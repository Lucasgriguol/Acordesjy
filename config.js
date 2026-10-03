// =====================================================
// CONFIGURACIÓN DE LA APLICACIÓN
// =====================================================
export const APP_CONFIG = {
  nombre: 'Acorde',
  descripcion: 'Repertorio musical compartido',
  categoriasIniciales: ['Adoración', 'Alabanza', 'Navidad', 'Jóvenes', 'Niños', 'Eventos', 'Especial'],
};

// =====================================================
// FIREBASE — ZONA EDITABLE
// =====================================================
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAfbb4bVPzQP0e70-G4P4-OE64GgyeFHzQ',
  authDomain: 'bdd-acordes-jy.firebaseapp.com',
  projectId: 'bdd-acordes-jy',
  messagingSenderId: '699874533278',
  appId: '1:699874533278:web:808d6a15e2782fc2aa008f',
};

export const firebaseConfigurado = () =>
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.apiKey !== 'PEGAR_AQUI' &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.projectId !== 'PEGAR_AQUI';

// =====================================================
// CÓDIGO DE EDICIÓN — OFUSCADO
// =====================================================
// Ofuscación simple (base64 + XOR). No es seguridad real:
// alguien con DevTools puede recuperarlo. Es un filtro para
// que un amigo curioso no toque "Editar" sin saber el código.
export const CODIGO_OBFUSCADO = 'fWJyfg==';
export const CLAVE_XOR = 73;

// Decodifica el código de edición en runtime.
export function obtenerCodigoEdicion() {
  try {
    const base64 = atob(CODIGO_OBFUSCADO);
    const bytes = new Uint8Array([...base64].map(c => c.charCodeAt(0)));
    const decoded = bytes.map(b => b ^ CLAVE_XOR);
    return new TextDecoder().decode(decoded);
  } catch {
    return '';
  }
}