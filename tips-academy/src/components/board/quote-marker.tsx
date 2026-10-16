import { Handwrite } from "@/components/board/handwrite"
import { Scribble } from "@/components/board/scribble"

/** Cita escrita con rotulador en la pizarra blanca. */
export function QuoteMarker({ text, author, role }: { text: string; author: string; role: string }) {
  return (
    <figure className="relative mx-auto max-w-4xl px-2 text-center">
      <Scribble kind="sparkle" className="absolute -top-6 left-0 size-10 sm:left-6" color="#f5a524" strokeWidth={3} />
      <Scribble kind="swirl" className="absolute -right-2 -bottom-6 h-10 w-24 sm:right-6" color="var(--sky)" strokeWidth={3} />
      <blockquote>
        <Handwrite as="p" text={`«${text}»`} className="font-hand text-[2.2rem] leading-[1.15] font-semibold text-ink-deep sm:text-5xl" speed={38} />
      </blockquote>
      <figcaption className="mt-5 text-base text-slate">
        — <strong className="text-ink">{author}</strong>, {role}
      </figcaption>
    </figure>
  )
}
