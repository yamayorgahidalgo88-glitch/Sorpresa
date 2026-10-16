import type { Metadata } from "next"

import { QuoteMarker } from "@/components/board/quote-marker"
import { PageHero } from "@/components/page-hero"
import { ServiceCard } from "@/components/service-card"
import { quotes, services } from "@/lib/site"

export const metadata: Metadata = {
  title: "Servicios",
  description: "Clases grupales y particulares, intensivo de Selectividad, Cambridge, técnicas de estudio, robótica, informática, educación financiera y Club de Rol en Alcorcón.",
  alternates: { canonical: "/servicios" },
}

const ROT = [-2, 1.5, -1, 2, -1.5, 1]

export default function Servicios() {
  return (
    <>
      <PageHero eyebrow="Servicios" title="Bienvenido a TIPS," hand="tu academia de refuerzo escolar">
        <p>
          Las clases grupales se imparten en nuestra academia de Alcorcón y las particulares a domicilio, en el centro o
          online. Encuentra la formación que mejor se adapte a ti; y si echas algo de menos, cuéntanoslo:{" "}
          <strong className="text-ink">entre todos hacemos TIPS</strong>.
        </p>
      </PageHero>

      <section aria-label="Todos los servicios" className="whiteboard py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <ServiceCard key={s.slug} service={s} rotate={ROT[i % ROT.length]} />
            ))}
          </ul>
          <div className="mt-24">
            <QuoteMarker {...quotes.lewis} />
          </div>
        </div>
      </section>
    </>
  )
}
