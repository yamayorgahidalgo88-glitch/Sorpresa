import Link from "next/link"

import { Handwrite } from "@/components/board/handwrite"
import { Scribble } from "@/components/board/scribble"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export function CtaStrip({ text = "¿Empezamos?" }: { text?: string }) {
  return (
    <section className="bg-sky-light/60 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
        <div className="relative">
          <Handwrite as="p" text={text} className="font-hand text-5xl font-bold text-ink" />
          <p className="mt-1 text-slate">Pide información gratis y sin compromiso.</p>
          <Scribble kind="sparkle" className="absolute -top-4 -right-10 size-8" color="#f5a524" strokeWidth={3} />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={site.links.matricula}>Reservar mi plaza</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contacto">Pide información</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
