# Centro Clínico Parque Lisboa · Web

Web de **Centro Clínico Parque Lisboa** (Alcorcón): fisioterapia, rehabilitación y podología.

- **Stack:** Next.js 16 (App Router, Cache Components) · Tailwind CSS 4 · shadcn/ui · Motion · Lenis · three.js · Lucide
- **Efectos:** Magic UI (Text Reveal, Marquee) y React Bits (Spotlight Card)
- **Diseño:** ver [`DESIGN.md`](./DESIGN.md) (basado en el análisis de Oura de `VoltAgent/awesome-design-md`, MIT)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # todas las páginas se generan estáticas
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. **Root Directory:** `parque-lisboa` (el proyecto está en esta subcarpeta).
3. Framework: Next.js (se detecta solo). No hace falta cambiar los comandos.
4. Variables de entorno (Settings → Environment Variables):

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública, p. ej. `https://centroclinicoparquelisboa.com` (canonical, sitemap, JSON-LD) |
| `RESEND_API_KEY` | Envío del formulario por email con [Resend](https://resend.com) |
| `CONTACT_TO_EMAIL` | Destinatario(s) de las solicitudes (separados por comas) |
| `CONTACT_FROM_EMAIL` | Remitente verificado en Resend, p. ej. `Web <web@centroclinicoparquelisboa.com>` |

Sin `RESEND_API_KEY`/`CONTACT_TO_EMAIL`, en producción el formulario muestra un aviso para llamar o escribir por
WhatsApp (en desarrollo, la solicitud se muestra en la consola).

## Dónde se edita el contenido

Todo el contenido de la clínica está en **`src/lib/site.ts`**: teléfono, WhatsApp, dirección, horario, servicios,
equipo, opiniones, preguntas frecuentes y datos legales.

## Vídeos

Los vídeos están en `public/videos/` con este patrón (no cambies los nombres):

```
<nombre>-720.mp4      escritorio (H.264, sin audio, ~1280px)
<nombre>-480.mp4      móvil (~854px)
<nombre>-poster.webp  primer fotograma / imagen fija
```

Nombres: `hero`, `fisioterapia`, `rehabilitacion`, `podologia`, `respira`.

Los actuales son clips de [Mixkit](https://mixkit.co) con **Stock Video Free License** (uso comercial permitido, sin
atribución; los clips «Restricted» no se usan porque no permiten uso comercial). Las fuentes están en
`src/lib/videos.ts`. Son **imágenes ilustrativas de estilo de vida**, por eso llevan la etiqueta «Imagen
ilustrativa»: no muestran el centro ni a su equipo.

### Usar vídeos propios o generados con IA

Lo ideal es grabar el propio centro (con consentimiento de quien aparezca). Si se generan con IA (Sora, Veo, Runway,
Kling…), es mejor que sean **ambientales** y que no simulen ser el centro real ni pacientes concretos. Prompts de
partida (8–10 s, plano fijo o travelling lento, 16:9):

- **hero:** «Luz cálida de mañana entrando por una ventana, una persona estira los brazos con calma junto a la cama,
  tonos crema y beige, estética editorial, cámara lenta suave, sin texto.»
- **fisioterapia:** «Primer plano de manos estirando suavemente un hombro al aire libre, luz dorada, fondo de árboles
  desenfocado, tonos verdes y crema, movimiento lento.»
- **rehabilitacion:** «Persona realizando ejercicios suaves de movilidad en una terraza luminosa, plantas, cielo claro,
  ritmo pausado, paleta oliva y crema.»
- **podologia:** «Pies con zapatillas caminando despacio por un sendero de parque en otoño, plano bajo, luz natural.»
- **respira:** «Retrato tranquilo de una persona respirando profundamente con los ojos cerrados, luz suave, fondo
  cálido desenfocado.»

Conversión recomendada con ffmpeg:

```bash
ffmpeg -i entrada.mp4 -t 10 -an -vf "scale=1280:-2" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart hero-720.mp4
ffmpeg -i entrada.mp4 -t 10 -an -vf "scale=854:-2"  -c:v libx264 -crf 29 -preset slow -pix_fmt yuv420p -movflags +faststart hero-480.mp4
ffmpeg -ss 1 -i entrada.mp4 -frames:v 1 -vf "scale=1280:-2" -c:v libwebp -quality 72 hero-poster.webp
```

## Rendimiento y accesibilidad

- El titular del hero no se anima (LCP). La escena 3D se carga en diferido (`requestIdleCallback`), se pausa fuera de
  pantalla y no se carga con «ahorro de datos» o sin WebGL.
- Los vídeos no se descargan hasta que se acercan a la pantalla, se pausan al salir y tienen botón de pausa.
- `prefers-reduced-motion`: sin desplazamiento suave, sin autoplay, sin parallax ni animaciones de entrada.
- Google Maps solo se carga tras aceptarlo (RGPD y rendimiento).

## Antes de publicar (checklist)

- [ ] Confirmar servicios (`services` en `site.ts`; hay especialidades ocultas de la web actual).
- [ ] Confirmar el código postal (28924) y el número de WhatsApp.
- [ ] Equipo real: nombres, especialidad, nº de colegiado y retratos con consentimiento.
- [ ] Opiniones reales y verificables (o enlazar a Google). **No inventar reseñas.**
- [ ] Datos legales: titular, NIF, nº de registro sanitario de la Comunidad de Madrid; revisión jurídica de los textos.
- [ ] Logotipo oficial (sustituir `src/components/logo.tsx` y `src/app/icon.svg`).
- [ ] Configurar Resend y las variables de entorno.
