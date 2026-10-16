import { ArrowUpRight, Mail, Phone } from "lucide-react"

import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { MapEmbed } from "@/components/map-embed"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"
import { emailParts, fullAddress, mapsLinkHref, site, whatsappHref } from "@/lib/site"

export function Location() {
  return (
    <section id="ubicacion" aria-labelledby="ubicacion-title" className="bg-canvas py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHeading
          id="ubicacion-title"
          eyebrow="Ubicación y horario"
          title={
            <>
              En el barrio de Parque Lisboa, <em>Alcorcón</em>
            </>
          }
          description="Nos encontrarás en la parte posterior del número 10 de la calle Porto Colón."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Reveal>
            <dl className="border-t border-hairline">
              <Row term="Dirección">
                <address className="not-italic">{fullAddress}</address>
                <a
                  href={mapsLinkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-ink underline-offset-4 hover:underline"
                >
                  Cómo llegar
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
              </Row>
              <Row term="Horario">
                <p>Lunes a viernes</p>
                <p className="text-ink">9:30–14:00 · 15:00–20:00</p>
                <p className="mt-1 text-ash">Sábados, domingos y festivos: cerrado</p>
              </Row>
              <Row term="Contacto">
                <ul className="space-y-2">
                  <li>
                    <a href={site.phone.href} className="inline-flex items-center gap-2 font-semibold text-ink underline-offset-4 hover:underline">
                      <Phone className="size-4" aria-hidden="true" />
                      {site.phone.display}
                    </a>
                  </li>
                  <li>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                      <WhatsAppIcon className="size-4 text-[#1fa855]" />
                      WhatsApp
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${site.email}`} className="inline-flex items-start gap-2 underline-offset-4 hover:underline">
                      <Mail className="mt-1 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        {emailParts[0]}@<wbr />
                        {emailParts[1]}
                      </span>
                    </a>
                  </li>
                </ul>
              </Row>
            </dl>
          </Reveal>

          <Reveal delay={0.1} className="min-h-[24rem] overflow-hidden rounded-[40px] border border-hairline bg-surface lg:min-h-full">
            <MapEmbed />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-hairline py-6 sm:grid-cols-[9rem_1fr]">
      <dt className="eyebrow pt-1 text-ink">{term}</dt>
      <dd className="leading-relaxed text-stone">{children}</dd>
    </div>
  )
}
