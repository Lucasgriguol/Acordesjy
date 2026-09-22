# Acorde

Repertorio musical responsive para consultar letras, acordes, tonalidades y repertorios durante ensayos o presentaciones.

## Funciones

- Biblioteca con búsqueda, filtros, orden y favoritos persistentes.
- Letras y acordes estructurados por secciones y posiciones exactas.
- Transposición temporal: no modifica los acordes originales.
- Modo interpretación limpio y ajuste de tipografía.
- Editor visual de acordes con borrador local y vista previa en tiempo real.
- Repertorios y notas de ensayo.
- Reglas Firebase y Cloud Function para escritura segura.

## Ejecutar

Usá un servidor local: `npx serve .` y abrí la dirección indicada. La app incluye datos demostrativos si Firebase no está configurado.

## Configuración

1. Editá solo `config.js`, en la **ZONA EDITABLE**.
2. Seguí [GUIA-CONFIGURACION.md](GUIA-CONFIGURACION.md).
3. Desplegá reglas y Functions antes de publicar.

## Estructura

- `config.js`: configuración centralizada.
- `js/music.js`: transposición y validación de acordes.
- `js/editor.js`: editor visual y vista previa.
- `js/firebase.js`: conexión del cliente Firebase.
- `functions/`: validación segura del código en servidor.
- `firestore.rules`: permisos de Firestore.

Firebase es la fuente de información compartida cuando se completa la configuración. La configuración web de Firebase es pública por diseño; los secretos y el código de edición viven en Functions/Secret Manager, nunca en JavaScript del navegador.
