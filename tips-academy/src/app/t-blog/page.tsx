import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CtaStrip } from "@/components/cta-strip"
import { PageHero } from "@/components/page-hero"
import { posts } from "@/lib/site"

export const metadata: Metadata = {
  title: "t-Blog",
  description: "Noticias y consejos de Tips Academy sobre Selectividad, estudio y educación.",
  alternates: { canonical: "/t-blog" },
}

export default function BlogPage() {
  return (
    <>
      <PageHero title="t-Blog:" hand="noticias y consejos">
        <p>
          Os ponemos al día de todo lo que tiene que ver con la educación: cambios en la Selectividad, técnicas de
          estudio, recursos y novedades de la academia.
        </p>
      </PageHero>
      <section className="whiteboard py-14 sm:py-16">
        <ul className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 md:grid-cols-2">
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/t-blog/${p.slug}`}
                style={{ rotate: `${i % 2 ? 1 : -1}deg` }}
                className="notebook group relative block h-full rounded-[6px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)] transition-transform hover:rotate-0! hover:-translate-y-1"
              >
                <time dateTime={p.iso} className="inline-block -rotate-3 rounded-md border-2 border-marker-red px-2 py-0.5 font-hand text-xl text-marker-red">
                  {p.date}
                </time>
                <h2 className="mt-4 text-2xl leading-snug font-bold text-ink group-hover:underline">{p.title}</h2>
                <p className="mt-3 leading-[2rem] text-slate">{p.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Leer más <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaStrip text="¿Te preparamos la PAU?" />
    </>
  )
}
