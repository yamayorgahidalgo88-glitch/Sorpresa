import { Clock, Phone } from "lucide-react"

import { ContactForm } from "@/components/contact-form"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { BlurFade } from "@/components/magicui/blur-fade"
import { SectionHeading } from "@/components/section-heading"
import { site, whatsappHref } from "@/lib/site"

export function Contact() {
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-brand-mint/60 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <SectionHeading
            id="contacto-title"
            eyebrow="Pide cita"
            title="Te ayudamos a encontrar tu hueco"
            description="Déjanos tus datos y te llamaremos para confirmar día y hora. Si lo prefieres, llámanos o escríbenos directamente."
          />
          <BlurFade delay={0.1} className="mt-8 grid gap-3">
            <a
              href={site.phone.href}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-primary/40"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-white">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Llámanos</span>
                <span className="text-lg font-semibold text-brand-deep">{site.phone.display}</span>
              </span>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-primary/40"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-[#1fa855] text-white">
                <WhatsAppIcon className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Escríbenos</span>
                <span className="text-lg font-semibold text-brand-deep">WhatsApp</span>
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </span>
            </a>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              {site.hours.summary}
            </p>
          </BlurFade>
        </div>

        <BlurFade delay={0.05} className="relative rounded-[2rem] border bg-white p-6 shadow-xl shadow-brand-deep/5 sm:p-9">
          <ContactForm />
        </BlurFade>
      </div>
    </section>
  )
}
