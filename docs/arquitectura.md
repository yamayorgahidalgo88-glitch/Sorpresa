# Arquitectura — Pokémon Arena

## 1. Tecnología elegida

| Opción | Valoración |
|---|---|
| **Phaser 3 + TypeScript (elegida)** | Motor 2D web maduro, con escalado a cualquier pantalla y entrada unificada de ratón y táctil. Se juega en el navegador sin instalar nada y encaja con el repositorio, que ya era una web estática. TypeScript da tipos estrictos para los datos de cartas. |
| Godot | Muy buena opción para exportar a escritorio o móvil, pero no está instalado en el entorno y obligaría a otro flujo de pruebas. Queda como alternativa si se busca una app nativa. |
| React | No se usa: no aporta nada a una simulación en tiempo real. Los menús se hacen en Phaser para no tener dos sistemas de interfaz. |

Herramientas (versiones fijadas): Phaser 3.90.0, TypeScript 5.9.3, Vite 7.3.7, Vitest 4.1.12 y vite-node 5.3.0. Las pruebas E2E usan el Playwright y el Chromium preinstalados. `npm audit` no informa de vulnerabilidades.

> Nota: `.npmrc` activa `legacy-peer-deps` para evitar un fallo de npm 10 (`Cannot read properties of null (reading 'edgesOut')`) al resolver las dependencias opcionales de Vitest 4.

## 2. Estructura

```
pokemon-arena/
├── index.html                 # Contenedor del juego (Vite)
├── src/
│   ├── main.ts                # Configuración de Phaser y lista de escenas
│   ├── sim/                   # ── MOTOR DE SIMULACIÓN (sin dependencias de Phaser) ──
│   │   ├── battle.ts          # Orquestador: bucle de paso fijo, órdenes, eventos, replay
│   │   ├── match.ts           # Partidas IA contra IA (pruebas, balance)
│   │   ├── core/              # rng (mulberry32), vectores, estado/eventos, World
│   │   ├── data/              # CONFIGURACIÓN: arena, reglas, cartas, tabla de tipos
│   │   ├── systems/           # energía, mazo, despliegue, navegación, objetivos,
│   │   │                      # combate, victoria
│   │   └── ai/                # observación filtrada + IA del oponente
│   ├── game/                  # ── PRESENTACIÓN (Phaser) ──
│   │   ├── layout.ts          # Resolución lógica, conversión casilla <-> pantalla
│   │   ├── theme.ts           # Paleta, tipografía
│   │   ├── input/             # DeployController (lógica de entrada independiente)
│   │   ├── render/            # Campo, vistas de tropas y torres, efectos, ilustraciones
│   │   ├── ui/                # Tarjetas de carta, botones, ficha de carta (cardDetail.ts)
│   │   ├── audio/             # Efectos sintetizados con Web Audio
│   │   └── scenes/            # Menú, Batalla, Resultados, Mazo, Colección
│   ├── render3d/              # ── CAPA 3D (Three.js): campo, torres, Pokémon vóxel, efectos ──
│   └── persistence/           # Ajustes, mazo e historial (localStorage, tolerante a fallos)
├── tests/                     # Vitest (simulación, IA, controles, persistencia)
└── scripts/
    ├── simulate.ts            # Simulación por lotes IA contra IA
    └── e2e.mjs                # Prueba en navegador real (escritorio y móvil)
```

Correspondencia con los módulos pedidos:

| Módulo pedido | Ubicación |
|---|---|
| Motor de simulación | `sim/battle.ts`, `sim/core/world.ts` |
| Tiempo y actualización de unidades | `Battle.step()` (paso fijo de 20 Hz) |
| Cartas y mazo | `sim/data/cards.ts`, `sim/systems/deck.ts` |
| Energía | `sim/systems/energy.ts` |
| Movimiento y navegación | `sim/systems/navigation.ts`, colisiones en `Battle.resolveCollisions` |
| Combate y selección de objetivos | `sim/systems/combat.ts`, `sim/systems/targeting.ts` |
| Torres y victoria | `sim/data/arena.ts`, `sim/systems/victory.ts` |
| Interfaz y entrada | `game/scenes/*`, `game/input/deployController.ts`, `game/ui/*` |
| Efectos visuales y sonido | `game/render/effects.ts`, `game/render/views.ts`, `game/audio/sfx.ts` |
| Configuración y persistencia | `sim/data/*`, `persistence/settings.ts` |
| IA del oponente | `sim/ai/observation.ts`, `sim/ai/opponent.ts` |
| Pruebas | `tests/*`, `scripts/e2e.mjs` |

## 3. Principios

1. **La simulación no conoce la interfaz.** `src/sim` no importa Phaser ni el DOM. Se ejecuta igual en Node (pruebas, simulación por lotes) que en el navegador.
2. **Datos, no código disperso.** Estadísticas, reglas, geometría y tabla de tipos están en `sim/data`. Para añadir un Pokémon basta con añadir una entrada en `cards.ts` (y, si se quiere, su ilustración en `creatureArt.ts`).
3. **Determinismo.** Paso fijo, energía en aritmética entera, aleatoriedad solo con un generador con semilla, iteración en orden de creación y desempates por id. Las órdenes se registran con su paso (`commandLog`) y `Battle.replay` reproduce la partida exacta. `stateHash()` permite compararlas.
4. **Eventos como frontera.** `step()` devuelve eventos (`despliegue`, `dano`, `muerte`, `torre_destruida`, `fin`…). La interfaz los consume para animaciones y sonido y nunca modifica el estado de la simulación (salvo con órdenes validadas mediante `deploy`).
5. **Mismas reglas para todos.** El jugador y la IA usan `Battle.deploy`, que valida mano, energía y zona. La IA solo ve una `Observation` filtrada.

## 4. Orden de un paso de simulación (`Battle.step`)

1. Regeneración de energía según la fase (x1, x2 o x3).
2. Cuenta atrás e impacto de hechizos.
3. Temporizadores de despliegue.
4. Habilidades periódicas (aura curativa, canto).
5. Selección de objetivos de tropas y torres.
6. Marcado de "en combate" (objetivo a su alcance).
7. Movimiento hacia el siguiente punto de ruta (puentes) y restricciones del río.
8. Colisiones (2 iteraciones, ponderadas por masa; las torres son obstáculos).
9. Ataques: cuerpo a cuerpo inmediato, proyectiles a distancia, torres.
10. Avance e impacto de proyectiles (área, cadena, ralentización).
11. Muertes y torres derribadas (en cascada, con evento único por entidad).
12. `tick++`, cambio de fase y comprobación de victoria.

## 5. Bucle en el navegador

`BattleScene.update` acumula **tiempo real** (`performance.now()`, con un tope de 250 ms por fotograma) y ejecuta los pasos fijos que tocan. Se mide el tiempo real porque Phaser suaviza `delta` cuando los fotogramas son lentos y la partida iría más despacio que el reloj. Las vistas interpolan entre la posición anterior y la actual para que el movimiento se vea fluido a cualquier tasa de fotogramas.

**Rendimiento.** Los `Graphics` vectoriales de Phaser se vuelven a teselar en cada fotograma. Por eso todo lo estático (suelo, puentes, zonas de despliegue, fichas de Pokémon, torres y caras de carta) se rasteriza **una vez** en texturas (`bake()`). El HUD solo se redibuja cuando cambian sus valores.

## 6. Entrada (móvil y ordenador)

Phaser entrega el ratón y el táctil como eventos *pointer*. `DeployController` es una máquina de estados pura: reposo → carta seleccionada (toque) o arrastre (al superar 14 px) → despliegue o rechazo. Se prueba con Vitest y, en un navegador real, con Playwright (ratón y táctil emulado con un Pixel 5). En ordenador, además, las teclas 1-4 seleccionan carta y Esc cancela.

## 7. Capa de render 3D (`src/render3d/`)

Dibuja el campo de la batalla jugable desde el 29-10-2026 (antes solo existía en la escena de referencia). Sustituye al render 2D del campo (ver `direccion_artistica.md`). Solo **lee** la simulación y sus eventos; no cambia ninguna regla.

| Módulo | Función |
|---|---|
| `engine.ts` | Renderizador Three.js, cámara en perspectiva con encuadre automático, luces, sombras, niebla, bloom y niveles de calidad (alto, medio, bajo) |
| `arena3d.ts` | Plataforma, río con shader de agua, puentes, muro perimetral y decorado instanciado |
| `towerModel.ts` | Torre guardiana y base (geometría real), con animaciones de disparo, impacto, cristal y bandera |
| `creatures/rig.ts`, `creatures/kit.ts` y un archivo por Pokémon | Personajes por piezas con pivotes y animación procedural. `kit.ts` da piezas comunes (elipsoides, articulaciones, cara de pixel art) y un bípedo genérico |
| `creatures/voxel.ts` | Paso a cubos (vóxel) con caché: las unidades iguales comparten la geometría y cada una tiene sus materiales |
| `creatures/registry.ts` | Registro de los 11 modelos (una prueba exige que todos los Pokémon del catálogo tengan modelo) |
| `ruins.ts` | Ruinas deterministas de una torre destruida |
| `gameLayer.ts` | Capa 3D de la batalla jugable: lienzo bajo el de Phaser, selección de casilla por rayo, fantasma de despliegue y zonas |
| `portraits.ts` | Retratos de los modelos vóxel para las cartas y la ficha (una sola vez, renderizador temporal) |
| `fx/particles.ts` y `fx/effects.ts` | Partículas en GPU y biblioteca modular de ataques por familia elemental |
| `battleView3d.ts` | Sincroniza la batalla con la escena: interpolación, orientación, anticipación (lee `cooldown`), proyectiles en arco, impactos, barras de vida y números |
| `textures.ts` y `palette.ts` | Texturas procedurales y paleta de la dirección artística |

**Integración en la batalla (`BattleScene` + `gameLayer.ts`):**
- El lienzo WebGL de Three.js va detrás del de Phaser. Phaser se crea con `transparent: true` y la escena de batalla deja su cámara sin fondo, así que solo dibuja el HUD (marcador arriba, cartas y energía abajo). La capa sigue el rectángulo del lienzo de Phaser en cada fotograma, porque cambia al girar el móvil o redimensionar la ventana.
- La cámara encaja el campo entre la barra superior y el HUD (`Engine.topFraction` y `hudFraction`).
- **Entrada:** `DeployController` recibe un `FieldMapping`. En 3D, el punto tocado se convierte en casilla con un rayo de la cámara contra el plano del suelo. Así se despliega exactamente donde se ve, aunque haya perspectiva.
- **Eventos:** la capa 3D dibuja todos los efectos. `BattleScene` conserva solo el sonido, los avisos y los rótulos.
- **Respaldo 2D:** sin WebGL, o con `?vista=2d`, se usan las vistas planas de antes. La E2E prueba los dos caminos.

`referencia.html` (escena de demostración) y `galeria.html` (los 11 modelos en fila; `?foco=<id>`, `?pose=`, `?captura=1`) son herramientas de revisión.

## 8. Uso de REA en el proyecto

REA (ver `analisis_mecanicas.md` §1) puede analizar la compilación de este mismo juego (`dist/`) con `rea analyze-javascript-application`, por ejemplo para auditar el grafo de módulos. Requiere Node ≥ 22.23.4 para que `rea doctor` dé el entorno por sano.
