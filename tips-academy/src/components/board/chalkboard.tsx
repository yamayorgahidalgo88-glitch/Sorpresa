import { cn } from "@/lib/utils"

/** Pizarra de tiza con marco de madera, borrador y tizas en la repisa. */
export function Chalkboard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-[22px] bg-wood p-3 shadow-[0_30px_60px_-30px_rgb(12_31_51/0.6)] sm:p-4", className)}>
      <div className="absolute inset-0 rounded-[22px] bg-[repeating-linear-gradient(95deg,rgb(0_0_0/0.06)_0_2px,transparent_2px_9px)]" aria-hidden="true" />
      <div className="chalkboard relative overflow-hidden rounded-[12px] px-6 py-10 sm:px-12 sm:py-14">{children}</div>
      {/* Repisa con tizas y borrador */}
      <div aria-hidden="true" className="absolute -bottom-3 left-1/2 flex h-4 w-[70%] -translate-x-1/2 items-end justify-center gap-3 rounded-b-md bg-[#8a5a30] shadow-md">
        <span className="mb-3 h-2 w-10 rounded-sm bg-white/95" />
        <span className="mb-3 h-2 w-7 rotate-6 rounded-sm bg-note-yellow" />
        <span className="mb-3 h-5 w-16 rounded-md bg-[#2b2b2b] shadow-[inset_0_-6px_0_#d8d2c4]" />
      </div>
    </div>
  )
}
