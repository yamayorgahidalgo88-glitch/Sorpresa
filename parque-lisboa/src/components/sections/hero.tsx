import Link from "next/link"
import { CalendarCheck, Clock, ImageIcon, MapPin, Phone } from "lucide-react"

import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { BlurFade } from "@/components/magicui/blur-fade"
import { OpenStatus } from "@/components/open-status"
import { Button } from "@/components/ui/button"
import { site, whatsappHref } from "@/lib/site"

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-16 overflow-hidden pt-16">
      {/* Fondo decorativo */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-20%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgb(172_255_54/0.35),transparent)] sm:right-[-5%]" />
        <div className="absolute top-1/3 -left-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(46_125_50/0.14),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(16_51_26/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(16_51_26/0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">
            <MapPin className="size-3.5" aria-hidden="true" />
            Alcorcón · Parque Lisboa
          </p>

          {/* El título no se anima para no retrasar el LCP. */}
          <h1
            id="hero-title"
            className="text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-balance text-brand-deep sm:text-5xl lg:text-[3.6rem]"
          >
            Fisioterapia, rehabilitación y podología{" "}
            <span className="font-display font-normal text-primary">en Alcorcón</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Un centro sanitario de barrio con trato cercano: te escuchamos, valoramos tu caso y te
            proponemos un plan adaptado a ti, con el tiempo que cada consulta necesita.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="xl" className="shadow-[0_10px_30px_-10px_rgb(46_125_50/0.7)]">
              <Link href="/#contacto">
                <CalendarCheck aria-hidden="true" />
                Pedir cita
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="bg-white/80">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-5 text-[#1fa855]" />
                Escríbenos por WhatsApp
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-foreground/80 sm:flex-row sm:items-center sm:gap-6">
            <OpenStatus />
            <a
              href={site.phone.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              <Phone className="size-4" aria-hidden="true" />
              {site.phone.display}
            </a>
          </div>
        </div>

        <BlurFade delay={0.1} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <HeroVisual />
        </BlurFade>
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-brand-deep shadow-2xl shadow-brand-deep/25 sm:aspect-[5/4] lg:aspect-[4/5]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgb(172_255_54/0.45),transparent_45%),radial-gradient(circle_at_10%_90%,rgb(46_125_50/0.9),transparent_55%)]" />
        <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -right-10 -bottom-10 w-3/4 text-white/[0.07]">
          <path d="M70 0h60v70h70v60h-70v70H70v-70H0V70h70z" fill="currentColor" />
        </svg>
        {/* Marcador de posición: sustituir por una foto propia del centro con permiso. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-white/80">
          <ImageIcon className="size-10" aria-hidden="true" />
          <p className="text-sm font-medium">Fotografía del centro</p>
          <p className="max-w-[16rem] text-xs text-white/60">
            Marcador de posición · sustituir por una imagen propia autorizada
          </p>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-2xl border bg-white/95 p-3.5 pr-5 shadow-xl shadow-brand-deep/10 backdrop-blur sm:-left-8">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <Clock className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-semibold text-brand-deep">Lunes a viernes</span>
          <span className="text-muted-foreground">9:30–14:00 · 15:00–20:00</span>
        </span>
      </div>

      <div className="absolute -top-4 -right-2 hidden items-center gap-2 rounded-full bg-brand-lime px-4 py-2 text-sm font-semibold text-brand-deep shadow-lg sm:flex sm:-right-6">
        <MapPin className="size-4" aria-hidden="true" />
        C/ Porto Colón, 10
      </div>
    </div>
  )
}
