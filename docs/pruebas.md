# Pruebas — Pokémon Arena

## Cómo ejecutarlas

```bash
cd pokemon-arena
npm install
npm test               # Vitest: 106 pruebas (≈5 s)
npm run typecheck      # tsc --noEmit (modo estricto)
npm run test:e2e       # compila, sirve y prueba en Chromium (escritorio + móvil); capturas en test-results/
npm run simulate -- 50 normal   # simulación por lotes IA contra IA
npm run balance -- 600 normal   # informe de balance por carta (mazos aleatorios)
```

## Última ejecución (27-10-2026)

| Comando | Resultado |
|---|---|
| `npm test` | **9 archivos, 106/106 pruebas superadas** |
| `npm run typecheck` | Sin errores |
| `npm run test:e2e` | **26/26 comprobaciones superadas** (13 en escritorio con ratón y 13 en móvil táctil), sin errores en consola |
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
| Estadísticas y balance | `balance_stats.test.ts` · atribución del daño a carta y equipo, Pokémon derrotados, regresión de balance |

## Prueba E2E (`scripts/e2e.mjs`)

Para cada perfil (escritorio 1280×800 con ratón y Pixel 5 táctil):
1. El menú carga y `?seed=4242` se aplica a la batalla.
2. Se despliega una carta tocando la carta y después el campo.
3. Se rechaza el despliegue en el campo rival.
4. Se despliega una carta arrastrándola (ratón, o eventos táctiles por CDP).
5. La simulación avanza y la IA juega.
6. Se fuerza la caída de la base rival y aparece la pantalla de resultados con la victoria, +30 trofeos y el desbloqueo de Geodude, que quedan guardados en `localStorage`.
7. "Revancha" inicia una batalla nueva.
8. Se abren el constructor de mazos y la colección.
9. No hay errores en la consola.

Las capturas (`test-results/*.png`) sirven para revisar la interfaz visualmente.

## Limitaciones conocidas

- La E2E se ejecuta con WebGL por software (sin GPU), a unos 5-12 fotogramas por segundo. La simulación sigue el tiempo real gracias al bucle de tiempo real, pero la fluidez visual solo se puede juzgar en un dispositivo real.
- El balance se mide con IA contra IA, no con jugadores humanos.
