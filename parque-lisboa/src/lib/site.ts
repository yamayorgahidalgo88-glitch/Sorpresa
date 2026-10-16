/**
 * Datos centrales del sitio. Todo el contenido editable de la clínica vive aquí.
 *
 * ⚠️  Los campos marcados con `TODO` deben confirmarse con la clínica antes de
 *     publicar (servicios, CP, WhatsApp, equipo, opiniones y datos legales).
 */

export const site = {
  name: "Centro Clínico Parque Lisboa",
  shortName: "Parque Lisboa",
  description:
    "Centro sanitario en Alcorcón (Parque Lisboa) con servicios de fisioterapia, rehabilitación y podología. Pide cita por teléfono, WhatsApp o formulario.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://centroclinicoparquelisboa.com").replace(/\/$/, ""),
  locale: "es_ES",

  phone: {
    display: "916 10 92 39",
    href: "tel:+34916109239",
    e164: "+34916109239",
  },
  // TODO: confirmar con la clínica qué número tiene WhatsApp Business.
  whatsapp: {
    number: "34916109239",
    message: "Hola, me gustaría pedir cita en el Centro Clínico Parque Lisboa.",
  },
  email: "info@centroclinicoparquelisboa.com",
  instagram: "https://www.instagram.com/ccparquelisboa/",

  address: {
    street: "C/ Porto Colón, 10 (posterior)",
    streetSchema: "Calle Porto Colón, 10, posterior",
    // TODO: confirmar el código postal con la clínica / Correos.
    postalCode: "28924",
    city: "Alcorcón",
    region: "Madrid",
    country: "ES",
  },
  maps: {
    query: "Centro Clínico Parque Lisboa, Calle Porto Colón 10, Alcorcón",
  },

  hours: {
    summary: "Lunes a viernes · 9:30–14:00 y 15:00–20:00",
    days: "Lunes a viernes",
    slots: [
      { opens: "09:30", closes: "14:00" },
      { opens: "15:00", closes: "20:00" },
    ],
    // 1 = lunes … 5 = viernes (Date#getDay)
    weekdays: [1, 2, 3, 4, 5],
  },

  // TODO: completar con los datos reales del titular (aviso legal / RGPD).
  legal: {
    owner: "[Razón social del titular]",
    taxId: "[NIF/CIF]",
    registry: "[Datos registrales, si procede]",
    healthRegistry: "[Nº de registro de centro sanitario de la Comunidad de Madrid]",
    dpoEmail: "info@centroclinicoparquelisboa.com",
    lastUpdated: "octubre de 2026",
  },
} as const

export const whatsappHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`
export const mapsLinkHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.maps.query)}`
export const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.maps.query)}&z=17&output=embed`
export const emailParts = site.email.split("@") as [string, string]
export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city} (${site.address.region})`

export type ServiceIcon = "fisioterapia" | "rehabilitacion" | "podologia" | "traumatologia" | "logopedia" | "psicologia"

export type Service = {
  slug: ServiceIcon
  title: string
  summary: string
  points: string[]
  /** Mostrar en la web. Los ocultos aparecen en la web actual pero no están confirmados. */
  visible: boolean
}

// TODO: confirmar el catálogo de servicios con la clínica.
export const services: Service[] = [
  {
    slug: "fisioterapia",
    title: "Fisioterapia",
    summary:
      "Valoración y tratamiento de molestias musculares y articulares con un plan adaptado a ti y a tu día a día.",
    points: ["Terapia manual", "Ejercicio terapéutico", "Educación postural"],
    visible: true,
  },
  {
    slug: "rehabilitacion",
    title: "Rehabilitación",
    summary:
      "Programas de recuperación funcional tras una lesión, una intervención o un periodo de inactividad, con seguimiento de tu evolución.",
    points: ["Recuperación funcional", "Readaptación progresiva", "Seguimiento personalizado"],
    visible: true,
  },
  {
    slug: "podologia",
    title: "Podología",
    summary:
      "Cuidado integral del pie: revisión, tratamiento de las afecciones más comunes y orientación sobre calzado y apoyo.",
    points: ["Quiropodia", "Valoración del pie", "Consejo sobre calzado"],
    visible: true,
  },
  // Especialidades que figuran en la web actual. Activar con `visible: true` tras confirmar.
  {
    slug: "traumatologia",
    title: "Traumatología",
    summary: "Consulta especializada en el aparato locomotor: huesos, articulaciones, músculos y ligamentos.",
    points: ["Consulta", "Diagnóstico", "Orientación terapéutica"],
    visible: false,
  },
  {
    slug: "logopedia",
    title: "Logopedia",
    summary: "Evaluación e intervención en la comunicación, el lenguaje, el habla, la voz y la deglución.",
    points: ["Infantil", "Adultos", "Voz y deglución"],
    visible: false,
  },
  {
    slug: "psicologia",
    title: "Psicología",
    summary: "Un espacio profesional y confidencial para acompañarte en tu bienestar emocional.",
    points: ["Adultos", "Adolescentes", "Terapia individual"],
    visible: false,
  },
]

export const visibleServices = services.filter((s) => s.visible)

export type TeamMember = { name: string; role: string; credential: string }

// Marcadores de posición: sustituir por el equipo real (con su consentimiento).
export const team: TeamMember[] = [
  { name: "Nombre Apellido", role: "Fisioterapeuta", credential: "Nº de colegiado: pendiente" },
  { name: "Nombre Apellido", role: "Fisioterapeuta · Rehabilitación", credential: "Nº de colegiado: pendiente" },
  { name: "Nombre Apellido", role: "Podólogo/a", credential: "Nº de colegiado: pendiente" },
  { name: "Nombre Apellido", role: "Recepción y atención al paciente", credential: "Coordinación de citas" },
]

export type Review = { author: string; text: string; service: string }

// Marcadores de posición: sustituir por reseñas reales y verificables
// (p. ej. de Google), con permiso del autor. No inventar opiniones.
export const reviews: Review[] = Array.from({ length: 6 }, (_, i) => ({
  author: `Nombre del paciente ${i + 1}`,
  text: "Espacio reservado para una opinión real de un paciente, publicada con su permiso o enlazada desde la ficha de Google del centro.",
  service: visibleServices[i % visibleServices.length].title,
}))

export const faqs = [
  {
    q: "¿Cómo puedo pedir cita?",
    a: `Puedes llamarnos al ${site.phone.display}, escribirnos por WhatsApp o enviarnos el formulario de contacto. Te responderemos en horario de atención para confirmar día y hora.`,
  },
  {
    q: "¿Cuál es el horario del centro?",
    a: `Atendemos de ${site.hours.days.toLowerCase()}, de 9:30 a 14:00 y de 15:00 a 20:00.`,
  },
  {
    q: "¿Dónde estáis exactamente?",
    a: `Estamos en ${fullAddress}, en el barrio de Parque Lisboa. La entrada está en la parte posterior del edificio.`,
  },
  {
    q: "¿Trabajáis con mutuas o aseguradoras?",
    // TODO: completar con las entidades colaboradoras reales.
    a: "Colaboramos con distintas entidades. Consúltanos por teléfono para confirmar si la tuya está incluida.",
  },
]

export const nav = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/#equipo", label: "Equipo" },
  { href: "/#opiniones", label: "Opiniones" },
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#contacto", label: "Contacto" },
] as const
