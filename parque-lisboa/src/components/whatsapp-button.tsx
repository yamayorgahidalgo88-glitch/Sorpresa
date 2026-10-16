import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { whatsappHref } from "@/lib/site"

export function WhatsAppButton() {
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)"
      className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex h-14 items-center gap-2 rounded-full bg-[#0f7a40] hover:bg-[#0c6835] pr-4 pl-4 text-white shadow-[0_12px_30px_-10px_rgb(0_0_0/0.4)] transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-offset-4 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  )
}
