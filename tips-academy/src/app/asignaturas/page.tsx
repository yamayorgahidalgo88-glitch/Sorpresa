import type { Metadata } from "next"

import { noteBg } from "@/components/board/sticky-note"
import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { Rich } from "@/components/rich"
import { subjects, type Sticky } from "@/lib/site"

export const metadata: Metadata = {
  title: "Asignaturas: clases de apoyo de Primaria, ESO y Bachillerato",
  description: "18 asignaturas disponibles en Tips Academy: clases de apoyo y particulares de Primaria, ESO, Bachillerato, Selectividad, acceso a FP, idiomas e informática.",
  alternates: { canonical: "/asignaturas" },
}

const LEVELS = [
  { title: "Primaria", text: "Refuerzo de **lectura, escritura y matemáticas** y ayuda con los deberes para coger buenos hábitos desde pequeños." },
  { title: "ESO", text: "**Clases de apoyo de ESO** en todas las asignaturas: matemáticas, física y química, lengua, inglés, biología, geografía e historia…" },
  { title: "Bachillerato y Selectividad", text: "Asignaturas de ciencias y de letras con profesores especialistas, y preparación de la **PAU (EvAU)** con nuestro intensivo." },
  { title: "Acceso a FP y mayores de 25", text: "Preparación de las pruebas de **acceso a Grado Medio y Superior** y del acceso a la universidad para mayores de 25." },
  { title: "Idiomas", text: "**Inglés** para todos los niveles y preparación de los certificados **Cambridge B2 y C1**." },
]

const COLORS: Sticky[] = ["yellow", "rose", "teal", "orange", "sky", "mint", "coral"]

export default function AsignaturasPage() {
  return (
    <>
      <PageHero title={`${subjects.length} asignaturas`} hand="¡y todos los niveles!">
        <p>Primaria, ESO, Bachillerato, Selectividad, acceso a módulos, mayores de 25 e idiomas. Si no ves la tuya, pregúntanos.</p>
      </PageHero>
      <section className="whiteboard py-14 sm:py-16">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
          {subjects.map((s, i) => (
            <li
              key={s.name}
              style={{ rotate: `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg` }}
              className={`rounded-[4px] p-4 shadow-[0_12px_20px_-14px_rgb(12_31_51/0.45)] transition-transform hover:rotate-0! hover:-translate-y-1 ${noteBg[COLORS[i % COLORS.length]]}`}
            >
              <p className="font-hand text-[1.6rem] leading-tight font-bold text-ink">{s.name}</p>
              <p className="mt-1 text-xs text-ink/70">{s.levels}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="etapas" className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="etapas" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Clases de apoyo para cada etapa
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-slate">
            <Rich text="En **clases grupales** o **clases particulares**, presenciales u online: adaptamos cada asignatura al curso y al ritmo del alumno." />
          </p>
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((l) => (
              <article key={l.title}>
                <h3 className="font-hand text-3xl font-bold text-ink">{l.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">
                  <Rich text={l.text} />
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CtaStrip text="¿Con cuál empezamos?" />
    </>
  )
}
