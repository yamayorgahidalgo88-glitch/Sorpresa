"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, Menu, Phone } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { nav, site } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/85 shadow-[0_1px_12px_-6px_rgb(16_51_26/0.25)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label={`${site.name} — inicio`}>
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="pill" className="hidden md:inline-flex">
            <a href={site.phone.href}>
              <Phone aria-hidden="true" />
              {site.phone.display}
            </a>
          </Button>
          <Button asChild size="pill" className="hidden sm:inline-flex">
            <Link href="/#contacto">
              <CalendarCheck aria-hidden="true" />
              Pedir cita
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="size-11 rounded-full lg:hidden" aria-label="Abrir menú">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] max-w-sm gap-0 p-0">
              <div className="border-b p-5">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
                <Logo />
              </div>
              <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto p-3">
                <ul className="flex flex-col">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium hover:bg-secondary"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="flex flex-col gap-2 border-t p-5">
                <SheetClose asChild>
                  <Button asChild size="xl">
                    <Link href="/#contacto">
                      <CalendarCheck aria-hidden="true" />
                      Pedir cita
                    </Link>
                  </Button>
                </SheetClose>
                <Button asChild size="xl" variant="outline">
                  <a href={site.phone.href}>
                    <Phone aria-hidden="true" />
                    Llamar al {site.phone.display}
                  </a>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">{site.hours.summary}</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
