# Spike Duel: Volleyball

Juego de vóley 1 contra 1 para navegador, pensado para publicarse en CrazyGames.

- **Modos:**
  - **Spike Career:** 50 niveles en 5 mundos (playa, selva, nieve, azotea y almacén), cada uno con su fondo ilustrado y más difícil que el anterior. Cada nivel da de 0 a 3 estrellas (pierdes: 0; ganas encajando como mucho 2 puntos: 3; como mucho 4: 2; más: 1). El jefe de cada mundo se juega en el volcán y está encadenado hasta que reúnes las estrellas que pide (12, 15, 18, 21 y 24).
  - **Torneo:** 8 rivales aleatorios, todos con personajes distintos, que cambian en cada torneo y son cada vez más difíciles. Si pierdes, vuelves a la ronda 1. Al ganarlo aparece un trofeo con confeti y «Reclamar premio»: eliges una de tres cajas, que suelen tener monedas y a veces un personaje, balón o súper que aún no tienes.
  - **2 jugadores:** en el mismo teclado (oculto en móviles por ahora).
  - **Online (Crear sala / Unirse a sala):** quien crea la sala recibe un código de 4 letras y el amigo lo escribe en su móvil u ordenador. La conexión es directa entre los dos dispositivos (WebRTC con PeerJS, cuyo servicio gratuito pone en contacto a los dos y aporta servidores STUN/TURN). Usa *rollback* (como los juegos de lucha online): los dos dispositivos ejecutan exactamente la misma partida y solo se envían los botones; los del rival se predicen y, si llegan distintos, la partida se rebobina y se recalcula al instante. La física evita funciones matemáticas que cada navegador redondea distinto (Safari y Chrome dan el mismo resultado) y el azar sale de una semilla compartida. Cada medio segundo el creador de la sala envía el estado completo como red de seguridad. Cada jugador se ve siempre a la izquierda y con su propio balón, como en Clash Royale. Las partidas online usan siempre el campo estándar. Las monedas siguen la misma regla que el resto de partidas; al final se puede pedir revancha.
- **Controles:** 1 jugador con A/D o flechas para moverse y W, flecha arriba o espacio para saltar. En 2 jugadores, A/D/W contra las flechas. En móvil aparecen botones táctiles.
- **Remate:** si tocas el balón en el aire, rematas. Cada toque carga la barra; llena, el siguiente remate es un súper remate. Quien saca no carga la barra hasta que el rival toque el balón. Un súper sigue activo hasta que lo toca el rival o termina el punto, aunque toque la red.
- **Súpers:** 20 súpers que se compran en la tienda. Fuego es el inicial. Los demás son Chicle, Encoger, Meteorito, Hielo, Rayo, Fantasma, Clones, Confusión, Tornado, Caracol, Imán, Tinta, Vendaval, Globo, Bumerán, Teletransporte, Bomba, Terremoto y Minibola (encoge el balón hasta que lo toca el rival). El Rayo se queda girando sobre la red de 1 a 3 segundos y sale disparado a un punto al azar del campo rival (quien lo toca queda paralizado 0,5 s); el Globo, al pasar la red, se mueve como un globo que se deshincha (acelerones locos por el campo rival hasta caer al suelo); el Vendaval empuja al rival hacia atrás unos 2,5 s; el Meteorito desaparece al llegar a la red y, 1-2 s después, cae muy rápido desde arriba en un punto al azar del campo rival; Gravedad cero se ha retirado (se parecía demasiado al Terremoto): su hueco se mantiene para no romper los guardados y a quien la había comprado se le devuelven las 250 monedas; el Tornado gira cada vez más rápido. Los rivales usan súpers cada vez más fuertes.
- **Monedas por partida (siempre igual):** si ganas y el rival te ha hecho 0-2 puntos, 25 monedas; 3-4 puntos, 15; 5-6 puntos, 7. Si pierdes, 0. Tras una victoria se puede ver un vídeo para duplicarlas. Al ganar el torneo se suman además 150 monedas y la caja de premio. En Spike Career solo se ganan monedas en un nivel cuando consigues más estrellas de las que tenías (así no se pueden farmear los niveles fáciles).
- **IA:** si la máquina lleva un rato con la pelota en su campo (antes cuanto más difícil es), salta para rematar o la pasa con una vaselina por encima de la red, así no se queda dando toques contra la red o su pared. La dificultad sigue subiendo ronda a ronda en el torneo y nivel a nivel y mundo a mundo en Spike Career.
- **Progresión:** las monedas de cada partido desbloquean 19 personajes (bota de fútbol, casco de piloto de Fórmula 1, pinchos, cyborg, punk, rey con corona y capa, pirata con loro, astronauta, ninja, nigiri de salmón y Slimy, un slime viscoso; los accesorios solo son estéticos) y 16 balones con diseño propio.
- **Remontada:** quien pierde un punto carga un 30 % de la barra de súper, sin llegar a llenarla de golpe.
- **Rivales:** se llaman como su skin (dos Cyborg se llaman los dos Cyborg); los jefes conservan su título. Con la barra llena, incluso los rivales fáciles buscan el remate para usar su súper.
- **Escenarios:** playa, selva, nieve, ciudad nocturna con focos y neones, almacén, volcán y luna (con la Tierra al fondo, estrellas fugaces y meteoritos), con el fondo estático guardado en caché para que vaya fluido.
- **Final de partida:** si ganas, primero se ofrece ver un vídeo con recompensa (duplica las monedas) o «No, gracias»; si pierdes, sale el anuncio normal entre partidas. Después, siguiente rival/nivel o menú.
- **Móvil:** se puede instalar como app (pantalla completa, solo horizontal). En pantallas más alargadas que 16:9 el escenario se extiende a los lados en lugar de dejar bandas negras.
- **Franja de controles (móvil):** la pista sube y los botones quedan en una franja oscura bajo el suelo, para que el dedo no tape al personaje. La altura de la franja se adapta al tamaño de los botones.
- **Botones (móvil):** desde el menú se abre una práctica en un mapa al azar contra un rival de nivel fácil (se mueve, salta y devuelve la pelota) que nunca termina la partida. Manteniendo pulsado 2,5 s el botón de salto se ajustan su tamaño y su posición; manteniendo una flecha, el tamaño, la posición y la separación de las dos flechas. Se guarda.
- **Bordes:** en pantallas anchas la pista llega hasta los bordes reales de la pantalla (ahí rebota la pelota) y los personajes corren un poco más rápido. En todos los mapas los bordes se ven como una pared de cristal transparente que brilla cuando la pelota rebota.
- **Cuenta atrás:** 3, 2, 1 al empezar cada partido y al volver de la pausa.
- **CrazyGames SDK:** el progreso se guarda con el módulo de datos del SDK (en la cuenta del jugador) y el juego respeta el silencio de CrazyGames (`settings.muteAudio`).
- **Online:** crear sala / unirse a sala solo aparece en móvil y fuera de CrazyGames (en ordenador y en CrazyGames está oculto por ahora).
- **Tienda:** cada objeto tiene su precio en monedas. `FREE_SHOP` es gratis (se ven los precios) en la versión instalable y de pago en CrazyGames, según el dominio. El guardado usa la clave `spikeduel.save.v2`, así que todo el mundo empieza de cero: 0 monedas, solo lo inicial y el nivel 1 de Spike Career.
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
| Vídeo con recompensa (`rewarded`) | Opcional tras cualquier victoria: duplica las monedas de la partida |

El partido nunca enseña los dos tipos de anuncio en la misma transición, y la recompensa solo se da si el anuncio termina. Así se cumplen las normas de anuncios de CrazyGames. El progreso se guarda con el módulo de datos del SDK y, si no está disponible, en `localStorage`.

Para el lanzamiento básico, que no admite anuncios, basta con subir la carpeta tal cual: sin el entorno de CrazyGames, el SDK no muestra anuncios.
