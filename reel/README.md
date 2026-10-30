# Reel Halloween 9:16 (21 s)

Render: `node reel/render.cjs --cuenta @tucuenta` → `reel/halloween-reel.mp4` (1080×1920, 30 fps).

Imágenes por toma en `assets/` (estilo de las ilustraciones de la profe):
- `toma1.png` colegio de noche con el niño vampiro · `toma2.png` mano llamando · `toma3.png` puerta y silueta
- `toma4.png` la profe con sombrero de bruja · `toma5.png` clase (recorte sin texto de la imagen original, ya incluido)
- `toma6.png` opcional: si falta, el cierre reutiliza `toma1.png` con la cámara subiendo hasta la luna.
Sin imagen, cada toma usa un dibujo provisional.

Audio provisional sintetizado en `audio.py`; para usar el tuyo deja un `reel/audio.wav` de 21 s antes de renderizar.
