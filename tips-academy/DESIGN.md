---
name: Tips Academy
description: Pizarra blanca juguetona basada en el análisis de Miro (VoltAgent/awesome-design-md, MIT), adaptada a la marca Tips (nube azul cielo + azul marino). Notas adhesivas pastel, rotulador y tiza que "se escriben solos" para transmitir que estudiar es entretenido.

colors:
  sky: "#36a9e1"        # azul del logotipo — papel del amarillo de Miro: marca, barra superior, etiquetas
  navy: "#1d3b5a"       # barra superior actual — papel del negro de Miro: botón principal (píldora)
  ink: "#1c1c1e"
  ink-deep: "#0c1f33"   # pie de página
  slate: "#4f5566"
  hairline: "#e0e2e8"
  marker-red: "#e5484d" # rotulador: círculos, tachados, chinchetas
  marker-blue: "#1f6feb"
  notes: { yellow: "#fff1a8", rose: "#ffd8f4", teal: "#c3faf5", orange: "#ffe0bd", sky: "#d6ecff", mint: "#d2f6dc", coral: "#ffc6c6" }
  board: "#24443a"      # pizarra de tiza
  chalk: "#f4f1e6"
typography:
  sans: Plus Jakarta Sans (sustituto de Roobert PRO)
  hand: Caveat (rotulador y tiza)
rounded: { pill: 9999px, sticky: 4px, card: 28px }
---

# Sistema de diseño

- **Lienzo**: blanco con rejilla de puntos (`whiteboard`), como un tablero de Miro.
- **Botones**: siempre píldora. Principal en azul marino con "sombra de tecla" (3D sutil).
- **Notas adhesivas** pastel con cinta para servicios, cifras, opiniones y equipo (girar ±1–3°).
- **Pizarra de tiza** (`Chalkboard`) para las frases importantes: método y citas.
- **Mano alzada**: Caveat solo para frases cortas, eslóganes y citas; el texto largo, en Plus Jakarta Sans.

## Movimiento

| Efecto | Dónde | Herramienta |
| --- | --- | --- |
| Scroll suave sincronizado | Toda la web | Lenis + GSAP ticker/ScrollTrigger |
| Texto escrito a mano letra a letra | Titulares y eslóganes | CSS (sin esperar a JS) |
| Tiza que escribe con la tiza visible | Pizarras | GSAP SplitText + ScrollTrigger |
| Círculos, subrayados, flechas, estrellas | Palabras clave | GSAP DrawSVGPlugin |
| Notas arrastrables con inercia | Hero | GSAP Draggable + InertiaPlugin |
| Avión de papel que vuela con el scroll | Hero | GSAP MotionPathPlugin + DrawSVG |
| Barras de porcentaje de éxito | Quiénes somos | GSAP ScrollTrigger |
| Eslóganes que se teclean y borran | Hero | React Bits · TextType |
| Contadores | Cifras | React Bits · CountUp |
| Botón magnético | CTA del hero | React Bits · Magnet |
| Cintas de etiquetas y opiniones | Servicios, opiniones | Magic UI · Marquee |

Con `prefers-reduced-motion` todo aparece escrito y quieto, sin scroll suave.
