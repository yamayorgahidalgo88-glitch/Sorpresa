import { Phone } from "lucide-react"

import { ContactForm } from "@/components/contact-form"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"
import { site, whatsappHref } from "@/lib/site"

/** Banda dorada pálida (Oura · rampa gold) con la tarjeta del formulario. */
export function Contact() {
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-[#efe3c8] py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeading
            id="contacto-title"
            eyebrow="Pide cita"
            title={
              <>
                Te ayudamos a <em>encontrar tu hueco</em>
              </>
            }
            description="Déjanos tus datos y te llamaremos para confirmar día y hora. Si lo prefieres, llámanos o escríbenos directamente."
          />
          <Reveal delay={0.1} className="mt-10 border-t border-ink/15">
            <a href={site.phone.href} className="group flex items-center justify-between border-b border-ink/15 py-5">
              <span>
                <span className="eyebrow block text-stone">Llámanos</span>
                <span className="mt-1 block font-display text-3xl font-light text-ink">{site.phone.display}</span>
              </span>
              <span className="grid size-12 place-items-center rounded-full border border-stone transition-colors group-hover:bg-stone group-hover:text-white">
                <Phone className="size-5" aria-hidden="true" />
              </span>
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between border-b border-ink/15 py-5">
              <span>
                <span className="eyebrow block text-stone">Escríbenos</span>
                <span className="mt-1 block font-display text-3xl font-light text-ink">WhatsApp</span>
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </span>
              <span className="grid size-12 place-items-center rounded-full border border-stone transition-colors group-hover:bg-stone group-hover:text-white">
                <WhatsAppIcon className="size-5" />
              </span>
            </a>
            <p className="mt-5 text-sm text-stone">{site.hours.summary}</p>
          </Reveal>
        </div>

        <Reveal delay={0.05} className="rounded-[24px] bg-canvas p-6 shadow-[0_30px_60px_-40px_rgb(57_34_30/0.45)] sm:p-10">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
