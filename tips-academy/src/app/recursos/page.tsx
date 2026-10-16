import type { Metadata } from "next"
import Link from "next/link"
import { FolderOpen } from "lucide-react"

import { QuoteMarker } from "@/components/board/quote-marker"
import { Mark } from "@/components/board/scribble"
import { noteBg } from "@/components/board/sticky-note"
import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { courses, quotes } from "@/lib/site"

export const metadata: Metadata = {
  title: "Recursos gratis: apuntes, ejercicios y exámenes",
  description: "Más de 1000 archivos gratuitos: apuntes, ejercicios y exámenes de ESO, Bachillerato, Selectividad (EvAU), acceso a Grado y mayores de 25.",
  alternates: { canonical: "/recursos" },
}

export default function RecursosPage() {
  return (
    <>
      <PageHero title="Nuestro rincón del saber:" hand="¡todo gratis!">
        <p>
          Exámenes, apuntes y ejercicios de todos los cursos. Ya estudies en el colegio, en el instituto o prepares un
          examen oficial, este es tu sitio. <strong className="text-ink">¡Adéntrate y descúbrelo!</strong>
        </p>
      </PageHero>

      <section aria-labelledby="cursos" className="whiteboard py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="cursos" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Elige tu <Mark kind="underline" color="var(--sky)">curso</Mark>
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {courses.map((c, i) => (
              <li key={c.slug}>
                <Link
                  href={`/recursos/${c.slug}`}
                  style={{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }}
                  className={`group relative flex h-full flex-col rounded-[6px] p-5 pt-8 shadow-[0_14px_24px_-16px_rgb(12_31_51/0.45)] transition-transform hover:-translate-y-1 hover:rotate-0! ${noteBg[c.color]}`}
                >
                  <span aria-hidden="true" className="absolute -top-3 left-4 h-6 w-16 rounded-t-lg bg-white/70" />
                  <FolderOpen className="size-7 text-ink transition-transform group-hover:-rotate-6" aria-hidden="true" />
                  <span className="mt-3 font-hand text-[1.8rem] leading-tight font-bold text-ink">{c.title}</span>
                  <span className="mt-auto pt-3 text-sm text-ink/70">Apuntes · Ejercicios · Exámenes</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-2">
          <div className="notebook rounded-[8px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)]">
            <h2 className="font-hand text-4xl font-bold text-ink">Todo es gratis</h2>
            <p className="mt-3 leading-[2rem] text-slate">
              Queremos ponerte más fácil pasar al siguiente curso o superar ese examen que tanto te preocupa. Y puedes
              compartir este material, ¡o incluso el tuyo!, para que todos tengamos acceso a lo necesario para aprender.
            </p>
          </div>
          <div className="notebook rounded-[8px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)]">
            <h2 className="font-hand text-4xl font-bold text-ink">¿Echas algo de menos?</h2>
            <p className="mt-3 leading-[2rem] text-slate">
              Escríbenos y en un par de días tendrás esos apuntes o ejercicios que tanto buscabas. Si te gusta el
              material, síguenos en redes: ¡nos ayudas muchísimo! <strong className="text-ink">Entre todos hacemos TIPS.</strong>
            </p>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-8">
          <QuoteMarker {...quotes.emerson} />
        </div>
      </section>

      <CtaStrip text="¿Y si te damos clase?" />
    </>
  )
}
