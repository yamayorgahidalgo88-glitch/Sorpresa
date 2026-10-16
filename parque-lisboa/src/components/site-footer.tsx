import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { InstagramIcon } from "@/components/icons/instagram"
import { Logo } from "@/components/logo"
import { emailParts, fullAddress, nav, site, visibleServices } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="bg-brand-deep text-white/75">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr_1.4fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 text-sm leading-relaxed">
            Centro sanitario en Alcorcón. Fisioterapia, rehabilitación y podología con atención cercana y personalizada.
          </p>
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex size-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
            aria-label="Instagram del centro (se abre en una pestaña nueva)"
          >
            <InstagramIcon className="size-5" />
          </a>
        </div>

        <nav aria-label="Secciones">
          <h2 className="text-sm font-semibold text-white">Navegación</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-white">Servicios</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {visibleServices.map((s) => (
              <li key={s.slug}>{s.title} en Alcorcón</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-lime" aria-hidden="true" />
              <address className="not-italic">{fullAddress}</address>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-lime" aria-hidden="true" />
              <a href={site.phone.href} className="hover:text-white hover:underline">
                {site.phone.display}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-lime" aria-hidden="true" />
              <a href={`mailto:${site.email}`} className="hover:text-white hover:underline">
                {emailParts[0]}@<wbr />
                {emailParts[1]}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm">{site.hours.summary}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {site.name} · {site.legal.healthRegistry}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/aviso-legal" className="hover:text-white hover:underline">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white hover:underline">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-white hover:underline">
                Política de cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
