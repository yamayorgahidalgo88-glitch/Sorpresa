import { Mail, MapPin, Phone } from "lucide-react"

import { Handwrite } from "@/components/board/handwrite"
import { ContactForm } from "@/components/contact-form"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { MapEmbed } from "@/components/map-embed"
import { OpenStatus } from "@/components/open-status"
import { site, waHref } from "@/lib/site"

export function Contact({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const H = headingLevel
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-sky-light/60 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-2xl">
          <H id="contacto-title" className="text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            Pide información{" "}
            <Handwrite text="gratis y sin compromiso" className="font-hand text-[1.15em] text-marker-blue" speed={40} />
          </H>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <ul className="space-y-4 rounded-[28px] border border-hairline bg-white p-6 sm:p-8">
              <li className="flex gap-4">
                <MapPin className="mt-1 size-5 shrink-0 text-marker-red" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ink">Dirección</span>
                  <address className="text-slate not-italic">{site.address.full}</address>
                </span>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-1 size-5 shrink-0 text-marker-red" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ink">Teléfono</span>
                  <a href={site.phone.href} className="text-slate underline-offset-4 hover:underline">+34 {site.phone.display}</a>
                </span>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 size-5 shrink-0 text-marker-red" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ink">Email</span>
                  <a href={`mailto:${site.email}`} className="text-slate underline-offset-4 hover:underline">{site.email}</a>
                </span>
              </li>
              <li className="grid grid-cols-2 gap-3 pt-2">
                {site.hours.map((h, i) => (
                  <div key={h.label} className={`rounded-[4px] p-4 ${i ? "bg-note-rose" : "bg-note-yellow"}`}>
                    <p className="font-hand text-2xl font-bold text-ink">{h.label}</p>
                    <p className="text-sm text-ink/80">L–V {h.display}</p>
                  </div>
                ))}
              </li>
              <li>
                <OpenStatus className="text-slate" />
              </li>
              <li>
                <a
                  href={waHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0f7a40] px-5 font-semibold text-white hover:bg-[#0c6835]"
                >
                  <WhatsAppIcon className="size-5" /> Escríbenos por WhatsApp
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              </li>
            </ul>
            <div className="h-72 overflow-hidden rounded-[28px] border border-hairline bg-white">
              <MapEmbed />
            </div>
          </div>

          <div className="notebook rounded-[8px] p-6 pl-14 shadow-[0_30px_50px_-30px_rgb(12_31_51/0.5)] sm:p-10 sm:pl-16">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
