import Link from "next/link"

import { InstagramIcon } from "@/components/icons/instagram"
import { Logo } from "@/components/logo"
import { emailParts, fullAddress, nav, site, visibleServices } from "@/lib/site"

/** Oura · footer sobre ink-band-soft. */
export function SiteFooter() {
  return (
    <footer className="bg-ink-band text-white/70">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-8">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-14 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-2xl font-display text-4xl leading-tight font-light text-white sm:text-5xl">
            Tu centro sanitario <em>en Parque Lisboa</em>.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex h-12 items-center self-start rounded-full bg-canvas px-6 font-semibold text-stone transition-colors hover:bg-white"
          >
            Pedir cita
          </Link>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1.3fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Fisioterapia, rehabilitación y podología en Alcorcón, con atención cercana y personalizada.
            </p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10"
              aria-label="Instagram del centro (se abre en una pestaña nueva)"
            >
              <InstagramIcon className="size-5" />
            </a>
          </div>

          <nav aria-label="Secciones">
            <h2 className="eyebrow text-white">Navegación</h2>
            <ul className="mt-5 space-y-3 text-sm">
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
            <h2 className="eyebrow text-white">Servicios</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {visibleServices.map((s) => (
                <li key={s.slug}>{s.title} en Alcorcón</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow text-white">Contacto</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <address className="not-italic">{fullAddress}</address>
              </li>
              <li>
                <a href={site.phone.href} className="hover:text-white hover:underline">
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white hover:underline">
                  {emailParts[0]}@<wbr />
                  {emailParts[1]}
                </a>
              </li>
              <li>{site.hours.summary}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 text-xs md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>
              © {site.name} · {site.legal.healthRegistry}
            </p>
            <p className="text-white/50">
              La información de esta web es orientativa y no sustituye la valoración de un profesional sanitario. Vídeos
              de estilo de vida ilustrativos (Mixkit).
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/aviso-legal" className="hover:text-white hover:underline">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white hover:underline">
                Privacidad
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-white hover:underline">
                Cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
