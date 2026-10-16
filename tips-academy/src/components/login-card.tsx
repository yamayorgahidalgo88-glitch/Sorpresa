"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { LogIn } from "lucide-react"

import { Handwrite } from "@/components/board/handwrite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Acceso al Aula Virtual (diseño). Se conectará con el sistema de usuarios de la academia. */
export function LoginCard() {
  const id = useId()
  const [sent, setSent] = useState(false)

  return (
    <div className="notebook rounded-[8px] p-8 pl-16 shadow-[0_30px_50px_-30px_rgb(12_31_51/0.5)]">
      <h1>
        <Handwrite text="Aula Virtual" trigger="load" className="font-hand text-6xl font-bold text-ink" speed={70} />
      </h1>
      <p className="mt-2 text-slate">Entra con tu cuenta de alumno o familia.</p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor={`${id}-email`} className="font-semibold text-ink">Correo electrónico</Label>
          <Input id={`${id}-email`} type="email" autoComplete="email" required className="h-12 rounded-[12px] bg-white px-4 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-pass`} className="font-semibold text-ink">Contraseña</Label>
          <Input id={`${id}-pass`} type="password" autoComplete="current-password" required className="h-12 rounded-[12px] bg-white px-4 text-base" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate">
          <input type="checkbox" className="size-4 accent-[#1d3b5a]" /> Mantenerme conectado
        </label>
        <Button type="submit" size="lg" className="mt-2">
          <LogIn aria-hidden="true" /> Entrar
        </Button>
        <p role="status" aria-live="polite" className="text-sm text-slate">
          {sent && "Vista de diseño: el acceso se conectará con el sistema de alumnos de la academia."}
        </p>
      </form>
      <p className="mt-4 text-sm text-slate">
        ¿No tienes cuenta?{" "}
        <Link href="/contacto" className="font-semibold text-sky-dark underline underline-offset-4">
          Pídela aquí
        </Link>
      </p>
    </div>
  )
}
