"use client"

import { startTransition, useActionState, useEffect, useId, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react"

import { sendMatricula, type MatriculaField, type MatriculaState } from "@/app/actions/matricula"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { courses, services } from "@/lib/site"
import { cn } from "@/lib/utils"

const initial: MatriculaState = { status: "idle" }
const field = "h-12 rounded-[12px] bg-white px-4 text-base"

export function MatriculaForm() {
  const [state, action, pending] = useActionState(sendMatricula, initial)
  const uid = useId()
  const form = useRef<HTMLFormElement>(null)
  const status = useRef<HTMLDivElement>(null)
  const params = useSearchParams()
  const wanted = services.find((x) => x.slug === params.get("servicio"))?.title ?? courses.find((x) => x.slug === params.get("curso"))?.title
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {}
  const values = state.status === "error" ? (state.values ?? {}) : {}

  useEffect(() => {
    if (state.status === "idle") return
    if (state.status === "success") form.current?.reset()
    const bad = form.current?.querySelector<HTMLElement>("[aria-invalid='true']")
    if (bad) bad.focus()
    else status.current?.focus()
  }, [state])

  const a = (name: MatriculaField) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-e` : undefined,
  })
  const err = (name: MatriculaField) =>
    errors[name] ? (
      <p id={`${uid}-${name}-e`} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
        <CircleAlert className="size-4" aria-hidden="true" /> {errors[name]}
      </p>
    ) : null

  return (
    <form
      ref={form}
      action={action}
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
      noValidate
      className="grid gap-5"
    >
      <div className="grid gap-2">
        <Label htmlFor={`${uid}-student`} className="font-semibold text-ink">Nombre completo del alumno *</Label>
        <Input {...a("student")} autoComplete="name" required defaultValue={values.student} className={field} />
        {err("student")}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-email`} className="font-semibold text-ink">Email de contacto *</Label>
          <Input {...a("email")} type="email" autoComplete="email" required defaultValue={values.email} className={field} />
          {err("email")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-phone`} className="font-semibold text-ink">Teléfono de contacto *</Label>
          <Input {...a("phone")} type="tel" autoComplete="tel" required defaultValue={values.phone} className={field} />
          {err("phone")}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-course`} className="font-semibold text-ink">Asignatura, curso o taller</Label>
          <select {...a("course")} defaultValue={values.course ?? wanted ?? ""} className="h-12 w-full rounded-[12px] border border-input bg-white px-4 text-base">
            <option value="">Selecciona (opcional)</option>
            <optgroup label="Clases de apoyo por curso">
              <option>Primaria</option>
              {courses.map((c) => (
                <option key={c.slug}>{c.title}</option>
              ))}
            </optgroup>
            <optgroup label="Talleres, cursos y otros servicios">
              {services.map((x) => (
                <option key={x.slug}>{x.title}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-hours`} className="font-semibold text-ink">Horas a la semana (opcional)</Label>
          <select {...a("hours")} defaultValue={values.hours ?? ""} className="h-12 w-full rounded-[12px] border border-input bg-white px-4 text-base">
            <option value="">Lo vemos juntos</option>
            {Array.from({ length: 15 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {i ? "horas" : "hora"}
              </option>
            ))}
          </select>
          {err("hours")}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${uid}-message`} className="font-semibold text-ink">Tu mensaje (opcional)</Label>
        <Textarea {...a("message")} rows={4} maxLength={800} defaultValue={values.message} className="rounded-[12px] bg-white px-4 py-3 text-base" />
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="privacy" required aria-invalid={errors.privacy ? true : undefined} className="mt-0.5 size-5 accent-[#1d3b5a]" />
        <span>
          He leído y acepto la{" "}
          <Link href="/privacidad" className="font-semibold text-ink underline underline-offset-4">
            política de privacidad
          </Link>
          . *
        </span>
      </label>
      {err("privacy")}
      <div
        ref={status}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(
          "rounded-2xl text-sm outline-none",
          state.status === "success" && "flex items-start gap-3 border border-[#0f7a40]/25 bg-note-mint p-4 text-ink",
          state.status === "error" && "flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 text-destructive"
        )}
      >
        {state.status === "success" && <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
        {state.status === "error" && <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
        {state.status !== "idle" && <p>{state.message}</p>}
      </div>
      <Button type="submit" size="xl" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {pending ? "Enviando…" : "Reservar mi plaza"}
      </Button>
    </form>
  )
}
