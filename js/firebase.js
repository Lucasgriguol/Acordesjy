// Integración Firebase. No modifica datos si la configuración no fue completada.
import { FIREBASE_CONFIG, firebaseConfigurado } from '../config.js';

let servicios;
export async function obtenerServiciosFirebase() {
  if (!firebaseConfigurado()) return null;
  if (servicios) return servicios;
  const [{ initializeApp }, authModule, firestoreModule, functionsModule, storageModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  servicios = { app, auth: authModule.getAuth(app), db: firestoreModule.getFirestore(app), functions: functionsModule.getFunctions(app), storage: storageModule.getStorage(app), ...authModule, ...firestoreModule, ...functionsModule };
  return servicios;
}

// La validación ocurre en Cloud Functions. El código nunca se compara en el navegador.
export async function solicitarAccesoEditor(codigo) {
  const s = await obtenerServiciosFirebase();
  if (!s) return { demo: true };
  if (!s.auth.currentUser) await s.signInAnonymously(s.auth);
  const validar = s.httpsCallable(s.functions, 'validarCodigoEdicion');
  await validar({ codigo });
  await s.auth.currentUser.getIdToken(true);
  const token = await s.auth.currentUser.getIdTokenResult();
  return { editor: token.claims.editor === true };
}
