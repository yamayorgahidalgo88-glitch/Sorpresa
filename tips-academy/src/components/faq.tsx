import { Plus } from "lucide-react"

import { Rich } from "@/components/rich"

export type FaqItem = { q: string; a: string }

/** Preguntas frecuentes desplegables (sin JS: <details>), con el texto siempre en el HTML. */
export function Faq({ items, title = "Preguntas frecuentes", id = "faq", className = "bg-white" }: { items: FaqItem[]; title?: string; id?: string; className?: string }) {
  return (
    <section aria-labelledby={id} className={`${className} py-14 sm:py-16`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <h2 id={id} className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        <FaqList items={items} className="mt-8" />
      </div>
    </section>
  )
}

export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {items.map((f) => (
        <details
          key={f.q}
          className="group rounded-2xl border border-hairline bg-white px-5 shadow-[0_10px_20px_-18px_rgb(12_31_51/0.5)] open:bg-note-yellow/40"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="size-5 shrink-0 text-sky-dark transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="pb-5 leading-relaxed text-slate">
            <Rich text={f.a} />
          </p>
        </details>
      ))}
    </div>
  )
}
