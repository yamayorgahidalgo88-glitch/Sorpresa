"use client"

import { useRef } from "react"
import { m, useReducedMotion, useScroll, useTransform } from "motion/react"
import { Clock, MapPin } from "lucide-react"

import { AmbientVideo } from "@/components/ambient-video"
import { site } from "@/lib/site"

/**
 * Escenario de vídeo del hero: empieza como una pieza redondeada (Oura · rounded.xl)
 * y se abre a sangre completa a medida que se desplaza la página.
 */
export function ScrollStage() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.15"] })
  const inset = useTransform(scrollYProgress, [0, 1], ["3.5%", "0%"])
  const radius = useTransform(scrollYProgress, [0, 1], [40, 0])
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.12, 1])

  return (
    <div ref={ref} className="relative">
      <m.div
        style={reduce ? undefined : { marginInline: inset, borderRadius: radius }}
        className="relative mx-4 h-[68svh] min-h-[26rem] overflow-hidden rounded-[40px] bg-sage-pale sm:mx-8 sm:h-[82svh] motion-safe:mx-0"
      >
        <m.div style={reduce ? undefined : { scale: videoScale }} className="absolute inset-0">
          <AmbientVideo name="hero" priority controlsClassName="right-5 bottom-5 sm:right-8 sm:bottom-8" />
        </m.div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3 sm:inset-x-8 sm:bottom-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3 pr-14 sm:pr-0">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-canvas/95 px-4 py-2.5 text-sm text-stone shadow-[0_8px_30px_-12px_rgb(28_27_26/0.35)] backdrop-blur">
              <Clock className="size-4" aria-hidden="true" />
              {site.hours.summary}
            </span>
            <span className="hidden items-center gap-2.5 rounded-full bg-canvas/95 px-4 py-2.5 text-sm text-stone shadow-[0_8px_30px_-12px_rgb(28_27_26/0.35)] backdrop-blur sm:inline-flex">
              <MapPin className="size-4" aria-hidden="true" />
              {site.address.street}, {site.address.city}
            </span>
          </div>
          <p className="text-xs text-white/75 sm:mr-16">Imagen ilustrativa</p>
        </div>
      </m.div>
    </div>
  )
}
