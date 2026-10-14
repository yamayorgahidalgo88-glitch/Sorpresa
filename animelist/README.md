# anYMe

App web (instalable en el móvil) para llevar nuestras listas de anime: quién lo ha visto, la nota de cada uno y dónde verlo **en España**.

## Qué hace
- **Cuentas** con usuario y contraseña (contraseñas cifradas con scrypt, sesión por cookie).
- **Test de personalidad** al entrar por primera vez: 5 preguntas sobre animes de la lista que te dan tu **color** y el personaje al que te pareces. El color se cambia luego en **Perfil** (también se puede repetir el test). El verde está reservado para `YHM`.
- **Tablas**: crear (pide el nombre primero), abrir y eliminar con la papelera roja (pide confirmación). Al crear puedes empezar con nuestros **animes para ver juntos** (los 9 que estaban en negrita en el PDF, con sus checks y notas).
- Cada tabla tiene una columna de **check y nota por persona**, con su nombre de usuario y su color. **Cada uno solo puede cambiar lo suyo.** La columna «Marta» de la plantilla queda libre (con sus notas antiguas) hasta que se le comparte la tabla.
- **Ranking en podio** por persona o por media, separando **series y películas**.
- **Pendientes** se puede ordenar arrastrando desde las rayas (≡). Ese orden es personal.
- **Autocompletado**: al escribir salen los animes que coinciden (entiende títulos en japonés, inglés y español, y erratas como “tokyo goul”). Al elegir uno se rellena solo dónde está disponible en España y en qué **idiomas de audio y subtítulos**.
- **Amigos**: buscador por nombre de usuario, solicitudes con ✓ verde / ✗ roja, lista de amigos.
- **Compartir**: el creador de una tabla la comparte con un amigo y elige qué columna será la suya (p. ej. «Marta») o una nueva. Al amigo le llega en **Amigos → Solicitudes** «te ha compartido una lista» con ✓ / ✗; al aceptar, la tabla aparece en sus tablas.
- **Perfil** con tu color, tu personaje y cerrar sesión.
- **Quiz** (al estilo Kahoot): 10 preguntas sobre los animes que tienes marcados como **vistos** en tus tablas, 20 segundos por pregunta y 4 respuestas de colores. Al acabar ves tu nota, un repaso de cada pregunta y el ranking de tus mejores partidas con el día y la hora. Las imágenes (personajes y escenas de la serie) salen de AniList. Sin IA y gratis, las preguntas se sacan de las fichas de personajes de AniList: «¿Quién es el Pilar del Viento?» o «¿Quién es el colocador del Nekoma?» (se responde eligiendo entre 4 caras), respiraciones, posiciones, dones, frutas del diablo, zanpakutō… Solo se usan datos con formato fijo y se descarta lo que AniList marca como spoiler (suele ser del manga). Además, `server/trivia-bank.js` tiene unas 200 preguntas de la trama escritas a mano (solo del anime) para 18 animes; para añadir más, se escriben ahí con su id del catálogo.

### Preguntas de la trama para cualquier anime (gratis, con Gemini)
Si el proyecto tiene la variable `GEMINI_API_KEY` (clave gratuita de Google AI Studio, aistudio.google.com, sin tarjeta), cuando marcas como visto un anime que no está en `server/trivia-bank.js` la IA de Google le escribe unas 15 preguntas de la trama **una sola vez**; se guardan en la tabla `trivia_ai_bank` y se reutilizan en las siguientes partidas (como mucho 4 animes nuevos por partida). Si una sale mal, en el juego hay un botón para quitarla. Sin la clave, el quiz funciona igual con las preguntas de AniList. Opcional: `GEMINI_MODEL`.

### Preguntas con IA en el quiz
Si el proyecto tiene la variable `ANTHROPIC_API_KEY` (clave de la API de Claude, en console.anthropic.com), las preguntas las escribe la IA: situaciones y momentos conocidos de cada anime, sin rebuscar y evitando los finales. Sin la clave (o si la IA tarda o falla) el quiz funciona igual con preguntas de personajes, estudio y año sacadas de AniList. Cada partida con IA cuesta unos céntimos. Opcional: `TRIVIA_MODEL` y `TRIVIA_EFFORT` para cambiar el modelo o el esfuerzo.

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

## Publicarla en Vercel (gratis)
La app ya está preparada para Vercel (`vercel.json` + `api/index.js`): API y web corren en una sola función.

1. En Vercel: **Add New → Project** → importar el repositorio de GitHub → **Root Directory: `animelist`** → Deploy.
2. En el proyecto: **Storage → Create Database → Turso** (plan gratis, región Europa) y conectarla al proyecto. Eso crea `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
3. **Redeploy**. Las tablas de la base de datos se crean solas en la primera visita.

Sin la base de datos, la app en Vercel se niega a arrancar a propósito: el disco de Vercel no es permanente y se perderían las cuentas.

En local, sin variables, usa el fichero `data/app.db`. También acepta `DATABASE_URL` / `DATABASE_TOKEN` (cualquier base libsql/Turso).
Una vez publicada, en el móvil: abre la web → «Añadir a pantalla de inicio» y aparecerá con el logo como una app.
