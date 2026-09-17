# Acorde

Aplicación web estática para un repertorio compartido. Abre `index.html` con un servidor local. Arranca en modo demostración y conserva favoritos, borradores y preferencias en el navegador.

## Conectar Firebase

1. Crea un proyecto Firebase y habilita Firestore, Storage y Authentication.
2. Implementa un endpoint seguro (Cloud Function) que valide el código administrativo y emita un *custom claim* `editor: true` para el usuario autenticado. El código nunca debe vivir en este repositorio ni en el cliente.
3. Configura el SDK en `js/firebase.js` y sustituye el adaptador demo en `js/store.js` por llamadas Firestore.
4. Despliega las reglas incluidas: `firebase deploy --only firestore:rules,storage`.

Las reglas permiten lectura y solo autorizan escrituras a sesiones con el claim `editor`. La interfaz de desbloqueo es deliberadamente un punto de integración, no una falsa medida de seguridad.
