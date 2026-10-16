import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Handwrite } from "@/components/board/handwrite"
import { posts, site } from "@/lib/site"

export function Blog() {
  return (
    <section id="blog" aria-labelledby="blog-title" className="whiteboard py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="blog-title">
            <span className="block text-sm font-semibold text-sky-dark">Noticias y consejos</span>
            <Handwrite text="t-Blog" className="mt-1 font-hand text-6xl font-bold text-ink" speed={90} />
          </h2>
          <Link href={site.links.blog} className="text-sm font-semibold text-sky-dark underline-offset-4 hover:underline">
            Ver todas las entradas →
          </Link>
        </div>
        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/t-blog/${p.slug}`}
                style={{ rotate: `${i ? 1 : -1}deg` }}
                className="notebook group relative block h-full rounded-[6px] p-7 pl-16 shadow-[0_20px_30px_-22px_rgb(12_31_51/0.5)] transition-transform hover:rotate-0! hover:-translate-y-1"
              >
                <span className="inline-block -rotate-3 rounded-md border-2 border-marker-red px-2 py-0.5 font-hand text-xl text-marker-red">
                  {p.date}
                </span>
                <h3 className="mt-4 text-xl leading-snug font-bold text-ink group-hover:underline">{p.title}</h3>
                <p className="mt-3 leading-[2rem] text-slate">{p.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Leer más <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
