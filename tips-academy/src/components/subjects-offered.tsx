import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { noteBg } from "@/components/board/sticky-note"
import { subjects, type Sticky } from "@/lib/site"

const COLORS: Sticky[] = ["yellow", "rose", "teal", "orange", "sky", "mint", "coral"]

/** Asignaturas que se ofrecen en la academia (misma lista que en /asignaturas). */
export function SubjectsOffered({ className = "bg-white" }: { className?: string }) {
  return (
    <section aria-labelledby="asignaturas-ofrecidas" className={`${className} py-14 sm:py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="asignaturas-ofrecidas" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Asignaturas que ofrecemos
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-slate">
          En clases grupales y particulares, en cualquiera de estos niveles. Si no ves la tuya, pregúntanos.
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          {subjects.map((s, i) => (
            <li key={s.name} className={`rounded-full px-5 py-2 font-hand text-2xl text-ink ${noteBg[COLORS[i % COLORS.length]]}`}>
              {s.name}
            </li>
          ))}
        </ul>
        <Link href="/asignaturas" className="mt-8 inline-flex items-center gap-2 font-semibold text-sky-dark underline-offset-4 hover:underline">
          Ver asignaturas por niveles <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
