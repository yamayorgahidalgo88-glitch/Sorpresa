# 🔨 PUJAZO

Juego online de pujas en tiempo real (2–5 jugadores) inspirado en el trend de TikTok de "pujar por cosas".
Cada jugador empieza con **20 🪙** y tiene que acabar con **4 cosas** para montar su *jardín / casa / parque de atracciones / pizza / viaje ideal*.

## Cómo se juega
- El anfitrión crea la sala (nombre + categoría o 🎲 aleatoria) y recibe un **código de 4 caracteres**.
- Los demás pulsan *Unirse a sala*, ponen su nombre y el código.
- Van saliendo cosas al azar (muy malas, malas, normales, buenas y muy buenas). 120 por categoría, sin repetirse en la partida.
- Cada puja dura **10 s**; cada vez que alguien puja, el reloj vuelve a **5 s**.
- **Pujar X** sube 1 la puja actual, o escribe una cantidad. Si dos pujan lo mismo a la vez, gana el primero que llega al servidor y al otro se le avisa.
- **Dejar de pujar**: si todos los demás se retiran, el que va ganando se lo lleva al instante (martillazo + pantalla rota + ¡VENDIDO!).
- Si nadie puja, se adjudica gratis a quien no tenga dinero (al azar si hay varios) o, si todos tienen, a quien menos tenga.
- Al final se genera con IA una imagen con lo que ha ganado cada uno, su lista con precios, y todos se puntúan de 0 a 10.

## Ejecutarlo en local
```bash
cd pujazo
npm install
npm start          # http://localhost:3000
npm test           # simula una partida completa con 3 bots (con el servidor arrancado)
```

## Publicarlo en internet
Necesita un servidor Node con WebSockets (no vale un hosting estático como GitHub Pages).
La opción más sencilla es **Render** (gratis): *New → Web Service*, conecta este repo y pon
- Root directory: `pujazo`
- Build command: `npm install`
- Start command: `npm start`

También funciona en Railway, Fly.io o cualquier VPS.

## Imágenes con IA
Las imágenes se generan con [Pollinations](https://pollinations.ai) a través del propio servidor, que las pone en cola,
las guarda en memoria y las empieza a generar en cuanto arranca la partida. Sin clave el servicio es gratuito pero lento
y pone una marca de agua. Para más calidad y velocidad, crea un token gratis en pollinations.ai y añádelo como variable de entorno:
```
POLLINATIONS_TOKEN=tu_token
```
Mientras una imagen se genera se muestra el emoji del objeto.

## Estructura
- `server.js` – salas, pujas en tiempo real (Socket.IO), temporizadores, votación y proxy de imágenes.
- `data/categories.js` – las 5 categorías con 120 objetos cada una (añadir una categoría nueva = añadir un bloque aquí).
- `public/` – la web (HTML/CSS/JS sin frameworks) y el logo `logo.svg`.
