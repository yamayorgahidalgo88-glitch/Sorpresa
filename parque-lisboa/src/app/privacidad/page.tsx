import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"
import { fullAddress, site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Información sobre el tratamiento de datos personales en ${site.name} conforme al RGPD y la LOPDGDD.`,
  alternates: { canonical: "/privacidad" },
}

export default function PrivacidadPage() {
  const { legal } = site
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política informa sobre el tratamiento de los datos personales que nos facilitas a través de este sitio web,
        conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Responsable: {legal.owner}</li>
        <li>NIF/CIF: {legal.taxId}</li>
        <li>Dirección: {fullAddress}</li>
        <li>
          Contacto en materia de protección de datos: <a href={`mailto:${legal.dpoEmail}`}>{legal.dpoEmail}</a>
        </li>
        <li>Delegado de Protección de Datos: [indicar si existe y su contacto]</li>
      </ul>

      <h2>2. Qué datos tratamos y para qué</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Finalidad</th>
            <th scope="col">Datos</th>
            <th scope="col">Base jurídica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Atender tu solicitud de cita o consulta a través del formulario, teléfono o WhatsApp.</td>
            <td>Nombre, teléfono, email (opcional), servicio de interés, preferencia horaria y mensaje.</td>
            <td>Consentimiento (art. 6.1.a RGPD) y aplicación de medidas precontractuales a petición tuya (art. 6.1.b).</td>
          </tr>
        </tbody>
      </table>
      <p>
        Te pedimos que <strong>no incluyas datos de salud</strong> en el formulario. La información clínica se recogerá en
        consulta y se tratará conforme a la normativa sanitaria (art. 9.2.h RGPD y Ley 41/2002 de autonomía del paciente).
      </p>
      <p>No tomamos decisiones automatizadas ni elaboramos perfiles con tus datos.</p>

      <h2>3. Conservación</h2>
      <p>
        Los datos de las solicitudes se conservarán el tiempo necesario para atenderlas y, como máximo, [12 meses] si no
        llegas a ser paciente. Si inicias un tratamiento, la historia clínica se conservará durante los plazos legalmente
        establecidos.
      </p>

      <h2>4. Destinatarios</h2>
      <p>No se cederán datos a terceros salvo obligación legal. Para prestar el servicio contamos con encargados del tratamiento:</p>
      <ul>
        <li>Alojamiento web: Vercel Inc. [confirmar proveedor].</li>
        <li>Envío de los formularios por email: Resend [o el proveedor de correo que se configure].</li>
      </ul>
      <p>
        Algunos de estos proveedores pueden estar ubicados fuera del Espacio Económico Europeo. En tal caso, las
        transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo
        aprobadas por la Comisión Europea.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
        portabilidad, así como retirar tu consentimiento en cualquier momento, escribiendo a{" "}
        <a href={`mailto:${legal.dpoEmail}`}>{legal.dpoEmail}</a> o por correo postal a la dirección indicada, adjuntando
        un documento que acredite tu identidad.
      </p>
      <p>
        Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia
        Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
      </p>

      <h2>6. Menores de edad</h2>
      <p>
        Las solicitudes relativas a menores de 14 años deben realizarlas sus padres o tutores legales.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos, como el cifrado de las
        comunicaciones (HTTPS) y el acceso restringido a la información.
      </p>
    </LegalPage>
  )
}
