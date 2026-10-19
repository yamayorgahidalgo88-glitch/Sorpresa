"use client"

import { useRef } from "react"
import { Scribble } from "@/components/board/scribble"
import { noteBg } from "@/components/board/sticky-note"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import { onVisibility } from "@/lib/in-view"
import type { Sticky } from "@/lib/site"
import { cn } from "@/lib/utils"

const NOTES: { text: string; sub: string; color: Sticky; pos: string; r: number }[] = [
  { text: "Mates", sub: "ESO y Bachillerato ✓", color: "yellow", pos: "sm:left-[4%] sm:top-[6%]", r: -6 },
  { text: "Inglés", sub: "B2 · C1 Cambridge", color: "sky", pos: "sm:right-[4%] sm:top-[2%]", r: 5 },
  { text: "EvAU", sub: "Intensivo 10 días", color: "rose", pos: "sm:left-[20%] sm:top-[36%]", r: -2 },
  { text: "Robótica", sub: "¡Aprender jugando!", color: "orange", pos: "sm:left-[2%] sm:bottom-[8%]", r: 4 },
  { text: "Física y Química", sub: "Grupos reducidos", color: "teal", pos: "sm:right-[2%] sm:top-[44%]", r: -5 },
  { text: "Técnicas de estudio", sub: "Estudia mejor, no más", color: "mint", pos: "sm:right-[20%] sm:bottom-[0%]", r: 3 },
]

/**
 * Tablero con notas adhesivas que aparecen "pegándose" y flotan suavemente (GSAP).
 * Son decorativas: la información está en la página.
 */
export function HeroBoard() {
  const board = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const notes = gsap.utils.toArray<HTMLElement>(".hero-note")
      if (prefersReducedMotion()) return
      gsap.from(notes, {
        y: -40,
        scale: 0.6,
        autoAlpha: 0,
        rotate: () => gsap.utils.random(-25, 25),
        duration: 0.7,
        ease: "back.out(1.8)",
        stagger: 0.12,
        delay: 0.4,
      })
      // Flotación suave
      const floats = notes.map((n, i) =>
        gsap.to(n, { y: "+=8", duration: 2.4 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.4 + i * 0.2 })
      )
      // Solo flotan mientras el tablero está en pantalla.
      return onVisibility(board.current!, (v) => floats.forEach((f) => (v ? f.resume() : f.pause())))
    },
    { scope: board }
  )

  return (
    <div ref={board} aria-hidden="true" className="relative mx-auto grid w-full max-w-[34rem] grid-cols-2 gap-x-4 gap-y-5 px-1 select-none sm:block sm:aspect-square sm:px-0">
      {/* Marco de pizarra blanca */}
      <div className="absolute inset-[6%] hidden rounded-[28px] sm:block border border-hairline bg-white/60 shadow-[inset_0_0_0_6px_#f7f8fa]" />
      <Scribble kind="swirl" className="absolute top-[44%] left-[8%] hidden h-14 w-28 sm:block" color="var(--sky)" strokeWidth={3} trigger="load" delay={1.6} />
      <Scribble kind="star" className="absolute top-[18%] left-[52%] hidden size-10 sm:block" color="var(--marker-red)" strokeWidth={3} trigger="load" delay={1.9} />
      <Scribble kind="sparkle" className="absolute right-[34%] bottom-[30%] hidden size-9 sm:block" color="#f5a524" strokeWidth={3} trigger="load" delay={2.1} />

      {NOTES.map((n) => (
        <div
          key={n.text}
          style={{ rotate: `${n.r}deg` }}
          className={cn(
            "hero-note relative z-10 rounded-[4px] p-3.5 shadow-[0_1px_1px_rgb(0_0_0/0.08),0_14px_24px_-14px_rgb(12_31_51/0.4)] sm:absolute sm:w-[38%] sm:p-5",
            noteBg[n.color],
            n.pos
          )}
        >
          <p className="font-hand text-[1.45rem] leading-none font-bold text-ink sm:text-[2rem]">{n.text}</p>
          <p className="mt-1.5 font-hand text-base leading-tight text-slate sm:text-xl">{n.sub}</p>
        </div>
      ))}
    </div>
  )
}
