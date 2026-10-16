import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { whatsappHref } from "@/lib/site"

export function WhatsAppButton() {
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)"
      className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex h-14 items-center gap-2 rounded-full bg-[#1fa855] pr-4 pl-4 text-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-offset-4 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="hidden text-sm font-semibold sm:inline">¿Hablamos?</span>
    </a>
  )
}
