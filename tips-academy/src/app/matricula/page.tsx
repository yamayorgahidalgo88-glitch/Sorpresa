import type { Metadata } from "next"
import { Globe, Mail, MapPin, Phone } from "lucide-react"

import { StickyNote } from "@/components/board/sticky-note"
import { MatriculaForm } from "@/components/matricula-form"
import { PageHero } from "@/components/page-hero"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Reservar mi plaza",
  description: "Reserva tu plaza en Tips Academy: clases de apoyo en Alcorcón.",
  alternates: { canonical: "/matricula" },
}

export default function MatriculaPage() {
  return (
    <>
      <PageHero title="Reserva tu plaza" hand="¡en dos minutos!">
        <p>Rellena el formulario y te llamaremos para confirmar el grupo y los horarios que mejor te vengan.</p>
      </PageHero>
      <section className="whiteboard py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="notebook rounded-[8px] p-6 pl-14 shadow-[0_30px_50px_-30px_rgb(12_31_51/0.5)] sm:p-10 sm:pl-16">
            <MatriculaForm />
          </div>
          <div className="space-y-6">
            <StickyNote color="yellow" rotate={2}>
              <h2 className="font-hand text-3xl font-bold text-ink">Datos de Tips Academy</h2>
              <ul className="mt-4 space-y-3 text-ink/85">
                <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0" aria-hidden="true" />{site.address.full}</li>
                <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><a href={site.phone.href} className="underline-offset-4 hover:underline">+34 {site.phone.display}</a></li>
                <li className="flex gap-3"><Mail className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><a href={`mailto:${site.email}`} className="underline-offset-4 hover:underline">{site.email}</a></li>
                <li className="flex gap-3"><Globe className="mt-0.5 size-5 shrink-0" aria-hidden="true" />tipsacademy.es</li>
              </ul>
            </StickyNote>
            <p className="text-xs leading-relaxed text-steel">
              Tratamos tus datos para prestarte el servicio solicitado y facturarlo. Se conservan mientras dure la
              relación y los plazos legales. No se ceden a terceros salvo obligación legal. Puedes ejercer tus derechos
              escribiendo a {site.email} con copia de tu DNI y reclamar ante la AEPD.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
