import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <p className="font-display text-8xl font-light text-forest">404</p>
      <h1 className="mt-4 font-display text-3xl font-light text-ink">No encontramos esta página</h1>
      <p className="mt-3 text-stone">Puede que el enlace haya cambiado. Vuelve al inicio o pide cita directamente.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/#contacto">Pedir cita</Link>
        </Button>
      </div>
    </div>
  )
}
