import Link from "next/link"

import { Handwrite } from "@/components/board/handwrite"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="whiteboard">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <Handwrite as="p" text="¡Ups! 404" trigger="load" className="font-hand text-8xl font-bold text-marker-red" speed={90} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Esta página se ha quedado sin apuntes</h1>
        <p className="mt-3 text-slate">Vuelve al inicio o pídenos lo que buscas.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contacto">Contactar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
