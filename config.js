// =====================================================
// CONFIGURACIÓN DE LA APLICACIÓN
// =====================================================
// ZONA EDITABLE
// Modificá únicamente los valores de este archivo para personalizar la app.

export const APP_CONFIG = {
  nombre: 'Acorde',
  descripcion: 'Repertorio musical compartido',
  categoriasIniciales: ['Adoración', 'Alabanza', 'Navidad', 'Jóvenes', 'Niños', 'Eventos', 'Especial'],
  permitirModoDemostracion: true,
};

// =====================================================
// FIREBASE — ZONA EDITABLE
// =====================================================
// PEGÁ ACÁ la configuración que Firebase muestra al registrar tu aplicación web.
// No pegues aquí cuentas de servicio, claves privadas ni secretos de administrador.
export const FIREBASE_CONFIG = {
  apiKey: 'PEGAR_AQUI',
  authDomain: 'PEGAR_AQUI',
  projectId: 'PEGAR_AQUI',
  storageBucket: 'PEGAR_AQUI',
  messagingSenderId: 'PEGAR_AQUI',
  appId: 'PEGAR_AQUI',
};

export const firebaseConfigurado = () => FIREBASE_CONFIG.apiKey !== 'PEGAR_AQUI' && FIREBASE_CONFIG.projectId !== 'PEGAR_AQUI';
