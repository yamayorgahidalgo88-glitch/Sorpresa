"use client"

import { useRef } from "react"
import { m, useReducedMotion, useScroll, useTransform } from "motion/react"

import { AmbientVideo } from "@/components/ambient-video"
import { Button } from "@/components/ui/button"

/** Banda de vídeo a sangre completa con parallax suave. */
export function Breathe() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"])
  const textY = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section ref={ref} aria-labelledby="respira-title" className="relative isolate h-[85svh] min-h-[32rem] overflow-hidden bg-forest">
      <m.div style={reduce ? undefined : { y }} className="absolute -inset-y-[14%] inset-x-0 -z-10">
        <AmbientVideo name="respira" controlsClassName="right-5 bottom-5 sm:right-8 sm:bottom-8" />
      </m.div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
      <m.div style={reduce ? undefined : { y: textY }} className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-8">
        <p className="eyebrow text-white/75">Un lugar para ti</p>
        <h2 id="respira-title" className="mt-5 max-w-3xl font-display text-[2.6rem] leading-[1.08] font-light text-white sm:text-6xl lg:text-7xl">
          Un espacio tranquilo para cuidarte, <em>a dos pasos de casa</em>.
        </h2>
        <div className="mt-10">
          <Button asChild variant="outlineLight" size="lg">
            <a href="#ubicacion">Cómo llegar</a>
          </Button>
        </div>
      </m.div>
      <p className="absolute bottom-6 left-4 text-xs text-white/70 sm:left-8">Imagen ilustrativa</p>
    </section>
  )
}
