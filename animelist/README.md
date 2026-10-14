# Anime List M&Y

App web (instalable en el móvil) para llevar nuestras listas de anime: quién lo ha visto, la nota de cada uno y dónde verlo **en España**.

## Qué hace
- **Cuentas** con usuario y contraseña (contraseñas cifradas con scrypt, sesión por cookie).
- **Tablas**: crear (pide el nombre primero), abrir y eliminar con la papelera roja (pide confirmación). Al crear puedes empezar con nuestros **animes para ver juntos** (los 9 que estaban en negrita en el PDF, con sus checks y notas). El resto de animes van en otras tablas.
- Cada tabla tiene columnas de **check y nota por persona** (con su color), ranking automático, filtros (pendientes / vistos) y botón **Añadir** al final.
- **Autocompletado**: al escribir salen los animes que coinciden (entiende títulos en japonés, inglés y español, y erratas como “tokyo goul”). Al elegir uno se rellena solo dónde está disponible en España y en qué **idiomas de audio y subtítulos**.
- **Amigos**: buscador por nombre de usuario, solicitudes con ✓ verde / ✗ roja, lista de amigos.
- **Compartir**: el creador de una tabla puede compartirla con un amigo, que podrá editarla.
- **Perfil** con cerrar sesión.

## Catálogo de anime (España)
`data/catalog.json` contiene **todo el anime (series y películas) disponible por suscripción en España** en Crunchyroll, Netflix, HBO Max, Prime Video y Disney+ (1663 títulos al generarlo), con idiomas de audio/subtítulos, sacado de JustWatch (país ES) y con títulos alternativos de AniList.
Además, al buscar y al abrir un anime la app consulta JustWatch **en directo**, así que la disponibilidad está al día aunque el catálogo guardado envejezca. Para regenerarlo:

```bash
npm run build:catalog
```

Nota: Netflix no publica los idiomas en JustWatch, así que en esos casos la app indica “la plataforma no lo indica”. El “Español” de audio puede ser de España o de Latinoamérica según el título.

## Ejecutar en local
```bash
cd animelist
npm install
npm start          # http://localhost:3000
npm test
```

## Publicarla (para usarla desde los dos móviles)
Es un servidor Node (Express). La base de datos es SQLite:
- Por defecto usa el fichero `data/app.db` (sirve en un servidor con disco persistente).
- En la nube gratis: crea una base de datos en [Turso](https://turso.tech) y define `DATABASE_URL=libsql://...` y `DATABASE_TOKEN=...`. Así puedes desplegar en Render, Railway, Fly.io, etc. sin perder datos.

`render.yaml` deja lista la configuración para Render (servicio web, `rootDir: animelist`).
Una vez publicada, en el móvil: abre la web → “Añadir a pantalla de inicio” y aparecerá con el logo como una app.
