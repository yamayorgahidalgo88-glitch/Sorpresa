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

- Mazo de **8 cartas distintas** (una sola fase por línea evolutiva), configurable en el constructor de mazos y guardado en el navegador.
- **Mano de 4** y "Siguiente" visible. Al jugar una carta, esta va al final de la cola y su hueco lo ocupa la siguiente.
- Jugar una carta exige tenerla en la mano, energía suficiente y una zona válida. Si no se cumple, se rechaza **sin gastar energía**.
- Cada carta muestra el retrato vóxel del Pokémon, su coste, función táctica, PS, daño y tipos. Al tocarla en el constructor de mazos se abre su **ficha completa**: PS, daño, daño por segundo, velocidad de ataque, velocidad (lenta, media, rápida o muy rápida), alcance, objetivos, tipo de unidad, cantidad, daño en área, despliegue, habilidad, debilidades y resistencias. La ficha también muestra el progreso de evolución y tiene los botones «Usar» (meterla en el mazo) y «Evolucionar» cuando hay copias y monedas suficientes.

## 4. Pokémon y líneas evolutivas (`data/cards.ts`)

Cada carta es una **línea evolutiva**. Se empieza con la primera fase y se evoluciona con copias y monedas (§10). Las fases 2 y 3 tienen **+12 % y +25 %** de PS y daño (también de curación, explosión y barrera); el coste y el comportamiento no cambian, salvo lo indicado en *Cambios al evolucionar*. Los tipos de las 46 especies (con Ditto) coinciden con PokéAPI (`docs/datos_pokeapi.json`, comprobado en `tests/pokeapi.test.ts`).

| Fase 1 | Fase 2 | Fase 3 | Tipos (fase 1) | Función | Coste | PS | Daño / cadencia | Vel. | Alcance | Ataca | Rasgo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Onix | Steelix | — | Roca/Tierra | Tanque | 5 | 3450 | 150 / 1,5 s | 0,8 | 0,8 | Solo torres | Muy resistente. Steelix es Acero/Tierra |
| Snorlax | — | — | Normal | Tanque | 6 | 3000 | 190 / 1,8 s | 0,6 | 1,0 | Tierra | Golpe con área de 1,2. No evoluciona |
| Pikachu | Raichu | — | Eléctrico | Rápido | 3 | 480 | 70 / 0,9 s | 1,8 | 3 | Aire y tierra | Cadena: 2 saltos (x0,5) |
| Charmander | Charmeleon | Charizard | Fuego | Antigrupo | 4 | 950 | 125 / 1,5 s | 1,0 | 2 | Tierra | Área de 1,4 |
| Squirtle | Wartortle | Blastoise | Agua | Distancia | 3 | 480 | 95 / 1,2 s | 1,0 | 5 | Aire y tierra | — |
| Bulbasaur | Ivysaur | Venusaur | Planta/Veneno | Apoyo | 4 | 950 | 60 / 1,4 s | 1,0 | 4 | Aire y tierra | Aura curativa: +60 cada 2 s |
| Machop ×3 | Machoke ×3 | Machamp ×3 | Lucha | Rápido | 3 | 340 c/u | 75 / 1,0 s | 1,4 | 0,6 | Tierra | Grupo de tres |
| Pidgey | Pidgeotto | Pidgeot | Normal/Volador | Rápido | 3 | 620 | 100 / 1,1 s | 1,6 | 1,2 | Aire y tierra | Vuela |
| Geodude | Graveler | Golem | Roca/Tierra | Asedio | 2 | 480 | 50 / 1,2 s | 1,4 | 0,6 | Solo torres | Autodestrucción: 260 en 2 casillas (60 % a torres) |
| Jigglypuff | Wigglytuff | — | Normal/Hada | Apoyo | 3 | 760 | 60 / 1,5 s | 1,0 | 3,5 | Aire y tierra | Canto: duerme 1,5 s (cada 5 s) |
| **Gastly** | Haunter | Gengar | Fantasma/Veneno | Distancia | 3 | 430 | 70 / 1,1 s | 1,4 | 3,5 | Aire y tierra | Flota (volador). Cada golpe ralentiza un 35 % durante 1,5 s |
| **Abra** | Kadabra | Alakazam | Psíquico | Distancia | 4 | 560 | 115 / 1,5 s | 1,0 | 5 | Aire y tierra | **Barrera**: escudo de 240 que absorbe daño antes que la salud |
| **Dratini** | Dragonair | Dragonite | Dragón | Tanque | 4 | 1250 | 120 / 1,4 s | 1,0 | 1,0 | Tierra | Barrido con área de 0,9 |
| **Magnemite** | Magneton | — | Eléctrico/Acero | **Edificio** | 4 | 950 | 85 / 0,9 s | — | 5,5 | Aire y tierra | Torreta fija; dura 35 s |
| **Voltorb** | Electrode | — | Eléctrico | **Edificio** | 4 | 1100 | 120 / 1,4 s (área 1,2) | — | 4 | Tierra | Dura 30 s. Al caer explota: 200 en 2,5 casillas (50 % a torres) |
| **Chansey** | Blissey | — | Normal | **Edificio** | 5 | 1000 | — | — | — | — | **Recolector**: +1 de energía cada 8 s durante 70 s |
| **Rattata ×5** | Raticate ×5 | — | Normal | Enjambre | 2 | 130 c/u | 50 / 1,0 s | 1,7 | 0,5 | Tierra | Grupo de cinco |
| **Zubat ×4** | Golbat ×4 | Crobat ×4 | Veneno/Volador | Enjambre | 2 | 85 c/u | 45 / 1,1 s | 1,9 | 0,5 | Aire y tierra | Vuela; grupo de cuatro |

| **Ditto** | — | — | Normal | Apoyo | Carta copiada **+1** | — | — | — | — | — | **Transformación**: se convierte en la última carta que jugaste (Pokémon o hechizo, en tu fase), por 1 de energía más (máx. 10). Si aún no has jugado nada, no se puede usar |

En negrita, las líneas nuevas. **Edificios** (desde el 29-10-2026, inspirados en Cannon, Bomb tower y el recolector de maná de Boom Arena): no se mueven, pierden vida con el tiempo (`lifetime`) hasta desaparecer y atraen a las tropas que atacan «solo edificios» (Onix, Geodude), que los prefieren a las torres. Chansey no ataca: genera energía para su dueño hasta el máximo de 10. Ditto se inspira en la carta «Mirror» de Boom Arena y Clash Royale (ver `comparativa_diseno.md`). La IA no lo usa, porque su valor depende de la carta anterior. La habilidad **Barrera** (`escudo`) es nueva en la simulación (`UnitEntity.shield`, aplicada en `applyDamage`).

**Cambios al evolucionar:** Charizard pasa a Fuego/Volador, vuela, ataca a aire y tierra con alcance 3 y área 1,5. Dragonite pasa a Dragón/Volador y vuela. Steelix pasa a Acero/Tierra.

**Hechizos (niveles 1 a 3)**: se mejoran como los Pokémon, con copias y monedas. Cada nivel sube el daño un 12 % y un 25 %.

| Hechizo | Tipo | Coste | Radio | Daño Nv 1/2/3 | A torres | Efecto |
|---|---|---|---|---|---|---|
| Rayo | Eléctrico | 3 | 2,5 | 320 / 358 / 400 | 35 % | Aturde 0,5 s |
| Ventisca | Hielo | 4 | 3 | 190 / 213 / 238 | 40 % | Ralentiza un 40 % durante 4 s |
| **Poción** | Normal | 2 | 2,8 | Cura 260 / 291 / 325 | — | Cura al instante a tus Pokémon de la zona (no a las torres) |
| **Tóxico** | Veneno | 4 | 3 | 50 por segundo × 8 s (400) | 35 % | Nube que daña cada segundo y frena un 15 % |

**Tipo Acero** añadido a la tabla de tipos (`data/elements.ts`), con todas sus relaciones contrastadas con PokéAPI.

**Evolución en combate** (desde el 29-10-2026, inspirada en las Evoluciones de Clash Royale): cada vez que juegas una carta de una línea que puede evolucionar, suma un contador de esa línea. Tras **2 jugadas**, la siguiente sale **en la fase siguiente** a la tuya (con su modelo, estadísticas y cambios) y el contador vuelve a 0. La carta muestra la insignia «EVO» cuando está lista y aparece un aviso al jugarla. Vale para los dos bandos y para Ditto. Regla: `rules.evolveAfterPlays` (`battle.ts`, `effectiveCard`).

Todas las tropas tardan 1 s en desplegarse; mientras tanto no actúan, pero se las puede atacar.

**Contrapesos de diseño:** Onix y Geodude ignoran a las tropas (presión directa, pero indefensos). Charmander arrasa grupos terrestres, pero no alcanza a voladores. Machop tiene mucho daño, pero cae ante el daño en área. Los voladores esquivan a los atacantes de "tierra", pero son débiles frente a Pikachu (Eléctrico x1,5) y a Squirtle. Bulbasaur y Jigglypuff aportan poco daño, pero sostienen o desbaratan las ofensivas.

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
- Lanza **Poción** sobre sus Pokémon heridos (`findHeal`) y valora **Tóxico** por su daño total (pulsos × daño). No usa Ditto.
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

### Estado actual (29-10-2026, normal, 700 partidas con mazos aleatorios de cartas base)
- **Iteración 4** (edificios, enjambres y hechizos nuevos): Pikachu y Rayo dominaban contra los enjambres, y Onix y Jigglypuff quedaban bajos. Cambios: Pikachu PS 520→480, daño 80→70, caída de la cadena 0,6→0,5; Rayo 300→320; Ventisca 170→190; Barrera 280→240; Onix PS 3300→3450. Resultado: **todas las cartas base entre el 43 % y el 56 %** (±4,3 %). La IA juega Poción 3,4 veces por partida y Tóxico 1,3.
- Se mide el equilibrio de las **cartas base** (fase 1). Las evoluciones son más fuertes a propósito, y el rival también las saca (§10).
- Iteración 3: con las líneas nuevas, Abra (56 %) y Bulbasaur (57 %) quedaban altos y Jigglypuff, Charmander y Onix bajos. Cambios: Barrera 320→280; curación 70→60; Jigglypuff PS 680→760 y daño 55→60; Charmander PS 900→950 y cadencia 1,6→1,5 s; Onix PS 3000→3300.
- Resultado de la iteración 3: todas las cartas entre el **44 % y el 56 %** (±3,6 %): Abra 56 %, Pikachu 55 %, Gastly 54 % … Machop 46 %, Onix 44 %.
- Mazo del jugador contra mazo de la IA (sin evoluciones): **≈54–57 %** (140 partidas, ±8 %).
- Pendiente: la IA juega poco los tanques (Onix, Snorlax: ~0,9 veces por partida) y Ventisca (0,7). El balance con jugadores humanos sigue sin medirse.

## 10. Progresión y economía (`persistence/progression.ts`, `persistence/economy.ts`)

- **Trofeos**: una victoria suma 20 / 30 / 40 según la dificultad (fácil, normal, difícil); una derrota resta 15 y nunca baja de 0; un empate no cambia nada.
- **Rangos**: Novato (0), Entrenador (100), Líder de Gimnasio (250), Alto Mando (400), Campeón (600).
- **Cartas iniciales (9)**: Onix, Pikachu, Charmander, Squirtle, Bulbasaur, Machop, Pidgey, Geodude y Rayo (el mazo usa 8). El resto (Snorlax, Jigglypuff, Gastly, Abra, Dratini, Ditto, Magnemite, Voltorb, Chansey, Rattata, Zubat, Ventisca, Poción y Tóxico) sale de las Pokéballs.
- **Monedas por partida**: 30 por ganar, 12 por empatar y 6 por perder, más 5 por medalla. Se empieza con 100.
- **Pokéballs** (los cofres). Cada hueco puede ser una carta que aún no tienes (la primera copia la desbloquea):

| Pokéball | Precio | Cartas distintas | Copias de cada una | Carta nueva | Sale evolucionada |
|---|---|---|---|---|---|
| Pokéball | 60 | 2 | 1–4 | 10 % | No |
| Superball | 180 | 3 (Pokémon y hechizos) | 3–7 | 20 % | No |
| Ultraball | 500 | 5 | 6–12 | 25 % | Fase 2: 8 % · fase 3: 1 % |
| Master Ball | 1500 | 10 | 10–20 | 30 % | **Al menos una en fase 2 garantizada** · fase 2: 15 % · fase 3: 6 % |

- **Carta evolucionada en una Pokéball**: si te sale Charmeleon o Charizard y tienes Charmander, tu carta sube directamente a esa fase y cambia en tu mazo.
- **Repetidas → monedas**, por su valor equivalente:
  - Las copias de una línea que ya está en su fase máxima (o que no evoluciona, como Snorlax) valen 5 monedas cada una.
  - Una evolución que ya tenías vale lo que cuesta conseguirla: 325 monedas la fase 2 y 1525 la fase 3.
- **Evolucionar**: desde la ficha de la carta. Fase 1→2: 15 copias y 250 monedas. Fase 2→3: 40 copias y 1000 monedas.
- **Camino de trofeos**: cada premio se cobra una sola vez (perder trofeos y volver a subir no lo repite).

| Trofeos | 20 | 50 | 75 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | **500** | 600 | 700 | 750 | 800 | 900 | **1000** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Premio | 100 🪙 | Poké | Super | Ultra | 250 🪙 | Ultra | Super | Ultra | 400 🪙 | Ultra | Super | **Master** | Ultra | Ultra | 1000 🪙 | Ultra | Ultra | **Master** |

- **Rival ajustado a tu mazo (emparejamiento justo, desde el 29-10-2026):**
  - Las fases del rival tienen la misma media que la **fuerza de tu mazo**: la fase media de tus cartas que pueden evolucionar.
  - Se añade un pequeño extra por trofeos (hasta +0,25) y una variación de ±0,3 por carta.
  - Con un mazo en primera fase, el rival casi no evoluciona; si evolucionas, él también.
  - Es determinista con la semilla de la partida.
  - Antes dependía solo de los trofeos; se cambió siguiendo la idea de juego limpio de Boom Arena.
- **Modo Desafío** (como los desafíos de Clash Royale): una racha contra la IA que acaba con **12 victorias o 3 derrotas**. La IA se endurece con cada victoria (fácil hasta 3, normal hasta 7, difícil después) y sus cartas evolucionan más. Cada victoria da 10 + 5 × victorias monedas. Premio final según las victorias: 3 → Pokéball, 6 → Superball, 9 → Ultraball, 12 → Master Ball. No cambia los trofeos. Se guarda en el perfil (`Profile.challenge`), así que se puede dejar a medias; también se puede abandonar y cobrar el premio alcanzado.
- **Modo Igualado** (como el juego limpio de Boom Arena): las cartas de los dos bandos están en su **fase máxima**. No da trofeos ni monedas.
- **Repeticiones**: desde los resultados, «Repetición» vuelve a jugar la partida con la misma semilla, los mazos sin barajar y las órdenes de los dos bandos (`Battle.commandLog`). No cuenta para trofeos ni monedas.
- **Interfaz**:
  - El menú muestra las monedas y un aviso con las Pokéballs pendientes de abrir.
  - Constructor de mazo como en Clash Royale: mazo arriba, colección abajo y cartas por descubrir con candado. Para cambiar una carta: «Usar» y después tocar la carta del mazo que sale. Cada carta tiene una barra de copias.
  - Tienda con apertura animada (la Pokéball se agita, destella y muestra cada carta).
  - Pantalla del camino de trofeos.
- **Persistencia** en `localStorage` (`pokemon-arena:perfil`), tolerante a fallos. Las partidas guardadas de la versión anterior se migran:
  - Los mazos con Charmeleon, Pidgeotto o Charizard pasan a su línea.
  - Se conservan las cartas que ya se habían desbloqueado por trofeos.
