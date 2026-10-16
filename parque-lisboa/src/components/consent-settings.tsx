"use client"

import { Button } from "@/components/ui/button"
import { setExternalConsent, useExternalConsent } from "@/hooks/use-consent"

export function ConsentSettings() {
  const consent = useExternalConsent()
  const label =
    consent === "granted" ? "Permitido" : consent === "denied" ? "Rechazado" : "Sin decidir (no se carga)"

  return (
    <div className="not-prose my-6 rounded-[24px] border border-hairline bg-surface p-5">
      <p className="font-semibold text-ink">Contenido de terceros: Google Maps</p>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        Estado actual: <strong className="text-foreground">{label}</strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setExternalConsent("granted")} disabled={consent === "granted"}>
          Permitir
        </Button>
        <Button variant="outline" onClick={() => setExternalConsent("denied")} disabled={consent === "denied"}>
          Rechazar
        </Button>
      </div>
    </div>
  )
}
