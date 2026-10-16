"use client"

import { useRef } from "react"
import { Hand } from "lucide-react"

import { Scribble } from "@/components/board/scribble"
import { noteBg } from "@/components/board/sticky-note"
import { Draggable, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import type { Sticky } from "@/lib/site"
import { cn } from "@/lib/utils"

const NOTES: { text: string; sub: string; color: Sticky; pos: string; r: number }[] = [
  { text: "Mates", sub: "ESO y Bachillerato ✓", color: "yellow", pos: "left-[4%] top-[6%]", r: -6 },
  { text: "Inglés", sub: "B2 · C1 Cambridge", color: "sky", pos: "right-[4%] top-[2%]", r: 5 },
  { text: "EvAU", sub: "Intensivo 10 días", color: "rose", pos: "left-[20%] top-[36%]", r: -2 },
  { text: "Robótica", sub: "¡Aprender jugando!", color: "orange", pos: "left-[2%] bottom-[8%]", r: 4 },
  { text: "Física y Química", sub: "Grupos reducidos", color: "teal", pos: "right-[2%] top-[44%]", r: -5 },
  { text: "Técnicas de estudio", sub: "A estudiar también se aprende", color: "mint", pos: "right-[20%] bottom-[0%]", r: 3 },
]

/**
 * Tablero con notas adhesivas: aparecen "pegándose" y se pueden arrastrar
 * (GSAP Draggable + Inertia). Son decorativas: la información está en la página.
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
      notes.forEach((n, i) =>
        gsap.to(n, { y: "+=8", duration: 2.4 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.4 + i * 0.2 })
      )
      Draggable.create(notes, {
        bounds: board.current,
        inertia: true,
        edgeResistance: 0.7,
        onPress() {
          gsap.to(this.target, { scale: 1.08, rotate: 0, zIndex: 30, boxShadow: "0 30px 40px -18px rgb(12 31 51 / .45)", duration: 0.2 })
        },
        onRelease() {
          gsap.to(this.target, { scale: 1, rotate: gsap.utils.random(-6, 6), zIndex: 10, boxShadow: "", duration: 0.35 })
        },
      })
    },
    { scope: board }
  )

  return (
    <div ref={board} aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[34rem] touch-pan-y select-none">
      {/* Marco de pizarra blanca */}
      <div className="absolute inset-[6%] rounded-[28px] border border-hairline bg-white/60 shadow-[inset_0_0_0_6px_#f7f8fa]" />
      <Scribble kind="swirl" className="absolute top-[44%] left-[8%] h-14 w-28" color="var(--sky)" strokeWidth={3} trigger="load" delay={1.6} />
      <Scribble kind="star" className="absolute top-[18%] left-[52%] size-10" color="var(--marker-red)" strokeWidth={3} trigger="load" delay={1.9} />
      <Scribble kind="sparkle" className="absolute right-[34%] bottom-[30%] size-9" color="#f5a524" strokeWidth={3} trigger="load" delay={2.1} />
      <p className="absolute top-[30%] right-[8%] flex items-center gap-1.5 font-hand text-xl text-steel">
        <Hand className="size-5" /> ¡Arrástrame!
      </p>

      {NOTES.map((n) => (
        <div
          key={n.text}
          style={{ rotate: `${n.r}deg` }}
          className={cn(
            "hero-note absolute z-10 w-[38%] cursor-grab rounded-[4px] p-4 shadow-[0_1px_1px_rgb(0_0_0/0.08),0_14px_24px_-14px_rgb(12_31_51/0.4)] active:cursor-grabbing sm:p-5",
            noteBg[n.color],
            n.pos
          )}
        >
          <p className="font-hand text-[1.7rem] leading-none font-bold text-ink sm:text-[2rem]">{n.text}</p>
          <p className="mt-1.5 font-hand text-lg leading-tight text-slate sm:text-xl">{n.sub}</p>
        </div>
      ))}
    </div>
  )
}
