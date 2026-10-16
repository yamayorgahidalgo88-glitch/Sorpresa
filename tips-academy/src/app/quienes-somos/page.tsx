import type { Metadata } from "next"

import { Handwrite } from "@/components/board/handwrite"
import { Mark } from "@/components/board/scribble"
import { StickyNote } from "@/components/board/sticky-note"
import { PageHero } from "@/components/page-hero"
import { SuccessRates } from "@/components/sections/success-rates"
import { Team } from "@/components/sections/team"
import { slogans, testimonials } from "@/lib/site"

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "Tips Academy: academia de apoyo escolar en Alcorcón con más de 15 años de experiencia, profesores titulados y metodología de aula invertida.",
  alternates: { canonical: "/quienes-somos" },
}

const PILLARS = [
  { title: "Experiencia y resultados", text: "Más de 15 años ayudando a alumnos a preparar sus exámenes en todos los niveles. Cuenta con nosotros, no te arrepentirás.", color: "yellow" as const },
  { title: "Profesores titulados", text: "Llenos de entusiasmo por la enseñanza y con todas las herramientas que necesites a tu disposición.", color: "rose" as const },
  { title: "Todos los niveles y asignaturas", text: "Primaria, ESO, Bachillerato, acceso a módulos, acceso a la universidad para mayores de 25, idiomas…", color: "teal" as const },
  { title: "Flexibilidad", text: "En asignaturas, horarios, modalidades y metodologías: presencial u online, particular o grupal.", color: "orange" as const },
]

const COURSES = [
  {
    title: "Preparación EvAU",
    text: "La prueba de acceso a la universidad es posiblemente el examen más determinante. Llevamos más de 15 años preparando alumnos, ayudándoles con la ansiedad, aportando trucos y destacando lo más importante del temario.",
    hand: "Daremos a tu futuro el empujón que necesita.",
  },
  {
    title: "Acceso a Grado Medio y Superior",
    text: "Si tu opción son los módulos de FP, más prácticos y enfocados al mercado laboral, somos tu academia. Nuestra flexibilidad encaja con quien compagina estudios y trabajo.",
    hand: "Ven a probar una clase.",
  },
  {
    title: "Acceso a la universidad para mayores de 25",
    text: "Entendemos que compaginar trabajo, familia y estudios es complejo, así que ponemos a tu disposición todos nuestros recursos para que te resulte lo más fácil y ameno posible.",
    hand: "Nunca es tarde para mejorar tu futuro.",
  },
]

export default function QuienesSomos() {
  return (
    <>
      <PageHero eyebrow="Nosotros" title="¡Bienvenido a TIPS," hand="tu academia de Alcorcón!">
        <p>
          <Handwrite text={slogans.tips} className="font-hand text-3xl font-bold text-ink" /> Eso queremos ser para ti: esa
          ayuda, ese apoyo extra que necesitas para alcanzar tus objetivos y construir tu futuro.
        </p>
      </PageHero>

      <section aria-labelledby="pilares" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="pilares" className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Lo que nos hace <Mark kind="underline" color="var(--sky)">diferentes</Mark>
          </h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <StickyNote as="li" key={p.title} color={p.color} rotate={i % 2 ? 2 : -2} className="hover:rotate-0">
                <h3 className="font-hand text-3xl leading-tight font-bold text-ink">{p.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{p.text}</p>
              </StickyNote>
            ))}
          </ul>
          <p className="mt-12 max-w-3xl text-lg leading-relaxed text-slate">
            Ofrecemos clases grupales y particulares, talleres de técnicas de estudio, cursos de robótica e informática y
            nuestro Club de Rol y Juegos de Mesa. Nuestra metodología se basa en el <strong className="text-ink">aula invertida</strong>:
            el alumno trabaja los contenidos antes de clase y en clase los afianzamos con práctica, adaptándonos a cada uno.
          </p>
        </div>
      </section>

      <Team />

      <section aria-labelledby="cursos" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="cursos" className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Las mejores clases y cursos</h2>
          <ul className="mt-12 grid gap-8 lg:grid-cols-3">
            {COURSES.map((c) => (
              <li key={c.title} className="notebook rounded-[8px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)]">
                <h3 className="text-xl font-bold text-ink">{c.title}</h3>
                <p className="mt-3 leading-[2rem] text-slate">{c.text}</p>
                <Handwrite as="p" text={c.hand} className="mt-4 font-hand text-2xl text-marker-red" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SuccessRates />

      <section aria-labelledby="testimonios" className="whiteboard py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <h2 id="testimonios" className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Testimonios de nuestros alumnos</h2>
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <StickyNote as="li" key={t.author} color={i ? "sky" : "mint"} rotate={i ? 1.5 : -1.5}>
                <blockquote className="font-hand text-2xl leading-snug text-ink">«{t.text}»</blockquote>
                <p className="mt-4 text-sm">
                  <strong className="text-ink">{t.author}</strong> <span className="text-slate">· {t.role}</span>
                </p>
              </StickyNote>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
