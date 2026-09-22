# Guía de configuración de Firebase

## 1. Crear el proyecto

Entrá a [Firebase Console](https://console.firebase.google.com/), elegí **Agregar proyecto** y completá el nombre. Al terminar, en la pantalla principal elegí el icono web (`</>`) para registrar esta aplicación.

## 2. Copiar la configuración

Firebase mostrará un objeto similar a `firebaseConfig`. Copiá los cinco valores en `config.js`, dentro de la sección **FIREBASE — ZONA EDITABLE**:

- `apiKey`: identificador público de la app web.
- `authDomain`: dominio de autenticación.
- `projectId`: identificador único del proyecto.
- `messagingSenderId`: identificador de mensajería.
- `appId`: identificador de esta aplicación web.

Esta configuración pública **no es una contraseña**. Nunca pegues una service account, clave privada ni secreto de administrador en `config.js`.

## 3. Activar servicios

En Firebase Console activá:

1. **Firestore Database** → Crear base de datos.
2. **Authentication** → Métodos de acceso → habilitá *Anónimo* (la función segura usa esta sesión para asignar permisos).
3. **Functions** si vas a usar el acceso de edición seguro.

## 4. Reglas de seguridad

Desde la carpeta del proyecto instalá Firebase CLI, iniciá sesión y ejecutá:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore functions
firebase deploy --only firestore:rules
```

Conservá las reglas incluidas. Permiten leer el repertorio, pero solo aceptan escrituras de un token con `editor: true`.

## 5. Código de edición seguro

La clave no se escribe en el frontend. Al desplegar Functions, configurá el secreto:

```bash
firebase functions:secrets:set CODIGO_EDICION
firebase deploy --only functions
```

Cuando se solicite, ingresá `0205`. La función `validarCodigoEdicion` compara el secreto en el servidor y concede el claim `editor` al usuario. Las reglas Firestore verifican ese claim; DevTools no puede evitarlo.

## 6. Probar

Abrí el proyecto mediante un servidor local, por ejemplo `npx serve .`. Sin completar `config.js`, la app funciona con ejemplos y borradores locales. Tras completar Firebase, verificá que los datos aparecen en Firestore y que una sesión sin claim no puede escribir.

## Errores comunes

- **“No se pudo validar el acceso”**: verificá que Functions esté desplegado, Anónimo esté habilitado y el secreto exista.
- **“Missing or insufficient permissions”**: desplegá las reglas y solicitá nuevamente el acceso para refrescar el token.
- **La app no carga como módulo**: no abras el HTML directamente; usá un servidor local.
- **La aplicación muestra ejemplos**: comprobá que Firestore esté creado, que la configuración de `config.js` sea correcta y que las reglas permitan lectura.
