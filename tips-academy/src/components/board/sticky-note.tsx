import { cn } from "@/lib/utils"
import type { Sticky } from "@/lib/site"

export const noteBg: Record<Sticky, string> = {
  yellow: "bg-note-yellow",
  rose: "bg-note-rose",
  teal: "bg-note-teal",
  orange: "bg-note-orange",
  sky: "bg-note-sky",
  mint: "bg-note-mint",
  coral: "bg-note-coral",
}

/** Nota adhesiva con cinta (Miro · tarjetas pastel). */
export function StickyNote({
  color = "yellow",
  rotate = 0,
  tape = true,
  className,
  children,
  as: Tag = "div",
}: {
  color?: Sticky
  rotate?: number
  tape?: boolean
  className?: string
  children: React.ReactNode
  as?: "div" | "li" | "article" | "figure"
}) {
  return (
    <Tag
      style={{ "--r": `${rotate}deg` } as React.CSSProperties}
      className={cn(
        "relative rotate-(--r) rounded-[4px] p-6 shadow-[0_1px_1px_rgb(0_0_0/0.08),0_12px_24px_-12px_rgb(12_31_51/0.35)] transition-transform duration-300 ease-out",
        noteBg[color],
        className
      )}
    >
      {tape && (
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg] bg-white/55 shadow-[0_1px_2px_rgb(0_0_0/0.12)] backdrop-blur-[1px]"
        />
      )}
      {children}
    </Tag>
  )
}
