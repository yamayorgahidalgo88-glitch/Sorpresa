import { cn } from "@/lib/utils"

/** Recreación del logotipo (nube azul con la «t»). Sustituir por el archivo oficial si se prefiere. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoCloud className="h-9 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[1.45rem] font-extrabold tracking-tight", tone === "dark" ? "text-ink" : "text-white")}>tips</span>
        <span className={cn("-mt-0.5 text-[0.72rem] font-semibold", tone === "dark" ? "text-slate" : "text-white/70")}>Academy</span>
      </span>
    </span>
  )
}

export function LogoCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 42" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tips-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cc0f0" />
          <stop offset="1" stopColor="#1f8fcf" />
        </linearGradient>
      </defs>
      <path
        d="M15 39C7.8 39 3 34.6 3 28.7c0-5.4 4-9.6 9.4-10.1C13.6 10.4 20.3 4 28.6 4c6.9 0 12.7 4.3 14.9 10.4 1-.3 2.2-.4 3.3-.4C53.6 14 59 19.6 59 26.5S53.6 39 46.8 39H15Z"
        fill="url(#tips-cloud)"
        stroke="#0c1f33"
        strokeWidth="3"
      />
      <path d="M12 21c2-6 7-10 13-11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
      <path
        d="M27.5 13.5h5.6v5.2h5.2v4.8h-5.2v6.2c0 1.6.8 2.3 2.2 2.3.9 0 1.8-.2 2.8-.6v4.6c-1.3.6-2.9.9-4.6.9-4.2 0-6-2.2-6-6.3v-7.1h-3.4v-4.8h3.4v-5.2Z"
        fill="#fff"
      />
    </svg>
  )
}
