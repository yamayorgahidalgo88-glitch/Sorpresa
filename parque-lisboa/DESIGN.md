---
name: Centro Clínico Parque Lisboa
description: Sistema visual "papel cálido" inspirado en el análisis de Oura (VoltAgent/awesome-design-md, MIT), adaptado a la identidad verde de la clínica. Serif fina para sentir, sans para leer, un único color de acción y bandas de tonos tierra que marcan el ritmo del scroll.

colors:
  primary: "#2e7d32"      # verde del logotipo — SOLO para la acción principal ("Pedir cita")
  on-primary: "#ffffff"
  canvas: "#f7f1e8"       # fondo por defecto (nunca blanco)
  surface: "#ffffff"      # tarjetas elevadas e inputs
  ink: "#1c1b1a"          # texto principal
  stone: "#4a4741"        # neutro de marca: botones secundarios, contornos, enlaces
  ash: "#6b665f"          # texto secundario (AA sobre crema)
  hairline: "#e1dcd3"     # separadores 1px
  ink-band: "#19191c"     # banda de opiniones y pie
  forest: "#224228"
  olive: "#5c6f5d"
  sage: "#849671"
  sage-pale: "#ced4b8"    # banda "Cómo trabajamos"
  gold: "#af751b"
  gold-soft: "#ddaa61"
  gold-pale: "#ddbe78"    # banda de contacto (#efe3c8)
  brand-lime: "#acff36"   # solo en el logotipo y la escena 3D

typography:
  display: { fontFamily: Fraunces, weight: 300, use: "titulares grandes, cursiva para el énfasis" }
  body: { fontFamily: DM Sans, size: 17-18px, lineHeight: 1.5 }
  eyebrow: { fontFamily: DM Sans, size: 12px, weight: 700, uppercase, letterSpacing: 0.12em }

rounded: { card: 24px, media: 40px, pill: 9999px, input: 12px }
---

# Sistema de diseño

Basado en el `DESIGN.md` de Oura de [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(licencia MIT). Se toma el **lenguaje** (paleta cálida, ritmo, tipografía, componentes), no la marca.

## Reglas

- **Un solo verde por vista.** `primary` solo en «Pedir cita» y en el envío del formulario. El resto de acciones: `stone`
  (relleno o contorno) o crema sobre oscuro.
- **Crema por defecto.** Blanco solo para tarjetas, inputs y el formulario.
- **Serif para sentir, sans para leer.** Fraunces solo en tamaños grandes; nunca en párrafos largos.
- **Bandas de color tierra** (salvia, dorado, oscuro) separan capítulos: crema → salvia → crema → vídeo → oscuro → crema → dorado → crema → oscuro.
- **Mucho aire.** Secciones con 112–160px de separación vertical.
- **Píldoras** totalmente redondas; tarjetas 24px; vídeos e imágenes grandes 40px.
- **Sombras** suaves, cálidas y de baja opacidad.

## Movimiento (contenido, apropiado para una clínica)

| Efecto | Dónde | Librería |
| --- | --- | --- |
| Desplazamiento suave | Toda la web | Lenis |
| Cruz de cristal 3D (puntero + scroll) | Hero | three.js (carga diferida) |
| Escenario de vídeo que se abre a sangre | Hero | Motion `useScroll` |
| Texto que se ilumina al hacer scroll | Filosofía | Magic UI · Text Reveal |
| Parallax de vídeo | Banda «Un lugar para ti» | Motion |
| Carrusel de opiniones | Opiniones | Magic UI · Marquee |
| Brillo que sigue al ratón | Tarjetas de equipo | React Bits · Spotlight Card |
| Aparición al entrar en pantalla | Bloques | Motion |

Todo se desactiva o se queda estático con `prefers-reduced-motion`. Los vídeos tienen botón de pausa y no se
reproducen solos con movimiento reducido o «ahorro de datos».
