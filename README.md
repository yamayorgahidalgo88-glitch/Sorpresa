# Ayoub Lahmany Barber Shop · Alcorcón

Web de la barbería de Ayoub con un asesor de cortes: subes una foto, se mide la forma de tu cara y los cortes se ordenan según lo bien que te quedan. Las reservas van a [Booksy](https://booksy.com/es-es/86074_ayoub-lahmany-barber-shop_barberia_52935_alcorcon).

## Qué hay

| Ruta | Qué es |
|---|---|
| `index.html`, `assets/` | La web: HTML, CSS y JavaScript sin framework ni compilación |
| `assets/js/face.js` | Análisis de la cara en el navegador con MediaPipe Face Landmarker (la foto no sale del móvil) |
| `assets/js/cuts.js` | Catálogo de 12 cortes, reglas por forma de cara y pictogramas |
| `assets/js/advisor.js` | El asesor: foto, medidas, ranking, filtros y prueba con IA |
| `api/try-on.js` | Función serverless que genera la foto con el corte (fal.ai o NVIDIA) |
| `flores/` | La página de las flores amarillas que había antes, intacta |

## Probar en local

```bash
cp .env.example .env   # opcional: pon una clave para activar la prueba con IA
npm run dev            # http://localhost:3000
```

Sin clave, todo funciona menos «Pruébatelo», que avisa de que la prueba aún no está activada.

## Publicar en Vercel

1. Importa el repositorio en Vercel (sin configuración: es estático más una función en `api/`).
2. En *Settings → Environment Variables* añade `FAL_KEY` (y `TRYON_PROVIDER=fal`).

## Sobre la prueba con IA

- **fal.ai (recomendado):** FLUX.1 Kontext [pro] acepta fotos subidas y cambia el peinado manteniendo la cara. Se paga por imagen generada, unos céntimos cada una.
- **NVIDIA:** la API gratuita de build.nvidia.com para FLUX.1 Kontext [dev] solo admite sus imágenes de ejemplo. Para usar fotos reales hay que montar el NIM en una GPU propia y poner su URL en `NVIDIA_ENDPOINT`. Además, la licencia de FLUX.1 Kontext [dev] exige acuerdo comercial con Black Forest Labs.
- Cada visitante tiene 3 pruebas por visita y hay un límite básico por IP en el servidor.
- La foto se envía solo al pulsar «Pruébatelo», recortada a la cara, y no se guarda.

## Pendiente con Ayoub

- Horario semanal (la web remite a Booksy).
- Fotos reales del local y de sus cortes, y logotipo si lo tiene.
- Confirmar precios y servicios (copiados de Booksy en octubre de 2026).
