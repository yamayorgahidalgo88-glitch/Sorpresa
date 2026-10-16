"use client"

import { useRef } from "react"

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

/** Trazos a mano alzada (rotulador). Se dibujan con DrawSVGPlugin al entrar en pantalla. */
const PATHS = {
  underline: { vb: "0 0 300 24", d: "M4 15 C 60 7, 120 19, 180 11 S 270 8, 296 13" },
  double: { vb: "0 0 300 30", d: "M4 10 C 80 4, 200 14, 296 8 M14 23 C 100 16, 210 26, 290 19" },
  circle: {
    vb: "0 0 300 120",
    d: "M150 8 C 70 6, 10 30, 12 62 C 14 98, 90 114, 160 112 C 240 110, 292 88, 288 56 C 284 22, 210 6, 130 12 C 100 15, 80 20, 70 24",
  },
  box: { vb: "0 0 300 100", d: "M8 12 L 292 6 L 296 92 L 6 96 Z M 8 12 L 30 10" },
  strike: { vb: "0 0 300 40", d: "M4 24 C 100 16, 200 26, 296 14" },
  arrow: { vb: "0 0 120 90", d: "M6 10 C 40 6, 90 24, 100 74 M80 58 L 101 78 L 114 52" },
  arrowUp: { vb: "0 0 40 50", d: "M24 47 C 14 38, 14 22, 20 5 M11 13 L 20 4 L 28 14" },
  star: { vb: "0 0 100 100", d: "M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z" },
  check: { vb: "0 0 60 50", d: "M6 26 L 22 42 L 54 6" },
  swirl: { vb: "0 0 120 60", d: "M6 40 C 20 10, 50 10, 50 30 C 50 48, 30 48, 32 32 C 34 16, 70 8, 90 22 C 104 32, 110 40, 114 52" },
  sparkle: { vb: "0 0 60 60", d: "M30 4 L30 22 M30 38 L30 56 M4 30 L22 30 M38 30 L56 30 M12 12 L22 22 M38 38 L48 48 M48 12 L38 22 M22 38 L12 48" },
} as const

export type ScribbleKind = keyof typeof PATHS

export function Scribble({
  kind,
  className,
  color = "var(--marker-red)",
  strokeWidth = 4,
  delay = 0,
  duration = 0.9,
  trigger = "view",
}: {
  kind: ScribbleKind
  className?: string
  color?: string
  strokeWidth?: number
  delay?: number
  duration?: number
  trigger?: "view" | "load"
}) {
  const ref = useRef<SVGSVGElement>(null)
  const p = PATHS[kind]

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(ref.current!.querySelectorAll("path"), {
        drawSVG: 0,
        duration,
        delay,
        ease: "power2.inOut",
        scrollTrigger: trigger === "view" ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
      })
    },
    { scope: ref }
  )

  return (
    <svg ref={ref} viewBox={p.vb} preserveAspectRatio="none" aria-hidden="true" focusable="false" className={cn("pointer-events-none overflow-visible", className)}>
      <path d={p.d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Resalta una palabra con un trazo de rotulador alrededor o debajo. */
export function Mark({
  children,
  kind = "underline",
  color,
  className,
  delay,
  trigger,
}: {
  children: React.ReactNode
  kind?: "underline" | "double" | "circle" | "box" | "strike"
  color?: string
  className?: string
  delay?: number
  trigger?: "view" | "load"
}) {
  const pos =
    kind === "circle"
      ? "-inset-x-[10%] -inset-y-[28%] h-[156%] w-[120%]"
      : kind === "box"
        ? "-inset-x-[4%] -inset-y-[12%] h-[124%] w-[108%]"
        : kind === "strike"
          ? "inset-x-0 top-[42%] h-[0.35em] w-full"
          : "inset-x-0 -bottom-[0.18em] h-[0.4em] w-full"
  return (
    <span className={cn("relative inline-block whitespace-nowrap", className)}>
      <span className="relative z-10">{children}</span>
      <Scribble kind={kind} color={color} delay={delay} trigger={trigger} className={cn("absolute z-0", pos)} />
    </span>
  )
}
