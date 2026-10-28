# Diseño de juego — Pokémon Arena

Juego de estrategia en tiempo real con cartas para un jugador contra la IA. Toma los principios generales del género (dos carriles, torres, energía que se regenera, mano rotativa) y los combina con Pokémon y un sistema de tipos. Todas las cifras de este documento salen de `pokemon-arena/src/sim/data/`, que es la fuente de verdad.

> Proyecto de fans sin ánimo de lucro. "Pokémon" y los nombres de las especies son marcas de sus propietarios. El prototipo usa gráficos vectoriales y sonidos sintetizados **originales**: no incorpora sprites, sonidos ni recursos de ningún juego comercial. Publicarlo o monetizarlo requeriría revisar la cuestión de la propiedad intelectual.

## 1. Campo de batalla (`data/arena.ts`)

- 18×32 casillas, en vertical. El jugador ocupa la mitad inferior y el rival la superior.
- **Río** en y∈[15,17]. **Puentes** en x∈[2,5] y x∈[13,16]: las tropas terrestres solo pueden cruzar por ellos.
- Dos **rutas** (x=3,5 y x=14,5) con caminos dibujados.
- Por bando: dos **torres guardianas** (1600 PS, 55 de daño cada 0,8 s, alcance 7,5) y una **base principal** (2600 PS, 70 de daño cada 1,0 s, alcance 7).
- **Zonas de despliegue**: la mitad propia sin río y sin pisar torres en pie. Al derribar una torre guardiana rival se abre una "bolsa" de 4 filas en esa ruta del campo enemigo. Los hechizos se lanzan en cualquier parte. Las posiciones se ajustan al centro de la casilla.

## 2. Tiempo, energía y victoria (`data/rules.ts`, `systems/victory.ts`)

| Regla | Valor |
|---|---|
| Paso de simulación | 20 pasos/s (fijo) |
| Tiempo reglamentario | 180 s |
| Energía | máx. 10, inicio 5, +1 cada 2,8 s (x1) |
| Energía doble | desde el segundo 120 |
| Prórroga | 60 s, energía x3, muerte súbita |
| Medallas | 1 por torre guardiana; 3 al derribar la base |

Orden de resolución:
1. Si se derriba una base, la partida termina en ese paso (`base_destruida`).
2. Al acabar el tiempo reglamentario, gana quien tenga más medallas (`tiempo`). Si hay empate, empieza la prórroga.
3. En la prórroga, la primera medalla de diferencia decide (`muerte_subita`).
4. Al acabar la prórroga, gana quien conserve más salud total en sus torres (`desempate`). Si es idéntica, la partida es un `empate`.

La base empieza **inactiva** (no dispara) y se activa al recibir daño o al caer una torre guardiana de su bando.

## 3. Cartas, mazo y mano (`systems/deck.ts`, `systems/energy.ts`)

- Mazo de **8 cartas distintas**, configurable en el constructor de mazos y guardado en el navegador.
- **Mano de 4** y "Siguiente" visible. Al jugar una carta, esta va al final de la cola y su hueco lo ocupa la siguiente.
- Jugar una carta exige tenerla en la mano, energía suficiente y una zona válida. Si no se cumple, se rechaza **sin gastar energía**.
- Cada carta muestra el retrato vóxel del Pokémon, su coste, función táctica, PS, daño y tipos. Al tocarla en el constructor de mazos o en la Colección se abre su **ficha completa**: PS, daño, daño por segundo, velocidad de ataque, velocidad (lenta, media, rápida o muy rápida), alcance, objetivos, tipo de unidad, cantidad, daño en área, despliegue, habilidad, debilidades y resistencias. En el constructor, la ficha tiene el botón «Añadir al mazo» o «Quitar del mazo».

## 4. Pokémon (`data/cards.ts`)

| Pokémon | Tipos | Función | Coste | PS | Daño / cadencia | Vel. | Alcance | Ataca | Rasgo |
|---|---|---|---|---|---|---|---|---|---|
| Onix | Roca/Tierra | Tanque | 5 | 3000 | 150 / 1,5 s | 0,8 | 0,8 | Solo torres | Muy resistente |
| Snorlax | Normal | Tanque | 6 | 3000 | 190 / 1,8 s | 0,6 | 1,0 | Tierra | Golpe con área de 1,2 |
| Pikachu | Eléctrico | Rápido | 3 | 520 | 80 / 0,9 s | 1,8 | 3 | Aire y tierra | Cadena: 2 saltos (x0,6) |
| Charmeleon | Fuego | Antigrupo | 4 | 900 | 125 / 1,6 s | 1,0 | 2 | Tierra | Llamarada con área de 1,4 |
| Squirtle | Agua | Distancia | 3 | 480 | 95 / 1,2 s | 1,0 | 5 | Aire y tierra | — |
| Bulbasaur | Planta/Veneno | Apoyo | 4 | 950 | 60 / 1,4 s | 1,0 | 4 | Aire y tierra | Aura curativa: +70 cada 2 s |
| Machop ×3 | Lucha | Rápido | 3 | 340 c/u | 75 / 1,0 s | 1,4 | 0,6 | Tierra | Grupo de tres |
| Pidgeotto | Normal/Volador | Rápido | 3 | 620 | 100 / 1,1 s | 1,6 | 1,2 | Aire y tierra | Vuela |
| Geodude | Roca/Tierra | Asedio | 2 | 480 | 50 / 1,2 s | 1,4 | 0,6 | Solo torres | Autodestrucción: 260 en 2 casillas (60 % a torres) |
| Jigglypuff | Normal/Hada | Apoyo | 3 | 680 | 55 / 1,5 s | 1,0 | 3,5 | Aire y tierra | Canto: duerme 1,5 s (cada 5 s) |
| Charizard | Fuego/Volador | Área | 5 | 1050 | 140 / 1,8 s | 1,2 | 3 | Aire y tierra | Vuela; área de 1,5 |

**Hechizos**

| Hechizo | Tipo | Coste | Radio | Daño | A torres | Efecto |
|---|---|---|---|---|---|---|
| Rayo | Eléctrico | 3 | 2,5 | 300 | 35 % | Aturde 0,5 s |
| Ventisca | Hielo | 4 | 3 | 170 | 40 % | Ralentiza un 40 % durante 4 s |

Todas las tropas tardan 1 s en desplegarse; mientras tanto no actúan, pero se las puede atacar.

**Contrapesos de diseño:** Onix y Geodude ignoran a las tropas (presión directa, pero indefensos). Charmeleon arrasa grupos terrestres, pero no alcanza a voladores. Machop tiene mucho daño, pero cae ante el daño en área. Los voladores esquivan a los atacantes de "tierra", pero son débiles frente a Pikachu (Eléctrico x1,5) y a Squirtle. Bulbasaur y Jigglypuff aportan poco daño, pero sostienen o desbaratan las ofensivas.

## 5. Sistema elemental (`data/elements.ts`)

Las relaciones (qué tipo es eficaz contra cuál) siguen la tabla clásica de los juegos de Pokémon para los 15 tipos usados. Los **multiplicadores son propios** y están atenuados, porque en tiempo real un x2 o un x0 resulta demasiado extremo:

| Relación | Multiplicador |
|---|---|
| Eficaz | **x1,5** |
| Neutro | x1 |
| Poco eficaz | **x0,7** |
| Casi inmune (inmunidad en la tabla clásica) | **x0,4** |

- Contra un defensor de doble tipo, los multiplicadores se multiplican y el resultado se acota a [0,25, 2,25]. Ejemplo: Agua contra Onix = 1,5 × 1,5 = 2,25.
- Las torres **no tienen tipo** (x1).
- Los números de daño cambian de color según la eficacia: naranja si es eficaz, gris si es poco eficaz.

## 6. IA del oponente (`ai/opponent.ts`)

- Recibe una `Observation` con su mano, su energía y lo visible en el campo. **No ve** la mano, la cola ni la energía del jugador, ni ningún estado futuro.
- Sus acciones pasan por la misma validación que las del jugador (`Battle.deploy`).
- Prioridades: (1) **rematar** una torre con un hechizo si basta para destruirla; (2) **defender** cuando una amenaza lleva cierto tiempo en su campo o cerca de sus torres, eligiendo la carta por ventaja de tipo, daño en área contra grupos, capacidad antiaérea y resistencia, y colocándola entre la amenaza y su torre; (3) **apoyar** una ofensiva propia en marcha; (4) **atacar** con tanque por detrás o con una unidad rápida en el puente cuando acumula energía (o para no desperdiciarla con 10).
- Dificultad configurable (`DIFFICULTIES`): intervalo entre decisiones, tiempo de reacción, umbral de energía para atacar, probabilidad de dudar y si tiene en cuenta los tipos y los remates.
- Toda su aleatoriedad usa un generador con semilla, así que es reproducible.

## 7. Interfaz y controles

- Pantallas: **menú principal** (dificultad, sonido, mazo actual, historial), **batalla**, **resultados** (medallas, motivo, estadísticas, semilla, revancha), **constructor de mazos** (ficha de cada carta con añadir o quitar, aviso si el mazo no tiene defensa antiaérea, coste medio) y **colección** (ficha de cada carta). La batalla se dibuja en 3D con los Pokémon en estilo vóxel; sin WebGL se usa la vista 2D.
- Diseño vertical de 720×1420 escalado para encajar en cualquier pantalla. Funciona en móvil y en ordenador.
- **Controles**: tocar una carta y después el campo, o arrastrar la carta al campo. Tocar de nuevo la carta la deselecciona. Teclas 1-4 para elegir carta y Esc para cancelar. Con una carta seleccionada, las casillas no permitidas se sombrean en rojo, y una vista previa verde o roja muestra el punto de despliegue, el alcance o el radio del hechizo.
- Combate: barras de salud, anillo de color de equipo (azul jugador, rojo rival), "Zz" para dormido o base inactiva, anillo celeste para ralentizado, embestidas y retrocesos al atacar, proyectiles del color de su tipo, números de daño, curaciones, descargas en cadena, rayos, ventiscas, explosiones, destrucción de torres con sacudida de cámara, avisos de fase ("¡ENERGÍA x2!", "¡PRÓRROGA!") y temporizador en rojo en los últimos 10 s.
- **Colisiones**: las tropas no se atraviesan; se empujan según su masa. Tierra y aire son capas independientes (los voladores pasan por encima de las tropas de tierra) y las torres son obstáculos sólidos para las tropas terrestres.

## 8. Reproducibilidad

- La batalla usa paso fijo y un generador pseudoaleatorio con semilla (mulberry32).
- La misma semilla con las mismas órdenes produce exactamente la misma partida. `Battle.commandLog` registra las órdenes y `Battle.replay` las reproduce.
- La semilla aparece en la pantalla de resultados y se puede fijar con `?seed=1234` en la URL.
- Los efectos visuales usan `Math.random`, pero no influyen en la simulación.

## 9. Balance

### Método
- `npm run balance -- 600 normal` juega partidas IA contra IA entre **mazos aleatorios** válidos (con al menos una defensa antiaérea) y estima la tasa de victoria de los mazos que incluyen cada carta, con su intervalo de confianza del 95 %. También mide el emparejamiento de los dos mazos por defecto jugando en ambos lados.
- El evento de daño indica la carta que lo causa (`sourceCardId`), lo que permite atribuir el daño a torres y a tropas a cada carta y entender *por qué* gana un mazo, no solo *si* gana.
- `tests/balance_stats.test.ts` es una prueba de regresión con márgenes amplios: detecta cambios que rompan el balance (cifras absurdas o un emparejamiento por defecto fuera de [20 %, 80 %]), pero no lo afina.

### Historial de ajustes

| Iteración | Diagnóstico | Cambio |
|---|---|---|
| 1 | Quitar a Charizard del mazo rival subía al del jugador de 19 % a 40 % | Charizard: PS 1250→1050, daño 165→140, cadencia 1,7→1,8 s. Onix: PS 2400→2700, velocidad 0,75→0,8 |
| 2 | Daño a torres por partida: mazo rival ≈1550 frente a ≈970. Geodude (2 de energía) hacía 326 por partida, sobre todo con su explosión; Onix (5 de energía) solo 78 porque la IA lo enviaba sin apoyo | La explosión de Geodude hace un 60 % a las torres. La IA escolta a sus tanques mientras avanzan. Onix: PS 3000. Pidgeotto: PS 620, daño 100. Jigglypuff: PS 680, daño 55, Canto cada 5 s |

### Estado actual (normal, 600 partidas con mazos aleatorios)
- Todas las cartas quedan entre el **45 % y el 55 %** de victorias (±3,6 %): Bulbasaur 55 %, Charizard 54 % … Jigglypuff 46 %, Onix 45 %.
- Mazo del jugador contra mazo de la IA: **≈47–50 % en normal** y **≈33–43 % en difícil** (muestras de 60 a 140 partidas, ±8–12 %).
- Pendiente: los tanques (Onix, Snorlax) se juegan poco (~1 vez por partida) y Ventisca muy poco (0,7), por las heurísticas de la IA. El balance con jugadores humanos sigue sin medirse.

## 10. Progresión (`persistence/progression.ts`)

- **Trofeos**: una victoria suma 20 / 30 / 40 según la dificultad (fácil, normal, difícil); una derrota resta 15 y nunca baja de 0; un empate no cambia nada.
- **Desbloqueos**: se empieza con las 8 cartas del mazo inicial. El resto se desbloquea por trofeos:

| Carta | Trofeos |
|---|---|
| Geodude | 30 |
| Jigglypuff | 80 |
| Snorlax | 150 |
| Ventisca | 220 |
| Charizard | 300 |

- **Rangos**: Novato (0), Entrenador (100), Líder de Gimnasio (250), Alto Mando (400), Campeón (600).
- **Sin niveles ni mejoras de carta (decisión deliberada)**: la progresión amplía las opciones del mazo, pero no las estadísticas. Así la partida la decide la estrategia y el balance medido sigue siendo válido para todos los jugadores.
- La IA usa su mazo completo desde el principio: el jugador ve en acción las cartas que podrá desbloquear.
- Interfaz: el menú muestra los trofeos, el rango y el próximo desbloqueo. Los resultados muestran la variación de trofeos, el ascenso de rango y las cartas desbloqueadas. El constructor y la colección marcan las cartas bloqueadas con su requisito.
- Persistencia en `localStorage`, tolerante a fallos: si un mazo guardado contiene cartas bloqueadas o datos corruptos, se vuelve al mazo inicial.
