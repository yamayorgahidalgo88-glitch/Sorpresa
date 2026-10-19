"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ChevronDown, Clock, MapPin, Menu, Phone } from "lucide-react"

import { Logo } from "@/components/logo"
import { OpenStatus } from "@/components/open-status"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { nav, site, type NavItem } from "@/lib/site"
import { cn } from "@/lib/utils"

function NavLink({ item, className, children }: { item: NavItem; className?: string; children?: React.ReactNode }) {
  return (
    <Link href={item.href} className={className}>
      {children ?? item.label}
    </Link>
  )
}

function Dropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  return (
    <li ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        // Con ratón (detail > 0) el clic abre; con teclado alterna.
        onClick={(e) => setOpen((o) => (e.detail === 0 ? !o : true))}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface",
          active ? "text-ink" : "text-slate"
        )}
      >
        {item.label}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute top-full left-0 z-50 w-80 pt-2"
      >
        <ul className="rounded-2xl border border-hairline bg-white p-2 shadow-[0_18px_40px_-16px_rgb(12_31_51/0.35)]">
          {item.children!.map((c) => (
            <li key={c.href}>
              <NavLink
                item={c}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-sky-light"
              >
                <span>{c.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  // «Scrolled» se detecta con un observador sobre un marcador al inicio de la página:
  // leer window.scrollY en cada evento de scroll fuerza al navegador a recalcular el diseño.
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-14 w-px" />
      {/* Barra superior: datos útiles en un formato compacto */}
      <div className="bg-ink-deep text-white/85">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 text-[0.8rem] sm:px-8">
          <div className="flex items-center gap-5">
            <a href={site.phone.href} className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-sky">
              <Phone className="size-3.5 text-sky" aria-hidden="true" />
              {site.phone.display}
            </a>
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <MapPin className="size-3.5 text-sky" aria-hidden="true" />
              {site.address.street}, {site.address.city}
            </span>
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <Clock className="size-3.5 text-sky" aria-hidden="true" />
              <OpenStatus className="text-[0.8rem] font-normal text-white/85" />
            </span>
          </div>
          <Link
            href={site.links.matricula}
            className="group inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 text-[0.78rem] font-semibold text-ink-deep transition-colors hover:bg-white"
          >
            Reservar mi plaza
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled ? "border-hairline bg-white shadow-[0_8px_30px_-20px_rgb(12_31_51/0.4)]" : "border-transparent bg-white"
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" className="rounded-xl">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {nav.map((item) =>
                item.children ? (
                  <Dropdown key={item.label} item={item} active={pathname.startsWith(item.href)} />
                ) : (
                  <li key={item.label}>
                    <NavLink
                      item={item}
                      className={cn(
                        "inline-flex rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface",
                        pathname === item.href ? "bg-sky-light text-ink" : "text-slate"
                      )}
                    />
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link href={site.links.aulaVirtual} className="hidden rounded-full px-3 py-2 text-sm font-medium text-sky-dark hover:underline lg:inline">
              Aula Virtual
            </Link>
            <Button asChild size="sm" className="hidden h-10 sm:inline-flex">
              <Link href={site.links.matricula}>Reservar mi plaza</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="icon" size="icon" className="xl:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
                <div className="flex h-[4.5rem] items-center border-b border-hairline px-6">
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                  <SheetDescription className="sr-only">Navegación principal</SheetDescription>
                  <Logo />
                </div>
                <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-1">
                    {nav.map((item) => (
                      <li key={item.label}>
                        {item.children ? (
                          <details className="group rounded-2xl">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl px-3 text-lg font-semibold text-ink hover:bg-surface">
                              {item.label}
                              <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <ul className="mb-2 ml-3 border-l-2 border-sky pl-3">
                              {item.children.map((c) => (
                                <li key={c.href}>
                                  <SheetClose asChild>
                                    <NavLink item={c} className="flex min-h-11 items-center text-[0.95rem] text-slate hover:text-ink" />
                                  </SheetClose>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <SheetClose asChild>
                            <NavLink item={item} className="flex min-h-12 items-center rounded-2xl px-3 text-lg font-semibold text-ink hover:bg-surface" />
                          </SheetClose>
                        )}
                      </li>
                    ))}
                    <li>
                      <SheetClose asChild>
                        <Link href={site.links.aulaVirtual} className="flex min-h-12 items-center rounded-2xl px-3 text-lg font-semibold text-sky-dark">
                          Aula Virtual
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </nav>
                <div className="flex flex-col gap-3 border-t border-hairline p-5">
                  <SheetClose asChild>
                    <Button asChild size="xl">
                      <Link href={site.links.matricula}>Reservar mi plaza</Link>
                    </Button>
                  </SheetClose>
                  <Button asChild size="xl" variant="outline">
                    <a href={site.phone.href}>
                      <Phone aria-hidden="true" />
                      {site.phone.display}
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
