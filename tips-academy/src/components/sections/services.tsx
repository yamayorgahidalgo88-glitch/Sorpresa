import Link from "next/link"

import { Mark } from "@/components/board/scribble"
import { QuoteMarker } from "@/components/board/quote-marker"
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
