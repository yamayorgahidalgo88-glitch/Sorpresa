import Link from "next/link"

import { Mark } from "@/components/board/scribble"
import { QuoteMarker } from "@/components/board/quote-marker"
import { Rich } from "@/components/rich"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { homeServices, quotes } from "@/lib/site"

const ROT = [-2, 1.5, -1, 2, -1.5, 1]

export function Services() {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="whiteboard py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-sky-dark">Servicios</p>
            <h2 id="servicios-title" className="mt-3 text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
              Todo lo que necesitas para <Mark kind="underline" color="var(--sky)">aprobar</Mark>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate">
              <Rich text="Somos una **academia de apoyo** con más de 15 años de experiencia: **clases de apoyo** en grupos reducidos, **clases particulares** a domicilio, en la academia u online, preparación de la **Selectividad**, inglés de Cambridge y talleres para aprender de otra forma." />
            </p>
          </div>
          <Button asChild variant="outline" className="self-start md:self-auto">
            <Link href="/servicios">Ver todos los servicios</Link>
          </Button>
        </div>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((s, i) => (
            <ServiceCard key={s.slug} service={s} rotate={ROT[i % ROT.length]} />
          ))}
        </ul>

        <div className="mt-14">
          <QuoteMarker {...quotes.lewis} decoration="watering" />
        </div>
      </div>
    </section>
  )
}
