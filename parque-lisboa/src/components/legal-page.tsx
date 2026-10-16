import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { site } from "@/lib/site"

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al inicio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-brand-deep sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Última actualización: {site.legal.lastUpdated}</p>
      <div
        role="note"
        className="mt-8 rounded-2xl border border-brand-sun/60 bg-brand-sun/15 p-4 text-sm leading-relaxed text-foreground"
      >
        <strong>Plantilla orientativa.</strong> Los textos entre corchetes deben completarse con los datos reales del
        titular y revisarse por un profesional jurídico antes de publicar la web.
      </div>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  )
}
