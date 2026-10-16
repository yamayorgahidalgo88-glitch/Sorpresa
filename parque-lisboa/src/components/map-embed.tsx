"use client"

import { MapPin, Navigation } from "lucide-react"

import { Button } from "@/components/ui/button"
import { setExternalConsent, useExternalConsent } from "@/hooks/use-consent"
import { mapsEmbedSrc, mapsLinkHref, site } from "@/lib/site"

/**
 * Mapa de Google cargado solo tras el consentimiento expreso del usuario
 * (Google puede instalar cookies). Antes se muestra una fachada ligera,
 * lo que además evita cargar ~500 KB de terceros en la carga inicial.
 */
export function MapEmbed() {
  const consent = useExternalConsent()

  if (consent === "granted") {
    return (
      <iframe
        title={`Mapa de ubicación de ${site.name}`}
        src={mapsEmbedSrc}
        className="size-full border-0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    )
  }

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-4 overflow-hidden bg-[linear-gradient(135deg,#e6f1e3,#f4f8f2)] p-6 text-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(46_125_50/0.08)_2px,transparent_2px),linear-gradient(90deg,rgb(46_125_50/0.08)_2px,transparent_2px)] [background-size:48px_48px]"
      />
      <span className="relative grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
        <MapPin className="size-7" aria-hidden="true" />
      </span>
      <div className="relative max-w-sm">
        <p className="font-semibold text-brand-deep">Ver el mapa interactivo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Al cargarlo, Google Maps puede instalar cookies propias. Más información en la{" "}
          <a href="/cookies" className="font-medium text-primary underline underline-offset-4">
            política de cookies
          </a>
          .
        </p>
      </div>
      <div className="relative flex flex-col gap-2 sm:flex-row">
        <Button size="pill" onClick={() => setExternalConsent("granted")}>
          Cargar mapa
        </Button>
        <Button asChild size="pill" variant="outline" className="bg-white">
          <a href={mapsLinkHref} target="_blank" rel="noopener noreferrer">
            <Navigation aria-hidden="true" />
            Abrir en Google Maps
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </Button>
      </div>
    </div>
  )
}
