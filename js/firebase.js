// Integración Firebase. No modifica datos si la configuración no fue completada.
import { FIREBASE_CONFIG, firebaseConfigurado, CODIGO_EDICION } from '../config.js';

let servicios;
export async function obtenerServiciosFirebase() {
  if (!firebaseConfigurado()) return null;
  if (servicios) return servicios;
  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  servicios = { app, auth: authModule.getAuth(app), db: firestoreModule.getFirestore(app), ...authModule, ...firestoreModule };
  return servicios;
}

// Validación LOCAL del código de edición (no pasa por ningún servidor).
// Pensada para un grupo cerrado de amigos, no para proteger datos sensibles.
export async function solicitarAccesoEditor(codigo) {
  if (codigo !== CODIGO_EDICION) throw new Error('Código incorrecto.');
  const s = await obtenerServiciosFirebase();
  if (!s) return { demo: true, editor: true };
  if (!s.auth.currentUser) await s.signInAnonymously(s.auth);
  return { editor: true };
}