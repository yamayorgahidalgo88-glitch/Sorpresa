"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, m } from "motion/react"
import { ArrowRight } from "lucide-react"

import { AmbientVideo } from "@/components/ambient-video"
import { SectionHeading } from "@/components/section-heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { visibleServices } from "@/lib/site"
import type { VideoName } from "@/lib/videos"

export function Services() {
  const [active, setActive] = useState<string>(visibleServices[0].slug)

  return (
    <section id="servicios" aria-labelledby="servicios-title" className="bg-canvas pb-28 sm:pb-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHeading
          id="servicios-title"
          eyebrow="Servicios"
          title={
            <>
              Tratamientos pensados <em>para tu día a día</em>
            </>
          }
          description="Cada tratamiento empieza con una valoración individual. A partir de ahí, el profesional te explica las opciones y decidís juntos el plan."
        />

        <Tabs value={active} onValueChange={setActive} className="mt-12 gap-8">
          {/* Oura · pill-tab */}
          <TabsList variant="line" className="h-auto w-full justify-start gap-2 overflow-x-auto p-1 group-data-horizontal/tabs:h-auto sm:w-fit">
            {visibleServices.map((s) => (
              <TabsTrigger
                key={s.slug}
                value={s.slug}
                className="h-11 flex-none rounded-full border border-input bg-transparent px-5 text-sm text-stone after:hidden data-[state=active]:border-2 data-[state=active]:border-stone data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-none"
              >
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleServices.map((s) => (
            <TabsContent key={s.slug} value={s.slug} className="outline-none">
              <AnimatePresence mode="wait">
                {active === s.slug && (
                  <m.div
                    key={s.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[40px] bg-sage-pale lg:aspect-[5/4]">
                      <AmbientVideo name={s.slug as VideoName} />
                      <p className="absolute bottom-5 left-6 text-xs text-white/80">Imagen ilustrativa</p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-display text-4xl font-light text-ink sm:text-5xl">{s.title}</h3>
                      <p className="mt-5 text-lg leading-relaxed text-stone">{s.summary}</p>
                      <ul className="mt-8 border-t border-hairline">
                        {s.points.map((p) => (
                          <li key={p} className="flex items-center justify-between border-b border-hairline py-4 text-ink">
                            {p}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/?servicio=${s.slug}#contacto`}
                        className="group mt-8 inline-flex items-center gap-3 self-start font-semibold text-ink"
                      >
                        <span className="underline-offset-4 group-hover:underline">Pedir cita de {s.title.toLowerCase()}</span>
                        <span className="grid size-11 place-items-center rounded-full border border-stone transition-colors group-hover:bg-stone group-hover:text-white">
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </span>
                      </Link>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>

        <p className="mt-12 text-stone">
          ¿No ves lo que buscas? Llámanos y te orientamos sobre el profesional más adecuado para tu caso.
        </p>
      </div>
    </section>
  )
}
