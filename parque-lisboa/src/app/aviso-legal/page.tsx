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
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y
        de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:
      </p>
      <ul>
        <li>Titular: {legal.owner}</li>
        <li>NIF/CIF: {legal.taxId}</li>
        <li>Nombre comercial: {site.name}</li>
        <li>Domicilio: {fullAddress}</li>
        <li>
          Teléfono: <a href={site.phone.href}>{site.phone.display}</a>
        </li>
        <li>
          Email: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        <li>Datos registrales: {legal.registry}</li>
        <li>Autorización sanitaria: {legal.healthRegistry}</li>
        <li>
          Profesionales sanitarios: ejercen la profesión colegiados en sus respectivos colegios profesionales. Títulos
          académicos expedidos en España. [Indicar colegios y números de colegiado.]
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Este sitio web tiene como finalidad informar sobre los servicios del centro y facilitar el contacto y la solicitud
        de citas. La información publicada es de carácter general y orientativo: <strong>no constituye consejo médico ni
        sustituye la valoración individual de un profesional sanitario</strong>. Los resultados de cualquier tratamiento
        dependen de cada persona y no pueden garantizarse.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso a la web es gratuito y atribuye la condición de usuario, que se compromete a hacer un uso adecuado de
        los contenidos conforme a la ley, la buena fe y el presente aviso legal.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Los contenidos, diseños, logotipos y demás elementos de la web son titularidad de {legal.owner} o de terceros que
        han autorizado su uso. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        El titular no se hace responsable de los daños derivados de un uso indebido de la web ni de interrupciones del
        servicio por causas ajenas. Los enlaces a sitios de terceros se ofrecen a título informativo; el titular no
        controla ni responde de sus contenidos.
      </p>

      <h2>6. Legislación y jurisdicción</h2>
      <p>
        Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los
        juzgados y tribunales que correspondan conforme a la normativa vigente.
      </p>
    </LegalPage>
  )
}
