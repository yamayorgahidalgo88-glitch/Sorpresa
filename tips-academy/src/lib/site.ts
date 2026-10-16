/**
 * Contenido de Tips Academy (tomado de la web actual, tipsacademy.es).
 * Todo lo editable vive aquí. Los apartados dinámicos de WordPress (Recursos,
 * t-Blog, Foro, Aula Virtual, matriculación) enlazan a la web actual.
 */

const ORIGIN = "https://tipsacademy.es"

export const site = {
  name: "Tips Academy",
  tagline: "Tus academias de apoyo en Alcorcón",
  description:
    "Academia de apoyo escolar e inglés en Alcorcón: clases grupales y particulares, intensivo de Selectividad (EvAU), Cambridge, técnicas de estudio, robótica e informática.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipsacademy.es").replace(/\/$/, ""),
  origin: ORIGIN,

  phone: { display: "641 77 09 21", href: "tel:+34641770921", e164: "+34641770921" },
  whatsapp: "34641770921",
  email: "info@tipsacademy.es",
  address: {
    street: "C/ Porto Lagos 1, posterior",
    postalCode: "28924",
    city: "Alcorcón",
    region: "Madrid",
    full: "Calle Porto Lagos 1 (posterior), 28924 Alcorcón, Madrid",
  },
  maps: { query: "Tips Academy, Calle Porto Lagos 1, Alcorcón" },
  hours: [
    { label: "Mañanas", days: "Lunes a viernes", opens: "09:30", closes: "13:00", display: "9:30 – 13:00" },
    { label: "Tardes", days: "Lunes a viernes", opens: "16:00", closes: "20:30", display: "16:00 – 20:30" },
  ],
  social: [
    { name: "Instagram", href: "https://www.instagram.com/academia_apoyotips/" },
    { name: "Facebook", href: "https://www.facebook.com/AcademiaClasesdeApoyoTips" },
    { name: "YouTube", href: "https://youtube.com/channel/UCnVfvjEXH1I5jDdTRk1HvXw" },
    { name: "X (Twitter)", href: "https://twitter.com/_TipsAcademy" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/tips-academy-academia-alcorc%C3%B3n-a1b666257/" },
    { name: "Pinterest", href: "https://www.pinterest.com/Tips_Academy/" },
  ],
  links: {
    matricula: `${ORIGIN}/formulario-de-matriculacion/`,
    recursos: `${ORIGIN}/recursos/`,
    blog: `${ORIGIN}/t-blog/`,
    foro: `${ORIGIN}/community`,
    aulaVirtual: `${ORIGIN}/software/`,
    googleReviews: "https://www.google.com/maps/search/?api=1&query=Tips+Academy+Alcorc%C3%B3n",
  },
  legal: {
    owner: "[Razón social del titular]",
    taxId: "[NIF/CIF]",
    registry: "[Datos registrales, si procede]",
    lastUpdated: "octubre de 2026",
  },
} as const

export const fullAddress = site.address.full
export const mapsLinkHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.maps.query)}`
export const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.maps.query)}&z=17&output=embed`
export const waHref = (text = "¡Hola! Me gustaría recibir información sobre Tips Academy.") =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`

/** Frases con alma de pizarra: eslóganes y citas de la web actual. */
export const quotes = {
  franklin: {
    text: "Dime y lo olvido, enséñame y lo recuerdo, involúcrame y lo aprendo.",
    author: "Benjamin Franklin",
    role: "político estadounidense",
  },
  lewis: {
    text: "La tarea del educador moderno no es talar selvas, sino regar desiertos.",
    author: "C. S. Lewis",
    role: "novelista británico",
  },
} as const

export const slogans = {
  tips: "TIPS: consejos.",
  together: "Entre todos hacemos TIPS",
  yours: "¡Tu academia de apoyo!",
  never: "Nunca es tarde para mejorar tu futuro",
  learn: "A estudiar también se aprende",
}

export type NavItem = { label: string; href: string; external?: boolean; children?: NavItem[] }

export const nav: NavItem[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Nosotros",
    href: "/quienes-somos",
    children: [
      { label: "Quiénes somos", href: "/quienes-somos" },
      { label: "Metodología", href: "/metodologia" },
    ],
  },
  {
    label: "Servicios",
    href: "/servicios",
    children: [
      { label: "Intensivo de Selectividad (EvAU) 2025/2026", href: `${ORIGIN}/intensivo-de-selectividad-evau-2025-2026/`, external: true },
      { label: "Clases grupales de apoyo escolar", href: `${ORIGIN}/servicios/clases-grupales-de-apoyo-escolar/`, external: true },
      { label: "Técnicas de estudio", href: `${ORIGIN}/servicios/tecnicas-de-estudio/`, external: true },
      { label: "Tips Software", href: `${ORIGIN}/software/`, external: true },
      { label: "Cursos de robótica", href: `${ORIGIN}/servicios/clases-robotica/`, external: true },
      { label: "Certificados Cambridge", href: `${ORIGIN}/servicios/certificados-cambridge/`, external: true },
      { label: "Educación financiera", href: `${ORIGIN}/servicios/educacion-financiera/`, external: true },
      { label: "Cursos de informática", href: `${ORIGIN}/servicios/cursos-de-informatica/`, external: true },
    ],
  },
  {
    label: "Recursos",
    href: `${ORIGIN}/recursos/`,
    external: true,
    children: [
      { label: "Material EvAU", href: `${ORIGIN}/recursos/material-evau/`, external: true },
      { label: "2º Bachillerato", href: `${ORIGIN}/recursos/2bachillerato/`, external: true },
      { label: "1º Bachillerato", href: `${ORIGIN}/recursos/1bachillerato/`, external: true },
      { label: "4º ESO", href: `${ORIGIN}/recursos/4eso/`, external: true },
      { label: "3º ESO", href: `${ORIGIN}/recursos/3eso/`, external: true },
      { label: "2º ESO", href: `${ORIGIN}/recursos/2eso/`, external: true },
      { label: "Acceso a Grado Superior", href: `${ORIGIN}/recursos/acceso-a-grado-superior/`, external: true },
    ],
  },
  { label: "Contacto", href: "/contacto" },
  { label: "t-Blog", href: `${ORIGIN}/t-blog/`, external: true },
  { label: "TIPS Foro", href: `${ORIGIN}/community`, external: true },
]

export const recursos = nav.find((n) => n.label === "Recursos")!.children!

export const stats = [
  { value: 4221, label: "Alumnos matriculados", color: "yellow" },
  { value: 18, label: "Asignaturas disponibles", color: "teal" },
  { value: 932, label: "Aprobados EvAU", color: "rose" },
  { value: 43, label: "Talleres expuestos", color: "orange" },
] as const

export type Sticky = "yellow" | "rose" | "teal" | "orange" | "sky" | "mint" | "coral"

export type Service = {
  slug: string
  title: string
  slogan: string
  text: string
  href: string
  color: Sticky
  icon: string
  home?: boolean
}

export const services: Service[] = [
  {
    slug: "apoyo-grupal",
    title: "Clases de apoyo grupales",
    slogan: "Todos los niveles y asignaturas",
    text: "Acude de forma presencial a la academia para recibir apoyo y refuerzo en todas las asignaturas y niveles.",
    href: `${ORIGIN}/servicios/clases-grupales-de-apoyo-escolar/`,
    color: "yellow",
    icon: "users",
    home: true,
  },
  {
    slug: "selectividad",
    title: "Intensivo de Selectividad",
    slogan: "Prepara la EvAU de la mejor manera posible",
    text: "Todas las asignaturas, 1 hora por asignatura durante 10 días y material propio de Selectividad.",
    href: `${ORIGIN}/intensivo-de-selectividad-evau-2025-2026/`,
    color: "rose",
    icon: "graduation",
    home: true,
  },
  {
    slug: "tecnicas-estudio",
    title: "Técnicas de estudio",
    slogan: "A estudiar también se aprende",
    text: "Periódicamente convocamos talleres para mejorar las capacidades de estudio y aprendizaje de nuestros alumnos.",
    href: `${ORIGIN}/servicios/tecnicas-de-estudio/`,
    color: "teal",
    icon: "brain",
    home: true,
  },
  {
    slug: "robotica",
    title: "Cursos de robótica",
    slogan: "Hacer del juego una profesión",
    text: "Damos a los alumnos las herramientas que necesitarán en una de las profesiones con más proyección del mercado.",
    href: `${ORIGIN}/servicios/clases-robotica/`,
    color: "orange",
    icon: "bot",
    home: true,
  },
  {
    slug: "julio",
    title: "Clases y cursos en julio",
    slogan: "Aprovecha julio para ponerte a punto",
    text: "Clases de apoyo por las mañanas e intensivos de inglés, tanto para B2 como para C1.",
    href: `${ORIGIN}/servicios/`,
    color: "sky",
    icon: "sun",
    home: true,
  },
  {
    slug: "cambridge",
    title: "Certificados Cambridge",
    slogan: "Preparación de exámenes oficiales",
    text: "En todas las carreras se exige un nivel mínimo de B2: con nosotros podrás preparar B2 y C1 sin ningún problema.",
    href: `${ORIGIN}/servicios/certificados-cambridge/`,
    color: "mint",
    icon: "languages",
    home: true,
  },
  {
    slug: "particulares",
    title: "Clases particulares",
    slogan: "Un profesor solo para ti",
    text: "A domicilio, en el centro u online, con un plan de aprendizaje personalizado y adaptado al estudiante.",
    href: `${ORIGIN}/servicios/clases-grupales-o-particulares/`,
    color: "coral",
    icon: "user",
  },
  {
    slug: "club-rol",
    title: "Club de Rol y Juegos de Mesa",
    slogan: "Ofreciendo ocio alternativo",
    text: "En un espacio seguro y controlado, brindamos la oportunidad de un ocio alternativo y saludable.",
    href: `${ORIGIN}/servicios/`,
    color: "yellow",
    icon: "dice",
  },
  {
    slug: "informatica",
    title: "Cursos de informática",
    slogan: "Programación y nuevas tecnologías",
    text: "Formación en informática y programación para estar más cerca de la profesión que deseas.",
    href: `${ORIGIN}/servicios/cursos-de-informatica/`,
    color: "teal",
    icon: "laptop",
  },
  {
    slug: "educacion-financiera",
    title: "Educación financiera",
    slogan: "Aprende a manejar tu dinero",
    text: "Conceptos básicos de economía personal explicados de forma práctica y cercana.",
    href: `${ORIGIN}/servicios/educacion-financiera/`,
    color: "orange",
    icon: "piggy",
  },
]

export const homeServices = services.filter((s) => s.home)

export const team = [
  { name: "Salma Aitja Fernández", role: "Profesora de Inglés y Primaria", color: "rose" },
  { name: "Sara Khamlichi", role: "Maestra especialista en Audición y Lenguaje e Inglés", color: "teal" },
  { name: "Rubén", role: "Profesor polivalente", color: "yellow" },
  { name: "Carlos Campelo Montero", role: "Profesor de Ciencias e Inglés", color: "sky" },
  { name: "Javier Plaza González", role: "Director y profesor polivalente", color: "orange" },
  { name: "Carlos Muñoz Rivas", role: "Jefe de estudios", color: "mint" },
] as const

/** Extractos de reseñas públicas de Google mostradas en la web actual (nombre abreviado). */
export const reviews = {
  rating: "5,0",
  count: 177,
  items: [
    { author: "Marta L.", when: "hace 5 meses", text: "Una academia maravillosa. Me han ayudado siempre que lo he necesitado. Los profesores son personas increíblemente listas y súper simpáticas." },
    { author: "Santi H.", when: "hace 5 meses", text: "He estado en un montón de academias, y la verdad es que esta es la única que me ha servido. La recomiendo al 100 %." },
    { author: "Lina C.", when: "hace 5 meses", text: "¡Muy profesionales! Explican muy bien, Javi y Carlos, profes de 10." },
    { author: "Miguel Ángel M.", when: "hace 3 años", text: "Fui por recomendación, pero me quedé por el profesorado, el método educativo y el cariño que le ponen a cada alumno." },
    { author: "Jhojan S.", when: "hace 4 meses", text: "Excelente academia para prepararse la PAU, con excelentes profesores siempre dispuestos a ayudar." },
    { author: "Mario R.", when: "hace 5 meses", text: "Tienen un intensivo de selectividad increíble con unos profesores estupendos." },
    { author: "Candela G.", when: "hace un año", text: "Tienen muy buen rollo en la academia, así que hasta se te hace agradable ir a clase." },
    { author: "Jessica M.", when: "hace un año", text: "100 % recomendable. Sara trata a los niños con un cariño increíble y eso hace que solo quieran estar con ella." },
    { author: "Débora R.", when: "hace 12 meses", text: "Mi hija va los sábados y está encantada con la profesora. ¡Mil gracias por ayudarla en este proceso!" },
  ],
}

export const testimonials = [
  {
    author: "Adriana O.",
    role: "Doctora en Biomedicina",
    text: "Con TIPS preparé mi examen de Advanced y no solo pude compaginar mi trabajo y el estudio para sacar el examen: mi mejora en el idioma ha sido enorme.",
  },
  {
    author: "Gema L.",
    role: "Gestión de eventos",
    text: "Preparé con ellos la selectividad. Fueron súper comprometidos con mis estudios. TIPS fue justo el empujón que necesitaba.",
  },
]

export const successRates = [
  { label: "Clases de preparación para la EvAU", value: 92 },
  { label: "Acceso a Grado Superior, Medio y título de la ESO", value: 89 },
  { label: "Acceso a la universidad para mayores de 25 años", value: 100 },
  { label: "Preparación de exámenes oficiales de inglés", value: 82 },
  { label: "Cursos y talleres", value: 100 },
]

export const posts = [
  {
    title: "Se blinda la Selectividad con inhibidores de frecuencia",
    date: "11 may 2026",
    excerpt: "Selectividad 2026: por qué este año «jugársela» con la IA no es una opción. Las autoridades educativas se ponen serias para garantizar la igualdad.",
    href: `${ORIGIN}/se-blinda-la-selectividad-con-inhibidores-de-frecuencia/`,
  },
  {
    title: "¡Cambio de reglas en la Selectividad 2026! Todo lo que necesitas saber (sin dramas)",
    date: "27 abr 2026",
    excerpt: "La Selectividad de 2026 (ahora PAU) viene con curvas. Pero que no cunda el pánico: en la academia ya nos hemos empollado el BOE.",
    href: `${ORIGIN}/cambio-de-reglas-en-la-selectividad-2026-%f0%9f%8e%93-todo-lo-que-necesitas-saber-sin-dramas/`,
  },
]

export const whatsappTopics = [
  "Clases de apoyo",
  "Clases particulares",
  "Talleres de técnicas de estudio",
  "Cursos de robótica",
  "Club de Rol",
]
