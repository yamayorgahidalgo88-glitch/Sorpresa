import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Bone,
  Brain,
  Check,
  Footprints,
  PersonStanding,
  Speech,
  type LucideIcon,
} from "lucide-react"

import { BlurFade } from "@/components/magicui/blur-fade"
import { SpotlightCard } from "@/components/reactbits/spotlight-card"
import { SectionHeading } from "@/components/section-heading"
import { visibleServices, type ServiceIcon } from "@/lib/site"

const icons: Record<ServiceIcon, LucideIcon> = {
  fisioterapia: Activity,
  rehabilitacion: PersonStanding,
  podologia: Footprints,
  traumatologia: Bone,
  logopedia: Speech,
  psicologia: Brain,
}

export function Services() {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="servicios-title"
          eyebrow="Servicios"
          title="Tratamientos pensados para tu día a día"
          description="Cada tratamiento empieza con una valoración individual. A partir de ahí, el profesional te explica las opciones y decidís juntos el plan."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleServices.map((service, i) => {
            const Icon = icons[service.slug]
            return (
              <BlurFade as="li" key={service.slug} delay={i * 0.08}>
                <SpotlightCard className="flex h-full flex-col rounded-3xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand-deep/5">
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-brand-deep">{service.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{service.summary}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {service.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-foreground/85">
                        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/?servicio=${service.slug}#contacto`}
                    className="mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Pedir cita de {service.title.toLowerCase()}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </SpotlightCard>
              </BlurFade>
            )
          })}
        </ul>

        <BlurFade className="mt-8">
          <p className="text-sm text-muted-foreground">
            ¿No ves lo que buscas? Llámanos y te orientamos sobre el profesional más adecuado para tu caso.
          </p>
        </BlurFade>
      </div>
    </section>
  )
}
