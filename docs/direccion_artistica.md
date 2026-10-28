# Dirección artística — Pokémon Arena

Documento vivo del salto visual del prototipo 2D a un acabado 3D de juego móvil comercial.
Tomamos como referencia la **calidad de producción** del género (legibilidad, colorido, proporciones, presentación), con **identidad propia**: no se copia ningún recurso, modelo ni diseño de arena de juegos comerciales.

Última actualización: 28-10-2026.

---

## 1. Auditoría (hito A)

### 1.1 Motor y render antes del cambio

| Elemento | Estado encontrado | Clasificación |
|---|---|---|
| Motor | Phaser 3.90 (WebGL 2D) + TypeScript | Se mantiene para menús y HUD |
| Cámara | Ortográfica cenital, sin perspectiva | Sustituir |
| Arena | Damero verde con `Graphics`, río y puentes como rectángulos | Provisional → sustituir |
| Torres | Octógonos planos con un rombo o estrella | Provisional → sustituir |
| Pokémon | Fichas planas de ~1 casilla (círculo y triángulos) | Provisional → sustituir |
| Animaciones | Balanceo, volteo horizontal y embestida de 9 px | Insuficiente |
| Iluminación y sombras | Ninguna (elipse negra fija) | Inexistente |
| Partículas | Círculos con interpolación (`tween`) | Provisional |
| Ataques | Círculo de color que viaja en línea recta | Provisional |
| Cartas y HUD | Rectángulos redondeados, tipografía del sistema | Provisional (hito G) |
| Rendimiento | Bueno en 2D tras hornear texturas | Correcto |

**Todos los recursos gráficos eran provisionales**: no había ningún modelo, sprite ni textura definitiva.

### 1.2 Los cinco problemas visuales más importantes

1. **Vista cenital plana, sin luz ni volumen.** El campo se lee como un diagrama, no como un lugar.
2. **Torres sin silueta.** Insignias 2D sin altura, tejado ni materiales; al caer dejan círculos grises.
3. **Personajes como fichas diminutas.** Sin volumen ni animaciones diferenciadas (reposo, carrera, ataque, daño, derrota).
4. **Ataques sin impacto.** Sin anticipación, estela, partículas ni reacción del objetivo, y sin identidad elemental.
5. **Presentación de prototipo.** Tipografía del sistema, paneles planos y ninguna escenografía alrededor del campo.

### 1.3 Decisión técnica

Las primitivas 2D de Phaser no pueden ofrecer volumen, luz, sombras ni perspectiva. Se sustituye **solo la capa de render del campo** por **Three.js 0.186 (3D real)**:

- La simulación (`src/sim`) **no se toca**. Sigue siendo la fuente de verdad y la nueva capa (`src/render3d`) solo la lee.
- Phaser se mantiene para menús y HUD hasta el hito G.
- Mientras se valida la calidad, la nueva capa vive en una página propia (`referencia.html`), sin romper el juego actual.

---

## 2. Estilo

**Fantasía 3D estilizada de juguete de alta calidad.**

- **Volúmenes:** redondeados y limpios; proporciones *chibi* en los personajes (cabeza grande, extremidades cortas).
- **Siluetas:** legibles desde la cámara de juego; contorno oscuro (casco invertido) en los personajes.
- **Materiales:** sencillos pero diferenciados (piedra, madera, metal dorado, tejas, agua, hierba, plástico de juguete). Sin texturas fotográficas.
- **Detalle:** suficiente para parecer terminado (almenas, ménsulas, estandartes, flores), concentrado fuera de las zonas de lectura del combate.
- **Prohibido:** emojis, iconos o ilustraciones planas en lugar de modelos, y aspecto de "rectángulos y círculos HTML".

### 2.1 Decisión de estilo de los Pokémon (28-10-2026): vóxel, "píxel 3D"

A petición del usuario ("que los Pokémon sean rollo pixel"), se compararon tres opciones en la misma escena. Lámina: `capturas/comparacion_estilos.jpg`.

| Opción | Resultado | Decisión |
|---|---|---|
| A. Suave (volúmenes redondeados) | Limpio y legible, pero más genérico | Se conserva como alternativa (`?estilo=suave`) |
| **B. Vóxel** (cubos + cara de pixel art) | Identidad propia y retro, encaja con la cámara cenital, conserva luz, sombras y animación | **Elegida** (por defecto) |
| C. Escena entera pixelada (render a 1/3 y ampliación nítida) | Arena borrosa y números de vida ilegibles ("1600" deformado) | Descartada |

Reglas del estilo vóxel (`src/render3d/creatures/voxel.ts`):
- **Tamaño del cubo: 0,085 casillas.** Pikachu mide ~16 cubos de alto y su cabeza ~10 de ancho, como un sprite clásico de 16 px. Con cubos de 0,055 cada cubo ocupaba ~1 píxel en la cámara de juego y el estilo no se percibía; con 0,11 se perdía la forma.
- **Una rejilla por pieza animada** (cabeza, orejas, brazos, pies, cola). La animación procedural sigue igual.
- **Oclusión ambiental por vértice** y ±6 % de variación de tono por cubo. Solo se generan las caras exteriores.
- **La cara se dibuja a mano, píxel a píxel** (8×4: ojos 2×2 con brillo, boca, mejillas), y se pinta sobre el cubo más frontal de cada columna. Derivarla de esferas diminutas daba ojos asimétricos y una boca de mancha. Las mejillas usan su propio material: se siguen encendiendo al cargar.
- **Formas macizas para piezas finas.** Las orejas pasan de cono a elipsoide para no partirse al convertirlas en cubos.
- **La arena se mantiene suave y estilizada** (juguete 3D). Los personajes vóxel destacan sobre ella y la lectura del combate no se resiente.

## 3. Paleta (`src/render3d/palette.ts`)

| Uso | Color |
|---|---|
| Césped claro / oscuro | `#76c84a` / `#68ba40` |
| Arena de caminos | `#e7c98a` (borde `#96784a`) |
| Agua poco profunda / profunda | `#2fb7e6` / `#1677b8` |
| Piedra / piedra oscura | `#d9d1c2` / `#8d8478` |
| Madera / madera oscura | `#b8793f` / `#7a4a24` |
| Oro (remates, puertas) | `#f5c542` |
| Equipo jugador (claro / base / oscuro) | `#9cc8ff` / `#3f8cff` / `#1f4fae` |
| Equipo rival (claro / base / oscuro) | `#ffa59e` / `#ff5146` / `#b3261d` |
| Contorno de personajes | `#1d1410` |
| Cielo / niebla | `#9fdcf5` / `#b8e6f2` |

Los tipos elementales conservan su color en efectos y números (eléctrico `#ffe14a`, fuego `#ff7a1a`, agua `#3fb7ff`…).

## 4. Escala (1 unidad = 1 casilla de la simulación)

| Objeto | Altura visual |
|---|---|
| Torre guardiana | 6,4 hasta el vértice del tejado (radio de huella 1,2–1,6) |
| Base principal | 7,55 hasta el vértice (radio 1,6–2,0, corona dorada) |
| Muro perimetral | 0,87 sobre el terreno exterior |
| Puente | 3 de ancho, arco de 0,22 |
| Pikachu | 1,35 × escala visual 1,6 ≈ 2,2 (≈ 16 cubos de 0,085 en estilo vóxel) |

**Regla de tamaño de personajes:** altura base = 0,8 + 0,55·log₂(altura real / 0,4 m + 1). Comprime la enorme variación real (de 0,4 m a 8,8 m) en un rango legible de 1,35 a 3,3 casillas. Se multiplica por `UNIT_SCALE = 1,6` para que se lean bien en la cámara de juego. Era 1,35; se subió al integrar el 3D en la batalla jugable, porque en la pantalla del móvil se veían pequeños. Solo afecta al dibujo: las colisiones no cambian. Las alturas reales vienen de PokéAPI (`docs/datos_pokeapi.json`):

| Pokémon | Altura real | Altura base |
|---|---|---|
| Pikachu | 0,4 m | 1,35 |
| Squirtle / Jigglypuff | 0,5 m | 1,44 |
| Bulbasaur | 0,7 m | 1,58 |
| Machop | 0,8 m | 1,64 |
| Charmeleon / Pidgeotto | 1,1 m | 1,80 |
| Charizard | 1,7 m | 2,11 |
| Snorlax | 2,1 m | 2,25 |
| Onix | 8,8 m | 3,30 |

## 5. Iluminación y sombras (`src/render3d/engine.ts`)

- **Cielo (hemisférica):** `#e4f4ff` arriba y `#5f8d43` abajo, intensidad 1,15. Rellena las sombras con un tono verde cálido.
- **Sol direccional cálido** `#fff0d2`, intensidad 2,4, desde arriba a la izquierda y por delante. Proyecta **sombras suaves** (PCF, radio 3) de torres, personajes, árboles y muros.
- **Contraluz frío** `#9fc7ff`, intensidad 0,7, desde el fondo. Recorta las siluetas.
- **Sombras de contacto:** disco difuminado bajo cada personaje, además de la sombra proyectada. Nada debe parecer flotar.
- **Mapeo tonal neutro** (Khronos PBR Neutral): conserva los colores saturados. ACES los apagaba.
- **Brillo (bloom)** con umbral alto (0,82): solo brillan los elementos emisivos (rayos, cristales, destellos). El escenario no.
- **Niebla** atada a la distancia de la cámara: solo afecta al decorado lejano, nunca al campo.

## 6. Materiales

| Material | Implementación |
|---|---|
| Piedra | Textura procedural de sillares con juntas, brillo superior y sombra inferior por pieza |
| Piedra lisa (almenas, contrafuertes) | Color plano `#d6cdbd`: evita sillares diminutos en piezas pequeñas |
| Madera | Tablones con vetas y nudos |
| Tejas | Escamas con degradado en el color del equipo |
| Oro | `metalness 0,55`, `roughness 0,3` |
| Agua | Shader propio: degradado de profundidad, reflejos alargados en la corriente y espuma animada en las orillas |
| Hierba | Textura del campo con franjas de segado, damero sutil (rejilla de despliegue), manchas y matas solo en los bordes |
| Personajes | `MeshPhysicalMaterial` con barniz (`clearcoat 0,25–0,8`): aspecto de figura de juguete |
| Cristal de torre | Octaedro facetado emisivo con el color del equipo y luz puntual propia |

Todas las texturas son **procedurales y originales** (`src/render3d/textures.ts`): se pintan en `<canvas>` al arrancar.

## 7. Cámara

- **Juego:** perspectiva de 28°, inclinación de **58°** (más cenital, como en los juegos de estrategia móviles: los personajes se leen desde arriba sin perder el volumen de las torres), el jugador abajo. El encuadre se calcula para que el campo completo, incluida la punta del tejado de la base rival, quepa por encima de la franja del HUD (15,5 % inferior).
- **Detalle y personaje:** solo para revisión. La pantalla vertical tiene un campo de visión horizontal estrecho (~18°), así que estas cámaras **alinean al personaje y su objetivo con la dirección de la vista**.

## 8. Animación y efectos

**Personajes:** jerarquía de piezas con pivotes y animación procedural (sin esqueleto con *skinning*; ver §10).

| Estado | Pikachu |
|---|---|
| Reposo | Respiración, parpadeo, tic de orejas, vaivén de cola |
| Carrera | Rebote, inclinación, braceo, pies alternos, orejas hacia atrás |
| Anticipación | Se agacha, orejas erguidas, cola tiesa vibrando, mejillas encendidas con arcos eléctricos que saltan hacia fuera |
| Ataque | Estirón, brazos hacia delante, latigazo de cola |
| Daño | Aplastamiento, retroceso y destello cálido breve |
| Aturdido | Balanceo de cabeza |
| Aparición | Cae desde arriba estirado y aterriza aplastándose, con polvo y aro de equipo |
| Derrota | Salto, giro, encogimiento y desvanecimiento con nube y chispas |

**La anticipación se sincroniza con las reglas sin modificarlas:** la vista lee el enfriamiento del ataque (`cooldown`) y anima la carga en los 0,3 s previos al golpe.

**Sistema modular de ataques** (`src/render3d/fx/effects.ts`):
- **Piezas:** carga → lanzamiento → proyectil con arco, estela y (en eléctricos) haz quebrado → impacto (destello, onda en el suelo, chispas con física, rayos radiales, humo) → reacción del objetivo → número de daño → limpieza automática.
- **Familias elementales**, que se diferencian en colores, gravedad de las partículas y presencia de arcos:

| Familia | Comportamiento |
|---|---|
| Eléctrico | Blanco y amarillo, arcos y haz |
| Fuego | Brasas que suben |
| Agua | Gotas que caen |
| Físico | Polvo y estrella blanca |
| Torres | Color del equipo |

- Las partículas se dibujan en un único lote de GPU por modo de fusión.
- **Números de daño** con la tipografía *Lilita One*, contorno grueso y degradado: naranja y "¡Eficaz!" si es eficaz, gris si es poco eficaz.

**Reglas de legibilidad, aplicadas tras la revisión de capturas:**
- Un efecto nunca blanquea por completo a un personaje ni a una torre. El destello por impacto se limita al 22 % en torres y al 60 % (cálido) en personajes.
- Los impactos pequeños (torre contra personaje) usan la mitad de potencia y humo gris, no blanco.
- La anticipación nace de las mejillas hacia fuera, nunca sobre la cara.

### 8.1 Modelos del hito F (11 especies) y ampliación a 34 especies (29-10-2026)

**Ampliación a 34 especies:**
- **Referencias:** ilustraciones oficiales que sirve PokéAPI (`sprites/other/official-artwork`), usadas **solo como referencia** de proporciones y rasgos. Los colores salen del análisis de sus colores dominantes. Ninguna imagen se incluye en el juego; los modelos son geometría propia.
- **Variantes por línea:** cada línea comparte una forma con variantes por fase, y la escala de especie (`CreatureRig.size`, hasta ×1,35) mantiene parecida la densidad de cubos. Rasgos de cada fase:
  - Charmander: cabeza redonda, sin cuerno.
  - Wartortle: orejas y cola de pelo. Blastoise: cañones y borde blanco del caparazón.
  - Ivysaur: capullo. Venusaur: flor de cinco pétalos.
  - Machoke y Machamp: calzón y cinturón dorado. Machamp tiene cuatro brazos.
  - Pidgey: pequeño, con alas plegadas. Pidgeot: melena y cola en abanico.
  - Graveler: cuatro brazos. Golem: caparazón de placas.
  - Wigglytuff: cuerpo de huevo y barriga blanca.
  - Steelix: bloques de acero con púas.
- **Especies nuevas:** Raichu, Gastly (gas palpitante), Haunter (manos sueltas), Gengar (sonrisa), Abra (sentado, ojos cerrados), Kadabra y Alakazam (cucharas que brillan al cargar), Dratini y Dragonair (serpiente erguida con barrido de cola) y Dragonite (vuela).
- Lámina: `capturas/galeria_reposo.jpg`.

**Hito F (11 especies):**

Los diez Pokémon nuevos siguen las mismas reglas que Pikachu: primitivas → vóxel de 0,085, cara de pixel art dibujada a mano y animación procedural.
- **Bípedos** (`BipedRig`): Squirtle, Charmeleon, Charizard, Machop, Snorlax y Jigglypuff. Comparten respiración, zancada, carga, golpe, daño y aturdimiento. Cada uno añade lo suyo: llama de la cola que ondula y brilla (Charmeleon y Charizard), alas que baten (Charizard), puñetazo con el brazo derecho (Machop), balanceo y panzazo (Snorlax), botes y se hincha al cantar (Jigglypuff).
- **Con animación propia:** Bulbasaur (cuatro patas en diagonal; el bulbo palpita al cargar), Pidgeotto (vuela batiendo las alas y ataca en picado), Geodude (flota y golpea con los dos puños) y Onix (siete segmentos que ondulan y embiste con la cabeza).
- Las piezas finas (alas, membranas) usan elipsoides de al menos dos cubos de grosor. La capa delantera se añade la última para que gane al pasar a cubos (membrana azul delante y naranja detrás en Charizard).

## 9. Criterios de calidad (lista de verificación por recurso)

- [ ] Silueta reconocible desde la cámara de juego, a tamaño de móvil.
- [ ] Volumen y materiales diferenciados; ninguna textura estirada o a mala escala.
- [ ] Sombra proyectada y de contacto.
- [ ] Animaciones de reposo, desplazamiento, ataque, daño y derrota.
- [ ] Efectos de habilidad con su familia elemental.
- [ ] Ningún efecto oculta unidades, barras de vida ni puntos de despliegue.
- [ ] Sin errores de consola. Funciona en las calidades alta, media y baja.
- [ ] Captura de antes y después revisada a mano.

## 10. Recursos y licencias

| Recurso | Origen | Licencia |
|---|---|---|
| Modelos 3D (arena, puentes, torres y ruinas, los 11 Pokémon, árboles, rocas) | **Originales**, construidos con geometría de Three.js en código (`src/render3d/`) | Del proyecto |
| Texturas (piedra, madera, tejas, césped, partículas) | **Originales**, procedurales en `<canvas>` | Del proyecto |
| Three.js 0.186.1 | npm `three` | MIT |
| Tipografía *Lilita One* (títulos y cifras del juego) | npm `@fontsource/lilita-one` 5.3.0 | SIL OFL 1.1 |
| Tipografía *Nunito* 800 (texto corrido del juego) | npm `@fontsource/nunito` 5.3.0 | SIL OFL 1.1 |
| Iconos de la interfaz (moneda, trofeo, energía, corona, candado, estrella) | **Originales**, dibujados con primitivas en `game/ui/icons.ts` | Del proyecto |
| Pokéballs de la tienda | **Originales**, dibujadas con primitivas en `game/render/pokeball.ts` | Del proyecto |
| Datos de referencia (tipos, alturas, colores) | PokéAPI v2 (catálogo *public-apis*), `scripts/pokeapi_datos.mjs` → `docs/datos_pokeapi.json` | Datos de PokéAPI; **no se usan sus sprites** (son recursos de juegos comerciales) |

**Sobre los modelos, con honestidad:** son mallas 3D reales (geometría, normales y materiales PBR) **construidas por código**. No proceden de una herramienta de modelado ni tienen esqueleto con *skinning*: cada personaje es una jerarquía de piezas rígidas animadas proceduralmente. Es adecuado para personajes *chibi* de piezas redondeadas. Un acabado con deformación de malla requeriría:
- modelos rigueados (glTF) hechos en Blender o con una herramienta de generación 3D;
- `GLTFLoader` y `AnimationMixer`.

No hay ninguna herramienta de ese tipo disponible en este entorno. `creatures/registry.ts` es el punto de integración: un `CreatureRig` puede envolver un modelo glTF cargado sin cambiar el resto del código.

**Recursos de public-apis evaluados:**
- **PokéAPI:** usada solo para datos.
- **Iconify:** su set *game-icons* (CC BY 3.0) es candidato para iconos del HUD en el hito G.
- **3DTexel:** CC0, pero inaccesible desde este entorno (tiempo de espera agotado).
- **Colormind:** accesible, no necesario.
- **Master Setter (cartas TCG):** descartado. Contiene ilustraciones comerciales.

---

## 12. Cartas e interfaz (hito G, 29-10-2026)

- **Tipografías:** *Lilita One* en títulos, cifras, botones y nombres, y *Nunito* (800) en el texto corrido: descripciones, resúmenes y fichas. Ambas son SIL OFL 1.1 y se cargan antes de arrancar Phaser, para que ningún texto se rasterice con la fuente de reserva.
- **Iconos propios** (`game/ui/icons.ts`), dibujados con primitivas y rasterizados una vez: moneda, trofeo, gota de energía, corona (medalla) llena y vacía, candado, estrella llena y vacía, confirmación y cerrar. **Se eliminan todos los emojis** de la interfaz, porque cambian de aspecto en cada sistema.
- **Marco de carta** (`CardWidget`):
  - **Retrato:** vóxel a sangre sobre una ventana con degradado y halo del color del tipo.
  - **Marco por fase:** plata en fase 1, oro en fase 2 y morado épico en fase 3; los hechizos usan el mismo esquema por nivel.
  - **Indicadores:** gota de energía con el coste arriba a la izquierda, puntos de tipo arriba a la derecha, cinta oscura con el nombre (ajustado al ancho) y estrellas de fase sobre la cinta.
  - Debajo, en el mazo, la barra de copias para evolucionar.
- **HUD de batalla:**
  - **Marcador:** degradado azul, con «RIVAL» y «TÚ» en los colores de equipo y tres coronas por bando que se llenan al derribar torres.
  - **Cronómetro:** en una cápsula con borde dorado; al lado, un botón redondo para salir.
  - **Panel inferior:** degradado con filo de luz, carta «Siguiente» en su hueco y barra de energía rosa con 10 divisiones, brillo y gota con la cifra.
- **Resto de pantallas:**
  - Coronas en los resultados.
  - Monedas y trofeos con su icono en el menú, el mazo, la tienda, el camino de trofeos y los resultados.
  - Botones de precio con el icono de moneda.

## 11. Estado por hitos visuales

| Hito | Estado |
|---|---|
| A. Auditoría | ✅ (§1) |
| B. Escenario de prueba con luz, cámara y materiales | ✅ `referencia.html` |
| C. Torre de referencia | ✅ Guardiana y base (variante) con cristal, almenas, balcón, tejado y bandera animada |
| D. Pokémon de referencia | ✅ Pikachu en estilo vóxel (por defecto) y suave, con todas sus animaciones |
| E. Ataque completo | ✅ Impactrueno: carga, lanzamiento, vuelo con haz, impacto, reacción, número, limpieza |
| F. Resto de unidades y torres | ✅ Los 11 Pokémon en vóxel con cara de pixel art y animaciones (`capturas/galeria_*.jpg`). Ruinas de torre: muñón roto, cascotes, vigas, tejado caído, cristal partido, estandarte y humo (`capturas/torre_ruinas.jpg`) |
| G. Cartas y HUD | ✅ Marco de carta definitivo, HUD de batalla, iconos propios y tipografías del juego en todas las pantallas (§12, `capturas/juego_*.jpg`) |
| H. Optimización y pruebas | 🟡 La capa 3D ya es la batalla jugable (`capturas/juego_batalla_3d_movil.jpg`), probada en E2E con WebGL por software. Faltan medir en móviles reales y reducir llamadas de dibujo (~550 por fotograma) |

**Capturas (antes y después de la misma escena):** `docs/capturas/` (`comparacion_antes_despues.jpg`, `ref_*.jpg`). Se generan con `node scripts/captura_referencia.mjs` en modo determinista.
