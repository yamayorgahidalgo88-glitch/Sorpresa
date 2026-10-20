# Caja de Dioses

Un simulador de dioses en el navegador, inspirado en el género de WorldBox pero con código, gráficos y sonidos propios. Creas un mundo, siembras pueblos y miras cómo viven por su cuenta: comen, duermen, trabajan, se enamoran, tienen hijos, inventan, comercian, rezan y guerrean.

Para jugar, abre `index.html` en un navegador moderno. No hace falta instalar nada. Si se publica con GitHub Pages, basta con abrir la carpeta `caja-de-dioses/`.

## Qué hay dentro

### Vida con mente propia
- Cada habitante tiene nombre y apellido, sexo, edad, rasgos, **necesidades** (comida, energía y ánimo), un **oficio** y una **familia**: pareja, padres, hijos y amigos.
- Cada pocos instantes puntúa todas sus opciones (comer, dormir, trabajar, charlar, buscar pareja, jugar, rezar, huir, luchar…) y elige una al azar, ponderando por la puntuación.
- El **Inspector** muestra esas decisiones con sus pesos, la tarea en curso y lo que lleva encima. Con el mod *Mentes visibles*, de cerca, se ve un bocadillo sobre cada cabeza.
- Las ciudades reparten los oficios según lo que falte: campesinos, leñadores, mineros, constructores, pescadores, cazadores, eruditos y soldados.
- Se mueven con búsqueda de caminos (A*). Los **caminos aparecen solos** donde más se pisa y luego aceleran el paso.

### Civilizaciones
- Casas que cambian con la era: tiendas, chozas, piedra, castillos, fábricas y rascacielos.
- Edificios especiales con efecto real: granero, muelle, molino, cuartel, biblioteca, templo, mercado y torre de vigía.
- **Barcos** para colonizar otras islas, desembarcar ejércitos y comerciar.
- **Diplomacia por opinión**: cada reino opina de los demás por la raza, las fronteras, la fe, el comercio y su historia común. De esa opinión salen guerras, paces y alianzas. Los motivos se ven en el panel del reino.
- **Religiones** que nacen con los templos y se difunden. **Dinastías** que heredan el trono.
- Árbol tecnológico de ocho eras que depende de los materiales: cobre, estaño, hierro, carbón, salitre, oro, plata, obsidiana, diamante, mithril y adamantita.
- Cada reino tiene su **escudo de armas** generado y una bandera que ondea sobre sus ciudades.

### Poder divino
- Terreno, materiales, fronteras, y declarar guerra o paz.
- Desastres: fuego, rayos, meteoritos, bombas, terremotos, inundaciones, volcanes, bomba nuclear, tornados, lluvia ácida, agujero negro, plagas, sequía, ventisca, locura y maldición.
- Bendiciones: lluvia, curar, fertilidad, flecha de Cupido, iluminar a los sabios, alegría.
- Diplomacia divina: sembrar discordia, inspirar amistad o cambiar una ciudad de bando.
- Imán, para coger criaturas y soltarlas en otra tierra, y dedo divino, para dar un toque.

### Mods (se activan y desactivan en la pestaña Mods)
Tecnología y forja, Razas extra, Bestiario, Apocalipsis, Héroes y leyendas, Diplomacia, Magia, Más allá, Invasión alien, Clima y estaciones, Modo dios, Religiones, Ecosistema (ciervos, osos, conejos, cangrejos, peces, pájaros, gallinas y mascotas), Rasgos ampliados, Superpoderes, Enfermedades y Mentes visibles.

En **Leyes**, «Sin pueblos dentro de otros» impide que nazcan pueblos pequeños dentro o al lado de otro reino y quita las rebeliones, para que las guerras sean entre reinos grandes.

Desde la pestaña **Mods** hay dos editores. **Crear rasgo** inventa rasgos propios con sus efectos, que se heredan como los demás. **Crear especie** diseña un pueblo nuevo: aspecto, colores, fuerza, vida, carácter y rasgos innatos. Las dos cosas se guardan en el navegador y viajan dentro de las partidas exportadas.

### Mundo vivo
Relieve continuo en montañas, costas con espuma y degradado de profundidad, estaciones (otoño dorado, inviernos nevados), día y noche con las casas iluminadas, nubes, lluvia y tormentas, humo de chimeneas y minimapa.

### Sonido
Todo el sonido está sintetizado, sin archivos: explosiones, truenos, cuernos de guerra, campanas, obras, combates según dónde mires, y una música ambiental generativa. El botón 🎵 de arriba alterna entre música y efectos, solo efectos, o silencio.

### Historia y logros
La pestaña **Historia** muestra una gráfica con la población de cada reino año a año, con detalle al pasar el cursor, y los récords del mundo. En el menú **Mundo** hay 25 **logros**, de «Primeros pasos» a «Diez siglos».

### Partidas
En el menú **Mundo** hay tres ranuras, un autoguardado cada tres minutos y la opción de exportar o importar el mundo a un archivo `.json`.

## Controles
- La **mano ✋** (arriba a la izquierda, o la tecla `H`) sirve para moverte sin cambiar nada: arrastra para desplazar el mapa y toca para ver un ser, un barco, un edificio (con su nivel) o una ciudad. Al elegir otra herramienta, la mano se quita sola.
- `espacio`: pausa. `1`–`5`: velocidad.
- `WASD` o las flechas: mover la cámara. `+` y `−`: zoom.
- `I`: inspeccionar. `[` y `]`: tamaño del pincel. `Esc`: cerrar ventanas.
- Clic derecho o dos dedos: desplazar. Rueda o pellizco: zoom.
- Pulsa el minimapa para ir a un sitio, o un suceso de la crónica (los que llevan ⌖) para verlo.

## Estructura
- `index.html`: la página.
- `css/style.css`: los estilos.
- `js/`: el juego, en módulos clásicos que comparten el ámbito global y se cargan en orden.
  - `core`, `data`, `world`: utilidades, datos y mundo.
  - `gfx`, `render`: texturas, sprites y dibujo por bloques cacheados.
  - `units`, `ai`: criaturas e inteligencia (necesidades, decisiones, tareas, A*).
  - `buildings`, `boats`, `diplomacy`, `civ`: civilizaciones.
  - `mods2`, `powers`, `nature`, `sim`: mods, poderes, naturaleza y bucle de simulación.
  - `audio`, `input`, `ui`, `save`, `achievements`, `main`: sonido, entrada, interfaz, partidas, logros y arranque.
- `tools/`: pruebas automáticas con Chromium (Playwright).
  - `node tools/test.mjs [años]`: prueba de humo con capturas en `tools/shots/`.
  - `node tools/sim.mjs [años]`: equilibrio de población, comida y eras.
  - `node tools/sweep.mjs`: todos los mapas y todas las herramientas durante un siglo.
  - `node tools/cpuprof.mjs tick|render`: perfil de CPU.
  - `node tools/mobile.mjs`: capturas en tamaño de móvil.
