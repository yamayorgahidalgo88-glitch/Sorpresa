import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { CtaStrip } from "@/components/cta-strip"
import { Button } from "@/components/ui/button"
import { posts } from "@/lib/site"

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<"/t-blog/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const p = posts.find((x) => x.slug === slug)
  if (!p) return {}
  return { title: p.title, description: p.excerpt, alternates: { canonical: `/t-blog/${p.slug}` }, openGraph: { type: "article" } }
}

export default async function PostPage({ params }: PageProps<"/t-blog/[slug]">) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()
  const other = posts.find((p) => p.slug !== post.slug)

  return (
    <>
      <div className="whiteboard py-10 sm:py-14">
        <article className="notebook mx-auto max-w-3xl rounded-[8px] px-6 py-10 pl-16 shadow-[0_30px_50px_-30px_rgb(12_31_51/0.5)] sm:px-12 sm:pl-20">
          <Link href="/t-blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-dark hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" /> t-Blog
          </Link>
          <time dateTime={post.iso} className="mt-6 block w-fit -rotate-3 rounded-md border-2 border-marker-red px-2 py-0.5 font-hand text-xl text-marker-red">
            {post.date}
          </time>
          <h1 className="mt-5 text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">{post.title}</h1>
          <div className="mt-8 space-y-4 text-[1.05rem] leading-[2rem] text-slate">
            {post.body.map((b, i) =>
              b.h ? (
                <h2 key={i} className="pt-4 text-xl font-bold text-ink">
                  {b.h}
                </h2>
              ) : b.p ? (
                <p key={i}>{b.p}</p>
              ) : (
                <ul key={i} className="list-disc space-y-1 pl-6">
                  {b.list!.map((li) => (
                    <li key={li.t}>
                      {li.b && <strong className="text-ink">{li.b} </strong>}
                      {li.t}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/servicios/intensivo-selectividad">Intensivo de Selectividad</Link>
            </Button>
            {other && (
              <Button asChild variant="outline">
                <Link href={`/t-blog/${other.slug}`}>Leer otra entrada</Link>
              </Button>
            )}
          </div>
        </article>
      </div>
      <CtaStrip text="¡Te esperamos en clase!" />
    </>
  )
}
