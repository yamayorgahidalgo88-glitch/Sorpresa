"use server"

import { z } from "zod"

import { contactSchema, serviceOptions, type ContactField, type ContactState } from "@/lib/contact-schema"
import { site } from "@/lib/site"

const preferenceLabel = { manana: "Mañana", tarde: "Tarde", indiferente: "Indiferente" } as const

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    service: String(formData.get("service") ?? ""),
    preference: String(formData.get("preference") ?? "indiferente"),
    message: String(formData.get("message") ?? ""),
  }

  // Honeypot anti-spam: los humanos no ven este campo.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Gracias. Hemos recibido tu solicitud." }
  }

  const parsed = contactSchema.safeParse({ ...values, privacy: formData.get("privacy") ?? undefined })
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {}
    for (const [key, msgs] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key as ContactField] = msgs[0]
    }
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors, values }
  }

  const data = parsed.data
  const serviceLabel = serviceOptions.find((o) => o.value === data.service)?.label ?? data.service
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL ?? "Web Tips Academy <onboarding@resend.dev>"

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[contacto] Envío simulado (configura RESEND_API_KEY y CONTACT_TO_EMAIL):", {
        ...data,
        service: serviceLabel,
      })
      return { status: "success", message: "Solicitud recibida (modo desarrollo: no se ha enviado ningún email)." }
    }
    console.error("[contacto] Falta configurar RESEND_API_KEY o CONTACT_TO_EMAIL")
    return {
      status: "error",
      message: `Ahora mismo no podemos recibir el formulario. Llámanos al ${site.phone.display} o escríbenos por WhatsApp.`,
      values,
    }
  }

  const rows: [string, string][] = [
    ["Nombre", data.name],
    ["Teléfono", data.phone],
    ["Email", data.email || "—"],
    ["Servicio", serviceLabel],
    ["Preferencia", preferenceLabel[data.preference]],
    ["Mensaje", data.message || "—"],
  ]

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        reply_to: data.email || undefined,
        subject: `Solicitud de información · ${serviceLabel} · ${data.name}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `<h2>Nueva solicitud de información desde la web</h2><table cellpadding="6">${rows
          .map(([k, v]) => `<tr><th align="left">${k}</th><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
          .join("")}</table>`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  } catch (err) {
    console.error("[contacto] Error al enviar", err)
    return {
      status: "error",
      message: `No hemos podido enviar tu solicitud. Inténtalo de nuevo o llámanos al ${site.phone.display}.`,
      values,
    }
  }

  return {
    status: "success",
    message: "¡Gracias! Hemos recibido tu mensaje. Te llamaremos en horario de atención.",
  }
}
