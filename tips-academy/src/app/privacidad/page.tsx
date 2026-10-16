import type { Metadata } from "next"

import { LegalPage } from "@/components/legal-page"
import { fullAddress, site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Tratamiento de datos personales en ${site.name} conforme al RGPD y la LOPDGDD.`,
  alternates: { canonical: "/privacidad" },
}

export default function PrivacidadPage() {
  const { legal } = site
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política informa sobre el tratamiento de los datos personales que nos facilitas a través de esta web,
        conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable</h2>
      <ul>
        <li>Responsable: {legal.owner} ({site.name})</li>
        <li>NIF/CIF: {legal.taxId}</li>
        <li>Dirección: {fullAddress}</li>
        <li>
          Contacto: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
      </ul>

      <h2>2. Finalidades y base jurídica</h2>
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
            <td>Responder a tu solicitud de información (formulario, teléfono o WhatsApp).</td>
            <td>Nombre, teléfono, email (opcional), interés y mensaje.</td>
            <td>Consentimiento (art. 6.1.a RGPD) y medidas precontractuales (art. 6.1.b).</td>
          </tr>
          <tr>
            <td>Gestionar la matrícula y el seguimiento académico, si te matriculas.</td>
            <td>Datos del alumno y de sus padres o tutores.</td>
            <td>Ejecución del contrato (art. 6.1.b RGPD).</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Menores de edad</h2>
      <p>
        Si el alumno es menor de 14 años, la solicitud debe realizarla su padre, madre o tutor legal (art. 7 LOPDGDD).
      </p>

      <h2>4. Conservación</h2>
      <p>
        Los datos de las solicitudes se conservan el tiempo necesario para atenderlas y, como máximo, [12 meses] si no se
        formaliza la matrícula. Los datos de alumnos, durante la relación y los plazos legales posteriores.
      </p>

      <h2>5. Destinatarios</h2>
      <p>No se ceden datos a terceros salvo obligación legal. Contamos con encargados del tratamiento para el alojamiento web y el envío de emails [indicar proveedores], con las garantías adecuadas para transferencias internacionales.</p>

      <h2>6. Derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad, y retirar
        tu consentimiento, escribiendo a <a href={`mailto:${site.email}`}>{site.email}</a>. También puedes reclamar ante
        la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          www.aepd.es
        </a>
        ).
      </p>
    </LegalPage>
  )
}
