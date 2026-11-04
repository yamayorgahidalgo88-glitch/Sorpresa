# SUPERSTAR · ARMY Edition — resumen para seguir trabajando

## Qué es
Juego de ritmo web (PWA instalable) inspirado en **SuperStar BTS** (Dalcomsoft, 2018–2020, ya cerrado), hecho como **regalo para la novia del usuario**. Se juega en el móvil, **solo en horizontal**: la app ocupa toda la pantalla, menú en una barra a la izquierda; si el móvil está en vertical (sin giro automático) la app se dibuja girada (`body.rot`, `applyRot` en `main.js`; el motor y los sobres convierten las coordenadas del toque). El CSS usa `--aw`/`--ah` (tamaño de la app) en lugar de vw/vh. Icono de la app: el logo SUPERSTAR que pasó el usuario (`superstar/icons/`).

- **Web publicada:** https://superstar-army.vercel.app
- **Repositorio:** `yamayorgahidalgo88-glitch/Sorpresa`, rama `claude/bts-superstar-game-vesiwx`. El juego está en `superstar/`. El `index.html` de la raíz es OTRO regalo («Flores Amarillas»): no tocarlo.
- **Vercel:** equipo `team_AJTr7WqPBL2IVmRDgpky7Ac8` (La Quinta del Bnitre), proyecto `superstar-army`. Se despliega con la herramienta de Vercel `create_deployment` usando `gitSource` (github, org `yamayorgahidalgo88-glitch`, repo `Sorpresa`, ref de la rama) y `target: production`. En cada cambio hay que **subir la versión de caché** en `superstar/sw.js` (`superstar-vNN`, ahora v30).
- El usuario habla **español** y no es programador: explicarle en lenguaje sencillo.

## Reglas importantes (decididas con el usuario)
- **No se sube ni se incrusta audio de BTS** en el repo ni en la web (los dos son públicos). Ella carga sus MP3 en el móvil (se guardan en IndexedDB). En el repo solo van **partituras** (tiempos y posiciones).
- No copiar letras, arte, logos ni partituras originales. Las fotos de los miembros son de **Wikimedia Commons con licencia libre** (créditos en Ajustes y en `superstar/img/members/CREDITS.md`).
- Del repo de fans `ssurgents.github.io` solo se usaron **estadísticas agregadas** de 152 partituras HARD de otra serie de SuperStar (no se copió ninguna).

## Cómo es el juego ahora
- **Pista en perspectiva horizontal**, fondo con los 7 miembros tintado de rosa, láseres, medidor RAVE (ENERGY → ULTRA RAVE con bonus x1–x4), carta que puntúa arriba en el centro, cut-in del miembro, juicios S·PERFECT/PERFECT/GOOD/BAD/MISS y combo.
- **Sin botones fijos:** abajo solo hay una barra de luz. Las notas caen en **13 posiciones** a lo ancho (como el original) y se toca donde llega cada nota (tolerancia ~1,7 posiciones).
- **Notas:** sueltas azules/rosas, dobles moradas (gemas), doradas = unidas: notas largas, **deslizamientos en diagonal** y **zigzags de 3–4 monedas con bandas rectas** que cruzan la pista (como las imágenes del original que pasó el usuario).
- **Niveles:** EASY / NORMAL / HARD usan **la misma partitura** y cambia la **velocidad de caída** (2,2 s / 1,65 s / 1,2 s). En HARD, además, hay menos zigzags y más cortos (`tameChains` en `engine.js`: uno de cada dos, 3 monedas máx., 4 posiciones de ancho).
- **Barra de colores grande:** solo cuentan los toques dentro de ella (`barY0`); tolerancia lateral `HIT = 2.2` posiciones, medida siempre en la línea donde llegan las notas (la altura del dedo no cambia la posición). Ventanas de tiempo iguales antes y después: S·PERFECT ±42 ms, PERFECT ±85 ms, GOOD ±135 ms, BAD ±180 ms. Probado con un robot «persona real» (errores de tiempo y posición, toques a cualquier altura): 0,4 % de toques razonables sin contar (antes 1,8 %, por la ventana tardía de 120 ms).
- **Partituras preparadas que siguen la voz** (`superstar/charts/<id>.json`): `dynamite`, `no-more-dream`, `the-truth-untold`. Si el MP3 cargado tiene la misma duración (±1,5 s) se usa esa; si no, el **generador automático** en el navegador (`js/beatmap.js`).
- **Recorte automático de intros/colas de videoclip** (`start`/`end` en la partitura): el juego arranca la canción en `start`.
- **Ninguna nota antes de que empiecen a cantar**; en pausas instrumentales largas solo algún golpe fuerte.
- **«🎙 Grabar partitura»:** el usuario puede tocar al ritmo (velocidad lenta opcional, guía en gris) y el juego cuadra los toques al compás; se guarda en el móvil y se puede exportar.
- **Calibrar sincronía** en Ajustes (importante con Bluetooth).
- **Cartas:** miembro × era × rango (C/B/A/S/R). **Eras = los 10 álbumes de estudio** (`ERAS` en `js/data.js`): DARK & WILD, WAKE UP, YOUTH, WINGS, FACE YOURSELF, LOVE YOURSELF 轉 TEAR, MAP OF THE SOUL : 7, THE JOURNEY, BE, ARIRANG. Cada carta lleva **la foto de ese miembro en el año de ese álbum** (`img/cards/<ERA>/<miembro>.jpg`, créditos en `img/cards/CREDITS.md` y `js/card-credits.js`). Las cartas muestran solo la letra del rango (sin estrellas). Probabilidades del sobre: C 55,5 %, B 28 %, A 12 %, S 4 %, **R 0,5 %**.
- Mazo de 7 que da **+% de puntos**; las cartas de la misma era que la canción valen x1,5 y 4+ de la misma era dan bonus extra. **Antes de cada canción** sale la pantalla del mazo (`deckIntro` en `main.js`): brillan una a una las cartas de la era de la canción y se suma el bonus.
- Sobres con apertura tipo «Star Drops». Las cartas antiguas (eras SCHOOL, HYYH, LY, MOTS, BUTTER, PROOF) se pasan solas a las nuevas (`migrateEras`).
- **Sin auriculares (energía):** se juega sin límite. Nivel, RP, récords, PWA instalable.

## Compartir canciones (por privado)
- En la ficha de cada canción, **«📤 Enviar canción a alguien»** (`js/share.js`): crea un MP3 normal con una etiqueta ID3 (TXXX `SUPERSTAR`) que guarda id, título, era y la partitura grabada si la hay. Se manda con el menú de compartir del móvil (WhatsApp, Telegram…) o se descarga.
- La otra persona lo abre con **Canciones → Importar canciones**: se coloca solo en su sitio (`songFromShare`). Nada se sube a la web.

## Archivos clave
- `superstar/js/engine.js` — motor: dibujo, entrada táctil, juicios, cadenas (`path`), modo grabar.
- `superstar/js/main.js` — pantallas, carga de canciones, `chartFor()` (tu partitura > preparada > automática), grabación, tienda.
- `superstar/js/beatmap.js` — analizador y generador en el navegador (tempo por programación dinámica, intensidad por tramos, modelo de movimiento).
- `superstar/js/data.js` — canciones (con su era), eras (`THEMES`, `ERAS`), miembros, rangos y probabilidades, niveles (`speed` por nivel). `superstar/js/cards.js`, `superstar/js/drop.js` — cartas y apertura de sobres.
- `tools/build_chart.py` — **constructor de partituras desde un MP3** (ffmpeg + Demucs para separar la voz + librosa: pulsos, sílabas, melodía pYIN, bombo/caja, golpes especiales, recorte de intro).
- `tools/validate_chart.py` — valida una partitura contra su MP3 (tiempos, posiciones, notas largas, solapes, sincronía).
- `replica/recon.md`, `replica/features.csv` — análisis inicial del juego original.

## Formato de partitura (`superstar/charts/<id>.json`)
`{id, duration, start, end, firstVocal, bpm, phase, beats[], intensity:{step, v[]}, charts:{normal:{lanes:4, level, notes:[...]}}}`
Cada nota: `{t, lane}`; larga: `+end`; deslizamiento: `+lane2`; zigzag: `+path:[[t,lane],...]`. Los 4 carriles se convierten a 13 posiciones en el motor.

## Añadir una canción nueva
1. El usuario adjunta el MP3 en el chat.
2. Si no está en `SONGS` (`js/data.js`), añadirla (id, título y `theme` = la era: el álbum de estudio donde sale, coreano o japonés; si no sale en ninguno, el más cercano en el tiempo).
3. `python3 tools/build_chart.py cancion.mp3 <id> --out superstar/charts --diffs normal` (Demucs tarda ~2 min; requiere `pip install librosa soundfile torch demucs`).
4. `python3 tools/validate_chart.py superstar/charts/<id>.json cancion.mp3` → debe salir VÁLIDA.
5. Añadir el id a `PREPARED` en `js/main.js`, subir versión de `sw.js`, commit, push y desplegar.
6. Mandarle una **prueba de audio** (su MP3 con un «tic» en cada nota y un tono durante las notas largas) para que lo escuche.

## Reglas de diseño medidas en las partituras originales
- Media ~5,4 pulsaciones/s en HARD, pico 6,5 en 1 s, separación mínima 130 ms.
- Partes rápidas: casi nunca repite botón (7–9 %) y cambia de lado 50–65 %; casi nunca 3 seguidas en el mismo sitio.
- Notas unidas: suelen ser cortas, pero el usuario quiere **zigzags y diagonales anchas** como en sus capturas.
- Valores actuales del constructor (NORMAL): separación mínima 0,15 s, pico 5,5/s, notas largas cortas salvo frases alargadas (>1 s → hasta 3 s).

## Pendiente / ideas
- **Más canciones:** el usuario irá pasando MP3.
- **Fotos por era: hechas** (70 fotos). Desde el contenedor Wikimedia devuelve 429; se descargaron con una GitHub Action temporal (`tools/fetch_photo_candidates.py`, ya borrada la action). Para repetir: volver a crear `.github/workflows/` que la ejecute, elegir y recortar, y borrar los candidatos. Huecos: en 2020 casi no hay fotos libres (se usan de 2019); ARIRANG usa 2026 para Jin y Jung Kook, finales de 2025 para el resto y 2023 para SUGA; SUGA en 2016 tiene una sola foto (YOUTH y WINGS la comparten con distinto encuadre).
- Esperar el feedback del usuario sobre cómo se sienten Dynamite, No More Dream y The Truth Untold (zigzags, densidad, raps).
- Limitación honesta: no se puede escuchar el audio; la calidad se mide con el validador y con las pruebas de audio que escucha el usuario.

## Cómo probar
- Servidor local: `python3 -m http.server 8765` en la raíz y abrir `http://localhost:8765/superstar/`.
- Playwright + Chromium (preinstalados). Atajos de prueba en la página: `window.__ss` (`startSong`, `setDiff`, `game`, `P`). Para que un bot juegue: `g.pointers.set(pid, pos); g._press(pos, pid); g._up(pid)`.
- Ojo: las capturas congelan la página un instante y provocan algún MISS falso.
