# SUPERSTAR · ARMY Edition — resumen para seguir trabajando

## Qué es
Juego de ritmo web (PWA instalable) inspirado en **SuperStar BTS** (Dalcomsoft, 2018–2020, ya cerrado), hecho como **regalo para la novia del usuario**. Se juega en el móvil, **solo en horizontal**: la app ocupa toda la pantalla, menú en una barra a la izquierda; si el móvil está en vertical (sin giro automático) la app se dibuja girada (`body.rot`, `applyRot` en `main.js`; el motor y los sobres convierten las coordenadas del toque). El CSS usa `--aw`/`--ah` (tamaño de la app) en lugar de vw/vh. Icono de la app: el logo SUPERSTAR que pasó el usuario (`superstar/icons/`).

- **Web publicada:** https://superstar-army.vercel.app
- **Repositorio:** `yamayorgahidalgo88-glitch/Sorpresa`, rama `claude/bts-superstar-game-vesiwx`. El juego está en `superstar/`. El `index.html` de la raíz es OTRO regalo («Flores Amarillas»): no tocarlo.
- **Vercel:** equipo `team_AJTr7WqPBL2IVmRDgpky7Ac8` (La Quinta del Bnitre), proyecto `superstar-army`. Se despliega con la herramienta de Vercel `create_deployment` usando `gitSource` (github, org `yamayorgahidalgo88-glitch`, repo `Sorpresa`, ref de la rama) y `target: production`. En cada cambio hay que **subir la versión de caché** en `superstar/sw.js` (`superstar-vNN`, ahora v55).
- El usuario habla **español** y no es programador: explicarle en lenguaje sencillo.

## Reglas importantes (decididas con el usuario)
- **No se sube ni se incrusta audio de BTS** en el repo ni en la web (los dos son públicos). Ella carga sus MP3 en el móvil (se guardan en IndexedDB). En el repo solo van **partituras** (tiempos y posiciones).
- No copiar letras, arte, logos ni partituras originales. Las fotos de los miembros son de **Wikimedia Commons con licencia libre** (créditos en Ajustes y en `superstar/img/members/CREDITS.md`).
- Del repo de fans `ssurgents.github.io` solo se usaron **estadísticas agregadas** de 152 partituras HARD de otra serie de SuperStar (no se copió ninguna).

## Cómo es el juego ahora
- **Pista en perspectiva horizontal**, fondo con los 7 miembros tintado de rosa, láseres, medidor RAVE (ENERGY → ULTRA RAVE con bonus x1–x4), carta que puntúa arriba en el centro, cut-in del miembro, juicios S·PERFECT/PERFECT/GOOD/BAD/MISS y combo.
- **Sin botones fijos:** abajo solo hay una barra de luz. Las notas caen en **13 posiciones** a lo ancho (como el original) y se toca donde llega cada nota (tolerancia ~1,7 posiciones).
- **Notas:** sueltas azules/rosas, dobles moradas (gemas), doradas = unidas: notas largas, **deslizamientos en diagonal** y **zigzags de 3–4 monedas con bandas rectas** que cruzan la pista (como las imágenes del original que pasó el usuario).
- **Niveles:** EASY y NORMAL usan **la misma partitura**; **HARD tiene su propia partitura con ~40 % más notas** (`charts.hard`: voz + golpes de bombo/caja en la rejilla de semicorcheas confirmados por el detector de la pista instrumental; `--diffs normal,hard` en `build_chart.py`; en la pista automática `nps` 4,7). Todas las preparadas tienen ya `charts.hard` (si alguna no lo tuviera, HARD usa la de NORMAL). Además cambia la **velocidad de caída** (2,2 s / 1,65 s / 1,2 s). En HARD, además, hay menos zigzags y más cortos (`tameChains` en `engine.js`: uno de cada dos, 3 monedas máx., 4 posiciones de ancho).
- **Barra de colores grande:** solo cuentan los toques dentro de ella (`barY0`); tolerancia lateral `HIT = 2.2` posiciones, medida siempre en la línea donde llegan las notas (la altura del dedo no cambia la posición). Ventanas de tiempo iguales antes y después: S·PERFECT ±42 ms, PERFECT ±85 ms, GOOD ±135 ms, BAD ±180 ms. Probado con un robot «persona real» (errores de tiempo y posición, toques a cualquier altura): 0,4 % de toques razonables sin contar (antes 1,8 %, por la ventana tardía de 120 ms).
- **Partituras preparadas que siguen la voz** (`superstar/charts/<id>.json`): `dynamite`, `no-more-dream`, `the-truth-untold`, `danger`, `on`, `n-o` (N.O, era DARK & WILD por cercanía: es de O!RUL8,2?, 2013). Si el MP3 cargado tiene la misma duración (±1,5 s) se usa esa; si no, el **generador automático** en el navegador (`js/beatmap.js`).
- **Recorte automático de intros/colas de videoclip** (`start`/`end` en la partitura): el juego arranca la canción en `start`.
- **Ninguna nota antes de que empiecen a cantar**; en pausas instrumentales largas solo algún golpe fuerte.
- **«🎙 Grabar partitura»:** el usuario puede tocar al ritmo (velocidad lenta opcional, guía en gris) y el juego cuadra los toques al compás; se guarda en el móvil y se puede exportar.
- **Calibrar sincronía** en Ajustes (importante con Bluetooth).
- **Cartas:** miembro × era × rango (C/B/A/S/R). **Eras = 21 álbumes** (`ERAS` en `js/data.js`): 2 COOL 4 SKOOL, O!RUL8,2?, SKOOL LUV AFFAIR, DARK & WILD, WAKE UP, HYYH Pt.1, HYYH Pt.2, YOUNG FOREVER, YOUTH, WINGS, LOVE YOURSELF HER, FACE YOURSELF, TEAR, ANSWER, MOTS PERSONA, MOTS:7, THE JOURNEY, BE, BUTTER, PROOF, ARIRANG. Cada canción va en el álbum donde salió por primera vez. Cada carta lleva **la foto de ese miembro en el año de ese álbum** (`img/cards/<ERA>/<miembro>.jpg`, créditos en `img/cards/CREDITS.md` y `js/card-credits.js`). Las cartas muestran solo la letra del rango (sin estrellas). Probabilidades por carta (las de los Star Drops normales de Brawl Stars): C 50 %, B 28 %, A 15 %, S 5 %, R 2 %. Cada sobre trae 1 carta (50 %), 2 (30 %) o 3 (20 %) (`PACK_SIZES`). Colores únicos por rango en cartas y sobres: C gris plateado, B azul claro, A amarillo dorado, S rosa, R lila. Apertura (`js/drop.js`, imágenes del usuario en `img/drop/`: `pack.webp`, `card-back.webp`, `glow-C/B/A/S/R.webp`, `space.jpg`): fondo de galaxia que se mueve; el sobre se abre **deslizando el dedo por la línea de puntos** con tijeras animadas (como Pokémon TCG Pocket), la tira de arriba sale volando, luz y fogonazo blanco; cada carta sale boca abajo con el dorso y el brillo de su rango (respira, parpadea, chispas y anillos girando en S y R); 3 toques por carta, si sube de rango otros 3, cuando no sube se da la vuelta. Sin sonidos ni nombres de rango. El corte es de verdad: hay que empezar en un extremo de la línea y llegar al otro sin levantar el dedo; si no, se deshace. «Abrir 5» junta las cartas de los 5 sobres en una apertura (sin contador ni aviso de cuántas cartas trae; botón «Desvelar todas») y siempre termina en un resumen. Los rayos girando solo salen con la carta ya girada. `pack.webp` recortado por su silueta (GrabCut). Apertura en 4 pasos (`.cut` → `.opened` → `.glowing` → `.whiteout` en `drop.js`). Imágenes precargadas al abrir la app (`preloadDrop`) y en la caché del service worker.
- Sobres: 10.000 notas (5 = 50.000). Al empezar en un dispositivo nuevo no hay cartas: primero se pide el nombre (`welcome()`), luego «¡Bienvenid@, <nombre>!» con **5 sobres gratis** (sumando al menos 7 cartas y sin repetir, `welcomeSizes` y `noDup`; el resto de sobres, sin cambios) que se abren seguidos directamente (`welcomeGift`, `openFreePacks`) y al acabar va a Inicio. En la Tienda, los sobres gratis de los niveles se abren con un solo botón «Abrir mis N sobres gratis». El 4-nov-2026 se reinició la partida del usuario (tres veces; la última para ver la bienvenida con 7 cartas mínimo) (`RESET_TAG` en `main.js`: nivel, cartas, notas y récords a cero; se conservan canciones, partituras grabadas, ajustes y nombre). Para otro reinicio, cambiar `RESET_TAG`.
- Mazo de 7 que da **+% de puntos**; las cartas de la misma era que la canción valen x1,5 y 4+ de la misma era dan bonus extra. **Antes de cada canción** sale la pantalla del mazo (`deckIntro` en `main.js`): brillan una a una las cartas de la era de la canción y se suma el bonus.
- Sobres con apertura tipo «Star Drops». Las cartas antiguas (eras SCHOOL, HYYH, LY, MOTS, BUTTER, PROOF) se pasan solas a las nuevas (`migrateEras`).
- **Sin auriculares (energía):** se juega sin límite. Nivel, RP, récords, PWA instalable.

## Cartas (pantalla)
- Tocar una carta del mazo abre `swapView` (como Clash Royale): la carta en grande y abajo una fila deslizable con las demás; tocar una la cambia (si ya estaba en el mazo, se intercambian).
- Colección con filtros (calidad mayor/menor y época: siempre las 21 etapas, con cuántas cartas tienes de cada una); se reinician al entrar en Cartas desde otra pantalla (`deckFilter` en `go()`).
- Desde la ficha de una canción, «Cambiar mazo» abre Cartas para esa canción (`go('deck', {songId})`, `deckSong`): aviso arriba con el bonus, las cartas de la era de la canción primero y marcadas x1.5 (también en `swapView`), y «Volver a la canción».
- Ficha de canción: el bonus del mazo grande arriba (`.sheet-bonus`) y en el mazo las cartas de la era de la canción iluminadas y las demás en gris (`.deck-mini.sinergy`).
- Resultado: si es nuevo récord sale «¡NUEVO RÉCORD!» con la puntuación anterior y la mejora.
- Todas las ventanas tienen botón ← volver (`modal()`). Comprar sobres pide confirmación (Sí/No).

## Portada
- Imagen del usuario (`img/title.jpg`, sin el texto «TOCA PARA EMPEZAR», que se dibuja encima con animación de brillo) a pantalla completa.

## Niveles
- Tocar «Lv.N» arriba abre `levelSheet`: barra de EXP y las recompensas de los próximos niveles. Recompensa al llegar a cada nivel (`levelReward`): múltiplos de 10 → 5 sobres gratis; múltiplos de 5 → 1 sobre gratis; el resto → 1.000 notas (RP). Las recompensas quedan **pendientes** (`P.pending`) hasta recogerlas: el nivel de arriba brilla en un recuadro arcoíris; en `levelSheet` salen como tarjetas «RECOGER»; las notas se suman y los sobres se abren directamente (`openPacksNow`) y se vuelve a la ventana del nivel.

## Compartir canciones (por privado)
- En la ficha de cada canción, **«📤 Enviar canción a alguien»** (`js/share.js`): crea un MP3 normal con una etiqueta ID3 (TXXX `SUPERSTAR`) que guarda id, título, era y la partitura grabada si la hay. El archivo se prepara al abrir la ventana y el botón «Compartir por WhatsApp…» llama a `navigator.share({files})` (solo el archivo, sin texto) directamente en el toque; si no se puede, «Guardar el archivo» y mandarlo en WhatsApp como Documento.
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
3. `PYTHONHASHSEED=0 python3 tools/build_chart.py cancion.mp3 <id> --out superstar/charts --diffs normal,hard` (Demucs tarda ~2 min; requiere `pip install librosa soundfile torch demucs`).
4. `python3 tools/validate_chart.py superstar/charts/<id>.json cancion.mp3` → debe salir VÁLIDA.
5. Añadir el id a `PREPARED` en `js/main.js`, subir versión de `sw.js`, commit, push y desplegar.
6. Mandarle una **prueba de audio** (su MP3 con un «tic» en cada nota y un tono durante las notas largas) para que lo escuche.

## Nota sobre el validador
- En canciones de rock con guitarras muy fuertes (Danger, ON) el detector de golpes de la mezcla solo encuentra ~2 golpes/s, así que el control de sincronía sale «FALLO» aunque la partitura esté bien. Comprobación alternativa usada: notas frente a sílabas de la voz separada + golpes de la pista instrumental (82 % a < 45 ms, desfase −11 ms; solo 4 de 625 notas a > 100 ms de algo que suena).

## Reglas de diseño medidas en las partituras originales
- Media ~5,4 pulsaciones/s en HARD, pico 6,5 en 1 s, separación mínima 130 ms.
- Partes rápidas: casi nunca repite botón (7–9 %) y cambia de lado 50–65 %; casi nunca 3 seguidas en el mismo sitio.
- Notas unidas: suelen ser cortas, pero el usuario quiere **zigzags y diagonales anchas** como en sus capturas.
- Valores actuales del constructor (NORMAL): separación mínima 0,15 s, pico 5,5/s, notas largas cortas salvo frases alargadas (>1 s → hasta 3 s).

## Pendiente / ideas
- **Más canciones:** el usuario irá pasando MP3.
- **Fotos por era: hechas** (147 fotos, 7 miembros × 21 eras; las photocards oficiales NO se usan: son de HYBE y la web es pública). Desde el contenedor Wikimedia devuelve 429; se descargaron con una GitHub Action temporal (`tools/fetch_photo_candidates.py`, ya borrada la action). Para repetir: volver a crear `.github/workflows/` que la ejecute, elegir y recortar, y borrar los candidatos. Huecos: en 2020 casi no hay fotos libres (se usan de 2019); ARIRANG usa 2026 para Jin y Jung Kook, finales de 2025 para el resto y 2023 para SUGA; SUGA en 2016 tiene una sola foto (YOUTH y WINGS la comparten con distinto encuadre).
- Esperar el feedback del usuario sobre cómo se sienten Dynamite, No More Dream y The Truth Untold (zigzags, densidad, raps).
- Limitación honesta: no se puede escuchar el audio; la calidad se mide con el validador y con las pruebas de audio que escucha el usuario.

## iPhone (iOS)
- No se ha podido probar en Safari real (solo hay Chromium en el contenedor). Arreglos preventivos: `navigator.audioSession.type='playback'` + audio HTML mudo (que suene con el interruptor de silencio), reanudar el audio al volver a la app, `-webkit-backdrop-filter`, sin menú de pulsación larga ni zoom por doble toque.
- Necesita iOS 16.2 o más (usa `color-mix` y `:has`). En Safari sin instalar, el navegador puede borrar los datos tras 7 días sin abrir la web: mejor instalarla en la pantalla de inicio. Las canciones de Apple Music no se pueden cargar (están protegidas): hacen falta archivos MP3 en la app Archivos.

## Cut-in del miembro (al subir el RAVE / cada 100 de combo)
- Franja arriba a la izquierda, con ancho limitado al hueco entre el borde de la pantalla y la pista (`edgeX`/`_pAtY`), para no taparla nunca. Foto en una ventana a la izquierda encuadrada en la cara; nombre y rango al lado.

## Cómo probar
- Servidor local: `python3 -m http.server 8765` en la raíz y abrir `http://localhost:8765/superstar/`.
- Playwright + Chromium (preinstalados). Atajos de prueba en la página: `window.__ss` (`startSong`, `setDiff`, `game`, `P`). Para que un bot juegue: `g.pointers.set(pid, pos); g._press(pos, pid); g._up(pid)`.
- Ojo: las capturas congelan la página un instante y provocan algún MISS falso.
