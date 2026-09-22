// IMPORTANTE: este archivo se ejecuta en Firebase, nunca en el navegador.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const codigoEdicion = defineSecret('CODIGO_EDICION');
 
exports.validarCodigoEdicion = onCall({ secrets: [codigoEdicion] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Iniciá sesión para continuar.');
  if (request.data?.codigo !== codigoEdicion.value()) throw new HttpsError('permission-denied', 'Código incorrecto.');
  await admin.auth().setCustomUserClaims(request.auth.uid, { editor: true });
  return { autorizado: true };
});
 