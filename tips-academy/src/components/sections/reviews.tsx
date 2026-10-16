"use client"

import { useState } from "react"
import { ExternalLink, Pause, Play, Star } from "lucide-react"

import { noteBg } from "@/components/board/sticky-note"
import { Marquee } from "@/components/magicui/marquee"
import { Button } from "@/components/ui/button"
import { reviews, site, type Sticky } from "@/lib/site"

const COLORS: Sticky[] = ["yellow", "rose", "teal", "orange", "sky", "mint"]

export function Reviews() {
  const [paused, setPaused] = useState(false)
  const half = Math.ceil(reviews.items.length / 2)
  const rows = [reviews.items.slice(0, half), reviews.items.slice(half)]

  return (
    <section id="opiniones" aria-labelledby="opiniones-title" className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sky-dark">Opiniones en Google</p>
          <h2 id="opiniones-title" className="mt-3 text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            Lo dicen nuestros alumnos y familias
          </h2>
          <p className="mt-5 flex items-center gap-3 text-lg text-slate">
            <span className="font-hand text-5xl font-bold text-ink">{reviews.rating}</span>
            <span className="flex text-[#f5a524]" aria-label="5 de 5 estrellas">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="size-6 fill-current" aria-hidden="true" />
              ))}
            </span>
            <span>{reviews.count} reseñas</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="icon"
            className="motion-reduce:hidden"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Reanudar opiniones" : "Pausar opiniones"}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </Button>
          <Button asChild variant="outline">
            <a href={site.links.googleReviews} target="_blank" rel="noopener noreferrer">
              Escribe una reseña
              <ExternalLink aria-hidden="true" />
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </Button>
        </div>
      </div>

      <div className="relative mt-14 space-y-6">
        {rows.map((row, r) => (
          <Marquee
            key={r}
            reverse={r === 1}
            paused={paused}
            className="py-4 [--duration:70s] [--gap:1.5rem]"
            role="region"
            aria-label={`Opiniones, fila ${r + 1}`}
          >
            {row.map((rev, i) => (
              <figure
                key={rev.author}
                style={{ rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
                className={`flex w-[18rem] shrink-0 flex-col rounded-[4px] p-6 shadow-[0_12px_24px_-14px_rgb(12_31_51/0.4)] sm:w-[22rem] ${noteBg[COLORS[(i + r * 3) % COLORS.length]]}`}
              >
                <blockquote className="font-hand text-2xl leading-snug text-ink">«{rev.text}»</blockquote>
                <figcaption className="mt-auto pt-4 text-sm">
                  <span className="font-semibold text-ink">{rev.author}</span>
                  <span className="text-slate"> · {rev.when}</span>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-4 text-xs text-steel sm:px-8">
        Extractos de reseñas públicas de Google. Valoración y número de reseñas a fecha de esta versión.
      </p>
    </section>
  )
}
