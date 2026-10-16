"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Phone } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { nav, site } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  // En la portada, anclas locales (desplazamiento suave); en otras páginas, vuelven a la portada.
  const href = (h: string) => (pathname === "/" ? h.replace(/^\//, "") : h)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {/* Oura · announcement-bar */}
      <div className="bg-canvas">
        <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-[0.7rem] font-semibold tracking-[0.12em] text-ink uppercase sm:px-8">
          Cita previa<span className="hidden sm:inline"> · {site.hours.days} 9:30–14:00 y 15:00–20:00</span> ·{" "}
          <a href={site.phone.href} className="underline-offset-4 hover:underline">
            {site.phone.display}
          </a>
        </p>
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-500",
          scrolled ? "border-hairline bg-canvas/88 backdrop-blur-xl" : "border-transparent bg-canvas"
        )}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <Link href="/" className="rounded-lg">
            <Logo />
            <span className="sr-only"> — inicio</span>
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={href(item.href)}
                    className="relative py-2 text-sm text-stone after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-stone after:transition-transform after:duration-300 hover:text-ink hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden h-10 md:inline-flex">
              <a href={site.phone.href}>
                <Phone aria-hidden="true" />
                {site.phone.display}
              </a>
            </Button>
            <Button asChild size="sm" className="hidden h-10 sm:inline-flex">
              <Link href={href("/#contacto")}>Pedir cita</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="icon" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full gap-0 border-hairline bg-canvas p-0 sm:max-w-md">
                <div className="flex h-[4.5rem] items-center border-b border-hairline px-6">
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                  <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
                  <Logo />
                </div>
                <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto px-6 py-6">
                  <ul className="flex flex-col">
                    {nav.map((item) => (
                      <li key={item.href} className="border-b border-hairline">
                        <SheetClose asChild>
                          <Link
                            href={href(item.href)}
                            className="flex min-h-16 items-center font-display text-3xl font-light text-ink"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="flex flex-col gap-3 border-t border-hairline p-6">
                  <SheetClose asChild>
                    <Button asChild size="xl">
                      <Link href={href("/#contacto")}>Pedir cita</Link>
                    </Button>
                  </SheetClose>
                  <Button asChild size="xl" variant="outline">
                    <a href={site.phone.href}>
                      <Phone aria-hidden="true" />
                      {site.phone.display}
                    </a>
                  </Button>
                  <p className="mt-1 text-center text-sm text-ash">{site.hours.summary}</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
