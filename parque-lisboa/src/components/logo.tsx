import { cn } from "@/lib/utils"

/**
 * Marcador del logotipo (cruz con el degradado de la marca + nombre).
 * Sustituir por el archivo oficial del logotipo cuando la clínica lo facilite.
 */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[0.95rem] font-semibold tracking-tight",
            tone === "dark" ? "text-primary" : "text-white"
          )}
        >
          Centro Clínico
        </span>
        <span
          className={cn(
            "mt-1 text-[0.68rem] font-medium uppercase tracking-[0.28em]",
            tone === "dark" ? "text-brand-olive" : "text-brand-lime"
          )}
        >
          Parque Lisboa
        </span>
      </span>
    </span>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ccpl-mark" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2e7d32" />
          <stop offset="1" stopColor="#acff36" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#ccpl-mark)" />
      <path d="M16.5 9h7v7.5H31v7h-7.5V31h-7v-7.5H9v-7h7.5z" fill="#fff" />
    </svg>
  )
}
