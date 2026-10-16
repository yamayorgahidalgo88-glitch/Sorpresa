import type { Metadata } from "next"

import { ConsentSettings } from "@/components/consent-settings"
import { LegalPage } from "@/components/legal-page"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Política de cookies",
  description: `Información sobre cookies y tecnologías similares en la web de ${site.name}.`,
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Conforme al artículo 22.2 de la LSSI-CE y a la Guía sobre el uso de cookies de la Agencia Española de Protección
        de Datos, te informamos de las cookies y tecnologías similares que utiliza este sitio.
      </p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Son pequeños archivos o datos que un sitio web almacena en tu dispositivo para recordar información sobre tu
        visita. También se consideran tecnologías similares el almacenamiento local del navegador (localStorage).
      </p>

      <h2>2. Cookies que utiliza esta web</h2>
      <p>
        <strong>Esta web no utiliza cookies propias de análisis, publicidad ni seguimiento.</strong> Solo emplea:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Titular</th>
            <th scope="col">Finalidad</th>
            <th scope="col">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>tips-consent-external (localStorage)</td>
            <td>Propia</td>
            <td>Técnica: recordar si has permitido cargar el mapa de Google. Exenta de consentimiento.</td>
            <td>Hasta que la borres</td>
          </tr>
          <tr>
            <td>Cookies de Google (p. ej. NID, AEC)</td>
            <td>Google LLC</td>
            <td>
              Se instalan solo si pulsas «Cargar mapa» para mostrar Google Maps. Pueden usarse para preferencias y
              análisis por parte de Google.
            </td>
            <td>Según Google</td>
          </tr>
        </tbody>
      </table>
      <p>
        Más información en la{" "}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
          política de cookies de Google
        </a>
        .
      </p>

      <h2>3. Configurar o retirar tu consentimiento</h2>
      <p>Puedes cambiar tu decisión en cualquier momento:</p>
      <ConsentSettings />
      <p>
        También puedes eliminar las cookies desde la configuración de tu navegador (Chrome, Firefox, Safari o Edge).
      </p>

      <h2>4. Cambios</h2>
      <p>
        Si en el futuro se incorporan herramientas de analítica u otras cookies no técnicas, se actualizará esta política
        y se solicitará tu consentimiento previo mediante un aviso.
      </p>
    </LegalPage>
  )
}
