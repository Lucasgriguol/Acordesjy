import { FIREBASE_CONFIG, firebaseConfigurado, obtenerCodigoEdicion } from '../config.js';

let servicios;
let signInPromise = null;

export async function obtenerServiciosFirebase() {
  if (!firebaseConfigurado()) return null;
  if (servicios) return servicios;

  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
  ]);

  const app = initializeApp(FIREBASE_CONFIG);
  servicios = {
    app,
    auth: authModule.getAuth(app),
    db: firestoreModule.getFirestore(app),
    ...authModule,
    ...firestoreModule,
  };
  return servicios;
}

// Garantiza una única sesión anónima por dispositivo (evita usuarios fantasma).
export async function asegurarSesion() {
  const s = await obtenerServiciosFirebase();
  if (!s) return null;
  if (s.auth.currentUser) return s.auth.currentUser;
  if (!signInPromise) {
    signInPromise = s.signInAnonymously(s.auth).finally(() => { signInPromise = null; });
  }
  const cred = await signInPromise;
  return cred.user;
}

// Validación LOCAL del código de edición (no es seguridad real).
export async function solicitarAccesoEditor(codigo) {
  const esperado = obtenerCodigoEdicion();
  if (!esperado) throw new Error('Código no configurado.');
  if (String(codigo).trim() !== esperado) throw new Error('Código incorrecto.');
  await asegurarSesion();
  return { editor: true };
}

// Ya no hay custom claims: siempre false.
export async function esEditor() {
  return false;
}