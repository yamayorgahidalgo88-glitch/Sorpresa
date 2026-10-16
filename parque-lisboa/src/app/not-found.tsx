import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <p className="font-display text-7xl text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-brand-deep">No encontramos esta página</h1>
      <p className="mt-3 text-muted-foreground">Puede que el enlace haya cambiado. Vuelve al inicio o pide cita directamente.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="pill">
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button asChild size="pill" variant="outline">
          <Link href="/#contacto">Pedir cita</Link>
        </Button>
      </div>
    </div>
  )
}
