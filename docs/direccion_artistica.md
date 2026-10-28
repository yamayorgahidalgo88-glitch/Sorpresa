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
| Pikachu | 1,35 × escala visual 1,35 ≈ 1,8 |

**Regla de tamaño de personajes:** altura base = 0,8 + 0,55·log₂(altura real / 0,4 m + 1). Comprime la enorme variación real (de 0,4 m a 8,8 m) en un rango legible de 1,35 a 3,3 casillas. Se multiplica por `UNIT_SCALE = 1,35` para que se lean bien en la cámara de juego. Las alturas reales vienen de PokéAPI (`docs/datos_pokeapi.json`):

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

- **Juego:** perspectiva de 28°, inclinación de 50°, el jugador abajo. El encuadre se calcula para que el campo completo, incluida la punta del tejado de la base rival, quepa por encima de la franja del HUD (15,5 % inferior).
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
| Modelos 3D (arena, puentes, torres, Pikachu, árboles, rocas) | **Originales**, construidos con geometría de Three.js en código (`src/render3d/`) | Del proyecto |
| Texturas (piedra, madera, tejas, césped, partículas) | **Originales**, procedurales en `<canvas>` | Del proyecto |
| Three.js 0.186.1 | npm `three` | MIT |
| Tipografía *Lilita One* | npm `@fontsource/lilita-one` 5.3.0 | SIL OFL 1.1 |
| Tipografía *Nunito* | npm `@fontsource/nunito` 5.3.0 | SIL OFL 1.1 |
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

## 11. Estado por hitos visuales

| Hito | Estado |
|---|---|
| A. Auditoría | ✅ (§1) |
| B. Escenario de prueba con luz, cámara y materiales | ✅ `referencia.html` |
| C. Torre de referencia | ✅ Guardiana y base (variante) con cristal, almenas, balcón, tejado y bandera animada |
| D. Pokémon de referencia | ✅ Pikachu con todas sus animaciones |
| E. Ataque completo | ✅ Impactrueno: carga, lanzamiento, vuelo con haz, impacto, reacción, número, limpieza |
| F. Resto de unidades y torres | ⏳ 10 Pokémon con cápsula **provisional** marcada; falta la torre en ruinas definitiva |
| G. Cartas y HUD | ⏳ |
| H. Optimización y pruebas | ⏳ Hay niveles de calidad alto, medio y bajo; falta integrar la capa 3D en el juego y medirla en móviles reales |

**Capturas (antes y después de la misma escena):** `docs/capturas/` (`comparacion_antes_despues.jpg`, `ref_*.jpg`). Se generan con `node scripts/captura_referencia.mjs` en modo determinista.
