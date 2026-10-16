# Tips Academy · Propuesta de web

Rediseño de [tipsacademy.es](https://tipsacademy.es) (academia de apoyo en Alcorcón) con estética de **pizarra**: textos
que se escriben a mano, tiza, notas adhesivas arrastrables y un avión de papel que vuela con el scroll.

- **Stack:** Next.js 16 · Tailwind 4 · shadcn/ui · **GSAP 3.15** (ScrollTrigger, SplitText, DrawSVG, MotionPath,
  Draggable, Inertia) · **Lenis** · **React Bits** (TextType, CountUp, Magnet) · Magic UI (Marquee) · Motion · Lucide
- **Diseño:** [`DESIGN.md`](./DESIGN.md), basado en el DESIGN.md de Miro de `VoltAgent/awesome-design-md` (MIT)

## Apartados

Se mantienen los de la web actual:

- **Portada:** barra superior (dirección, teléfono, contactar, reservar plaza), bienvenida, academia de inglés y apoyo
  (método + cita de Benjamin Franklin), cifras (4221 alumnos, 18 asignaturas, 932 aprobados EvAU, 43 talleres), 6
  servicios + cita de C. S. Lewis, recursos (+1000 archivos), equipo, opiniones de Google (5,0 · 177), t-Blog, contacto
  (horarios, mapa con consentimiento, formulario) y chat de WhatsApp con temas.
- **Páginas:** Quiénes somos (pilares, equipo, cursos, porcentaje de éxito, testimonios), Metodología (aula invertida),
  Servicios (10 servicios), Contacto, Aviso legal, Privacidad y Cookies.
- **Enlazan a la web actual** (contenido dinámico de WordPress): Recursos por curso, fichas de servicios, t-Blog,
  TIPS Foro, Aula Virtual y formulario de matriculación.

Todo el contenido se edita en **`src/lib/site.ts`**.

## Desarrollo y despliegue

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # todo estático
```

En Vercel: Root Directory `tips-academy`. Variables opcionales:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, sitemap, JSON-LD) |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` para permitir que Google la indexe. **Por defecto no se indexa** (es una propuesta y duplicaría la web actual) |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Envío del formulario por email con Resend |

## Antes de publicar

- [ ] Fotos reales del equipo (ahora, avatares con iniciales) y logotipo oficial si se prefiere al recreado.
- [ ] Revisar textos de «Educación financiera» e «Informática» (resumidos) y cifras/porcentajes actualizados.
- [ ] Conectar las opiniones con un widget de Google o actualizarlas (son extractos públicos con nombre abreviado).
- [ ] Completar datos legales (titular, NIF) y revisión jurídica.
- [ ] Activar `NEXT_PUBLIC_ALLOW_INDEXING=true` solo cuando sustituya a la web actual.

## Licencias de terceros

GSAP (licencia estándar gratuita de GreenSock), Lenis (MIT), React Bits (MIT + Commons Clause: uso en proyectos
permitido, no revender los componentes), Magic UI (MIT), awesome-design-md (MIT).
