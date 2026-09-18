import { store } from './store.js';
import { validChord } from './music.js';

const newSong = () => ({id:`song-${Date.now()}`,title:'',artist:'',originalKey:'C',category:'Sin categoría',tags:[],description:'',bpm:'',capo:'',createdAt:Date.now(),sections:[{id:'section-1',type:'verse',name:'Verso 1',lines:[{text:'',chords:[]}]}]});

export function mountEditor(id, ui) {
  let song=id==='new'?newSong():structuredClone(store.getSong(id));
  let dirty=false; let mobilePreview=false;
  const draft=store.getDraft();
  if(draft?.song?.id===song.id && confirm('Hay un borrador local. ¿Querés recuperarlo?')) song=draft.song;
  const mark=()=>{dirty=true;store.saveDraft(song);const status=document.querySelector('#editor-status');if(status)status.textContent='Cambios sin guardar · borrador local guardado';updatePreview();};
  const updatePreview=()=>{const target=document.querySelector('#live-preview');if(target)target.innerHTML=`<div class="song-content editor-preview">${ui.renderContent(song)}</div>`;};
  const draw=()=>{
    ui.shell(id==='new'?'Nueva canción':'Editar canción',`<div class="editor"><p id="editor-status" class="status">${dirty?'Cambios sin guardar · borrador local guardado':'Guardado'}</p><div class="editor-tabs"><button class="button ${!mobilePreview?'':'ghost'}" data-tab="edit">Editar</button><button class="button ${mobilePreview?'':'ghost'}" data-tab="preview">Vista previa</button></div><div class="editor-workspace"><section class="editor-form ${mobilePreview?'mobile-hidden':''}"><section class="card"><div class="grid"><label class="form-row span-8">Título *<input data-field="title" value="${ui.esc(song.title)}"></label><label class="form-row span-4">Artista<input data-field="artist" value="${ui.esc(song.artist)}"></label><label class="form-row span-4">Tonalidad *<input data-field="originalKey" value="${ui.esc(song.originalKey)}"></label><label class="form-row span-4">Categoría<input data-field="category" value="${ui.esc(song.category)}"></label><label class="form-row span-2">BPM<input data-field="bpm" type="number" value="${ui.esc(song.bpm)}"></label><label class="form-row span-2">Capo<input data-field="capo" type="number" value="${ui.esc(song.capo)}"></label><label class="form-row span-12">Notas<input data-field="description" value="${ui.esc(song.description)}"></label></div></section><div id="sections">${song.sections.map(section).join('')}</div><button class="button secondary" data-add-section>＋ Sección</button></section><aside class="live-panel ${mobilePreview?'':'mobile-preview-hidden'}"><h2 class="section-title">Vista previa en tiempo real</h2><div id="live-preview"></div></aside></div><div class="toolbar"><button class="button" data-save>Guardar canción</button><button class="button ghost" data-cancel>Cancelar</button></div></div>`);
    bind();updatePreview();
  };
  const section=(s,si)=>`<section class="editor-section"><div class="toolbar"><input data-name="${si}" value="${ui.esc(s.name)}" aria-label="Nombre de sección"><button class="button ghost" data-up="${si}">↑</button><button class="button ghost" data-down="${si}">↓</button><button class="button ghost" data-duplicate="${si}">Duplicar</button><button class="button ghost" data-remove-section="${si}">Eliminar</button></div>${s.lines.map((line,li)=>`<div class="line-edit"><textarea data-line="${si}:${li}" class="search" rows="2" placeholder="Letra de esta línea">${ui.esc(line.text)}</textarea><div class="chord-edit">${line.chords.map((chord,ci)=>`<span class="chord-token"><input data-chord="${si}:${li}:${ci}:value" value="${ui.esc(chord.value)}" aria-label="Acorde"><input data-chord="${si}:${li}:${ci}:position" type="number" min="0" value="${chord.position}" aria-label="Posición"><button data-delete-chord="${si}:${li}:${ci}">×</button></span>`).join('')}<button class="button ghost" data-add-chord="${si}:${li}">＋ Acorde</button></div></div>`).join('')}<button class="button ghost" data-add-line="${si}">＋ Línea</button></section>`;
  const bind=()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{mobilePreview=b.dataset.tab==='preview';draw();});
    document.querySelectorAll('[data-field]').forEach(input=>input.oninput=()=>{song[input.dataset.field]=input.value;mark();});
    document.querySelectorAll('[data-name]').forEach(input=>input.oninput=()=>{song.sections[Number(input.dataset.name)].name=input.value;mark();});
    document.querySelectorAll('[data-line]').forEach(input=>input.oninput=()=>{const [s,l]=input.dataset.line.split(':').map(Number);song.sections[s].lines[l].text=input.value;mark();});
    document.querySelectorAll('[data-chord]').forEach(input=>input.oninput=()=>{const [s,l,c,key]=input.dataset.chord.split(':');song.sections[s].lines[l].chords[c][key]=key==='position'?Number(input.value):input.value;mark();});
    document.querySelectorAll('[data-add-chord]').forEach(b=>b.onclick=()=>{const [s,l]=b.dataset.addChord.split(':').map(Number);song.sections[s].lines[l].chords.push({value:'C',position:0});mark();draw();});
    document.querySelectorAll('[data-delete-chord]').forEach(b=>b.onclick=()=>{const [s,l,c]=b.dataset.deleteChord.split(':').map(Number);song.sections[s].lines[l].chords.splice(c,1);mark();draw();});
    document.querySelectorAll('[data-add-line]').forEach(b=>b.onclick=()=>{song.sections[Number(b.dataset.addLine)].lines.push({text:'',chords:[]});mark();draw();});
    document.querySelectorAll('[data-remove-section]').forEach(b=>b.onclick=()=>{song.sections.splice(Number(b.dataset.removeSection),1);mark();draw();});
    document.querySelectorAll('[data-duplicate]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.duplicate);song.sections.splice(i+1,0,structuredClone(song.sections[i]));mark();draw();});
    document.querySelectorAll('[data-up],[data-down]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.up ?? b.dataset.down),to=b.dataset.up!==undefined?i-1:i+1;if(to<0||to>=song.sections.length)return;[song.sections[i],song.sections[to]]=[song.sections[to],song.sections[i]];mark();draw();});
    document.querySelector('[data-add-section]').onclick=()=>{song.sections.push({id:`section-${Date.now()}`,type:'custom',name:'Nueva sección',lines:[{text:'',chords:[]}]});mark();draw();};
    document.querySelector('[data-save]').onclick=()=>{if(!song.title.trim()||!song.originalKey.trim())return ui.notify('Título y tonalidad son obligatorios.');for(const s of song.sections)for(const l of s.lines)for(const c of l.chords)if(!validChord(c.value))return ui.notify(`Acorde inválido: ${c.value}`);store.saveSong(song);dirty=false;ui.notify('Canción guardada');ui.render({name:'song',id:song.id});};
    document.querySelector('[data-cancel]').onclick=()=>{if(!dirty||confirm('Tenés cambios sin guardar. ¿Descartarlos?'))ui.render({name:'library'});};
  };
  window.onbeforeunload=()=>dirty?'Tenés cambios sin guardar.':undefined;
  draw();
}
