"use client"

// React Bits · Spotlight Card (https://reactbits.dev/components/spotlight-card)
// Versión ligera: actualiza variables CSS en lugar de estado de React.

import { useRef } from "react"

import { cn } from "@/lib/utils"

type SpotlightCardProps = React.ComponentPropsWithoutRef<"div"> & {
  spotlightColor?: string
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgb(172 255 54 / 0.28)",
  ...props
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el || e.pointerType !== "mouse") return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      style={{ "--spotlight": spotlightColor } as React.CSSProperties}
      className={cn(
        "group/spot relative isolate overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-500",
        "before:bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),var(--spotlight),transparent_70%)]",
        "hover:before:opacity-100 focus-within:before:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
