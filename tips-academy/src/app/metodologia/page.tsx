import type { Metadata } from "next"
import Link from "next/link"

import { ChalkWrite } from "@/components/board/chalk-write"
import { Chalkboard } from "@/components/board/chalkboard"
import { Handwrite } from "@/components/board/handwrite"
import { Mark } from "@/components/board/scribble"
import { StickyNote } from "@/components/board/sticky-note"
import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"
import { quotes } from "@/lib/site"

export const metadata: Metadata = {
  title: "Metodología: aula invertida",
  description: "En Tips Academy trabajamos con el aula invertida (flipped classroom): el alumno es el protagonista y la clase se dedica a practicar y resolver dudas.",
  alternates: { canonical: "/metodologia" },
}

const STEPS = [
  { n: "1", title: "Antes de clase", text: "El alumno trabaja los contenidos con los materiales que le facilitan sus profesores.", color: "yellow" as const },
  { n: "2", title: "En clase", text: "Afianzamos conceptos con aclaraciones, práctica y ejercicios: aprendizaje activo desde el minuto cero.", color: "teal" as const },
  { n: "3", title: "A tu ritmo", text: "Seguimos el ritmo que marcan las habilidades y conocimientos previos de cada alumno.", color: "rose" as const },
]

export default function Metodologia() {
  return (
    <>
      <PageHero title="Flipped classroom:" hand="¡el aula invertida!">
        <p>
          El aprendizaje se convierte en un proceso <strong className="text-ink">activo y no pasivo</strong>. Las clases sirven
          para aplicar los conceptos, resolver dudas y trabajar los retos concretos a los que se enfrentarán los alumnos.
        </p>
      </PageHero>

      <section aria-labelledby="como" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="como" className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            ¿Cómo <Mark kind="circle" color="var(--marker-red)">funciona</Mark>?
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <StickyNote as="li" key={s.n} color={s.color} rotate={[-2, 1.5, -1][i]} className="hover:rotate-0">
                <span className="font-hand text-6xl font-bold text-ink/80" aria-hidden="true">{s.n}</span>
                <h3 className="mt-2 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink/80">{s.text}</p>
              </StickyNote>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="ventajas" className="whiteboard py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <Chalkboard>
            <h2 id="ventajas" className="sr-only">Ventajas del aula invertida</h2>
            <ChalkWrite as="h3" className="text-4xl sm:text-5xl">Ventajas del aula invertida</ChalkWrite>
            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <div>
                <ChalkWrite className="text-3xl text-note-yellow" speed={0.025} showChalk={false}>
                  1. Aprendizaje profundo, progresivo y mucho más notable.
                </ChalkWrite>
                <p className="mt-3 text-lg leading-relaxed text-chalk/85">
                  Fomenta el aprendizaje individual del alumno fuera del aula, favoreciendo un aprendizaje mucho más profundo
                  gracias a su inmersión en el proceso.
                </p>
              </div>
              <div>
                <ChalkWrite className="text-3xl text-note-yellow" speed={0.025} showChalk={false}>
                  2. El alumno es el centro y el profesor le guía.
                </ChalkWrite>
                <p className="mt-3 text-lg leading-relaxed text-chalk/85">
                  Los alumnos pasan de ser sujetos pasivos a activos: más motivados, creativos e implicados. Los profesores
                  tienen más tiempo para resolver dudas e incidir en lo que más cuesta.
                </p>
              </div>
            </div>
            <figure className="mt-14 border-t border-dashed border-chalk/25 pt-12 text-center">
              <blockquote>
                <ChalkWrite className="mx-auto max-w-3xl text-[2.2rem] leading-[1.2] sm:text-5xl" speed={0.045}>
                  {`«${quotes.franklin.text}»`}
                </ChalkWrite>
              </blockquote>
              <figcaption className="chalk-text mt-6 font-hand text-2xl text-note-yellow">
                — {quotes.franklin.author}, {quotes.franklin.role}
              </figcaption>
            </figure>
          </Chalkboard>
        </div>
      </section>

      <section className="bg-white py-14 text-center">
        <Handwrite as="p" text="¿Lo probamos juntos?" className="font-hand text-5xl font-bold text-ink" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/contacto">Pide información</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/servicios">Ver servicios</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
