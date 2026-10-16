"use client"

import { useRef } from "react"

import { gsap, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

type Props = {
  children: string
  as?: "p" | "h2" | "h3" | "blockquote" | "span"
  className?: string
  /** segundos por letra */
  speed?: number
  start?: string
  showChalk?: boolean
}

/**
 * Escritura en tiza con GSAP SplitText + ScrollTrigger: las letras aparecen una a una
 * mientras una tiza recorre el texto. Con movimiento reducido el texto aparece completo.
 */
export function ChalkWrite({ children, as: Tag = "p", className, speed = 0.035, start = "top 78%", showChalk = true }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const chalk = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !text.current) return
      const split = SplitText.create(text.current, { type: "chars,words", charsClass: "chalk-char", aria: "none" })
      const chars = split.chars as HTMLElement[]
      gsap.set(chars, { clipPath: "inset(0 100% 0 0)" })
      gsap.set(chalk.current, { autoAlpha: 0 })

      // Las posiciones se miden al empezar (con las fuentes ya cargadas).
      const play = () => {
        const tl = gsap.timeline()
        const box = wrap.current!.getBoundingClientRect()
        chars.forEach((c, idx) => {
          const r = c.getBoundingClientRect()
          // La caja de cada letra lleva relleno (ver .chalk-char): se descuenta para
          // situar la punta de la tiza sobre la propia letra, a media altura.
          const fs = parseFloat(getComputedStyle(c).fontSize)
          const right = r.right - 0.32 * fs
          const top = r.top + 0.45 * fs
          const bottom = r.bottom - 0.35 * fs
          const at = idx * speed
          tl.to(c, { clipPath: "inset(0 0% 0 0)", duration: speed * 2.2, ease: "none" }, at)
          if (showChalk) {
            tl.set(
              chalk.current,
              { autoAlpha: 1, x: right - box.left, y: top + (bottom - top) * 0.55 - box.top, rotate: gsap.utils.random(-42, -32) },
              at
            )
          }
        })
        if (showChalk) tl.to(chalk.current, { autoAlpha: 0, x: "+=16", y: "-=16", duration: 0.4 })
        // Sin recorte al terminar: ninguna letra queda cortada
        tl.set(chars, { clipPath: "none" })
      }
      ScrollTrigger.create({ trigger: wrap.current, start, once: true, onEnter: play })
      return () => split.revert()
    },
    { scope: wrap }
  )

  return (
    <div ref={wrap} className="relative">
      <Tag className={cn("chalk-text font-hand", className)}>
        {/* Texto visual (se divide en letras) + copia para lectores de pantalla */}
        <span ref={text} aria-hidden="true">
          {children}
        </span>
        <span className="sr-only">{children}</span>
      </Tag>
      {showChalk && (
        <span
          ref={chalk}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 -mt-[5px] block h-2.5 w-10 origin-[0_50%] rounded-[3px] bg-gradient-to-r from-white to-[#e9e4d4] shadow-[0_2px_4px_rgb(0_0_0/0.35)] opacity-0"
        />
      )}
    </div>
  )
}
