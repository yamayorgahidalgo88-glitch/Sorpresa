import Link from "next/link"
import { preload } from "react-dom"
import { ArrowDown, Phone } from "lucide-react"

import { OpenStatus } from "@/components/open-status"
import { ScrollStage } from "@/components/sections/scroll-stage"
import { Hero3D } from "@/components/three/hero-3d"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"
import { posterSrc } from "@/lib/videos"

export function Hero() {
  preload(posterSrc("hero"), { as: "image", fetchPriority: "high" })

  return (
    <section aria-labelledby="hero-title" className="relative bg-canvas">
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 pt-10 pb-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10 lg:pt-20 lg:pb-20">
        <div className="relative z-10">
          {/* El titular no se anima para no retrasar el LCP. */}
          <h1 id="hero-title">
            <span className="eyebrow block text-ink">Fisioterapia · Rehabilitación · Podología en Alcorcón</span>
            <span className="mt-6 block font-display text-[3.4rem] leading-[1.02] font-light tracking-[-0.02em] text-ink sm:text-7xl lg:text-[6.4rem]">
              Cuidamos de cómo te <em className="font-light text-forest">mueves</em>.
            </span>
          </h1>

          <p className="mt-8 max-w-xl font-display text-xl leading-snug font-light text-stone sm:text-2xl">
            Un centro sanitario de barrio, cercano y sin prisas. Te escuchamos, valoramos tu caso y diseñamos contigo un
            plan a tu medida.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="xl">
              <Link href="#contacto">Pedir cita</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href={site.phone.href}>
                <Phone aria-hidden="true" />
                Llamar al {site.phone.display}
              </a>
            </Button>
          </div>

          <OpenStatus className="mt-6 text-stone" />
        </div>

        <Hero3D className="mx-auto -mt-2 aspect-square w-full max-w-[18rem] sm:max-w-md lg:mt-0 lg:max-w-none" />
      </div>

      <ScrollStage />

      <div className="mx-auto flex max-w-7xl justify-center px-4 pt-10 sm:px-8">
        <a
          href="#filosofia"
          className="inline-flex items-center gap-2 text-sm text-ash underline-offset-4 hover:text-ink hover:underline"
        >
          Descubre el centro
          <ArrowDown className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
