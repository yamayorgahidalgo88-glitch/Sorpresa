# Spike Duel: Volleyball

Juego de vóley 1 contra 1 para navegador, pensado para publicarse en CrazyGames.

- **Modos:**
  - **Spike Career:** 50 niveles en 5 mundos (playa, selva, nieve, azotea y almacén), cada uno con su fondo ilustrado y más difícil que el anterior. Cada nivel da de 0 a 3 estrellas (pierdes: 0; ganas encajando como mucho 2 puntos: 3; como mucho 4: 2; más: 1). El jefe de cada mundo se juega en el volcán y está encadenado hasta que reúnes las estrellas que pide (12, 15, 18, 21 y 24).
  - **Torneo:** 8 rivales aleatorios, todos con personajes distintos, que cambian en cada torneo y son cada vez más difíciles. Si pierdes, vuelves a la ronda 1. Al ganarlo aparece un trofeo con confeti y «Reclamar premio»: eliges una de tres cajas, que suelen tener monedas y a veces un personaje, balón o súper que aún no tienes.
  - **2 jugadores:** en el mismo teclado (oculto en móviles por ahora).
  - **Online (Crear sala / Unirse a sala):** quien crea la sala recibe un código de 4 letras y el amigo lo escribe en su móvil u ordenador. La conexión es directa entre los dos dispositivos (WebRTC con PeerJS, cuyo servicio gratuito pone en contacto a los dos y aporta servidores STUN/TURN). Usa *rollback* (como los juegos de lucha online): los dos dispositivos ejecutan exactamente la misma partida y solo se envían los botones; los del rival se predicen y, si llegan distintos, la partida se rebobina y se recalcula al instante. La física evita funciones matemáticas que cada navegador redondea distinto (Safari y Chrome dan el mismo resultado) y el azar sale de una semilla compartida. Cada medio segundo el creador de la sala envía el estado completo como red de seguridad. Cada jugador se ve siempre a la izquierda y con su propio balón, como en Clash Royale. Las partidas online usan siempre el campo estándar. Ganar da 15 monedas y perder 5; al final se puede pedir revancha.
- **Controles:** 1 jugador con A/D o flechas para moverse y W, flecha arriba o espacio para saltar. En 2 jugadores, A/D/W contra las flechas. En móvil aparecen botones táctiles.
- **Remate:** si tocas el balón en el aire, rematas. Cada toque carga la barra; llena, el siguiente remate es un súper remate. Quien saca no carga la barra hasta que el rival toque el balón. Un súper sigue activo hasta que lo toca el rival o termina el punto, aunque toque la red.
- **Súpers:** 21 súpers que se compran en la tienda. Fuego es el inicial. Los demás son Chicle, Encoger, Meteorito, Hielo, Gravedad cero, Rayo, Fantasma, Clones, Confusión, Tornado, Caracol, Imán, Tinta, Vendaval, Globo, Bumerán, Teletransporte, Bomba, Terremoto y Minibola (encoge el balón hasta que lo toca el rival). El Rayo se queda girando sobre la red de 1 a 3 segundos y sale disparado a un punto al azar del campo rival; Gravedad cero hace flotar 2 segundos a quien la toca; el Tornado gira cada vez más rápido. Los rivales usan súpers cada vez más fuertes.
- **Progresión:** las monedas de cada partido desbloquean 19 personajes (bota de fútbol, casco de piloto de Fórmula 1, pinchos, cyborg, punk, rey con corona y capa, pirata con loro, astronauta, ninja, nigiri de salmón y Slimy, un slime viscoso; los accesorios solo son estéticos) y 16 balones con diseño propio.
- **Remontada:** quien pierde un punto carga un 30 % de la barra de súper, sin llegar a llenarla de golpe.
- **Rivales:** se llaman como su skin (dos Cyborg se llaman los dos Cyborg); los jefes conservan su título. Con la barra llena, incluso los rivales fáciles buscan el remate para usar su súper.
- **Escenarios:** playa, selva, nieve, ciudad nocturna con focos y neones, almacén, volcán y luna (con la Tierra al fondo, estrellas fugaces y meteoritos), con el fondo estático guardado en caché para que vaya fluido.
- **Final de partida:** primero se ofrece ver un anuncio con recompensa (monedas extra) o «No, gracias»; después, siguiente rival/nivel o menú.
- **Móvil:** se puede instalar como app (pantalla completa, solo horizontal). En pantallas más alargadas que 16:9 el escenario se extiende a los lados en lugar de dejar bandas negras.
- **Franja de controles (móvil):** la pista sube y los botones quedan en una franja oscura bajo el suelo, para que el dedo no tape al personaje. La altura de la franja se adapta al tamaño de los botones.
- **Botones (móvil):** desde el menú se abre una práctica en un mapa al azar contra un rival de nivel fácil (se mueve, salta y devuelve la pelota) que nunca termina la partida. Manteniendo pulsado 2,5 s el botón de salto se ajustan su tamaño y su posición; manteniendo una flecha, el tamaño, la posición y la separación de las dos flechas. Se guarda.
- **Bordes:** en pantallas anchas la pista llega hasta los bordes reales de la pantalla (ahí rebota la pelota) y los personajes corren un poco más rápido. En todos los mapas los bordes se ven como una pared de cristal transparente que brilla cuando la pelota rebota.
- **Cuenta atrás:** 3, 2, 1 al empezar cada partido y al volver de la pausa.
- **Tienda:** cada objeto tiene su precio en monedas. Ahora mismo `FREE_SHOP = true` en `game.js` para probarlo todo gratis (los precios se conservan); hay que ponerlo en `false` antes de publicar.
- **Safari/iPhone:** mantener pulsado un botón táctil no abre el menú de selección de texto.
- **Idioma:** inglés, o español si el navegador está en español.

## Probarlo en local

```sh
cd spike-duel
python3 -m http.server 8000
# abre http://localhost:8000
```

No necesita compilar nada: son archivos estáticos (`index.html`, `style.css`, `sdk.js`, `game.js`) y pesan menos de 100 KB.

## Actualizaciones en el móvil

`index.html` pide `style.css`, `sdk.js` y `game.js` con `?v=...`. Al publicar una versión nueva hay que cambiar ese número para que los móviles no sigan usando la copia guardada.

## CrazyGames

`sdk.js` carga el SDK HTML5 v3 de CrazyGames solo dentro de CrazyGames (y en `localhost` para pruebas) y sigue funcionando si el SDK no carga o no responde en 3 s.

| Evento | Cuándo |
| --- | --- |
| `loadingStart` / `loadingStop` | Durante el arranque |
| `gameplayStart` | Al empezar o reanudar un partido |
| `gameplayStop` | Al pausar, salir o terminar un partido |
| `happytime` | Al ganar un partido del torneo |
| Anuncio entre partidas (`midgame`) | Al terminar un partido perdido o de 2 jugadores |
| Vídeo con recompensa (`rewarded`) | Opcional tras una victoria del torneo: duplica las monedas |

El partido nunca enseña los dos tipos de anuncio en la misma transición, y la recompensa solo se da si el anuncio termina. Así se cumplen las normas de anuncios de CrazyGames. El progreso se guarda con el módulo de datos del SDK y, si no está disponible, en `localStorage`.

Para el lanzamiento básico, que no admite anuncios, basta con subir la carpeta tal cual: sin el entorno de CrazyGames, el SDK no muestra anuncios.
