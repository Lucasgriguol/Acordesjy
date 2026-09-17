import {demoSongs} from './data.js';
const DRAFT='acorde-draft';
export const store={
  songs:structuredClone(demoSongs), repertoires:[{id:'domingo',name:'Repertorio Domingo',songIds:['grande-amor','luz','refugio'],notes:'Entrar después del segundo coro.'}],
  favorites:new Set(JSON.parse(localStorage.getItem('acorde-favorites')||'[]')),
  getSong(id){return this.songs.find(s=>s.id===id)},
  saveSong(song){const i=this.songs.findIndex(s=>s.id===song.id);song.updatedAt=Date.now();if(i<0)this.songs.unshift(song);else this.songs[i]=song;this.clearDraft();},
  toggleFavorite(id){this.favorites.has(id)?this.favorites.delete(id):this.favorites.add(id);localStorage.setItem('acorde-favorites',JSON.stringify([...this.favorites]));},
  saveDraft(song){localStorage.setItem(DRAFT,JSON.stringify({song,at:Date.now()}));}, getDraft(){try{return JSON.parse(localStorage.getItem(DRAFT))}catch{return null}},clearDraft(){localStorage.removeItem(DRAFT)}
};
