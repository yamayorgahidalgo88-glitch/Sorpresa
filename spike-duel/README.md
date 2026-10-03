# Spike Duel: Volleyball

Juego de vóley 1 contra 1 para navegador, pensado para publicarse en CrazyGames.

- **Modos:** Torneo contra 8 rivales de dificultad creciente y 2 jugadores en el mismo teclado o pantalla.
- **Controles:** 1 jugador con A/D o flechas para moverse y W, flecha arriba o espacio para saltar. En 2 jugadores, A/D/W contra las flechas. En móvil aparecen botones táctiles.
- **Remate:** si tocas el balón en el aire, rematas. Cada toque carga la barra; llena, el siguiente remate es un súper remate.
- **Progresión:** las monedas de cada partido desbloquean 8 personajes y 6 balones.
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
