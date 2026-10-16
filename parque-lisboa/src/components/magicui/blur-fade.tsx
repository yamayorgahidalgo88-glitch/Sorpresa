"use client"

// Magic UI · Blur Fade (https://magicui.design/docs/components/blur-fade)
// Adaptado a LazyMotion (`m`) y a prefers-reduced-motion.

import { useRef } from "react"
import { m, useInView, useReducedMotion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"

type BlurFadeProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  offset?: number
  blur?: string
  as?: "div" | "li" | "article"
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.5,
  offset = 16,
  blur = "6px",
  as = "div",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" })
  const reduce = useReducedMotion()

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const variants: Variants = {
    hidden: { opacity: 0, y: offset, filter: `blur(${blur})` },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  }
  const Component = m[as]

  return (
    <Component
      ref={ref as never}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(className)}
    >
      {children}
    </Component>
  )
}
