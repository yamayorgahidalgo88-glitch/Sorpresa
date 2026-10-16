import Link from "next/link"

import { ChalkWrite } from "@/components/board/chalk-write"
import { Chalkboard } from "@/components/board/chalkboard"
import { Handwrite } from "@/components/board/handwrite"
import { Mark, Scribble } from "@/components/board/scribble"
import { Button } from "@/components/ui/button"
import { quotes } from "@/lib/site"

const POINTS = [
  "Explicaciones totalmente individualizadas",
  "Metodología propia: AULA INVERTIDA",
  "Grupos reducidos y atención personalizada",
  "Presencial u online, particular o grupal",
]

export function MethodBoard() {
  return (
    <section id="metodo" aria-labelledby="metodo-title" className="whiteboard py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-3xl">
          <h2 id="metodo-title" className="text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            No damos la misma clase <Mark kind="strike" color="var(--marker-red)">para todos</Mark>{" "}
            <Handwrite text="¡a cada uno la suya!" className="font-hand text-[1.15em] text-marker-blue" speed={40} />
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate">
            Nuestros profesores dan a cada estudiante las explicaciones que necesita para entender lo que le cuesta y
            llegar con confianza a sus exámenes. Puedes elegir clases particulares (online o presenciales) o grupales en
            nuestra academia.
          </p>
        </div>

        <Chalkboard className="mt-10">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <ChalkWrite as="h3" className="text-4xl leading-tight sm:text-5xl">
                Cada estudiante tiene un perfil diferente al resto.
              </ChalkWrite>
              <ul className="mt-8 space-y-4">
                {POINTS.map((p, i) => (
                  <li key={p} className="flex items-start gap-3">
                    <Scribble kind="check" className="mt-1 h-6 w-7 shrink-0" color="#c7f3a6" strokeWidth={3.5} delay={0.4 + i * 0.25} />
                    <ChalkWrite className="text-2xl leading-snug sm:text-[1.7rem]" speed={0.02} showChalk={false}>
                      {p}
                    </ChalkWrite>
                  </li>
                ))}
              </ul>
            </div>

            <figure className="relative flex flex-col justify-center lg:border-l lg:border-dashed lg:border-chalk/25 lg:pl-14">
              <span aria-hidden="true" className="chalk-text font-hand text-8xl leading-[0.5] text-note-yellow">“</span>
              <blockquote>
                <ChalkWrite className="text-[2rem] leading-[1.25] sm:text-[2.5rem]" speed={0.04}>
                  {quotes.franklin.text}
                </ChalkWrite>
              </blockquote>
              <figcaption className="chalk-text mt-6 font-hand text-2xl text-note-yellow">
                — {quotes.franklin.author}, {quotes.franklin.role}
              </figcaption>
              <div className="mt-10">
                <Button asChild variant="chalk" size="lg">
                  <Link href="/metodologia">Conoce el aula invertida</Link>
                </Button>
              </div>
            </figure>
          </div>
        </Chalkboard>
      </div>
    </section>
  )
}
