import Link from "next/link"

import { Handwrite } from "@/components/board/handwrite"
import { Logo } from "@/components/logo"
import { nav, site, slogans } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="bg-ink-deep text-white/70">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-12 md:flex-row md:items-end md:justify-between">
          <Handwrite
            as="p"
            text={`${slogans.together}.`}
            className="font-hand text-5xl leading-none text-sky sm:text-6xl"
            speed={60}
          />
          <Link
            href={site.links.matricula}
            className="inline-flex h-12 items-center self-start rounded-full bg-white px-6 font-semibold text-ink-deep transition-colors hover:bg-sky-light"
          >
            Reservar mi plaza
          </Link>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Tu academia de apoyo en Alcorcón: clases grupales y particulares, EvAU, Cambridge, técnicas de estudio,
              robótica e informática.
            </p>
          </div>

          <nav aria-label="Pie de página">
            <h2 className="text-sm font-semibold text-white">Navegación</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.map((n) => (
                <li key={n.label}>
                  <Link href={n.href} className="hover:text-white hover:underline">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-white">Contacto</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>{site.address.full}</li>
              <li>
                <a href={site.phone.href} className="hover:text-white hover:underline">
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white hover:underline">
                  {site.email}
                </a>
              </li>
              {site.hours.map((h) => (
                <li key={h.label}>
                  {h.label}: L–V {h.display}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Síguenos</h2>
            <p className="mt-4 text-sm">¡Te podemos ayudar también desde aquí!</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {site.social.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-full border border-white/20 px-3.5 text-xs font-semibold text-white/85 transition-colors hover:bg-white hover:text-ink-deep"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>© Tips Academy · Todos los derechos reservados</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/aviso-legal" className="hover:text-white hover:underline">Aviso legal</Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white hover:underline">Política de privacidad</Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-white hover:underline">Política de cookies</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
