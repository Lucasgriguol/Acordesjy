import { demoSongs } from './data.js';
import { obtenerServiciosFirebase, asegurarSesion } from './firebase.js';

const DRAFT = 'acorde-draft';
const FAV_KEY = 'acorde-favorites';

function normalizarFecha(valor, fallback = Date.now()) {
  if (!valor) return fallback;
  if (typeof valor === 'number') return valor;
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  if (typeof valor.seconds === 'number') return valor.seconds * 1000;
  const t = Date.parse(valor);
  return Number.isNaN(t) ? fallback : t;
}

export const store = {
  songs: structuredClone(demoSongs),
  repertoires: [
    { id: 'domingo', name: 'Domingo', songIds: ['grande-amor', 'luz', 'refugio'], notes: 'Servicio de la mañana' }
  ],
  favorites: new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')),
  conectado: false,
  firebase: null,

  async iniciarFirebase() {
    try {
      const firebase = await obtenerServiciosFirebase();
      if (!firebase) return false;

      const user = await asegurarSesion();
      if (!user) return false;

      // Favoritos: merge local + remoto
      try {
        const favDoc = await firebase.getDoc(firebase.doc(firebase.db, 'favorites', user.uid));
        if (favDoc.exists()) {
          const remotos = favDoc.data().songIds || [];
          this.favorites = new Set([...this.favorites, ...remotos]);
          this.persistFavorites();
        }
      } catch (e) { console.warn('No se pudieron cargar favoritos remotos.', e); }

      const [songsSnapshot, setsSnapshot] = await Promise.all([
        firebase.getDocs(firebase.collection(firebase.db, 'songs')),
        firebase.getDocs(firebase.collection(firebase.db, 'repertoires'))
      ]);

      if (!songsSnapshot.empty) {
        this.songs = songsSnapshot.docs.map(doc => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            createdAt: normalizarFecha(d.createdAt),
            updatedAt: d.updatedAt ? normalizarFecha(d.updatedAt) : undefined
          };
        });
      }
      if (!setsSnapshot.empty) {
        this.repertoires = setsSnapshot.docs.map(doc => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            songIds: Array.isArray(d.songIds) ? d.songIds : [],
            createdAt: d.createdAt ? normalizarFecha(d.createdAt) : undefined
          };
        });
      }

      this.firebase = firebase;
      this.conectado = true;
      return true;
    } catch (error) {
      console.warn('No se pudo conectar con Firebase.', error);
      return false;
    }
  },

  getSong(id) { return this.songs.find(s => s.id === id); },
  getRepertoire(id) { return this.repertoires.find(r => r.id === id); },

  async saveSong(song) {
    const i = this.songs.findIndex(s => s.id === song.id);
    song.updatedAt = Date.now();
    if (i < 0) this.songs.unshift(song);
    else this.songs[i] = song;
    if (this.firebase) {
      await this.firebase.setDoc(
        this.firebase.doc(this.firebase.db, 'songs', song.id),
        song
      );
    }
    this.clearDraft();
  },

  async deleteSong(id) {
    this.songs = this.songs.filter(s => s.id !== id);
    if (this.firebase) {
      await this.firebase.deleteDoc(this.firebase.doc(this.firebase.db, 'songs', id));
    }
  },

  newRepertoire() {
    return {
      id: `set-${Date.now()}`,
      name: '',
      songIds: [],
      notes: '',
      createdAt: Date.now()
    };
  },

  async saveRepertoire(repertoire) {
    const i = this.repertoires.findIndex(r => r.id === repertoire.id);
    repertoire.updatedAt = Date.now();
    if (i < 0) this.repertoires.unshift(repertoire);
    else this.repertoires[i] = repertoire;
    if (this.firebase) {
      await this.firebase.setDoc(
        this.firebase.doc(this.firebase.db, 'repertoires', repertoire.id),
        repertoire
      );
    }
  },

  async deleteRepertoire(id) {
    this.repertoires = this.repertoires.filter(r => r.id !== id);
    if (this.firebase) {
      await this.firebase.deleteDoc(this.firebase.doc(this.firebase.db, 'repertoires', id));
    }
  },

  async toggleFavorite(id) {
    this.favorites.has(id) ? this.favorites.delete(id) : this.favorites.add(id);
    this.persistFavorites();
    if (this.firebase?.auth?.currentUser) {
      try {
        await this.firebase.setDoc(
          this.firebase.doc(this.firebase.db, 'favorites', this.firebase.auth.currentUser.uid),
          { songIds: [...this.favorites], updatedAt: Date.now() }
        );
      } catch (e) { console.warn('No se pudo sync favoritos.', e); }
    }
  },

  persistFavorites() {
    localStorage.setItem(FAV_KEY, JSON.stringify([...this.favorites]));
  },

  saveDraft(song) {
    localStorage.setItem(DRAFT, JSON.stringify({ song, at: Date.now() }));
  },
  getDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT)); } catch { return null; }
  },
  clearDraft() { localStorage.removeItem(DRAFT); }
};