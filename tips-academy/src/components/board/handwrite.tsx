"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type Props = {
  text: string
  as?: "h1" | "h2" | "h3" | "p" | "span" | "blockquote"
  className?: string
  /** ms por letra */
  speed?: number
  /** retardo inicial en segundos */
  delay?: number
  /** "load": empieza al cargar (sin esperar a JS); "view": al entrar en pantalla */
  trigger?: "load" | "view"
}

/**
 * Texto que se escribe letra a letra, como a mano (rotulador o tiza).
 * La animación es CSS: el texto real está en el HTML (SEO y lectores de pantalla)
 * y, sin JavaScript, se escribe igualmente al cargar.
 */
export function Handwrite({ text, as = "span", className, speed = 45, delay = 0, trigger = "view" }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || trigger === "load") return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.hw = "play"
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trigger])

  let i = 0
  const words = text.split(" ")
  const children = words.map((word, w) => (
    <span key={w} className="inline-block whitespace-nowrap">
      {Array.from(word).map((ch) => (
        <span key={i} className="hw-char" style={{ "--i": i++ } as React.CSSProperties}>
          {ch}
        </span>
      ))}
      {w < words.length - 1 ? <span className="hw-char" style={{ "--i": i++ } as React.CSSProperties}>&nbsp;</span> : null}
    </span>
  ))

  const Tag = as
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("hw", className)}
      data-hw={trigger === "load" ? "play" : "wait"}
      style={{ "--speed": `${speed}ms`, "--d": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}
