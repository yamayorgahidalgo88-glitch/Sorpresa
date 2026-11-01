# Ayoub Lahmany Barber Shop · Alcorcón

Web de la barbería de Ayoub: portada con vídeo, servicios y precios, trabajos reales, dónde estamos y reserva. Las reservas van a [Booksy](https://booksy.com/es-es/86074_ayoub-lahmany-barber-shop_barberia_52935_alcorcon).

## Qué hay

| Ruta | Qué es |
|---|---|
| `index.html`, `assets/` | La web: HTML, CSS y JavaScript sin framework ni compilación |
| `assets/js/motion.js` | Animaciones de scroll (GSAP, ScrollTrigger y Lenis desde CDN) |
| `assets/js/reel.js` | Carrusel infinito de trabajos |
| `flores/` | La página de las flores amarillas que había antes, intacta |

El asesor de cortes con IA está retirado por ahora (ver `HANDOFF.md` para recuperarlo).

## Probar en local

```bash
npm run dev            # http://localhost:3000
```

## Publicar en Vercel

Web estática, sin variables de entorno. Ver `HANDOFF.md` para publicar con la herramienta de Vercel.

## Pendiente con Ayoub

- Horario semanal (la web remite a Booksy).
- Confirmar el uso del logo y de las fotos de Booksy.
- Confirmar precios y servicios (copiados de Booksy en octubre de 2026).
