import { z } from "zod"

import { services } from "@/lib/site"

export const serviceOptions = [
  ...services.filter((s) => s.visible).map((s) => ({ value: s.slug, label: s.title })),
  { value: "otro", label: "Otro / no lo sé" },
] as const

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre.").max(80, "El nombre es demasiado largo."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s-]{7,16}\d)$/, "Introduce un teléfono válido."),
  email: z.union([z.literal(""), z.email("Introduce un email válido.").max(120)]),
  service: z.enum(serviceOptions.map((o) => o.value) as [string, ...string[]], {
    error: "Elige una opción.",
  }),
  preference: z.enum(["manana", "tarde", "indiferente"]).default("indiferente"),
  message: z.string().trim().max(800, "El mensaje no puede superar 800 caracteres.").optional().default(""),
  privacy: z.literal("on", { error: "Debes aceptar la política de privacidad." }),
})

export type ContactField = keyof z.infer<typeof contactSchema>

export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<ContactField, string>>; values?: Record<string, string> }
