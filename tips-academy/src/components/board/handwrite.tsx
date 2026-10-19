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

type Phase = "wait" | "play" | "done"

/**
 * Texto que se escribe letra a letra, como a mano (rotulador).
 *
 * Rendimiento: las letras vienen ya divididas desde el servidor y su animación CSS está en pausa
 * («hw-wait») hasta que el texto entra en pantalla. Así, al empezar a escribir solo se cambia una
 * clase (no se crean de golpe decenas de elementos, que es lo que provocaba tirones en textos largos).
 * Al terminar, «hw-done» quita animaciones y recortes para que no quede nada animado.
 */
export function Handwrite({ text, as = "span", className, speed = 45, delay = 0, trigger = "view" }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>(trigger === "load" ? "play" : "wait")

  useEffect(() => {
    // Con «movimiento reducido» el CSS (globals.css) muestra las letras sin animar.
    if (trigger !== "view") return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase((p) => (p === "wait" ? "play" : p))
          io.disconnect()
        }
      },
      { rootMargin: "0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trigger])

  // Al terminar de escribir, se quitan las animaciones.
  useEffect(() => {
    if (phase !== "play") return
    const total = delay * 1000 + Array.from(text).length * speed + 400
    const id = window.setTimeout(() => setPhase("done"), total)
    return () => window.clearTimeout(id)
  }, [phase, text, speed, delay])

  const Tag = as
  const words = text.split(" ")
  // Turno en que empieza cada palabra: sus letras y el espacio consumen un «turno» cada uno.
  const starts = words.map((_, w) => words.slice(0, w).reduce((n, x) => n + Array.from(x).length + 1, 0))
  const content = words.map((word, w) => {
    const start = starts[w]
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

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("hw", phase === "wait" && "hw-wait", phase === "done" && "hw-done", className)}
      style={{ "--speed": `${speed}ms`, "--d": `${delay}s` } as React.CSSProperties}
    >
      {content}
    </Tag>
  )
}
