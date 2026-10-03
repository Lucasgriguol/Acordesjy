import { store } from './store.js';
import { transposeChord, transposeKey } from './music.js';
import { solicitarAccesoEditor } from './firebase.js';
import { mountEditor } from './editor.js';

const app = document.querySelector('#app');
let route = { name: 'home' };
let fontSize = 1.1;

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[c]));

const notify = message => {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 2600);
};

const renderContent = (song, shift = 0) =>
  song.sections.map(section => `
    <section class="song-section">
      <h2>${esc(section.name)}</h2>
      ${section.lines.map(line => `
        <div class="chords">
          ${line.chords.map(chord => `<span class="chord" style="left:${Number(chord.position) || 0}ch">${esc(transposeChord(chord.value, shift))}</span>`).join('')}
        </div>
        <div class="lyric-line">${esc(line.text)}</div>`).join('')}
    </section>`).join('');

function shell(title, body, action = '') {
  app.className = 'shell';
  app.innerHTML = `
    <aside class="sidebar">
      <p class="brand">Acor<span>de</span></p>
      <nav class="nav">
        <button data-nav="home">⌂ <span>Inicio</span></button>
        <button data-nav="library">♫ <span>Biblioteca</span></button>
        <button data-nav="favorites">★ <span>Favoritos</span></button>
        <button data-nav="sets">☷ <span>Repertorios</span></button>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar"><h1>${title}</h1>${action}</header>
      ${body}
    </main>`;
  document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => render({ name: button.dataset.nav }));
}

function songRows(list) {
  return list.map(song => `
    <article class="song-row" data-song="${song.id}">
      <div>
        <strong>${esc(song.title)}</strong>
        <small>${esc(song.artist)} · ${song.originalKey}</small>
      </div>
      ${store.favorites.has(song.id) ? '<span aria-hidden="true">★</span>' : ''}
    </article>`).join('');
}

function bindSongs() {
  document.querySelectorAll('[data-song]').forEach(row => {
    row.onclick = () => render({ name: 'song', id: row.dataset.song });
  });
}

// =============== HOME ===============
function home() {
  const recent = [...store.songs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const favorites = store.songs.filter(song => store.favorites.has(song.id));

  shell('Tu repertorio', `
    <div class="grid">
      <section class="card span-8">
        <h2 class="section-title">Encontrá una canción</h2>
        <input id="search" class="search" placeholder="Título, artista, tonalidad o etiqueta…" autofocus>
        <div id="matches" class="song-list" style="margin-top:12px">${songRows(recent)}</div>
      </section>

      <section class="card span-4">
        <h2 class="section-title">Acciones rápidas</h2>
        <button class="button" data-library>Explorar biblioteca</button>
        <button class="button secondary" data-new>Nueva canción</button>
      </section>

      <section class="card span-4">
        <h2 class="section-title">Favoritos</h2>
        ${favorites.length
          ? `<div class="song-list">${songRows(favorites)}</div>`
          : '<p class="subtle">Guardá tus canciones más usadas aquí.</p>'}
      </section>

      <section class="card span-4">
        <h2 class="section-title">Repertorios</h2>
        ${store.repertoires.length
          ? store.repertoires.map(set => `
              <button class="song-row" data-set="${set.id}">
                <strong>${esc(set.name || 'Sin nombre')}</strong>
                <span>${(set.songIds || []).length} canciones</span>
              </button>`).join('')
          : '<p class="subtle">Todavía no hay repertorios.</p>'}
      </section>

      <section class="card span-4">
        <h2 class="section-title">Biblioteca</h2>
        <p class="subtle">${store.songs.length} canciones disponibles.</p>
      </section>
    </div>`);

  const input = document.querySelector('#search');
  input.oninput = event => {
    const q = event.target.value.toLowerCase().trim();
    const matches = store.songs.filter(s =>
      [s.title, s.artist, s.originalKey, s.category, ...(s.tags || [])]
        .join(' ').toLowerCase().includes(q)
    );
    document.querySelector('#matches').innerHTML = matches.length
      ? songRows(matches)
      : '<p class="subtle">No encontramos canciones.</p>';
    bindSongs();
  };

  bindSongs();
  document.querySelector('[data-library]').onclick = () => render({ name: 'library' });
  document.querySelector('[data-new]').onclick = () => unlock(() => render({ name: 'editor', id: 'new' }));
  document.querySelectorAll('[data-set]').forEach(button => button.onclick = () => render({ name: 'set', id: button.dataset.set }));
}

// =============== BIBLIOTECA / FAVORITOS ===============
function library(onlyFavorites = false) {
  const title = onlyFavorites ? `Favoritos (${store.favorites.size})` : 'Biblioteca';
  shell(
    title,
    `<div class="filters">
      <input id="query" class="search" placeholder="Buscar canciones…">
      <select id="category" class="search">
        <option value="">Todas las categorías</option>
        ${[...new Set(store.songs.map(s => s.category))].map(c => `<option>${esc(c)}</option>`).join('')}
      </select>
      <select id="sort" class="search">
        <option value="az">Nombre A–Z</option>
        <option value="za">Nombre Z–A</option>
        <option value="artist">Artista</option>
        <option value="new">Más recientes</option>
        <option value="old">Más antiguas</option>
      </select>
    </div>
    <div id="cards" class="song-grid" style="margin-top:18px"></div>`,
    onlyFavorites ? '' : '<button class="button" data-new>Nueva canción</button>'
  );

  const draw = () => {
    const q = document.querySelector('#query').value.toLowerCase().trim();
    const category = document.querySelector('#category').value;
    const sort = document.querySelector('#sort').value;

    let songs = store.songs.filter(s =>
      (!onlyFavorites || store.favorites.has(s.id)) &&
      (!category || s.category === category) &&
      [s.title, s.artist, s.originalKey, s.category, ...(s.tags || [])]
        .join(' ').toLowerCase().includes(q)
    );

    songs.sort(
      sort === 'za' ? (a, b) => b.title.localeCompare(a.title) :
      sort === 'artist' ? (a, b) => (a.artist || '').localeCompare(b.artist || '') :
      sort === 'new' ? (a, b) => b.createdAt - a.createdAt :
      sort === 'old' ? (a, b) => a.createdAt - b.createdAt :
      (a, b) => a.title.localeCompare(b.title)
    );

    document.querySelector('#cards').innerHTML = songs.length
      ? songs.map(song => `
          <article class="song-card" data-song="${song.id}">
            <div class="song-head">
              <div>
                <h3>${esc(song.title)}</h3>
                <p class="song-meta">${esc(song.artist)}</p>
              </div>
              <button class="favorite ${store.favorites.has(song.id) ? 'on' : ''}" data-favorite="${song.id}">★</button>
            </div>
            <span class="pill">${song.originalKey}</span>
            <span class="pill">${esc(song.category)}</span>
          </article>`).join('')
      : '<p class="empty">No encontramos canciones con esos filtros.</p>';

    bindSongs();
    document.querySelectorAll('[data-favorite]').forEach(button => {
      button.onclick = async event => {
        event.stopPropagation();
        await store.toggleFavorite(button.dataset.favorite);
        draw();
      };
    });
  };

  ['query', 'category', 'sort'].forEach(id => document.querySelector('#' + id).oninput = draw);
  draw();
  document.querySelector('[data-new]')?.addEventListener('click', () => unlock(() => render({ name: 'editor', id: 'new' })));
}

// =============== READER ===============
function reader(id, performance = false) {
  const song = store.getSong(id);
  if (!song) return render({ name: 'library' });

  let shift = 0;

  const draw = () => {
    const key = transposeKey(song.originalKey, shift);
    const controls = `
      <div class="controls">
        <div class="transpose">
          <button data-shift="-1">−</button>
          <strong>${key}</strong>
          <button data-shift="1">+</button>
        </div>
        <button class="button ghost" data-original>Original</button>
        <button class="button ghost" data-font="-">A−</button>
        <button class="button ghost" data-font="+">A+</button>
        ${performance
          ? '<button class="button ghost" data-back>Volver</button>'
          : '<button class="button ghost" data-performance>Interpretación</button><button class="button ghost" data-edit>Editar</button>'}
      </div>`;

    const fav = store.favorites.has(song.id);
    const body = `
      <div class="reader">
        <header class="reader-header">
          <p class="subtle">${esc(song.artist)} · ${esc(song.category)}</p>
          <h1>
            ${esc(song.title)}
            <button class="favorite ${fav ? 'on' : ''}" data-fav-reader="${song.id}" style="font-size:1.4rem" aria-label="Favorito">★</button>
          </h1>
          <p class="subtle">
            Original: ${song.originalKey} · Actual: <b>${key}</b>
            ${song.capo ? ` · Capo ${song.capo}` : ''}
            ${song.bpm ? ` · ${song.bpm} BPM` : ''}
          </p>
        </header>
        ${controls}
        <div class="song-content" style="--song-font:${fontSize}rem">
          ${renderContent(song, shift)}
        </div>
      </div>`;

    if (performance) {
      app.className = 'performance';
      app.innerHTML = `<main class="main">${body}</main>`;
    } else {
      shell('Canción', body);
    }

    document.querySelectorAll('[data-shift]').forEach(button => button.onclick = () => {
      shift += Number(button.dataset.shift);
      draw();
    });

    document.querySelector('[data-original]').onclick = () => { shift = 0; draw(); };

    document.querySelectorAll('[data-font]').forEach(button => button.onclick = () => {
      fontSize = Math.max(0.8, Math.min(2, fontSize + (button.dataset.font === '+' ? 0.1 : -0.1)));
      draw();
    });

    document.querySelector('[data-performance]')?.addEventListener('click', () => reader(id, true));
    document.querySelector('[data-back]')?.addEventListener('click', () => reader(id));
    document.querySelector('[data-edit]')?.addEventListener('click', () => unlock(() => render({ name: 'editor', id })));

    document.querySelector('[data-fav-reader]')?.addEventListener('click', async () => {
      await store.toggleFavorite(song.id);
      draw();
    });
  };

  draw();
}

// =============== UNLOCK ===============
function unlock(done) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h2>Acceso de edición</h2>
      <p class="subtle">Ingresá el código para habilitar la edición.</p>
      <div class="form-row">
        <label>Código administrativo</label>
        <input type="password" autofocus placeholder="••••">
      </div>
      <div class="modal-actions">
        <button class="button ghost" data-close>Cancelar</button>
        <button class="button" data-validate>Continuar</button>
      </div>
    </div>`;
  document.body.append(modal);
  modal.querySelector('[data-close]').onclick = () => modal.remove();

  modal.querySelector('[data-validate]').onclick = async () => {
    const button = modal.querySelector('[data-validate]');
    const input = modal.querySelector('input');
    button.disabled = true;
    button.textContent = 'Validando…';
    try {
      const result = await solicitarAccesoEditor(input.value);
      if (!result.editor) throw new Error('No autorizado.');
      modal.remove();
      notify('Acceso autorizado.');
      done();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Continuar';
      notify(error.message || 'No se pudo validar el acceso.');
    }
  };
}

// =============== REPERTORIOS ===============
function sets() {
  shell('Repertorios', `
    <div class="toolbar">
      <button class="button" data-new-set>＋ Nuevo repertorio</button>
    </div>
    <div class="song-grid">
      ${store.repertoires.length
        ? store.repertoires.map(set => `
            <article class="song-card" data-set="${set.id}">
              <div class="song-head">
                <div>
                  <h3>${esc(set.name || 'Sin nombre')}</h3>
                  <p class="song-meta">${(set.songIds || []).length} canciones</p>
                </div>
                <button class="favorite" data-delete-set="${set.id}" title="Eliminar">🗑</button>
              </div>
              <p class="subtle">${esc(set.notes || '')}</p>
            </article>`).join('')
        : '<p class="empty">Todavía no tenés repertorios. Creá el primero.</p>'}
    </div>`);

  document.querySelector('[data-new-set]').onclick = () => unlock(async () => {
    const set = store.newRepertoire();
    await store.saveRepertoire(set);
    render({ name: 'set', id: set.id });
  });

  document.querySelectorAll('[data-set]').forEach(card => {
    card.onclick = e => {
      if (e.target.closest('[data-delete-set]')) return;
      render({ name: 'set', id: card.dataset.set });
    };
  });

  document.querySelectorAll('[data-delete-set]').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      if (!confirm('¿Eliminar este repertorio?')) return;
      await store.deleteRepertoire(btn.dataset.deleteSet);
      notify('Repertorio eliminado.');
      sets();
    };
  });
}

function setView(id) {
  const set = store.getRepertoire(id);
  if (!set) return sets();

  const songs = (set.songIds || []).map(sid => store.getSong(sid)).filter(Boolean);
  const disponibles = store.songs.filter(s => !set.songIds.includes(s.id));

  shell(set.name || 'Repertorio', `
    <div class="toolbar">
      <button class="button" data-add-song>＋ Agregar canción</button>
      <button class="button ghost" data-edit-notes>Editar nombre y notas</button>
      <button class="button danger" data-delete>Eliminar repertorio</button>
    </div>

    <section class="card" style="margin-bottom:18px">
      <p class="subtle">Notas: ${esc(set.notes || '—')}</p>
    </section>

    <h2 class="section-title">Canciones (${songs.length})</h2>
    <div class="song-list" id="set-songs">
      ${songs.length
        ? songs.map((song, i) => `
            <article class="song-row" data-song="${song.id}">
              <div>
                <strong>${i + 1}. ${esc(song.title)}</strong>
                <small>${esc(song.artist)} · ${song.originalKey}</small>
              </div>
              <div class="toolbar" style="margin:0">
                <button class="button ghost" data-up-song="${song.id}" title="Subir">↑</button>
                <button class="button ghost" data-down-song="${song.id}" title="Bajar">↓</button>
                <button class="button ghost" data-remove-song="${song.id}" title="Quitar">×</button>
              </div>
            </article>`).join('')
        : '<p class="empty">Este repertorio está vacío.</p>'}
    </div>`);

  document.querySelectorAll('[data-song]').forEach(row => {
    row.onclick = e => {
      if (e.target.closest('[data-up-song],[data-down-song],[data-remove-song]')) return;
      render({ name: 'song', id: row.dataset.song });
    };
  });

  document.querySelector('[data-add-song]').onclick = () => {
    if (!disponibles.length) return notify('No hay más canciones para agregar.');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal">
        <h2>Agregar canción</h2>
        <div class="song-list" style="max-height:50vh;overflow:auto;margin:14px 0">
          ${disponibles.map(s => `
            <button class="song-row" data-pick="${s.id}">
              <div><strong>${esc(s.title)}</strong><small>${esc(s.artist)}</small></div>
            </button>`).join('')}
        </div>
        <div class="modal-actions">
          <button class="button ghost" data-close>Cerrar</button>
        </div>
      </div>`;
    document.body.append(modal);
    modal.querySelector('[data-close]').onclick = () => modal.remove();
    modal.querySelectorAll('[data-pick]').forEach(btn => {
      btn.onclick = async () => {
        set.songIds.push(btn.dataset.pick);
        await store.saveRepertoire(set);
        modal.remove();
        setView(id);
      };
    });
  };

  document.querySelectorAll('[data-remove-song]').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      set.songIds = set.songIds.filter(sid => sid !== btn.dataset.removeSong);
      await store.saveRepertoire(set);
      setView(id);
    };
  });

  document.querySelectorAll('[data-up-song],[data-down-song]').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const sid = btn.dataset.upSong || btn.dataset.downSong;
      const idx = set.songIds.indexOf(sid);
      const to = btn.dataset.upSong !== undefined ? idx - 1 : idx + 1;
      if (to < 0 || to >= set.songIds.length) return;
      [set.songIds[idx], set.songIds[to]] = [set.songIds[to], set.songIds[idx]];
      await store.saveRepertoire(set);
      setView(id);
    };
  });

  document.querySelector('[data-edit-notes]').onclick = async () => {
    const name = prompt('Nombre del repertorio:', set.name || '');
    if (name === null) return;
    const notes = prompt('Notas:', set.notes || '');
    if (notes === null) return;
    set.name = name.trim();
    set.notes = notes.trim();
    await store.saveRepertoire(set);
    notify('Repertorio actualizado.');
    setView(id);
  };

  document.querySelector('[data-delete]').onclick = async () => {
    if (!confirm('¿Eliminar este repertorio?')) return;
    await store.deleteRepertoire(id);
    notify('Repertorio eliminado.');
    render({ name: 'sets' });
  };
}

// =============== ROUTER ===============
function render(next) {
  route = next;
  window.onbeforeunload = null;

  if (next.name === 'home') home();
  else if (next.name === 'library') library();
  else if (next.name === 'favorites') library(true);
  else if (next.name === 'song') reader(next.id);
  else if (next.name === 'editor') mountEditor(next.id, { shell, render, notify, esc, renderContent });
  else if (next.name === 'sets') sets();
  else if (next.name === 'set') setView(next.id);
  else home();
}

// Bootstrap
render(route);
store.iniciarFirebase().then(ok => { if (ok) render(route); });