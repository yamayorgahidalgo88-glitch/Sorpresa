"use client"

import { useState } from "react"
import { ExternalLink, Pause, Play } from "lucide-react"

import { Marquee } from "@/components/magicui/marquee"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { mapsLinkHref, reviews, type Review } from "@/lib/site"

/** Banda oscura (Oura · ink world) con tarjetas crema flotando como recortes. */
export function Reviews() {
  const [paused, setPaused] = useState(false)
  const half = Math.ceil(reviews.length / 2)

  return (
    <section id="opiniones" aria-labelledby="opiniones-title" className="overflow-hidden bg-ink-band py-28 sm:py-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="opiniones-title"
          tone="dark"
          eyebrow="Opiniones"
          title={
            <>
              Lo que cuentan <em>nuestros pacientes</em>
            </>
          }
          description="Aquí se mostrarán reseñas reales de pacientes, publicadas con su permiso."
        />
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outlineLight"
            size="icon"
            className="motion-reduce:hidden"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Reanudar el desplazamiento de opiniones" : "Pausar el desplazamiento de opiniones"}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </Button>
          <Button asChild variant="onDark">
            <a href={mapsLinkHref} target="_blank" rel="noopener noreferrer">
              Ver reseñas en Google
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </Button>
        </div>
      </div>

      <div className="relative mt-16 space-y-5">
        <Marquee paused={paused} className="[--duration:80s] [--gap:1.25rem]" role="region" aria-label="Opiniones de pacientes, fila 1">
          {reviews.slice(0, half).map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Marquee>
        <Marquee reverse paused={paused} className="[--duration:90s] [--gap:1.25rem]" role="region" aria-label="Opiniones de pacientes, fila 2">
          {reviews.slice(half).map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Marquee>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink-band sm:w-40" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-band sm:w-40" />
      </div>

      <p className="mx-auto mt-10 max-w-7xl px-4 text-xs text-white/55 sm:px-8">
        Contenido de ejemplo: sustituir por opiniones reales y verificables antes de publicar.
      </p>
    </section>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    // Oura · news-card
    <figure className="flex w-[19rem] shrink-0 flex-col rounded-[24px] bg-canvas p-7 shadow-[0_20px_50px_-30px_rgb(0_0_0/0.8)] sm:w-[24rem]">
      <span aria-hidden="true" className="font-display text-6xl leading-none text-gold">
        “
      </span>
      <blockquote className="-mt-3 font-display text-xl leading-snug font-light text-ink">{review.text}</blockquote>
      <figcaption className="mt-auto pt-6 text-sm">
        <span className="block font-semibold text-ink">{review.author}</span>
        <span className="text-ash">{review.service}</span>
      </figcaption>
    </figure>
  )
}
