"use client"

import { Suspense, startTransition, useActionState, useEffect, useId, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react"

import { sendContact } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { serviceOptions, type ContactField, type ContactState } from "@/lib/contact-schema"
import { cn } from "@/lib/utils"

const initialState: ContactState = { status: "idle" }

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const uid = useId()

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {}
  const values = state.status === "error" ? (state.values ?? {}) : {}

  useEffect(() => {
    if (state.status === "idle") return
    if (state.status === "success") formRef.current?.reset()
    const firstInvalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")
    if (firstInvalid) firstInvalid.focus()
    else statusRef.current?.focus()
  }, [state])

  const field = (name: ContactField) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
  })

  return (
    <form
      ref={formRef}
      action={formAction}
      // Con JS, enviamos manualmente para que React no reinicie el formulario si hay errores.
      // Sin JS, `action` sigue funcionando (mejora progresiva).
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
      noValidate className="grid gap-5" aria-describedby={`${uid}-required`}>
      <p id={`${uid}-required`} className="text-xs text-muted-foreground">
        Los campos marcados con <span aria-hidden="true">*</span>
        <span className="sr-only">asterisco</span> son obligatorios.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" required error={errors.name} htmlFor={`${uid}-name`} errorId={`${uid}-name-error`}>
          <Input {...field("name")} autoComplete="name" required defaultValue={values.name} className="h-12 rounded-[12px] bg-white px-4 text-base" />
        </Field>
        <Field label="Teléfono" required error={errors.phone} htmlFor={`${uid}-phone`} errorId={`${uid}-phone-error`}>
          <Input
            {...field("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            defaultValue={values.phone}
            className="h-12 rounded-[12px] bg-white px-4 text-base"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email (opcional)" error={errors.email} htmlFor={`${uid}-email`} errorId={`${uid}-email-error`}>
          <Input {...field("email")} type="email" autoComplete="email" defaultValue={values.email} className="h-12 rounded-[12px] bg-white px-4 text-base" />
        </Field>
        <Field label="¿Qué te interesa?" required error={errors.service} htmlFor={`${uid}-service`} errorId={`${uid}-service-error`}>
          <select
            {...field("service")}
            required
            defaultValue={values.service ?? ""}
            className="h-12 w-full rounded-[12px] border border-input bg-white px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {serviceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Suspense fallback={null}>
            <ServicePreselect selectId={`${uid}-service`} />
          </Suspense>
        </Field>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold text-ink">Preferencia horaria</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["manana", "Mañana"],
            ["tarde", "Tarde"],
            ["indiferente", "Indiferente"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-input px-4 text-sm has-checked:border-ink has-checked:bg-note-yellow has-checked:text-ink has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="preference"
                value={value}
                defaultChecked={(values.preference ?? "indiferente") === value}
                className="size-4 accent-[#1d3b5a]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Mensaje (opcional)"
        hint="Curso, asignaturas, horario que te viene mejor… Cuanto más nos cuentes, mejor te ayudamos."
        error={errors.message}
        htmlFor={`${uid}-message`}
        errorId={`${uid}-message-error`}
      >
        <Textarea {...field("message")} rows={4} maxLength={800} defaultValue={values.message} className="rounded-[12px] bg-white px-4 py-3 text-base" />
      </Field>

      {/* Honeypot anti-spam */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No rellenar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="privacy"
            required
            aria-invalid={errors.privacy ? true : undefined}
            aria-describedby={errors.privacy ? `${uid}-privacy-error` : `${uid}-privacy-info`}
            className="mt-0.5 size-5 shrink-0 accent-[#1d3b5a]"
          />
          <span>
            He leído y acepto la{" "}
            <Link href="/privacidad" className="font-semibold text-ink underline underline-offset-4">
              política de privacidad
            </Link>
            . <span aria-hidden="true">*</span>
          </span>
        </label>
        {errors.privacy && <ErrorText id={`${uid}-privacy-error`}>{errors.privacy}</ErrorText>}
        <p id={`${uid}-privacy-info`} className="text-xs leading-relaxed text-muted-foreground">
          Responsable: Tips Academy. Finalidad: responder a tu solicitud de información. Legitimación: tu consentimiento.
          No se cederán datos a terceros salvo obligación legal. Puedes ejercer tus derechos según se indica en la política
          de privacidad.
        </p>
      </div>

      <div
        ref={statusRef}
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

      <Button type="submit" disabled={pending} size="xl" className="w-full sm:w-auto sm:justify-self-start">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {pending ? "Enviando…" : "Pedir información"}
      </Button>
    </form>
  )
}

function Field({
  label,
  hint,
  required,
  error,
  htmlFor,
  errorId,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  htmlFor: string
  errorId: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  )
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

/** Preselecciona el servicio si se llega desde «Pedir cita de …» (?servicio=slug). */
function ServicePreselect({ selectId }: { selectId: string }) {
  const params = useSearchParams()
  const slug = params.get("servicio")

  useEffect(() => {
    const select = document.getElementById(selectId) as HTMLSelectElement | null
    if (select && slug && serviceOptions.some((o) => o.value === slug)) select.value = slug
  }, [slug, selectId])

  return null
}
