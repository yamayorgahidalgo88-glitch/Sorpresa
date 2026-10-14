# Normas del proyecto

- **Nunca borrar cuentas ni datos de los usuarios al actualizar la app.** Ni en el servidor (base de datos) ni en la vista previa (`localStorage` con la clave `animelist-preview-v2`). Si cambia la forma de los datos, se migran los existentes (ver `MIGRATIONS` en `animelist/server/db.js` y el bloque de arreglos al cargar en `animelist/preview/mock-api.js`); nunca se cambia la clave ni se reinicia la base de datos.
- La app está en `animelist/`. `index.html` de la raíz es otra cosa (regalo «Flores Amarillas»): no tocarlo.
- La vista previa se regenera con `node scripts/build-preview.mjs <carpeta-de-pósters>` y debe tener el mismo comportamiento que el servidor.
- Todo el texto de la app en español de España.
