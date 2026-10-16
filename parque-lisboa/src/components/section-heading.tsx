import { BlurFade } from "@/components/magicui/blur-fade"
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

export function SectionHeading({ id, eyebrow, title, description, align = "left", tone = "light", className }: Props) {
  return (
    <BlurFade className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.18em]",
          tone === "light" ? "text-primary" : "text-brand-lime"
        )}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          "mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl",
          tone === "light" ? "text-brand-deep" : "text-white"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            tone === "light" ? "text-muted-foreground" : "text-white/75"
          )}
        >
          {description}
        </p>
      )}
    </BlurFade>
  )
}
