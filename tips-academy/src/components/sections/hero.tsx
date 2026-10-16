import Link from "next/link"

import { Handwrite } from "@/components/board/handwrite"
import { Mark, Scribble } from "@/components/board/scribble"
import { HeroBoard } from "@/components/sections/hero-board"
import { HeroSlogans } from "@/components/sections/hero-slogans"
import { PaperPlane } from "@/components/sections/paper-plane"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="whiteboard relative overflow-hidden">
      <PaperPlane />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12 lg:pb-20">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-light px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink-deep">
            <span className="size-2 rounded-full bg-sky" aria-hidden="true" />
            Academia de apoyo en Alcorcón · +15 años
          </p>

          <h1 id="hero-title" className="mt-6 text-[2.6rem] leading-[1.08] font-bold tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.2rem]">
            ¡Bienvenidos a{" "}
            <Mark kind="circle" color="var(--marker-red)" trigger="load" delay={1.2}>
              TIPS ACADEMY
            </Mark>
            ,{" "}
            <Handwrite
              text="tu academia en Alcorcón!"
              trigger="load"
              delay={0.35}
              speed={42}
              className="font-hand text-[1.18em] font-semibold text-sky-dark"
            />
          </h1>

          <HeroSlogans />

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
            Clases particulares o grupales de apoyo, preparación de exámenes oficiales (Selectividad, acceso a Grado
            Medio y Superior, Cambridge) y talleres de técnicas de estudio, robótica y programación.{" "}
            <strong className="text-ink">Elige el profesor que mejor se adapte a lo que buscas.</strong>
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-start">
              <Button asChild size="xl">
                <Link href={site.links.matricula}>Reservar mi plaza</Link>
              </Button>
              {/* La flecha sale de la frase y apunta al botón */}
              <p className="relative mt-3 ml-14 font-hand text-2xl text-marker-red">
                <Scribble
                  kind="arrowUp"
                  className="absolute -top-5 -left-14 h-11 w-14"
                  color="var(--marker-red)"
                  strokeWidth={2.6}
                  trigger="load"
                  delay={2.2}
                />
                ¡Gratis y sin compromiso!
              </p>
            </div>
            <Button asChild size="xl" variant="outline" className="self-start">
              <Link href="/contacto">Pide información</Link>
            </Button>
          </div>
        </div>

        <HeroBoard />
      </div>
    </section>
  )
}
