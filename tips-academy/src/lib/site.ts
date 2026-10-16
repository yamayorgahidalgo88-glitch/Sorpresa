/**
 * Contenido de Tips Academy (tomado de la web actual, tipsacademy.es).
 * Todo lo editable vive aquí. Todas las secciones tienen su página propia en esta web.
 */

export const site = {
  name: "Tips Academy",
  tagline: "Tu academia de apoyo en Alcorcón",
  description:
    "Academia de apoyo escolar e inglés en Alcorcón: clases grupales y particulares, intensivo de Selectividad (EvAU), Cambridge, técnicas de estudio, robótica e informática.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipsacademy.es").replace(/\/$/, ""),

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
    matricula: "/matricula",
    recursos: "/recursos",
    blog: "/t-blog",
    foro: "/foro",
    aulaVirtual: "/aula-virtual",
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
  garrisson: {
    text: "Un maestro es una brújula que activa los imanes de la curiosidad, el conocimiento y la sabiduría en los alumnos.",
    author: "Ever Garrisson",
    role: "maestro de educación infantil",
  },
  emerson: {
    text: "El educador es el hombre que hace que las cosas difíciles parezcan fáciles.",
    author: "Ralph Waldo Emerson",
    role: "poeta norteamericano",
  },
} as const

export type QuoteKey = keyof typeof quotes

export const slogans = {
  tips: "TIPS: consejos.",
  together: "Entre todos hacemos TIPS",
  yours: "¡Tu academia de apoyo!",
  never: "Nunca es tarde para mejorar tu futuro",
  learn: "A estudiar también se aprende",
}

export type Sticky = "yellow" | "rose" | "teal" | "orange" | "sky" | "mint" | "coral"

export type Service = {
  slug: string
  title: string
  slogan: string
  /** texto corto para tarjetas */
  text: string
  color: Sticky
  icon: string
  home?: boolean
  /** página de detalle */
  intro: string[]
  features?: { title: string; text: string }[]
  subjects?: string[]
  note?: string
  quote: QuoteKey
}

export const services: Service[] = [
  {
    slug: "intensivo-selectividad",
    title: "Intensivo de Selectividad",
    slogan: "Prepara la EvAU de la mejor manera posible",
    text: "Todas las asignaturas, 1 hora por asignatura durante 10 días y material propio de Selectividad.",
    color: "rose",
    icon: "graduation",
    home: true,
    intro: [
      "Un año más estamos contigo para preparar esta prueba tan importante con nuestro ya famoso Intensivo de Selectividad (EvAU 2025/2026) en nuestra academia de Alcorcón.",
      "¿Lo prefieres de forma particular? También te ayudamos: un profesor solo para ti en un intensivo de 15 horas para afrontar con seguridad la prueba de acceso a la universidad.",
    ],
    features: [
      { title: "Grupos reducidos", text: "Clases presenciales con pocos alumnos para sacarle el máximo partido." },
      { title: "Material propio", text: "Cuadernillos Intensivo de Selectividad hechos por nuestros profesores." },
      { title: "10 días, 1 hora por asignatura", text: "Justo antes de Selectividad, cuando más lo necesitas." },
      { title: "Solo material de Selectividad", text: "Trabajamos exclusivamente exámenes de cursos anteriores." },
      { title: "11 asignaturas", text: "Tanto de ciencias como de letras." },
      { title: "Profes especialistas", text: "Muchos años de experiencia en la prueba de Selectividad (EvAU)." },
    ],
    subjects: ["Matemáticas II", "Matemáticas CCSS", "Física", "Química", "Economía", "Lengua y Literatura", "Biología", "Filosofía", "Inglés", "Historia", "Geografía"],
    quote: "franklin",
  },
  {
    slug: "clases-grupales",
    title: "Clases de apoyo grupales",
    slogan: "Todos los niveles y asignaturas",
    text: "Acude de forma presencial a la academia para recibir apoyo y refuerzo en todas las asignaturas y niveles.",
    color: "yellow",
    icon: "users",
    home: true,
    intro: [
      "Nos comprometemos a darte el respaldo necesario para alcanzar el éxito académico con clases de apoyo diseñadas para las necesidades de cada estudiante, en un espacio colaborativo donde superar los retos.",
      "Desde matemáticas hasta lengua y ciencias, reforzamos conceptos clave, aclaramos dudas y damos atención personalizada, con acceso gratuito a todos los apuntes y ejercicios de nuestra web.",
    ],
    features: [
      { title: "Colaboración entre compañeros", text: "Trabajar juntos fomenta el intercambio de ideas y un aprendizaje más efectivo." },
      { title: "Motivación compartida", text: "La dinámica de grupo inspira a esforzarse y superar retos con confianza." },
      { title: "Feedback al momento", text: "Los profes corrigen y explican los errores al instante para afianzar lo aprendido." },
      { title: "Profes especializados", text: "Cada alumno tiene su ritmo y nuestros profesores se adaptan a él." },
    ],
    note: "Las clases son presenciales en nuestra academia de Alcorcón.",
    quote: "garrisson",
  },
  {
    slug: "clases-particulares",
    title: "Clases particulares",
    slogan: "Un profesor solo para ti",
    text: "A domicilio, en la academia u online, con un plan de aprendizaje personalizado y adaptado al estudiante.",
    color: "coral",
    icon: "user",
    intro: [
      "En las clases grupales, aun siendo en grupo, el profesor trabaja de forma personalizada con cada alumno aplicando nuestro método de aula invertida.",
      "En las clases particulares cuentas con dedicación total del profesor, flexibilidad de horarios y la posibilidad de elegir entre un equipo de más de 10 profesores según tus necesidades.",
    ],
    features: [
      { title: "En tu casa", text: "El profesor va a tu domicilio." },
      { title: "En la academia", text: "En nuestras aulas de Alcorcón (según disponibilidad)." },
      { title: "Online", text: "Desde donde estés, con la misma atención personalizada." },
      { title: "Tú eliges", text: "Horarios flexibles y más de 10 profesores titulados." },
    ],
    quote: "garrisson",
  },
  {
    slug: "tecnicas-de-estudio",
    title: "Técnicas de estudio",
    slogan: "A estudiar también se aprende",
    text: "Periódicamente convocamos talleres para mejorar las capacidades de estudio y aprendizaje de nuestros alumnos.",
    color: "teal",
    icon: "brain",
    home: true,
    intro: [
      "Talleres orientados principalmente a ESO y Bachillerato: 4 sesiones de 1 hora, de forma presencial en nuestro centro de Alcorcón. Hacemos entre 4 y 6 talleres al año. ¡Plazas limitadas!",
      "Entendemos cómo funciona nuestro cerebro para elegir la mejor manera de estudiar, y te ayudamos a desarrollar tu propia metodología según tus capacidades, fortalezas y flaquezas.",
      "Organización, resumen, subrayado, esquemas y buenos hábitos: para que estudiar deje de ser un suplicio y se convierta en algo activo, ameno y productivo.",
    ],
    features: [
      { title: "Organización", text: "Planifica tu tiempo y tus tareas." },
      { title: "Resumen y esquema", text: "Quédate con lo importante." },
      { title: "Subrayado", text: "Lee de forma activa." },
      { title: "Hábitos", text: "Motivación y capacidad de esfuerzo." },
    ],
    quote: "garrisson",
  },
  {
    slug: "robotica",
    title: "Cursos de robótica",
    slogan: "Hacer del juego una profesión",
    text: "Damos a los alumnos las herramientas que necesitarán en una de las profesiones con más proyección del mercado.",
    color: "orange",
    icon: "bot",
    home: true,
    intro: [
      "Construir, programar y probar: en nuestros cursos de robótica los alumnos aprenden jugando y desarrollan habilidades de una de las profesiones con más proyección del mercado.",
      "Consúltanos grupos, edades y horarios disponibles.",
    ],
    features: [
      { title: "Aprender jugando", text: "Retos prácticos que enganchan." },
      { title: "Programación", text: "Primeros pasos en lógica y código." },
      { title: "Trabajo en equipo", text: "Proyectos que se resuelven entre todos." },
    ],
    quote: "garrisson",
  },
  {
    slug: "julio",
    title: "Clases y cursos en julio",
    slogan: "Aprovecha julio para ponerte a punto",
    text: "Clases de apoyo por las mañanas e intensivos de inglés, tanto para B2 como para C1.",
    color: "sky",
    icon: "sun",
    home: true,
    intro: [
      "El verano es el mejor momento para recuperar asignaturas o adelantar el curso siguiente sin presión.",
      "En julio tenemos clases de apoyo por las mañanas e intensivos de inglés para B2 y C1.",
    ],
    features: [
      { title: "Apoyo por las mañanas", text: "Recupera o refuerza asignaturas." },
      { title: "Intensivo B2", text: "Prepárate para el First." },
      { title: "Intensivo C1", text: "Prepárate para el Advanced." },
    ],
    quote: "emerson",
  },
  {
    slug: "cambridge",
    title: "Certificados Cambridge",
    slogan: "Preparación de exámenes oficiales",
    text: "En todas las carreras se exige un nivel mínimo de B2: con nosotros podrás preparar B2 y C1 sin ningún problema.",
    color: "mint",
    icon: "languages",
    home: true,
    intro: [
      "El inglés es oficial en 57 países y lo hablan más de 1.000 millones de personas. Con un B2 puedes desenvolverte con fluidez, optar a mejores trabajos y acceder a más información de calidad.",
      "Nuestros profesores conocen a fondo cada examen de Cambridge y te preparan de forma más rápida y eficaz, trabajando justo lo que se evalúa el día de la prueba.",
    ],
    features: [
      { title: "Grupos B2 y C1", text: "De 19:30 a 21:00, dos días a la semana, y sábados por la mañana." },
      { title: "Libro incluido", text: "Ejercicios y exámenes de práctica para coger ritmo." },
      { title: "Profes especialistas", text: "Muy familiarizados con cada examen oficial." },
    ],
    quote: "emerson",
  },
  {
    slug: "informatica",
    title: "Cursos de informática",
    slogan: "La tecnología ha llegado para quedarse",
    text: "Windows, paquete Office, navegación web, edición de imágenes y comunicaciones, adaptado a la vida académica.",
    color: "teal",
    icon: "laptop",
    intro: [
      "La informática forma parte de nuestro día a día. Nuestro curso está adaptado a lo que el alumnado necesitará en su vida académica, con un profesional de la informática al frente.",
      "Dos horas a la semana, 8 € por hora y una matrícula de 10 € al inicio del curso. No hace falta traer material: cada alumno tiene un portátil en nuestras aulas de informática.",
    ],
    features: [
      { title: "Entorno Windows", text: "Maneja tu ordenador con soltura." },
      { title: "Paquete Office", text: "Documentos, hojas de cálculo y presentaciones." },
      { title: "Navegación web", text: "Busca y usa la información de forma segura." },
      { title: "Edición de imágenes", text: "Primeros pasos con programas de edición." },
    ],
    quote: "emerson",
  },
  {
    slug: "educacion-financiera",
    title: "Educación financiera",
    slogan: "Charlas gratuitas",
    text: "Charlas gratuitas con nuestro consultor de confianza para tomar mejores decisiones con tu dinero.",
    color: "orange",
    icon: "piggy",
    intro: [
      "Charlas GRATUITAS de educación financiera de la mano de nuestro consultor de confianza, Sergio F. Borrás.",
      "Jubilación, ahorro para tus hijos, comprar una casa, acortar la hipoteca, gestionar tus ahorros, ventajas fiscales y protección de tu familia: hay muchas opciones y factores a tener en cuenta. ¿Cuáles necesitas?",
      "La educación financiera ayuda a tomar decisiones y a administrar mejor el dinero para mejorar tu calidad de vida y cumplir tus objetivos.",
    ],
    note: "¿Te interesa? Contacta con nosotros y te avisamos de las próximas charlas.",
    quote: "garrisson",
  },
  {
    slug: "club-rol",
    title: "Club de Rol y Juegos de Mesa",
    slogan: "Ofreciendo ocio alternativo",
    text: "En un espacio seguro y controlado, brindamos la oportunidad de un ocio alternativo y saludable.",
    color: "yellow",
    icon: "dice",
    intro: [
      "Un espacio seguro y controlado donde disfrutar de un ocio alternativo y saludable con juegos de rol y de mesa.",
      "Imaginación, estrategia y trabajo en equipo… ¡y muchas risas!",
    ],
    quote: "emerson",
  },
  {
    slug: "software",
    title: "Tips Software",
    slogan: "Software y aplicaciones web a medida",
    text: "Desarrollo de software y aplicaciones web a medida para empresas: CRM, portales de clientes, inventarios y comercio electrónico.",
    color: "sky",
    icon: "code",
    intro: [
      "La digitalización ya no es una opción, sino una necesidad. En Tips Software diseñamos software y aplicaciones web a medida que se adaptan como un guante a cada negocio.",
      "Aplicaciones accesibles desde cualquier navegador y dispositivo: gestión de inventarios, portales de clientes, CRM sectoriales o comercio electrónico, con una gran experiencia de usuario.",
      "Te acompañamos desde la consultoría y el prototipo hasta el despliegue y el mantenimiento.",
    ],
    features: [
      { title: "Escalabilidad", text: "Tu software crece con tu empresa." },
      { title: "Seguridad", text: "Arquitecturas modernas y cifrado profesional." },
      { title: "Integración", text: "Conectado con las herramientas que ya usas." },
    ],
    quote: "emerson",
  },
]

export const homeServices = services.filter((s) => s.home)
export const serviceHref = (slug: string) => `/servicios/${slug}`
export const academicServices = services.filter((s) => s.slug !== "software")

export type NavItem = { label: string; href: string; children?: NavItem[] }

export type Course = { slug: string; title: string; color: Sticky; subjects: string[] }

export const courses: Course[] = [
  { slug: "material-evau", title: "Material EvAU", color: "rose", subjects: ["Matemáticas II", "Matemáticas CCSS", "Física", "Química", "Biología", "Lengua y Literatura", "Historia", "Geografía", "Filosofía", "Economía", "Inglés"] },
  { slug: "2-bachillerato", title: "2º Bachillerato", color: "yellow", subjects: ["Matemáticas II", "Matemáticas CCSS", "Física", "Química", "Biología", "Lengua y Literatura", "Historia de España", "Economía", "Inglés"] },
  { slug: "1-bachillerato", title: "1º Bachillerato", color: "teal", subjects: ["Matemáticas I", "Matemáticas CCSS", "Física y Química", "Biología", "Lengua y Literatura", "Filosofía", "Economía", "Inglés"] },
  { slug: "4-eso", title: "4º ESO", color: "orange", subjects: ["Matemáticas", "Física y Química", "Biología", "Lengua", "Geografía e Historia", "Inglés"] },
  { slug: "3-eso", title: "3º ESO", color: "sky", subjects: ["Matemáticas", "Física y Química", "Biología", "Lengua", "Geografía e Historia", "Inglés"] },
  { slug: "2-eso", title: "2º ESO", color: "mint", subjects: ["Matemáticas", "Física y Química", "Lengua", "Geografía e Historia", "Inglés"] },
  { slug: "mayores-25", title: "Mayores de 25 años", color: "coral", subjects: ["Comentario de texto", "Lengua castellana", "Inglés", "Materias específicas"] },
  { slug: "grado-superior", title: "Acceso a Grado Superior", color: "yellow", subjects: ["Lengua", "Matemáticas", "Inglés", "Materias específicas"] },
  { slug: "grado-medio", title: "Acceso a Grado Medio", color: "teal", subjects: ["Lengua", "Matemáticas", "Ciencias", "Sociales"] },
  { slug: "ingles", title: "Inglés", color: "rose", subjects: ["Grammar", "Reading", "Writing", "Listening", "B2 First", "C1 Advanced"] },
]

/** Las 18 asignaturas disponibles (pendiente de confirmar con la academia). */
export const subjects = [
  { name: "Matemáticas", levels: "Primaria · ESO · Bachillerato" },
  { name: "Matemáticas CCSS", levels: "Bachillerato" },
  { name: "Lengua y Literatura", levels: "Primaria · ESO · Bachillerato" },
  { name: "Inglés", levels: "Todos los niveles · Cambridge" },
  { name: "Física", levels: "Bachillerato" },
  { name: "Química", levels: "Bachillerato" },
  { name: "Física y Química", levels: "ESO · 1º Bachillerato" },
  { name: "Biología", levels: "ESO · Bachillerato" },
  { name: "Geografía", levels: "ESO · Bachillerato" },
  { name: "Historia", levels: "ESO · Bachillerato" },
  { name: "Filosofía", levels: "Bachillerato" },
  { name: "Economía", levels: "ESO · Bachillerato" },
  { name: "Latín", levels: "ESO · Bachillerato" },
  { name: "Dibujo Técnico", levels: "Bachillerato" },
  { name: "Tecnología", levels: "ESO" },
  { name: "Francés", levels: "ESO · Bachillerato" },
  { name: "Informática", levels: "Todos los niveles" },
  { name: "Primaria (todas)", levels: "Apoyo global" },
]

export const nav: NavItem[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Nosotros",
    href: "/quienes-somos",
    children: [
      { label: "Quiénes somos", href: "/quienes-somos" },
      { label: "Metodología", href: "/metodologia" },
      { label: "Asignaturas", href: "/asignaturas" },
    ],
  },
  {
    label: "Servicios",
    href: "/servicios",
    children: services.map((s) => ({ label: s.title, href: serviceHref(s.slug) })),
  },
  {
    label: "Recursos",
    href: "/recursos",
    children: courses.map((c) => ({ label: c.title, href: `/recursos/${c.slug}` })),
  },
  { label: "Contacto", href: "/contacto" },
  { label: "t-Blog", href: "/t-blog" },
  { label: "TIPS Foro", href: "/foro" },
]

export const stats = [
  { value: 4221, label: "Alumnos matriculados", color: "yellow", href: "/quienes-somos#testimonios" },
  { value: 18, label: "Asignaturas disponibles", color: "teal", href: "/asignaturas" },
  { value: 932, label: "Aprobados EvAU", color: "rose", href: "/servicios/intensivo-selectividad" },
  { value: 43, label: "Talleres impartidos", color: "orange", href: "/servicios/tecnicas-de-estudio" },
] as const

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
  rating: "5",
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

export type Block = { h?: string; p?: string; list?: { b?: string; t: string }[] }

export type Post = { slug: string; title: string; date: string; iso: string; excerpt: string; color: Sticky; body: Block[] }

export const posts: Post[] = [
  {
    slug: "se-blinda-la-selectividad-con-inhibidores-de-frecuencia",
    title: "Se blinda la Selectividad con inhibidores de frecuencia",
    date: "11 may 2026",
    iso: "2026-05-11",
    color: "rose",
    excerpt: "Selectividad 2026: por qué este año «jugársela» con la IA no es una opción. Las autoridades educativas se ponen serias para garantizar la igualdad.",
    body: [
      { h: "🛑 Selectividad 2026: por qué este año «jugársela» con la IA no es una opción" },
      { p: "Si estás preparando la EvAU / PAU 2026, seguro que ya has leído las noticias: las reglas del juego están cambiando. Con el avance de la Inteligencia Artificial, las autoridades educativas han decidido ponerse serias para garantizar que todos los alumnos jueguen limpio." },
      { h: "📵 Detectores de frecuencia y vigilancia reforzada" },
      { p: "Este año, cuatro comunidades autónomas ya han anunciado que van a «blindar» sus aulas de examen con detectores de frecuencia: cualquier dispositivo electrónico (móviles, relojes inteligentes o pinganillos) será detectado al instante. Estas son las medidas clave:" },
      {
        list: [
          { b: "Prohibición total:", t: "móviles y relojes inteligentes apagados (no vale el modo avión) y guardados en las zonas designadas." },
          { b: "Vigilancia extrema:", t: "más vocales y más atención para detectar comportamientos sospechosos." },
          { b: "Tolerancia cero:", t: "copiar o llevar material no permitido supone un CERO automático en todos los exámenes de esa convocatoria." },
        ],
      },
      { h: "🚀 La verdadera «inteligencia» es ir bien preparado" },
      { p: "Sabemos que los nervios pueden hacerte pensar en atajos, pero no los necesitas. Con nuestro Intensivo EvAU (del 18 al 29 de mayo) te damos las herramientas reales para que tu nota dependa de ti:" },
      {
        list: [
          { b: "Repaso total del temario:", t: "sin dejar flecos sueltos." },
          { b: "Resolución de exámenes reales:", t: "para que sepas exactamente a qué te enfrentas." },
          { b: "Simulacros de examen:", t: "para gestionar el tiempo y la presión." },
          { b: "Estrategias probadas:", t: "técnicas de estudio que funcionan mejor que cualquier «pinganillo»." },
        ],
      },
      { p: "No te arriesgues a un cero. La seguridad de saberte el temario es el mejor detector de éxitos que existe. ¡Quedan pocas plazas para nuestro intensivo!" },
    ],
  },
  {
    slug: "cambio-de-reglas-en-la-selectividad-2026",
    title: "¡Cambio de reglas en la Selectividad 2026! Todo lo que necesitas saber (sin dramas)",
    date: "27 abr 2026",
    iso: "2026-04-27",
    color: "sky",
    excerpt: "La Selectividad de 2026 (ahora PAU) viene con curvas. Pero que no cunda el pánico: en la academia ya nos hemos empollado el BOE.",
    body: [
      { h: "¡Hola, equipazo de Tips Academy!" },
      { p: "Si estás en Bachillerato o tienes a alguien en casa que lo esté, ya habrás oído que la Selectividad de 2026 (ahora PAU) viene con curvas. Que no cunda el pánico: nos hemos empollado el BOE para que tú solo tengas que preocuparte de estudiar. Las claves, rápidas y claritas:" },
      { h: "⏰ 1. Los 90 minutos de oro" },
      { p: "Los exámenes seguirán durando 90 minutos, con descansos de media hora entre pruebas. Un ratito para respirar, repasar y comerte una barrita." },
      { h: "🧠 2. Menos memoria, más «coco»" },
      { p: "El modelo cambia a un enfoque competencial: más preguntas de razonamiento y menos de «escupir» datos. Es un reto, ¡pero para eso estamos aquí, para enseñarte a pensar!" },
      { h: "✍️ 3. ¡Ojo con las faltas!" },
      { p: "La ortografía y la corrección gramatical pueden quitarte hasta un 10 % de la nota en todas las asignaturas, incluso en Matemáticas o Física." },
      { h: "🌍 4. ¿Igual para todos? Casi, casi…" },
      { p: "Se busca un examen más homogéneo en toda España: criterios de corrección y estructura mucho más parecidos entre comunidades." },
      { h: "📉 5. Adiós a la «carta blanca»" },
      { p: "Se acaba elegir entre opción A y B: el examen será más «único», con preguntas obligatorias y otras con elección interna. Toca llevar el temario mejor preparado que nunca." },
      { h: "¿Te agobia el cambio? Te cubrimos las espaldas 🚀" },
      { p: "Ya estamos adaptando materiales y simulacros al nuevo modelo competencial. Consejo extra: no lo dejes para el último mes. Ven a nuestro famoso Intensivo de Selectividad. ¡A por todas! 💪" },
    ],
  },
]

export const whatsappTopics = [
  "Clases de apoyo",
  "Clases particulares",
  "Talleres de técnicas de estudio",
  "Cursos de robótica",
  "Club de Rol",
]
