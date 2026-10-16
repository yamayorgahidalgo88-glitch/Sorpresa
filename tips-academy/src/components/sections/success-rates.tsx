"use client"

import { useRef } from "react"

import { Handwrite } from "@/components/board/handwrite"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import { successRates } from "@/lib/site"

/** Porcentaje de éxito: barras de rotulador que se rellenan al entrar en pantalla (GSAP). */
export function SuccessRates() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".rate-fill", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.4,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} aria-labelledby="exito" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <h2 id="exito" className="text-center">
          <Handwrite text="Porcentaje de éxito" className="font-hand text-5xl font-bold text-ink sm:text-6xl" speed={55} />
        </h2>
        <ul className="mt-12 space-y-7">
          {successRates.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="font-hand text-3xl font-bold text-marker-blue">{r.value}%</span>
              </div>
              <div className="mt-2 h-5 overflow-hidden rounded-full border-2 border-ink bg-white" role="img" aria-label={`${r.value} %`}>
                <div className="rate-fill rate-stripes h-full rounded-full" style={{ width: `${r.value}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
