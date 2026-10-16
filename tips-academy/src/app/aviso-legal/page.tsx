import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"
import { fullAddress, site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Aviso legal y condiciones de uso del sitio web de ${site.name}.`,
  alternates: { canonical: "/aviso-legal" },
}

export default function AvisoLegalPage() {
  const { legal } = site
  return (
    <LegalPage title="Aviso legal">
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:
      </p>
      <ul>
        <li>Titular: {legal.owner}</li>
        <li>NIF/CIF: {legal.taxId}</li>
        <li>Nombre comercial: {site.name}</li>
        <li>Domicilio: {fullAddress}</li>
        <li>
          Teléfono: <a href={site.phone.href}>{site.phone.display}</a> · Email: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        <li>Datos registrales: {legal.registry}</li>
      </ul>

      <h2>2. Objeto y condiciones de uso</h2>
      <p>
        Esta web informa sobre los servicios de la academia y facilita el contacto y la matriculación. El acceso es
        gratuito y el usuario se compromete a hacer un uso adecuado de los contenidos conforme a la ley y a la buena fe.
        Los resultados académicos dependen del esfuerzo de cada alumno; las cifras publicadas son datos históricos de la
        academia y no constituyen una garantía.
      </p>

      <h2>3. Propiedad intelectual</h2>
      <p>
        Los contenidos, diseños, logotipos y materiales de la web son titularidad de {legal.owner} o de terceros que han
        autorizado su uso. Los recursos descargables se ofrecen para uso personal y educativo; queda prohibida su
        reproducción con fines comerciales sin autorización.
      </p>

      <h2>4. Responsabilidad y enlaces</h2>
      <p>
        El titular no se responsabiliza del uso indebido de la web ni de los contenidos de sitios de terceros enlazados,
        que se ofrecen a título informativo.
      </p>

      <h2>5. Legislación aplicable</h2>
      <p>Este aviso legal se rige por la legislación española.</p>
    </LegalPage>
  )
}
