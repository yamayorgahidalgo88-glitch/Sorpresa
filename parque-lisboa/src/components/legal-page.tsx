import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { site } from "@/lib/site"

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al inicio
      </Link>
      <h1 className="mt-8 font-display text-5xl font-light text-ink sm:text-6xl">{title}</h1>
      <p className="mt-3 text-sm text-ash">Última actualización: {site.legal.lastUpdated}</p>
      <div
        role="note"
        className="mt-8 rounded-[24px] border border-gold-pale bg-gold-pale/25 p-4 text-sm leading-relaxed text-foreground"
      >
        <strong>Plantilla orientativa.</strong> Los textos entre corchetes deben completarse con los datos reales del
        titular y revisarse por un profesional jurídico antes de publicar la web.
      </div>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  )
}
