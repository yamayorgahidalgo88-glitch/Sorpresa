import type { Metadata } from "next"
import Link from "next/link"
import { Lock, MessagesSquare, Users } from "lucide-react"

import { ChalkQuote } from "@/components/board/chalk-quote"
import { StickyNote } from "@/components/board/sticky-note"
import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "TIPS Foro",
  description: "La comunidad de Tips Academy: dudas, apuntes compartidos y novedades para alumnos y familias.",
  alternates: { canonical: "/foro" },
}

const FEATURES = [
  { icon: MessagesSquare, title: "Resuelve dudas", text: "Pregunta y ayuda a otros alumnos.", color: "yellow" as const },
  { icon: Users, title: "Comunidad", text: "Comparte apuntes y experiencias.", color: "teal" as const },
  { icon: Lock, title: "Contenido premium", text: "Exclusivo para suscriptores.", color: "rose" as const },
]

export default function ForoPage() {
  return (
    <>
      <PageHero title="Bienvenido a tu" hand="comunidad TIPS">
        <p>
          El foro es un espacio exclusivo para la comunidad de la academia. Si quieres formar parte, ponte en contacto
          con nosotros. ¡Muchas gracias, te esperamos!
        </p>
      </PageHero>
      <section className="whiteboard py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <ul className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <StickyNote as="li" key={f.title} color={f.color} rotate={[-2, 1.5, -1][i]} className="hover:rotate-0">
                <f.icon className="size-8 text-ink" aria-hidden="true" />
                <h2 className="mt-3 font-hand text-3xl font-bold text-ink">{f.title}</h2>
                <p className="mt-1 text-ink/80">{f.text}</p>
              </StickyNote>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contacto">Quiero formar parte</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/aula-virtual">Ya tengo cuenta</Link>
            </Button>
          </div>
          <div className="mt-14">
            <ChalkQuote quote="emerson" />
          </div>
        </div>
      </section>
    </>
  )
}
