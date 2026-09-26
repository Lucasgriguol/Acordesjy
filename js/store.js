import {demoSongs} from './data.js';
import { obtenerServiciosFirebase } from './firebase.js';
const DRAFT='acorde-draft';
export const store={
  songs:structuredClone(demoSongs), repertoires:[{id:'domingo',name:'',songIds:['grande-amor','luz','refugio'],notes:''}],
  favorites:new Set(JSON.parse(localStorage.getItem('acorde-favorites')||'[]')),
  conectado:false,
  async iniciarFirebase(){
    try{
      const firebase=await obtenerServiciosFirebase();
      if(!firebase)return false;
      if(!firebase.auth.currentUser)await firebase.signInAnonymously(firebase.auth);
      const [songsSnapshot,setsSnapshot]=await Promise.all([firebase.getDocs(firebase.collection(firebase.db,'songs')),firebase.getDocs(firebase.collection(firebase.db,'repertoires'))]);
      if(!songsSnapshot.empty)this.songs=songsSnapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      if(!setsSnapshot.empty)this.repertoires=setsSnapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      this.firebase=firebase;this.conectado=true;return true;
    }catch(error){console.warn('No se pudo conectar con Firebase.',error);return false;}
  },
  getSong(id){return this.songs.find(s=>s.id===id)},
  async saveSong(song){
    const i=this.songs.findIndex(s=>s.id===song.id);song.updatedAt=Date.now();
    if(i<0)this.songs.unshift(song);else this.songs[i]=song;
    if(this.firebase)await this.firebase.setDoc(this.firebase.doc(this.firebase.db,'songs',song.id),song);
    this.clearDraft();
  },
  toggleFavorite(id){this.favorites.has(id)?this.favorites.delete(id):this.favorites.add(id);localStorage.setItem('acorde-favorites',JSON.stringify([...this.favorites]));},
  saveDraft(song){localStorage.setItem(DRAFT,JSON.stringify({song,at:Date.now()}));}, getDraft(){try{return JSON.parse(localStorage.getItem(DRAFT))}catch{return null}},clearDraft(){localStorage.removeItem(DRAFT)}
};