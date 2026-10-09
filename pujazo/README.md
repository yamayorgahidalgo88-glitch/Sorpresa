# 🔨 PUJAZO

Juego online de pujas en tiempo real (2–5 jugadores) inspirado en el trend de TikTok de "pujar por cosas".
Cada jugador empieza con **20 🪙** y tiene que acabar con **4 cosas** para montar su *jardín / casa / parque de atracciones / pizza / viaje ideal*.

## Publicarlo en Vercel
Esta carpeta es una web estática, sin servidor ni base de datos, así que no hay nada que configurar:

1. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa este repositorio.
2. En **Root Directory** elige `pujazo`.
3. Framework Preset: **Other**, sin comando de build → **Deploy**.

(O desde la terminal: `cd pujazo && npx vercel`.)

## Cómo funciona el online sin servidor
Vercel no mantiene conexiones en tiempo real, así que la sala vive en el **navegador del anfitrión**:
los demás jugadores se conectan directamente a él por WebRTC usando [PeerJS](https://peerjs.com) (gratuito).
El código de 4 caracteres identifica la sala.

- El anfitrión decide quién gana cada puja y lleva el reloj, así que si dos pujan lo mismo a la vez vale solo la primera.
- Si un invitado recarga la página, vuelve a entrar en la partida.
- **Si el anfitrión cierra la pestaña, la sala se acaba para todos** (la web le avisa antes).

## Cómo se juega
- El anfitrión crea la sala (nombre + categoría o 🎲 aleatoria) y recibe el código.
- Los demás pulsan *Unirse a sala*, ponen su nombre y el código.
- Van saliendo cosas al azar (muy malas, malas, normales, buenas y muy buenas). 120 por categoría, sin repetirse.
- Cada puja dura **10 s**; cada vez que alguien puja, el reloj vuelve a **5 s**.
- **Pujar X** sube 1 la puja actual, o escribe una cantidad.
- **Dejar de pujar**: si todos los demás se retiran, el que va ganando se lo lleva al instante (martillazo + pantalla rota + ¡VENDIDO!).
- Si nadie puja, se adjudica gratis a quien no tenga dinero (al azar si hay varios) o, si todos tienen, a quien menos tenga.
- Al final cada uno ve lo que ha ganado con sus precios y todos se puntúan de 0 a 10.

## Probarlo en local
```bash
cd pujazo
python3 -m http.server 5173     # o: npx serve
# abre http://localhost:5173 en dos pestañas
node test/simulate.js           # simula una partida completa contra el motor
```

## Archivos
- `index.html`, `style.css`, `app.js` – la interfaz.
- `engine.js` – reglas del juego (salas, pujas, relojes, votación).
- `net.js` – conexión entre jugadores con PeerJS.
- `categories.js` – las 5 categorías con 120 cosas cada una.
- `logo.svg` – el logo.
