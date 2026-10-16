// Magic UI · Marquee (https://magicui.design/docs/components/marquee)
// Pausa al pasar el ratón o al enfocar, y se detiene con prefers-reduced-motion.

import { cn } from "@/lib/utils"

type MarqueeProps = React.ComponentPropsWithoutRef<"div"> & {
  reverse?: boolean
  pauseOnHover?: boolean
  paused?: boolean
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  paused = false,
  repeat = 4,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex gap-(--gap) overflow-hidden p-2 [--duration:60s] [--gap:1rem] motion-reduce:overflow-x-auto motion-reduce:px-4",
        className
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn(
            "flex shrink-0 animate-marquee justify-around gap-(--gap) motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            "group-focus-within:[animation-play-state:paused]",
            paused && "[animation-play-state:paused]",
            i > 0 && "motion-reduce:hidden"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
