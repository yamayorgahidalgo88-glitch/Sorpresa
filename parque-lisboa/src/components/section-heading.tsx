import { Reveal } from "@/components/motion/reveal"
import { cn } from "@/lib/utils"

type Props = {
  id: string
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  tone?: "light" | "dark"
  className?: string
}

/** Overline discreto + titular en serif fina (Oura · eyebrow-label + heading-2). */
export function SectionHeading({ id, eyebrow, title, description, align = "left", tone = "light", className }: Props) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className={cn("eyebrow", tone === "light" ? "text-ink" : "text-white/70")}>{eyebrow}</p>
      <h2
        id={id}
        className={cn(
          "mt-5 font-display text-[2.6rem] leading-[1.08] font-light tracking-[-0.01em] text-balance sm:text-5xl lg:text-[3.6rem]",
          tone === "light" ? "text-ink" : "text-white"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 max-w-2xl text-lg leading-relaxed text-pretty",
            align === "center" && "mx-auto",
            tone === "light" ? "text-stone" : "text-white/75"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  )
}
