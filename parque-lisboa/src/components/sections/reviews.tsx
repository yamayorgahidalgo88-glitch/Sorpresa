"use client"

import { useState } from "react"
import { ExternalLink, Pause, Play, Quote } from "lucide-react"

import { Marquee } from "@/components/magicui/marquee"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { mapsLinkHref, reviews, type Review } from "@/lib/site"

export function Reviews() {
  const [paused, setPaused] = useState(false)
  const half = Math.ceil(reviews.length / 2)

  return (
    <section id="opiniones" aria-labelledby="opiniones-title" className="overflow-hidden bg-brand-mint/60 py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <SectionHeading
          id="opiniones-title"
          eyebrow="Opiniones"
          title="Lo que cuentan nuestros pacientes"
          description="Aquí se mostrarán reseñas reales de pacientes, publicadas con su permiso."
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon-lg"
            className="size-11 rounded-full bg-white motion-reduce:hidden"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Reanudar el desplazamiento de opiniones" : "Pausar el desplazamiento de opiniones"}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </Button>
          <Button asChild variant="outline" size="pill" className="bg-white">
            <a href={mapsLinkHref} target="_blank" rel="noopener noreferrer">
              Ver reseñas en Google
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </Button>
        </div>
      </div>

      <div className="relative mt-12">
        <Marquee paused={paused} className="[--duration:70s]" role="region" aria-label="Opiniones de pacientes, fila 1">
          {reviews.slice(0, half).map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Marquee>
        <Marquee reverse paused={paused} className="[--duration:80s]" role="region" aria-label="Opiniones de pacientes, fila 2">
          {reviews.slice(half).map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Marquee>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#eef7ee] sm:w-32" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#eef7ee] sm:w-32" />
      </div>

      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
        Contenido de ejemplo: sustituir por opiniones reales y verificables antes de publicar.
      </p>
    </section>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="w-[18rem] shrink-0 rounded-3xl border bg-white p-6 shadow-sm sm:w-[22rem]">
      <Quote className="size-6 text-primary/40" aria-hidden="true" />
      <blockquote className="mt-3 text-sm leading-relaxed text-foreground/85">{review.text}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
          {review.author.charAt(0)}
        </span>
        <span className="text-sm">
          <span className="block font-semibold text-brand-deep">{review.author}</span>
          <span className="text-muted-foreground">{review.service}</span>
        </span>
      </figcaption>
    </figure>
  )
}
