"use client"

import { useEffect, useRef, useState } from "react"

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

type Phase = "idle" | "play" | "done"

/**
 * Texto que se escribe letra a letra, como a mano (rotulador).
 *
 * Rendimiento: el texto es texto normal siempre (SEO y lectores de pantalla). Solo mientras
 * se está escribiendo se divide en letras con animación CSS; al terminar vuelve a ser un
 * único nodo de texto, así no quedan cientos de elementos animados al hacer scroll.
 */
export function Handwrite({ text, as = "span", className, speed = 45, delay = 0, trigger = "view" }: Props) {
  const ref = useRef<HTMLElement>(null)
  // "load" se pinta ya con las letras (sin parpadeo); "view" empieza como texto normal.
  const [phase, setPhase] = useState<Phase>(trigger === "load" ? "play" : "idle")

  useEffect(() => {
    // Con «movimiento reducido» el CSS (globals.css) muestra las letras sin animar.
    if (trigger !== "view") return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase((p) => (p === "idle" ? "play" : p))
          io.disconnect()
        }
      },
      { rootMargin: "0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trigger])

  // Al terminar de escribir, se vuelve a texto normal.
  useEffect(() => {
    if (phase !== "play") return
    const total = delay * 1000 + Array.from(text).length * speed + 400
    const id = window.setTimeout(() => setPhase("done"), total)
    return () => window.clearTimeout(id)
  }, [phase, text, speed, delay])

  const Tag = as
  let content: React.ReactNode = text

  if (phase === "play") {
    const words = text.split(" ")
    let turn = 0
    content = words.map((word, w) => {
      const start = turn
      turn += Array.from(word).length + 1 // las letras y el espacio consumen un «turno»
      return (
        <span key={w}>
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, k) => (
              <span key={k} className="hw-char" style={{ "--i": start + k } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? " " : null}
        </span>
      )
    })
  }

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("hw", className)}
      style={{ "--speed": `${speed}ms`, "--d": `${delay}s` } as React.CSSProperties}
    >
      {content}
    </Tag>
  )
}
