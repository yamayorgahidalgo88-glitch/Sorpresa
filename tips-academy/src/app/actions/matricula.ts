"use server"

import { z } from "zod"

import { sendMail } from "@/lib/mail"
import { site } from "@/lib/site"

const schema = z.object({
  student: z.string().trim().min(2, "Indica el nombre completo del alumno.").max(100),
  email: z.email("Introduce un email válido.").max(120),
  phone: z.string().trim().regex(/^(\+?\d[\d\s-]{7,16}\d)$/, "Introduce un teléfono válido."),
  course: z.string().trim().max(60).optional().default(""),
  hours: z.union([z.literal(""), z.coerce.number().int().min(1).max(15)]).optional().default(""),
  subjects: z.string().max(600).optional().default(""),
  message: z.string().trim().max(800).optional().default(""),
  privacy: z.literal("on", { error: "Debes aceptar la política de privacidad." }),
})

export type MatriculaField = keyof z.infer<typeof schema>
export type MatriculaState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<MatriculaField, string>>; values?: Record<string, string> }

export async function sendMatricula(_prev: MatriculaState, formData: FormData): Promise<MatriculaState> {
  const values = Object.fromEntries(
    ["student", "email", "phone", "course", "hours", "message"].map((k) => [k, String(formData.get(k) ?? "")])
  )
  // Las asignaturas llegan como varios valores; se guardan unidas por «|».
  values.subjects = formData.getAll("subjects").map(String).slice(0, 30).join("|")
  if (String(formData.get("website") ?? "") !== "") return { status: "success", message: "¡Gracias!" }

  const parsed = schema.safeParse({ ...values, privacy: formData.get("privacy") ?? undefined })
  if (!parsed.success) {
    const fieldErrors: Partial<Record<MatriculaField, string>> = {}
    for (const [k, msgs] of Object.entries(z.flattenError(parsed.error).fieldErrors)) if (msgs?.[0]) fieldErrors[k as MatriculaField] = msgs[0]
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors, values }
  }
  const d = parsed.data
  const result = await sendMail({
    subject: `Reserva de plaza · ${d.student}`,
    replyTo: d.email,
    rows: [
      ["Alumno", d.student],
      ["Email", d.email],
      ["Teléfono", d.phone],
      ["Asignatura / taller", d.course || "—"],
      ["Horas/semana", d.hours === "" ? "—" : String(d.hours)],
      ["Asignaturas", d.subjects ? d.subjects.split("|").join(", ") : "—"],
      ["Mensaje", d.message || "—"],
    ],
  })
  if (result === "sent" || result === "dev") {
    return {
      status: "success",
      message:
        result === "dev"
          ? "Reserva recibida (modo desarrollo: no se ha enviado ningún email)."
          : "¡Plaza solicitada! Te llamaremos para confirmar horarios y grupo.",
    }
  }
  return { status: "error", message: `No hemos podido enviar tu reserva. Llámanos al ${site.phone.display}.`, values }
}
