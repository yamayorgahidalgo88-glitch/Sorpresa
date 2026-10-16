import { Marquee } from "@/components/magicui/marquee"

const ITEMS = [
  "Clases particulares",
  "Clases grupales",
  "Selectividad (EvAU)",
  "Acceso a Grado Superior",
  "Acceso a Grado Medio",
  "Certificaciones Cambridge",
  "Técnicas de estudio",
  "Robótica",
  "Programación",
  "Informática",
  "Mayores de 25",
  "Primaria · ESO · Bachillerato",
]
const COLORS = ["bg-note-yellow", "bg-note-rose", "bg-note-teal", "bg-note-orange", "bg-note-sky", "bg-note-mint"]

/** Magic UI · Marquee: todo lo que ofrece la academia, como etiquetas de colores. */
export function SubjectsMarquee() {
  return (
    <section aria-label="Lo que ofrecemos" className="border-y border-hairline bg-white py-5">
      <Marquee className="[--duration:45s] [--gap:0.75rem]" role="region" aria-label="Servicios de la academia">
        {ITEMS.map((t, i) => (
          <span
            key={t}
            className={`inline-flex h-11 shrink-0 items-center rounded-full px-5 font-hand text-2xl text-ink ${COLORS[i % COLORS.length]}`}
          >
            {t}
          </span>
        ))}
      </Marquee>
    </section>
  )
}
