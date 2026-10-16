import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { StickyNote } from "@/components/board/sticky-note"
import { ServiceIcon } from "@/components/service-icon"
import { serviceHref, type Service } from "@/lib/site"

export function ServiceCard({ service, rotate = 0 }: { service: Service; rotate?: number }) {
  return (
    <StickyNote
      as="li"
      color={service.color}
      rotate={rotate}
      className="group flex flex-col hover:z-10 hover:-translate-y-2 hover:rotate-0 hover:shadow-[0_30px_40px_-24px_rgb(12_31_51/0.5)]"
    >
      <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-white/70 transition-transform duration-500 group-hover:rotate-[-12deg]">
        <ServiceIcon name={service.icon} className="size-6 text-ink" />
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">{service.title}</h3>
      <p className="mt-1 font-hand text-2xl leading-tight text-sky-dark">{service.slogan}</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{service.text}</p>
      <Link
        href={serviceHref(service.slug)}
        className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-ink underline-offset-4 after:absolute after:inset-0 hover:underline"
      >
        Saber más <span className="sr-only">sobre {service.title}</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </StickyNote>
  )
}
