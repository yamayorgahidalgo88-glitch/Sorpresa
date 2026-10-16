# Tips Academy · Propuesta de web

Rediseño de [tipsacademy.es](https://tipsacademy.es) (academia de apoyo en Alcorcón) con estética de **pizarra**: textos
que se escriben a mano, tiza, notas adhesivas arrastrables y un avión de papel que vuela con el scroll.

- **Stack:** Next.js 16 · Tailwind 4 · shadcn/ui · **GSAP 3.15** (ScrollTrigger, SplitText, DrawSVG, MotionPath) · **Lenis** · **React Bits** (TextType, CountUp) · Magic UI (Marquee) · Motion · Lucide
- **Diseño:** [`DESIGN.md`](./DESIGN.md), basado en el DESIGN.md de Miro de `VoltAgent/awesome-design-md` (MIT)

## Apartados

Todas las secciones de la web actual tienen su página en esta web, con el mismo diseño (ya no se enlaza a la antigua):

- **Portada:** bienvenida, método (pizarra + cita de Franklin), cifras (enlazan a su apartado), servicios + cita de
  C. S. Lewis, recursos, equipo, opiniones de Google, t-Blog y contacto.
- **Nosotros:** Quiénes somos, Metodología y Asignaturas (las 18).
- **Servicios:** listado + una página por servicio (Intensivo de Selectividad con calendario 2026, clases grupales,
  particulares, técnicas de estudio, robótica, julio, Cambridge, informática, educación financiera, Club de Rol y Tips
  Software), cada una con su cita en la pizarra.
- **Recursos:** listado de cursos + una página por curso (apuntes, ejercicios y exámenes).
- **t-Blog** con sus entradas, **TIPS Foro**, **Aula Virtual**, **Reservar mi plaza** (formulario de matrícula),
  **Contacto** y páginas legales.

Pendiente de conectar (solo diseño): archivos descargables de Recursos, acceso del Aula Virtual y Foro (requieren el
sistema de usuarios de la academia).

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
- [ ] Confirmar la lista de las 18 asignaturas y las asignaturas por curso de Recursos (propuestas).
- [ ] Texto de «Cursos de robótica» y «Club de Rol» (la web actual no tiene texto; lo hemos redactado).
- [ ] Revisar cifras/porcentajes actualizados.
- [ ] Conectar las opiniones con un widget de Google o actualizarlas (son extractos públicos con nombre abreviado).
- [ ] Completar datos legales (titular, NIF) y revisión jurídica.
- [ ] Activar `NEXT_PUBLIC_ALLOW_INDEXING=true` solo cuando sustituya a la web actual.

## Licencias de terceros

GSAP (licencia estándar gratuita de GreenSock), Lenis (MIT), React Bits (MIT + Commons Clause: uso en proyectos
permitido, no revender los componentes), Magic UI (MIT), awesome-design-md (MIT).
