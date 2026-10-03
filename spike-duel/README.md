# Spike Duel: Volleyball

Juego de vóley 1 contra 1 para navegador, pensado para publicarse en CrazyGames.

- **Modos:**
  - **Spike Career:** 50 niveles en 5 mundos (playa, selva, nieve, azotea y almacén), con un camino de casillas. Cada 10 niveles hay un jefe que se juega en el volcán.
  - **Torneo:** 8 rivales aleatorios que cambian en cada torneo, de dificultad creciente. Si pierdes, vuelves a la ronda 1.
  - **2 jugadores:** en el mismo teclado o pantalla.
- **Controles:** 1 jugador con A/D o flechas para moverse y W, flecha arriba o espacio para saltar. En 2 jugadores, A/D/W contra las flechas. En móvil aparecen botones táctiles.
- **Remate:** si tocas el balón en el aire, rematas. Cada toque carga la barra; llena, el siguiente remate es un súper remate. Quien saca no carga la barra hasta que el rival toque el balón. Un súper sigue activo hasta que lo toca el rival o termina el punto, aunque toque la red.
- **Súpers:** 20 súpers que se compran en la tienda. Fuego es el inicial. Los demás son Chicle, Encoger, Meteorito, Hielo, Gravedad cero, Rayo, Fantasma, Clones, Confusión, Tornado, Caracol, Imán, Tinta, Vendaval, Globo, Bumerán, Teletransporte, Bomba y Terremoto. Los rivales usan súpers cada vez más fuertes.
- **Progresión:** las monedas de cada partido desbloquean 16 personajes (8 con accesorios: casco, pinchos, gafas de sol, tatuajes, corona, pirata, cascos de DJ y ninja; solo son estéticos) y 16 balones con diseño propio.
- **Cuenta atrás:** 3, 2, 1 al empezar cada partido y al volver de la pausa.
- **Idioma:** inglés, o español si el navegador está en español.

## Probarlo en local

```sh
cd spike-duel
python3 -m http.server 8000
# abre http://localhost:8000
```

No necesita compilar nada: son archivos estáticos (`index.html`, `style.css`, `sdk.js`, `game.js`) y pesan menos de 100 KB.

## CrazyGames

`sdk.js` envuelve el SDK HTML5 v3 de CrazyGames y sigue funcionando si el SDK no carga.

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
