"use client"

// Magic UI · Text Reveal (https://magicui.design/docs/components/text-reveal)
// Las palabras se iluminan al desplazarse. Con movimiento reducido se muestra el texto completo.

import { useRef } from "react"
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"

import { cn } from "@/lib/utils"

export function TextReveal({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] })
  const words = children.split(" ")

  if (reduce) {
    return <p className={className}>{children}</p>
  }

  return (
    <div ref={ref} className="relative">
      <p className={cn("flex flex-wrap", className)}>
        <span className="sr-only">{children}</span>
        {words.map((word, i) => {
          const start = i / words.length
          const end = start + 1 / words.length
          return (
            <Word key={i} progress={scrollYProgress} range={[start, end]}>
              {word}
            </Word>
          )
        })}
      </p>
    </div>
  )
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  // Del gris (contraste 3:1, válido para texto grande) a tinta.
  const color = useTransform(progress, range, ["#8e8880", "#1c1b1a"])
  return (
    <m.span aria-hidden="true" style={{ color }} className="mr-[0.25em]">
      {children}
    </m.span>
  )
}
