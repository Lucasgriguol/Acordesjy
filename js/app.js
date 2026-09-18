import { store } from './store.js';
import { transposeChord, transposeKey } from './music.js';
import { solicitarAccesoEditor } from './firebase.js';
import { mountEditor } from './editor.js';

const app = document.querySelector('#app');
let route = { name: 'home' };
let fontSize = 1.1;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const notify = message => { const node=document.querySelector('#toast'); node.textContent=message; node.classList.add('show'); setTimeout(()=>node.classList.remove('show'),2600); };
const renderContent = (song, shift=0) => song.sections.map(section => `<section class="song-section"><h2>${esc(section.name)}</h2>${section.lines.map(line => `<div class="chords">${line.chords.map(chord => `<span class="chord" style="left:${Number(chord.position)||0}ch">${esc(transposeChord(chord.value,shift))}</span>`).join('')}</div><div class="lyric-line">${esc(line.text)}</div>`).join('')}</section>`).join('');

function shell(title, body, action='') {
  app.className='shell';
  app.innerHTML=`<aside class="sidebar"><p class="brand">Acor<span>de</span></p><nav class="nav"><button data-nav="home">⌂ <span>Inicio</span></button><button data-nav="library">♫ <span>Biblioteca</span></button><button data-nav="favorites">★ <span>Favoritos</span></button><button data-nav="sets">☷ <span>Repertorios</span></button><button data-nav="settings">⚙ <span>Ajustes</span></button></nav></aside><main class="main"><header class="topbar"><h1>${title}</h1>${action}</header>${body}</main>`;
  document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>render({name:button.dataset.nav}));
}
function songRows(list) { return list.map(song=>`<article class="song-row" data-song="${song.id}"><div><strong>${esc(song.title)}</strong><small>${esc(song.artist)} · ${song.originalKey}</small></div>${store.favorites.has(song.id)?'★':''}</article>`).join(''); }
function bindSongs() { document.querySelectorAll('[data-song]').forEach(row=>row.onclick=()=>render({name:'song',id:row.dataset.song})); }

function home() {
  const recent=[...store.songs].sort((a,b)=>b.createdAt-a.createdAt).slice(0,3);
  const favorites=store.songs.filter(song=>store.favorites.has(song.id));
  shell('Tu repertorio',`<div class="grid"><section class="card span-8"><h2 class="section-title">Encontrá una canción</h2><input id="search" class="search" placeholder="Título, artista, tonalidad o etiqueta…" autofocus><div id="matches" class="song-list" style="margin-top:12px">${songRows(recent)}</div></section><section class="card span-4"><h2 class="section-title">Acciones rápidas</h2><button class="button" data-library>Explorar biblioteca</button> <button class="button secondary" data-new>Nueva canción</button></section><section class="card span-4"><h2 class="section-title">Favoritos</h2>${favorites.length?`<div class="song-list">${songRows(favorites)}</div>`:'<p class="subtle">Guardá tus canciones más usadas aquí.</p>'}</section><section class="card span-4"><h2 class="section-title">Repertorios</h2>${store.repertoires.map(set=>`<button class="song-row" data-set="${set.id}"><strong>${esc(set.name)}</strong><span>${set.songIds.length} canciones</span></button>`).join('')}</section><section class="card span-4"><h2 class="section-title">Biblioteca</h2><p class="subtle">${store.songs.length} canciones disponibles.</p></section></div>`);
  document.querySelector('#search').oninput=event=>{const q=event.target.value.toLowerCase();document.querySelector('#matches').innerHTML=songRows(store.songs.filter(s=>[s.title,s.artist,s.originalKey,s.category,...s.tags].join(' ').toLowerCase().includes(q)))||'<p class="subtle">No encontramos canciones.</p>';bindSongs();};
  bindSongs();document.querySelector('[data-library]').onclick=()=>render({name:'library'});document.querySelector('[data-new]').onclick=()=>unlock(()=>render({name:'editor',id:'new'}));document.querySelectorAll('[data-set]').forEach(button=>button.onclick=()=>render({name:'set',id:button.dataset.set}));
}
function library(onlyFavorites=false) {
  shell(onlyFavorites?'Favoritos':'Biblioteca',`<div class="filters"><input id="query" class="search" placeholder="Buscar canciones…"><select id="category" class="search"><option value="">Todas las categorías</option>${[...new Set(store.songs.map(s=>s.category))].map(category=>`<option>${esc(category)}</option>`).join('')}</select><select id="sort" class="search"><option value="az">Nombre A–Z</option><option value="za">Nombre Z–A</option><option value="artist">Artista</option><option value="new">Más recientes</option><option value="old">Más antiguas</option></select></div><div id="cards" class="song-grid" style="margin-top:18px"></div>`,onlyFavorites?'':'<button class="button" data-new>Nueva canción</button>');
  const draw=()=>{const q=document.querySelector('#query').value.toLowerCase(),category=document.querySelector('#category').value,sort=document.querySelector('#sort').value;let songs=store.songs.filter(s=>(!onlyFavorites||store.favorites.has(s.id))&&(!category||s.category===category)&&[s.title,s.artist,s.originalKey,s.category,...s.tags].join(' ').toLowerCase().includes(q));songs.sort(sort==='za'?(a,b)=>b.title.localeCompare(a.title):sort==='artist'?(a,b)=>a.artist.localeCompare(b.artist):sort==='new'?(a,b)=>b.createdAt-a.createdAt:sort==='old'?(a,b)=>a.createdAt-b.createdAt:(a,b)=>a.title.localeCompare(b.title));document.querySelector('#cards').innerHTML=songs.map(song=>`<article class="song-card" data-song="${song.id}"><div class="song-head"><div><h3>${esc(song.title)}</h3><p class="song-meta">${esc(song.artist)}</p></div><button class="favorite ${store.favorites.has(song.id)?'on':''}" data-favorite="${song.id}">★</button></div><span class="pill">${song.originalKey}</span> <span class="pill">${esc(song.category)}</span></article>`).join('')||'<p class="empty">No encontramos canciones con esos filtros.</p>';bindSongs();document.querySelectorAll('[data-favorite]').forEach(button=>button.onclick=event=>{event.stopPropagation();store.toggleFavorite(button.dataset.favorite);draw();});};
  ['query','category','sort'].forEach(id=>document.querySelector('#'+id).oninput=draw);draw();document.querySelector('[data-new]')?.addEventListener('click',()=>unlock(()=>render({name:'editor',id:'new'})));
}
function reader(id, performance=false) {
  const song=store.getSong(id); if(!song)return render({name:'library'});
  let shift=0;
  const draw=()=>{
    const key=transposeKey(song.originalKey,shift);
    const controls=`<div class="controls"><div class="transpose"><button data-shift="-1">−</button><strong>${key}</strong><button data-shift="1">+</button></div><button class="button ghost" data-original>Original</button><button class="button ghost" data-font="-">A−</button><button class="button ghost" data-font="+">A+</button>${performance?'<button class="button ghost" data-back>Volver</button>':'<button class="button ghost" data-performance>Interpretación</button><button class="button ghost" data-edit>Editar</button>'}</div>`;
    const body=`<div class="reader"><header class="reader-header"><p class="subtle">${esc(song.artist)} · ${esc(song.category)}</p><h1>${esc(song.title)}</h1><p class="subtle">Original: ${song.originalKey} · Actual: <b>${key}</b>${song.capo?` · Capo ${song.capo}`:''}${song.bpm?` · ${song.bpm} BPM`:''}</p></header>${controls}<div class="song-content" style="--song-font:${fontSize}rem">${renderContent(song,shift)}</div></div>`;
    if(performance){app.className='performance';app.innerHTML=`<main class="main">${body}</main>`;}else shell('Canción',body);
    document.querySelectorAll('[data-shift]').forEach(button=>button.onclick=()=>{shift+=Number(button.dataset.shift);draw();});
    document.querySelector('[data-original]').onclick=()=>{shift=0;draw();};
    document.querySelectorAll('[data-font]').forEach(button=>button.onclick=()=>{fontSize=Math.max(.8,Math.min(2,fontSize+(button.dataset.font==='+'?.1:-.1)));draw();});
    document.querySelector('[data-performance]')?.addEventListener('click',()=>reader(id,true));
    document.querySelector('[data-back]')?.addEventListener('click',()=>reader(id));
    document.querySelector('[data-edit]')?.addEventListener('click',()=>unlock(()=>render({name:'editor',id})));
  };
  draw();
}
function unlock(done) {
  const modal=document.createElement('div'); modal.className='modal-backdrop';
  modal.innerHTML=`<div class="modal"><h2>Acceso de edición</h2><p class="subtle">El código se valida en Firebase Cloud Functions; nunca en el navegador.</p><div class="form-row"><label>Código administrativo</label><input type="password" inputmode="numeric" autofocus placeholder="••••"></div><div class="modal-actions"><button class="button ghost" data-close>Cancelar</button><button class="button" data-validate>Continuar</button></div></div>`;
  document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();
  modal.querySelector('[data-validate]').onclick=async()=>{const button=modal.querySelector('[data-validate]');button.disabled=true;button.textContent='Validando…';try{const result=await solicitarAccesoEditor(modal.querySelector('input').value);if(!result.demo&&!result.editor)throw Error('No autorizado');modal.remove();notify(result.demo?'Modo demostración: configurá Firebase antes de publicar.':'Acceso autorizado.');done();}catch(error){button.disabled=false;button.textContent='Continuar';notify(error.message==='Código incorrecto.'?'Código incorrecto.':'No se pudo validar el acceso.');}};
}
function sets() { shell('Repertorios',`<div class="song-grid">${store.repertoires.map(set=>`<article class="song-card" data-set="${set.id}"><h3>${esc(set.name)}</h3><p class="song-meta">${set.songIds.length} canciones</p><p class="subtle">${esc(set.notes||'')}</p></article>`).join('')}</div>`);document.querySelectorAll('[data-set]').forEach(button=>button.onclick=()=>render({name:'set',id:button.dataset.set})); }
function setView(id) { const set=store.repertoires.find(item=>item.id===id);if(!set)return sets();shell(set.name,`<section class="card"><p class="subtle">Notas de ensayo: ${esc(set.notes||'—')}</p><div class="song-list">${songRows(set.songIds.map(songId=>store.getSong(songId)).filter(Boolean))}</div></section>`);bindSongs(); }
function settings() { shell('Configuración',`<section class="card" style="max-width:700px"><h2 class="section-title">Firebase y seguridad</h2><p class="subtle">Completá config.js y seguí GUIA-CONFIGURACION.md. Las reglas bloquean escrituras sin el permiso editor.</p></section>`); }
function render(next) { route=next;window.onbeforeunload=null;if(next.name==='home')home();else if(next.name==='library')library();else if(next.name==='favorites')library(true);else if(next.name==='song')reader(next.id);else if(next.name==='editor')mountEditor(next.id,{shell,render,notify,esc,renderContent});else if(next.name==='sets')sets();else if(next.name==='set')setView(next.id);else settings(); }
render(route);
