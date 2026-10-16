import Link from "next/link"
import { FolderOpen } from "lucide-react"

import { Handwrite } from "@/components/board/handwrite"
import { Mark } from "@/components/board/scribble"
import { noteBg } from "@/components/board/sticky-note"
import { courses } from "@/lib/site"

export function Resources() {
  return (
    <section id="recursos" aria-labelledby="recursos-title" className="bg-white py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold text-sky-dark">Recursos gratis</p>
          <h2 id="recursos-title" className="mt-3 text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            Más de <Mark kind="circle" color="var(--marker-red)">1000 archivos</Mark> para estudiar
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate">
            Apuntes, ejercicios y exámenes de todos los cursos y material de Selectividad, con los exámenes de los últimos
            10 años. ¿Echas algo de menos? Escríbenos y en un par de días tendrás esos apuntes que tanto buscabas.
          </p>
          <Handwrite as="p" text="Entre todos hacemos TIPS ♥" className="mt-6 font-hand text-3xl text-marker-blue" />
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.slice(0, 6).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/recursos/${c.slug}`}
                className="group relative block rounded-2xl border border-hairline bg-surface p-5 pt-7 transition-all hover:-translate-y-1 hover:border-ink hover:bg-white"
              >
                <span aria-hidden="true" className={`absolute -top-3 left-5 h-6 w-20 rounded-t-lg ${noteBg[c.color]}`} />
                <span className="flex items-center gap-3">
                  <FolderOpen className="size-6 text-ink transition-transform group-hover:-rotate-6" aria-hidden="true" />
                  <span className="font-semibold text-ink">{c.title}</span>
                </span>
                <span className="mt-1 block pl-9 text-sm text-slate">Apuntes · Ejercicios · Exámenes</span>
              </Link>
            </li>
          ))}
          <li className="sm:col-span-2">
            <Link href="/recursos" className="block rounded-2xl bg-navy p-5 text-center font-semibold text-white hover:bg-ink-deep">
              Ver todos los recursos →
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
