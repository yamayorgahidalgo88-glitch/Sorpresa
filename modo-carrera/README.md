# Modo Carrera Míster

Juego de navegador de modo carrera de entrenador con **datos reales de EA SPORTS FC 26** (temporada 2025/26): equipos, plantillas, medias, potencial, valores de mercado, salarios y presupuestos.

Abre `index.html` en el navegador (carga `data.js` y `game.js` de la misma carpeta).

- 10 divisiones jugables: LaLiga, LaLiga Hypermotion, Premier League, Championship, Serie A, Serie B, Bundesliga, 2. Bundesliga, Ligue 1 y Ligue 2, con ascensos y descensos.
- Mercado internacional con jugadores de otras ligas (Portugal, Países Bajos, Turquía, Arabia Saudí, MLS, Argentina, Brasil…) y agentes libres.
- Partidos en directo minuto a minuto, tácticas y 11 formaciones, posiciones secundarias reales.
- Fichajes con negociación de traspaso y contrato, ventanas de verano e invierno, ofertas de la IA.
- Cantera y ojeadores, objetivos de la directiva, despidos y ofertas de trabajo.
- Guardado automático comprimido en el navegador y exportación/importación.

## Datos

`data.js` se genera con `tools/build_data.py` a partir de:
- Jugadores: `players_fc26_clean.csv` de [thompgt/fc26-player-analysis](https://github.com/thompgt/fc26-player-analysis) (la misma fuente que usa el proyecto Carrera Entrenador V24).
- Presupuestos: `clubs.seed.json` del proyecto Carrera Entrenador V24; para el resto de clubes, la fórmula de `sync-data.mjs`.

```bash
python3 tools/build_data.py players_fc26_clean.csv clubs.seed.json > data.js
```
