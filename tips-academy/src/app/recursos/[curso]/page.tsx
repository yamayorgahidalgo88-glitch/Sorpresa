import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Download, FileText, NotebookPen, PenLine } from "lucide-react"

import { StickyNote } from "@/components/board/sticky-note"
import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { courses } from "@/lib/site"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return courses.map((c) => ({ curso: c.slug }))
}

export async function generateMetadata({ params }: PageProps<"/recursos/[curso]">): Promise<Metadata> {
  const { curso } = await params
  const c = courses.find((x) => x.slug === curso)
  if (!c) return {}
  return {
    title: `Recursos ${c.title}: apuntes, ejercicios y exámenes`,
    description: `Apuntes, ejercicios y exámenes gratis de ${c.title}.`,
    alternates: { canonical: `/recursos/${c.slug}` },
  }
}

const KINDS = [
  { key: "Apuntes", icon: NotebookPen, color: "yellow" as const, rot: -1.5 },
  { key: "Ejercicios", icon: PenLine, color: "teal" as const, rot: 1 },
  { key: "Exámenes", icon: FileText, color: "rose" as const, rot: -1 },
]

export default async function CursoPage({ params }: PageProps<"/recursos/[curso]">) {
  const { curso } = await params
  const course = courses.find((c) => c.slug === curso)
  if (!course) notFound()

  return (
    <>
      <PageHero title={course.title} hand="apuntes, ejercicios y exámenes">
        <p>Todo el material es gratuito. Elige la asignatura y descárgalo.</p>
      </PageHero>

      <section className="whiteboard py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 lg:grid-cols-3">
          {KINDS.map(({ key, icon: Icon, color, rot }) => (
            <StickyNote key={key} color={color} rotate={rot} className="hover:rotate-0">
              <h2 className="flex items-center gap-3 font-hand text-4xl font-bold text-ink">
                <Icon className="size-7" aria-hidden="true" /> {key}
              </h2>
              <ul className="mt-5 divide-y divide-ink/10">
                {course.subjects.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="font-medium text-ink">{s}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate" title="Archivos pendientes de conectar">
                      <Download className="size-3.5" aria-hidden="true" /> PDF
                    </span>
                  </li>
                ))}
              </ul>
            </StickyNote>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-7xl px-4 text-xs text-steel sm:px-8">
          Vista de diseño: los archivos se conectarán desde el gestor de contenidos de la academia.
        </p>
      </section>

      <section aria-labelledby="otros-cursos" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 id="otros-cursos" className="text-2xl font-bold text-ink">Otros cursos</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {courses.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/recursos/${c.slug}`}
                  aria-current={c.slug === course.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                    c.slug === course.slug ? "border-navy bg-navy text-white" : "border-hairline bg-white text-ink hover:border-ink"
                  )}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaStrip text="¿Te ayudamos con esto?" query={`curso=${course.slug}`} />
    </>
  )
}
