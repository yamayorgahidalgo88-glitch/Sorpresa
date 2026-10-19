import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, Phone } from "lucide-react"

import { ChalkQuote } from "@/components/board/chalk-quote"
import { Mark } from "@/components/board/scribble"
import { noteBg, StickyNote } from "@/components/board/sticky-note"
import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { SubjectsOffered } from "@/components/subjects-offered"
import { ServiceCard } from "@/components/service-card"
import { ServiceIcon } from "@/components/service-icon"
import { Button } from "@/components/ui/button"
import { services, site, type Sticky } from "@/lib/site"

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: PageProps<"/servicios/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const s = services.find((x) => x.slug === slug)
  if (!s) return {}
  return { title: s.title, description: s.text, alternates: { canonical: `/servicios/${s.slug}` } }
}

const NOTE_COLORS: Sticky[] = ["yellow", "teal", "rose", "orange", "sky", "mint"]
const ROT = [-2, 1.5, -1, 2, -1.5, 1]

const CALENDAR = [
  {
    title: "Convocatoria ordinaria 2026",
    rows: [
      ["Matrícula EvAU (centros)", "13–19 de mayo, hasta las 14:00"],
      ["Exámenes", "1, 2, 3 y 4 de junio · incidencias, 5 de junio"],
      ["Notas", "11 de junio, 12:00"],
      ["Revisión", "Del 12 al 16 de junio (23:59)"],
    ],
  },
  {
    title: "Convocatoria extraordinaria 2026",
    rows: [
      ["Matrícula EvAU (centros)", "18–24 de junio, hasta las 14:00"],
      ["Exámenes", "30 de junio, 1 y 2 de julio · incidencias, 3 de julio"],
      ["Notas", "9 de julio, 12:00"],
      ["Revisión", "10, 13 y 14 de julio (23:59)"],
    ],
  },
]

export default async function ServicePage({ params }: PageProps<"/servicios/[slug]">) {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) notFound()
  const others = services.filter((s) => s.slug !== service.slug && s.slug !== "software").slice(0, 3)

  return (
    <>
      <PageHero title={service.title} hand={service.slogan} />

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 text-lg leading-relaxed text-slate">
            {service.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {service.note && <p className="font-semibold text-ink">{service.note}</p>}
          </div>
          <StickyNote color={service.color} rotate={2} className="self-start">
            <span className="grid size-14 place-items-center rounded-full border-2 border-ink bg-white/70">
              <ServiceIcon name={service.icon} className="size-7 text-ink" />
            </span>
            <p className="mt-4 font-hand text-3xl leading-tight font-bold text-ink">¿Te apuntas?</p>
            <p className="mt-2 text-ink/80">Cuéntanos qué necesitas y te informamos sin compromiso.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button asChild>
                <Link href={`${site.links.matricula}?servicio=${service.slug}`}>Reservar mi plaza</Link>
              </Button>
              <Button asChild variant="outline">
                <a href={site.phone.href}>
                  <Phone aria-hidden="true" /> {site.phone.display}
                </a>
              </Button>
            </div>
          </StickyNote>
        </div>
      </section>

      {service.features && (
        <section aria-labelledby="claves" className="whiteboard py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 id="claves" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Lo más <Mark kind="underline" color="var(--sky)">importante</Mark>
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {service.features.map((f, i) => (
                <StickyNote as="li" key={f.title} color={NOTE_COLORS[i % NOTE_COLORS.length]} rotate={ROT[i % ROT.length]} className="hover:rotate-0">
                  <Check className="size-6 text-ink" aria-hidden="true" />
                  <h3 className="mt-3 font-hand text-[1.7rem] leading-tight font-bold text-ink">{f.title}</h3>
                  <p className="mt-1 text-ink/80">{f.text}</p>
                </StickyNote>
              ))}
            </ul>
          </div>
        </section>
      )}

      {service.subjects && (
        <section aria-labelledby="asig" className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 id="asig" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {service.subjects.length} asignaturas disponibles
            </h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {service.subjects.map((sub, i) => (
                <li key={sub} className={`rounded-full px-5 py-2 font-hand text-2xl text-ink ${noteBg[NOTE_COLORS[i % NOTE_COLORS.length]]}`}>
                  {sub}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {(service.slug === "clases-grupales" || service.slug === "clases-particulares") && <SubjectsOffered />}

      {service.slug === "intensivo-selectividad" && (
        <section aria-labelledby="calendario" className="whiteboard py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 id="calendario" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Calendario de la Selectividad 2025/2026
            </h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {CALENDAR.map((c, i) => (
                <div key={c.title} className="notebook rounded-[8px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)]" style={{ rotate: `${i ? 1 : -1}deg` }}>
                  <h3 className="font-hand text-3xl font-bold text-marker-red">{c.title}</h3>
                  <dl className="mt-4 space-y-2">
                    {c.rows.map(([k, v]) => (
                      <div key={k} className="grid gap-1 leading-[2rem] sm:grid-cols-[13rem_1fr]">
                        <dt className="font-semibold text-ink">{k}</dt>
                        <dd className="text-slate">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <ChalkQuote quote={service.quote} />
        </div>
      </section>

      <section aria-labelledby="otros" className="whiteboard py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="otros" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">También te puede interesar</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s, i) => (
              <ServiceCard key={s.slug} service={s} rotate={ROT[i]} />
            ))}
          </ul>
        </div>
      </section>

      <CtaStrip query={`servicio=${service.slug}`} />
    </>
  )
}
