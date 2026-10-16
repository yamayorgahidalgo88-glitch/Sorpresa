
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

export type MailResult = "sent" | "dev" | "unconfigured" | "error"

/** Envía un email con Resend (si está configurado). */
export async function sendMail({ subject, rows, replyTo }: { subject: string; rows: [string, string][]; replyTo?: string }): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL ?? "Web Tips Academy <onboarding@resend.dev>"

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[web] Envío simulado: ${subject}`, Object.fromEntries(rows))
      return "dev"
    }
    console.error("[web] Falta configurar RESEND_API_KEY o CONTACT_TO_EMAIL")
    return "unconfigured"
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        reply_to: replyTo || undefined,
        subject,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `<h2>${escapeHtml(subject)}</h2><table cellpadding="6">${rows
          .map(([k, v]) => `<tr><th align="left">${k}</th><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
          .join("")}</table>`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    return "sent"
  } catch (err) {
    console.error("[web] Error al enviar", err)
    return "error"
  }
}
