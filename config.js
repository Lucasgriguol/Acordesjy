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
// ACCESO DE EDICIÓN — ZONA EDITABLE
// =====================================================
// Código que hay que ingresar para poder crear/editar canciones.
// OJO: esta verificación es LOCAL (en el navegador), no es seguridad real:
// cualquiera que abra las herramientas de desarrollador puede verlo.
// Sirve como filtro simple para un grupo cerrado de amigos, no para
// proteger datos sensibles.
export const CODIGO_EDICION = '0205';

// =====================================================
// FIREBASE — ZONA EDITABLE
// =====================================================
// PEGÁ ACÁ la configuración que Firebase muestra al registrar tu aplicación web.
// No pegues aquí cuentas de servicio, claves privadas ni secretos de administrador.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAfbb4bVPzQP0e70-G4P4-OE64GgyeFHzQ',
  authDomain: 'bdd-acordes-jy.firebaseapp.com',
  projectId: 'bdd-acordes-jy',
  messagingSenderId: '699874533278',
  appId: '1:699874533278:web:808d6a15e2782fc2aa008f',
};

export const firebaseConfigurado = () => FIREBASE_CONFIG.apiKey !== 'PEGAR_AQUI' && FIREBASE_CONFIG.projectId !== 'PEGAR_AQUI';