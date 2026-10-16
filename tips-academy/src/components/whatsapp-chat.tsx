"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, m } from "motion/react"
import { X } from "lucide-react"

import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { waHref, whatsappTopics } from "@/lib/site"

/** Chat de WhatsApp con temas rápidos (como el widget de la web actual). */
export function WhatsAppChat() {
  const [open, setOpen] = useState(false)
  const id = useId()
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <m.div
            id={id}
            role="dialog"
            aria-label="Chat de WhatsApp"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[min(22rem,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-3xl border border-hairline bg-white shadow-[0_24px_60px_-20px_rgb(12_31_51/0.45)]"
          >
            <div className="bg-[#0f7a40] px-5 py-4 text-white">
              <p className="font-semibold">¡Bienvenido a Tips Academy!</p>
              <p className="text-sm text-white/85">¿En qué podemos ayudarte?</p>
            </div>
            <ul className="space-y-2 p-4">
              {whatsappTopics.map((t) => (
                <li key={t}>
                  <a
                    href={waHref(`¡Hola! Quiero información sobre: ${t}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center rounded-2xl bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-note-mint"
                  >
                    {t}
                    <span className="sr-only"> (abre WhatsApp)</span>
                  </a>
                </li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 items-center gap-2 rounded-full bg-[#0f7a40] px-4 text-white shadow-[0_12px_30px_-10px_rgb(0_0_0/0.45)] transition-transform hover:scale-[1.04]"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <WhatsAppIcon className="size-7" />}
        <span className="hidden text-sm font-semibold sm:inline">{open ? "Cerrar" : "¿Hablamos?"}</span>
        <span className="sr-only sm:hidden">{open ? "Cerrar chat" : "Abrir chat de WhatsApp"}</span>
      </button>
    </div>
  )
}
