import { ChalkWrite } from "@/components/board/chalk-write"
import { Chalkboard } from "@/components/board/chalkboard"
import { quotes, type QuoteKey } from "@/lib/site"

/** Cita escrita con tiza en la pizarra (las frases célebres de la web actual). */
export function ChalkQuote({ quote, className }: { quote: QuoteKey; className?: string }) {
  const q = quotes[quote]
  return (
    <Chalkboard className={className}>
      <figure className="text-center">
        <blockquote>
          <ChalkWrite className="mx-auto max-w-3xl text-[2rem] leading-[1.2] sm:text-[2.6rem]" speed={0.04}>
            {`«${q.text}»`}
          </ChalkWrite>
        </blockquote>
        <figcaption className="chalk-text mt-6 font-hand text-2xl text-note-yellow">
          — {q.author}, {q.role}
        </figcaption>
      </figure>
    </Chalkboard>
  )
}
