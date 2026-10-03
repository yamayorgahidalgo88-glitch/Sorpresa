# Modo Carrera Míster

Juego de navegador de modo carrera de entrenador con datos reales de **EA SPORTS FC 26** y la **temporada 2026/27**, basado en el proyecto Carrera Entrenador V24.3.

Abre `index.html` en el navegador. Carga `data.js`, `game.js` y las imágenes de `assets/` de la misma carpeta.

## Qué incluye
- **Temporada como en V24**: la carrera empieza el 1 de julio de 2026 (pretemporada) y avanza día a día con el calendario oficial 2026/27 de openfootball (LaLiga, Premier League, Championship, Serie A, Bundesliga y Ligue 1). LaLiga Hypermotion, Serie B, 2. Bundesliga y Ligue 2 no tienen calendario público y se generan con fechas de fin de semana.
- **Ligas 2026/27 reales**: los equipos de cada liga salen del calendario 2026/27 (por ejemplo Málaga, Deportivo y Racing en LaLiga; Coventry, Hull e Ipswich en la Premier).
- **Competiciones europeas**: Champions, Europa League y Conference League con los participantes y fechas de V24, fase liga, play-off, eliminatorias a doble partido y final.
- **Ventanas de mercado por fechas** (verano del 1 de julio al 1 de septiembre, invierno en enero), como en V24.
- **Escudos reales** y **caras de las cartas FC 26** en plantilla, alineación, mercado y partidos. Cartas tipo FUT (oro, plata, bronce y promesas).
- Fichajes y negociación, cantera con ojeadores, directiva, ascensos y descensos, temporadas encadenadas y guardado automático.

## Datos e imágenes
`tools/` contiene los scripts que generan `data.js` y `assets/`:
- `build_data.py`: jugadores de `players_fc26_clean.csv` ([thompgt/fc26-player-analysis](https://github.com/thompgt/fc26-player-analysis)), calendarios de [openfootball/football.json](https://github.com/openfootball/football.json) `2026-27/`, presupuestos de `clubs.seed.json` de V24 y escudos de [luukhopman/football-logos](https://github.com/luukhopman/football-logos).
- `fetch_badges.py`: escudos que faltan, desde TheSportsDB.
- `fetch_faces.py` y `build_faces.py`: caras de las cartas FC 26 empaquetadas en hojas WebP.

Los escudos son marcas de sus clubes y las caras pertenecen a EA SPORTS. Este proyecto es de uso personal y no comercial.
