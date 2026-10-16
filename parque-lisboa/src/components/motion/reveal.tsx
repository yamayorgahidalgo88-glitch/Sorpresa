"use client"

import { useRef } from "react"
import { m, useInView, useReducedMotion } from "motion/react"

/** Aparición suave al entrar en pantalla (Motion). Sin efecto con movimiento reducido. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  as?: "div" | "li"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" })
  const reduce = useReducedMotion()

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const Component = m[as]
  return (
    <Component
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  )
}
