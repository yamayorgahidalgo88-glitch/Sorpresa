# Pruebas — Pokémon Arena

## Cómo ejecutarlas

```bash
cd pokemon-arena
npm install
npm test               # Vitest: 148 pruebas (≈6 s)
npm run typecheck      # tsc --noEmit (modo estricto)
npm run test:e2e       # compila, sirve y prueba en Chromium (escritorio y móvil en 3D, escritorio en 2D); capturas en test-results/
node scripts/rendimiento.mjs --build   # llamadas de dibujo y tiempo de CPU con 50 Pokémon (móvil y escritorio)
node scripts/captura_galeria.mjs   # capturas de los 11 modelos vóxel (tras npx vite build)
npm run simulate -- 50 normal   # simulación por lotes IA contra IA
npm run balance -- 600 normal   # informe de balance por carta (mazos aleatorios)
```

## Última ejecución (29-10-2026)

| Comando | Resultado |
|---|---|
| `npm test` | **16 archivos, 148/148 pruebas superadas** |
| `npm run captura:referencia` | Escena 3D de referencia en calidades alta, media y baja: **sin errores de consola**; 14 capturas revisadas a mano en `docs/capturas/` |
| `npm run typecheck` | Sin errores |
| `npm run test:e2e` | **Todas las comprobaciones superadas** en los tres perfiles: escritorio con ratón (3D), móvil táctil (3D) y escritorio con la vista 2D de respaldo. Incluye las nuevas de Desafío e Igualado. Sin errores en consola |
| `npm audit` | 0 vulnerabilidades |

## Cobertura de las pruebas obligatorias

| Requisito | Archivo · prueba |
|---|---|
| Elixir (energía) nunca negativo | `energy_deck.test.ts` · "nunca es negativa…" y "en batalla, la energía se mantiene en [0, 10]…"; también se comprueba en cada paso de 30 partidas en `ai_longrun.test.ts` |
| Costes de cartas correctos | `energy_deck.test.ts` · "desplegar descuenta exactamente el coste de cada carta" (las 13), "rechaza el despliegue sin energía suficiente" |
| Despliegues dentro de zonas permitidas | `deployment_movement.test.ts` · mitad propia, río, campo rival, torres, límites, hechizos en cualquier lugar, bolsa tras derribar una torre, rechazo sin gastar energía |
| Movimiento y selección de objetivos | `deployment_movement.test.ts` · cruce solo por puentes, voladores sobre el río, avance a la torre de su ruta, quietud durante el despliegue, enemigo más cercano, "solo edificios", "tierra" no ataca aire, parada al tener alcance, no solapamiento |
| Aplicación correcta de daño | `combat_towers.test.ts` · daño exacto cuerpo a cuerpo, área, cadena con caída, hechizos (incluido el factor contra torres); `elements.test.ts` · daño real con ventaja de tipo |
| Muerte sin duplicar eventos | `combat_towers.test.ts` · "la salud nunca baja de 0 y cada muerte se emite una sola vez", explosión única de Geodude, torre destruida una vez; `ai_longrun.test.ts` comprueba duplicados en 30 partidas completas |
| Ataques de torres dentro de su alcance | `combat_towers.test.ts` · "disparan solo a enemigos dentro de su alcance", activación de la base por daño y por caída de una guardiana |
| Ventajas y desventajas elementales | `elements.test.ts` · 18 pares explícitos, dobles tipos, acotación en todo el espacio 15×15×15, torres sin tipo, coherencia de la tabla |
| Victoria y derrota | `victory_determinism.test.ts` · base derribada, medallas al acabar el tiempo, muerte súbita, desempate por salud, empate |
| Límite de tiempo | `victory_determinism.test.ts` · fin exacto en el paso 200/300 con reglas cortas y en 4:00 con las reglas por defecto; fases x1 → x2 → x3 |
| Sin errores críticos en partidas prolongadas | `ai_longrun.test.ts` · 30 partidas completas IA contra IA (3 dificultades) sin estados imposibles ni acciones rechazadas; batalla saturada con más de 80 tropas durante 60 s |
| Controles en móvil y ordenador | `input_persistence.test.ts` · toque-toque, deseleccionar, arrastrar y soltar, umbral de temblor, soltar fuera, zona prohibida, Esc; `scripts/e2e.mjs` · lo mismo en Chromium con ratón y con táctil |
| Partida automatizada que termina | `ai_longrun.test.ts` y `victory_determinism.test.ts` (`runAiMatch`) |
| Reproducibilidad con semilla | `victory_determinism.test.ts` · misma semilla, misma huella; `Battle.replay` reproduce el registro de órdenes |
| IA legal y sin información oculta | `ai_longrun.test.ts` · claves de la observación, sin la cola del jugador, cartas en mano, coste pagable, zona legal, defensa ante amenazas, no juega al azar, remate con hechizo |
| Persistencia | `input_persistence.test.ts` · ajustes, mazo, valores corruptos, historial |
| Progresión | `progression.test.ts` · mazo inicial desbloqueado, catálogo completo con trofeos, suma y resta (sin bajar de 0), desbloqueos y ascensos, rangos; `input_persistence.test.ts` · trofeos guardados, mazo con cartas bloqueadas |
| Ditto y repeticiones | `ditto_replay.test.ts` · Ditto no se juega sin carta previa, copia Pokémon y hechizos con +1 de coste y su zona, la IA no lo usa; una partida con Ditto se reproduce exacta (`Battle.replay`) |
| Economía y evoluciones | `economy.test.ts` · fases coherentes por línea (mejoran sin cambiar coste), 9 cartas iniciales, mazo sin dos fases de una línea, precios, cartas distintas y copias de cada Pokéball, evolucionadas solo en Ultra y Master (garantía en Master), cartas nuevas y mejora automática, repetidas → monedas, evolucionar (copias, monedas, fase máxima), monedas por partida, camino de trofeos cobrado una vez, rival con más evoluciones con más trofeos; `combat_towers.test.ts` · Barrera de Abra; `input_persistence.test.ts` · migración de mazos antiguos y monedas por partida |
| Edificios, enjambres y hechizos nuevos | `new_cards.test.ts` · los edificios no se mueven y pierden su salud en su tiempo de vida, quienes solo atacan edificios van a por ellos antes que a las torres, Magnemite dispara a voladores y Voltorb explota al caer, Chansey genera 1 de energía cada 8 s, salen 5 Rattata y 4 Zubat, Poción cura a los aliados sin dañar, Tóxico golpea 8 veces con daño reducido a torres |
| Evolución en combate y modos | `combat_evolution.test.ts` · la tercera jugada de una línea sale una fase por encima y la cuenta se reinicia, las cartas en fase máxima y los hechizos no cambian, el rival también evoluciona y la regla se puede desactivar; `economy.test.ts` · Desafío (monedas por victoria, dificultad creciente, premios a 3/6/9/12, fin con 3 derrotas o 12 victorias, retirarse cobra el premio alcanzado) |
| Modelos 3D (hito F) | `models.test.ts` · las 46 especies tienen modelo, se pasan a vóxel, animan sin valores inválidos, tienen punto de ataque y altura coherente; la caché comparte geometría pero no materiales |
| Rendimiento (hito H) | `models.test.ts` · cada Pokémon es una única malla con piel con como mucho 3 materiales, los índices de hueso son válidos, mover un grupo mueve sus cubos; la fusión de mallas estáticas agrupa por material, conserva la posición y respeta las piezas animadas |
| Ficha de carta | `card_detail.test.ts` · las estadísticas salen del catálogo (PS, daño, DPS, velocidad de ataque, alcance, objetivos, cantidad, área), categorías de velocidad, hechizos, debilidades por tabla de tipos |
| Estadísticas y balance | `balance_stats.test.ts` · atribución del daño a carta y equipo, Pokémon derrotados, regresión de balance |

## Prueba E2E (`scripts/e2e.mjs`)

Para cada perfil (escritorio 1280×800 con ratón y Pixel 5 táctil, ambos con la capa 3D; y escritorio con `?vista=2d`). WebGL se ejecuta por software (SwiftShader):
1. El menú carga y `?seed=4242` se aplica a la batalla. Se comprueba que la batalla use la capa 3D (o la 2D con `?vista=2d`).
   Para tocar una casilla en 3D, la prueba la proyecta con la cámara real (`layer3d.project`).
2. Se despliega una carta tocando la carta y después el campo.
3. Se rechaza el despliegue en el campo rival.
4. Se despliega una carta arrastrándola (ratón, o eventos táctiles por CDP).
5. La simulación avanza y la IA juega. En 3D se comprueba que la escena se dibuje y que el lienzo 3D esté alineado con el del HUD.
6. Se fuerza la caída de la base rival y aparece la pantalla de resultados con la victoria, +30 trofeos, +45 monedas y el premio de 20 trofeos del camino, que quedan guardados en `localStorage`.
7. «Repetición» abre la partida en modo repetición con sus órdenes y no cambia el historial; después se inicia una batalla nueva.
8. Constructor de mazos: tocar Geodude (colección) abre su ficha; «Usar» y tocar Onix (mazo) los intercambia y se guarda.
9. Tienda: comprar una Pokéball descuenta monedas, se abre con su animación y da cartas.
10. Desafío: se empieza, se gana una partida y cuenta la victoria y las monedas. Igualado: todas las cartas de los dos bandos están en su fase máxima.
11. No hay errores en la consola.

Las capturas (`test-results/*.png`) sirven para revisar la interfaz visualmente.

## Escena de referencia 3D (`scripts/captura_referencia.mjs`)

Se ejecuta en modo determinista (`?captura=1`): el tiempo avanza en pasos fijos y las capturas se toman por **estado** de la simulación, no por tiempo:
- **carga:** cuando la carga del ataque llega a 0,6;
- **lanzamiento:** primer fotograma tras el golpe;
- **impacto:** fotograma en que desaparece el proyectil;
- **derrota:** fotograma en que cae Pikachu.

Comprueba que no haya errores de consola. Se ignoran los avisos de rendimiento del controlador gráfico por software al leer píxeles. Además, `tests/pokeapi.test.ts` contrasta los tipos de cada Pokémon y toda la tabla de tipos con una instantánea de PokéAPI (`docs/datos_pokeapi.json`).

## Limitaciones conocidas

- La E2E se ejecuta con WebGL por software (sin GPU), a pocos fotogramas por segundo; por eso sus esperas son largas.
- Con 50 Pokémon en el campo la batalla 3D hace 439 llamadas de dibujo por fotograma (antes 1642; ver `direccion_artistica.md` §13). No se ha medido en móviles reales: los FPS dependen de la GPU del teléfono. Si va lenta, la calidad baja sola (resolución y, después, sombras).
- El balance se mide con IA contra IA, no con jugadores humanos.
