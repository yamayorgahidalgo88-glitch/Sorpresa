import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react"

import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { BlurFade } from "@/components/magicui/blur-fade"
import { MapEmbed } from "@/components/map-embed"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { emailParts, fullAddress, mapsLinkHref, site, whatsappHref } from "@/lib/site"

export function Location() {
  return (
    <section id="ubicacion" aria-labelledby="ubicacion-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="ubicacion-title"
          eyebrow="Ubicación y horario"
          title="En el barrio de Parque Lisboa, Alcorcón"
          description="Nos encontrarás en la parte posterior del número 10 de la calle Porto Colón."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <BlurFade className="flex flex-col gap-4">
            <InfoCard icon={MapPin} title="Dirección">
              <address className="not-italic">{fullAddress}</address>
              <a
                href={mapsLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                <Navigation className="size-4" aria-hidden="true" />
                Cómo llegar
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </InfoCard>

            <InfoCard icon={Clock} title="Horario">
              <dl className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[auto_1fr] sm:gap-y-1">
                <dt className="font-medium text-foreground">Lunes a viernes</dt>
                <dd className="mb-2 sm:mb-0">9:30–14:00 · 15:00–20:00</dd>
                <dt className="font-medium text-foreground">Sábados y domingos</dt>
                <dd>Cerrado</dd>
              </dl>
            </InfoCard>

            <InfoCard icon={Phone} title="Contacto">
              <ul className="space-y-1">
                <li>
                  <a href={site.phone.href} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {site.phone.display}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} className="inline-flex items-start gap-1.5 underline-offset-4 hover:underline">
                    <Mail className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {emailParts[0]}@<wbr />
                      {emailParts[1]}
                    </span>
                  </a>
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="pill">
                  <a href={site.phone.href}>
                    <Phone aria-hidden="true" />
                    Llamar
                  </a>
                </Button>
                <Button asChild size="pill" variant="outline">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-4 text-[#1fa855]" />
                    WhatsApp
                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </a>
                </Button>
              </div>
            </InfoCard>
          </BlurFade>

          <BlurFade delay={0.1} className="min-h-[22rem] overflow-hidden rounded-3xl border bg-card lg:min-h-full">
            <MapEmbed />
          </BlurFade>
        </div>
      </div>
    </section>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 rounded-3xl border bg-card p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-muted-foreground">
        <h3 className="mb-1.5 text-base font-semibold text-brand-deep">{title}</h3>
        {children}
      </div>
    </div>
  )
}
