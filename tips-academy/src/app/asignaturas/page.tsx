import type { Metadata } from "next"

import { noteBg } from "@/components/board/sticky-note"
import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { subjects, type Sticky } from "@/lib/site"

export const metadata: Metadata = {
  title: "Asignaturas",
  description: "18 asignaturas disponibles en Tips Academy: Primaria, ESO, Bachillerato, Selectividad, idiomas e informática.",
  alternates: { canonical: "/asignaturas" },
}

const COLORS: Sticky[] = ["yellow", "rose", "teal", "orange", "sky", "mint", "coral"]

export default function AsignaturasPage() {
  return (
    <>
      <PageHero title={`${subjects.length} asignaturas`} hand="¡y todos los niveles!">
        <p>Primaria, ESO, Bachillerato, Selectividad, acceso a módulos, mayores de 25 e idiomas. Si no ves la tuya, pregúntanos.</p>
      </PageHero>
      <section className="whiteboard py-14 sm:py-16">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
          {subjects.map((s, i) => (
            <li
              key={s.name}
              style={{ rotate: `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg` }}
              className={`rounded-[4px] p-4 shadow-[0_12px_20px_-14px_rgb(12_31_51/0.45)] transition-transform hover:rotate-0! hover:-translate-y-1 ${noteBg[COLORS[i % COLORS.length]]}`}
            >
              <p className="font-hand text-[1.6rem] leading-tight font-bold text-ink">{s.name}</p>
              <p className="mt-1 text-xs text-ink/70">{s.levels}</p>
            </li>
          ))}
        </ul>
      </section>
      <CtaStrip text="¿Con cuál empezamos?" />
    </>
  )
}
