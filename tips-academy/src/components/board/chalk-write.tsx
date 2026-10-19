"use client"

import { useRef } from "react"

import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap"
import { whenInView } from "@/lib/in-view"
import { cn } from "@/lib/utils"

type Props = {
  children: string
  as?: "p" | "h2" | "h3" | "blockquote" | "span"
  className?: string
  /** segundos por letra */
  speed?: number
  showChalk?: boolean
}

/**
 * Escritura en tiza con GSAP SplitText (se activa al entrar en pantalla): las letras aparecen una a una
 * mientras una tiza recorre el texto. Con movimiento reducido el texto aparece completo.
 *
 * Rendimiento: el texto solo se divide en letras cuando empieza a escribirse y, al terminar,
 * se deshace (SplitText.revert) para dejar un único nodo de texto sin animaciones.
 */
export function ChalkWrite({ children, as: Tag = "p", className, speed = 0.035, showChalk = true }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const chalk = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = text.current
      if (!el) return
      el.classList.remove("chalk-pending")
      if (prefersReducedMotion()) return
      // Oculto hasta que le toca escribirse (con JS); sigue ocupando su sitio.
      el.classList.add("chalk-pending")
      gsap.set(chalk.current, { autoAlpha: 0 })

      let split: SplitText | undefined
      const play = () => {
        split = SplitText.create(el, { type: "chars,words", charsClass: "chalk-char", aria: "none" })
        const chars = split.chars as HTMLElement[]
        gsap.set(chars, { clipPath: "inset(0 100% 0 0)" })
        el.classList.remove("chalk-pending")

        const tl = gsap.timeline({
          onComplete: () => {
            split?.revert()
            split = undefined
          },
        })
        // Un solo tween con «stagger» para todas las letras (en lugar de uno por letra).
        tl.to(chars, { clipPath: "inset(0 0% 0 0)", duration: speed * 2.2, ease: "none", stagger: speed }, 0)

        if (showChalk) {
          // La posición de la tiza se calcula de una vez (lecturas agrupadas, sin tocar el DOM entre medias)
          // y se aplica con un único tween que avanza por el índice de letra.
          const box = wrap.current!.getBoundingClientRect()
          const fs = parseFloat(getComputedStyle(chars[0]).fontSize)
          // La caja de cada letra lleva relleno (ver .chalk-char): se descuenta para
          // situar la punta de la tiza sobre la propia letra, a media altura.
          const pos = chars.map((c) => {
            const r = c.getBoundingClientRect()
            const top = r.top + 0.45 * fs
            const bottom = r.bottom - 0.35 * fs
            return { x: r.right - 0.32 * fs - box.left, y: top + (bottom - top) * 0.55 - box.top, rot: gsap.utils.random(-42, -32) }
          })
          const cursor = { i: 0 }
          const place = gsap.quickSetter(chalk.current, "x", "px")
          const placeY = gsap.quickSetter(chalk.current, "y", "px")
          const placeR = gsap.quickSetter(chalk.current, "rotation", "deg")
          tl.set(chalk.current, { autoAlpha: 1 }, 0)
          tl.to(
            cursor,
            {
              i: chars.length - 1,
              duration: (chars.length - 1) * speed,
              ease: "none",
              onUpdate: () => {
                const p = pos[Math.round(cursor.i)]
                place(p.x)
                placeY(p.y)
                placeR(p.rot)
              },
            },
            0
          )
          tl.to(chalk.current, { autoAlpha: 0, x: "+=16", y: "-=16", duration: 0.4 })
        }
      }
      const stop = whenInView(wrap.current!, play, "0px 0px -22% 0px")
      return () => {
        stop()
        split?.revert()
        el.classList.remove("chalk-pending")
      }
    },
    { scope: wrap }
  )

  return (
    <div ref={wrap} className="relative">
      <Tag className={cn("chalk-text font-hand", className)}>
        {/* Texto visual (se divide en letras al escribirse) + copia para lectores de pantalla */}
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
