/**
 * Contenido de Tips Academy (tomado de la web actual, tipsacademy.es).
 * Todo lo editable vive aquí. Todas las secciones tienen su página propia en esta web.
 */

export const site = {
  name: "Tips Academy",
  tagline: "Tu academia de apoyo en Alcorcón",
  description:
    "Academia en Alcorcón con más de 15 años: clases de apoyo y particulares (presencial, a domicilio u online), Selectividad, inglés Cambridge y talleres.",
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
  learn: "Aprender también puede ser divertido",
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
  /** SEO: título y descripción para buscadores (si no, se usan title y text) */
  seoTitle?: string
  seoDescription?: string
  /** Apartados de texto ampliado. Admite **negritas**. */
  sections?: { title: string; body: string[] }[]
  /** Preguntas frecuentes del servicio. Admite **negritas** en la respuesta. */
  faq?: { q: string; a: string }[]
}

export const services: Service[] = [
  {
    slug: "intensivo-selectividad",
    seoTitle: "Intensivo de Selectividad (PAU / EvAU) 2026",
    seoDescription: "Curso intensivo de Selectividad en Alcorcón: 10 días, una hora por asignatura, material propio y exámenes de años anteriores. También en clases particulares.",
    sections: [
      {
        title: "Así es el intensivo",
        body: [
          "Durante los **10 días previos a la Selectividad** repasamos cada asignatura una hora al día, en grupos reducidos y con cuadernillos elaborados por nuestros profesores.",
          "Trabajamos solo con **exámenes de convocatorias anteriores**, para que llegues sabiendo qué te pueden preguntar y cómo responder. Y además del temario, practicamos la gestión del tiempo y de los nervios: llegar con un plan marca la diferencia.",
        ],
      },
    ],
    faq: [
      { q: "¿Qué asignaturas incluye?", a: "Hasta 11 asignaturas de ciencias y de letras: las tienes todas en el listado de esta página." },
      { q: "¿Puedo prepararla con un profesor solo para mí?", a: "Sí. Tenemos un **intensivo particular** de 15 horas con un profesor dedicado solo a ti." },
      { q: "¿Cuándo empieza?", a: "Justo antes de los exámenes de la PAU. Escríbenos y te confirmamos fechas y plazas disponibles." },
    ],
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
    seoTitle: "Clases de apoyo y refuerzo escolar en grupos reducidos",
    seoDescription: "Clases de apoyo grupales en Alcorcón para Primaria, ESO y Bachillerato: grupos reducidos, atención personalizada y método de aula invertida.",
    sections: [
      {
        title: "Refuerzo escolar en grupos reducidos",
        body: [
          "Nuestras **clases de apoyo** se dan en grupos reducidos para que cada alumno tenga su sitio: el profesor sigue su trabajo, resuelve sus dudas y le propone ejercicios a su nivel.",
          "Es la mejor forma de llevar el curso al día, preparar los exámenes con tiempo y ganar autonomía al estudiar.",
        ],
      },
      {
        title: "Primaria, ESO y Bachillerato",
        body: [
          "Hacemos **refuerzo escolar de Primaria, ESO y Bachillerato** en todas las asignaturas: matemáticas, lengua, inglés, física y química, biología, historia, economía… Tienes el listado completo más abajo.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuántos alumnos hay en cada grupo?", a: "Trabajamos con **grupos reducidos** para poder atender a cada alumno. Pregúntanos por la disponibilidad del grupo que te interesa." },
      { q: "¿Qué horario tenéis?", a: "La academia abre de lunes a viernes de 9:30 a 13:00 y de 16:00 a 20:30. Te ayudamos a elegir los días y horas que mejor encajan con tu semana." },
      { q: "¿Se pueden combinar con clases particulares?", a: "Sí, puedes combinar clases grupales y **clases particulares** según lo que necesites en cada momento del curso." },
    ],
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
    seoTitle: "Clases particulares con profesores titulados",
    seoDescription: "Clases particulares y profesores particulares para Primaria, ESO, Bachillerato, Selectividad e inglés: a domicilio, en nuestra academia de Alcorcón u online.",
    sections: [
      {
        title: "Clases particulares a tu medida",
        body: [
          "Una **clase particular** es la forma más directa de resolver dudas: un profesor, un alumno y un plan de trabajo pensado solo para él. Empezamos viendo en qué punto está, qué le cuesta y qué exámenes tiene por delante, y a partir de ahí organizamos las sesiones.",
          "Sirven para **recuperar una asignatura**, subir nota, preparar un examen concreto o coger hábito de estudio. Como el ritmo lo marca el alumno, avanzamos rápido en lo que ya domina y nos paramos en lo que le cuesta.",
        ],
      },
      {
        title: "Profesores particulares titulados",
        body: [
          "Contamos con un equipo de más de 10 **profesores particulares** titulados, especialistas en ciencias, letras e idiomas. Te ayudamos a elegir el que mejor encaja con la asignatura y con la forma de aprender del alumno.",
        ],
      },
      {
        title: "Todas las asignaturas y niveles",
        body: [
          "Damos **clases particulares de Primaria, ESO y Bachillerato**, preparación de la **Selectividad (PAU)**, acceso a Grado Medio y Superior, acceso a la universidad para mayores de 25 e **inglés**.",
        ],
      },
      {
        title: "A domicilio, en la academia u online",
        body: [
          "Tú eliges dónde: el profesor puede ir **a domicilio**, puedes venir a nuestra academia en Alcorcón o conectarte a **clases particulares online** desde cualquier lugar, con la misma atención personalizada. Los horarios se adaptan a tu semana.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuánto cuesta una clase particular?", a: "Depende del nivel, la asignatura y la modalidad (a domicilio, en la academia u online). Escríbenos o llámanos y te damos un **presupuesto sin compromiso**." },
      { q: "¿Sirven para preparar un examen concreto?", a: "Sí. Cuéntanos qué necesitas y vemos juntos la mejor opción: desde un repaso antes de un examen hasta un seguimiento durante todo el curso." },
      { q: "¿Las clases particulares online funcionan igual?", a: "Sí: el profesor explica, corrige y resuelve dudas en directo, y compartís materiales y ejercicios como en una clase presencial. Es una buena opción si vives lejos o tienes poco tiempo." },
      { q: "¿Qué diferencia hay con las clases grupales?", a: "En las grupales trabajas en un grupo reducido en la academia y el profesor atiende a cada alumno con nuestro método de aula invertida. En las particulares tienes al profesor **solo para ti** y total flexibilidad de horario y lugar." },
    ],
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
    seoTitle: "Taller de técnicas de estudio para ESO y Bachillerato",
    seoDescription: "Taller de técnicas de estudio: organización, resúmenes, esquemas, subrayado y hábitos para estudiar mejor en menos tiempo. Plazas limitadas.",
    sections: [
      {
        title: "Aprender a estudiar",
        body: [
          "Estudiar muchas horas no siempre da resultados. En el taller de **técnicas de estudio** aprendes a organizarte, a hacer **resúmenes y esquemas** que de verdad sirven y a memorizar de forma activa, para estudiar menos tiempo y mejor.",
        ],
      },
    ],
    title: "Técnicas de estudio",
    slogan: "Estudia mejor, no más",
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
    seoTitle: "Cursos de robótica y programación para niños y jóvenes",
    seoDescription: "Cursos de robótica y programación: los alumnos construyen y programan sus propios proyectos mientras aprenden lógica, creatividad y trabajo en equipo.",
    sections: [
      {
        title: "Robótica y programación",
        body: [
          "En los **cursos de robótica** los alumnos montan y programan sus propios proyectos, y aprenden **programación**, lógica y pensamiento computacional mientras se divierten.",
          "Es una actividad que potencia la creatividad, la resolución de problemas y el trabajo en equipo.",
        ],
      },
    ],
    faq: [
      { q: "¿Para qué edades son?", a: "Consúltanos los grupos y edades disponibles cada curso y te contamos cuál encaja mejor." },
    ],
    title: "Cursos de robótica",
    slogan: "Aprende jugando con la tecnología",
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
    seoTitle: "Clases de apoyo e intensivos de inglés en julio",
    seoDescription: "En julio: clases de apoyo por las mañanas para recuperar o adelantar asignaturas e intensivos de inglés B2 First y C1 Advanced.",
    sections: [
      {
        title: "Un verano para ponerse al día",
        body: [
          "Si te ha quedado alguna asignatura o quieres empezar el próximo curso con ventaja, en julio tenemos **clases de apoyo por las mañanas**. Y si tu objetivo es el inglés, los **intensivos B2 y C1** son la mejor forma de aprovechar el verano.",
        ],
      },
    ],
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
    seoTitle: "Preparación de exámenes Cambridge B2 First y C1 Advanced",
    seoDescription: "Prepara el B2 First o el C1 Advanced de Cambridge: grupos entre semana y los sábados, libro incluido y profesores especialistas en cada examen.",
    sections: [
      {
        title: "Clases de inglés con un objetivo",
        body: [
          "Nuestras **clases de inglés** están orientadas a aprobar el **B2 First** y el **C1 Advanced** de Cambridge: trabajamos las cuatro destrezas (reading, writing, listening y speaking) con el formato real del examen y simulacros para coger ritmo.",
          "Y si antes necesitas mejorar tu nivel, también damos **apoyo de inglés** de colegio, instituto y Bachillerato.",
        ],
      },
    ],
    faq: [
      { q: "¿Qué horario tienen los grupos?", a: "De 19:30 a 21:00, dos días a la semana, y también los sábados por la mañana." },
      { q: "¿Hay cursos intensivos?", a: "Sí, en julio hacemos **intensivos de B2 y C1**." },
    ],
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
    seoTitle: "Cursos de informática: Windows, Office e internet",
    seoDescription: "Curso de informática adaptado a la vida académica: Windows, Word, Excel, PowerPoint, navegación web y edición de imágenes. Portátil incluido en clase.",
    faq: [
      { q: "¿Cuánto cuesta?", a: "8 € la hora, dos horas a la semana, y una matrícula de 10 € al inicio del curso." },
      { q: "¿Tengo que traer ordenador?", a: "No: cada alumno tiene un portátil en nuestras aulas de informática." },
    ],
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
    seoTitle: "Club de Rol y Juegos de Mesa en Alcorcón",
    seoDescription: "Club de rol y juegos de mesa: ocio alternativo y saludable en un espacio seguro, para desarrollar imaginación, estrategia y trabajo en equipo.",
    sections: [
      {
        title: "Un ocio que también educa",
        body: [
          "Los **juegos de rol y de mesa** fomentan la imaginación, la comunicación y el pensamiento estratégico. En nuestro club se juega en grupo y en un ambiente seguro: un buen sitio para hacer amigos con los mismos intereses.",
        ],
      },
    ],
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

/** Preguntas frecuentes de la portada. Admite **negritas** en la respuesta. */
export const homeFaq = [
  { q: "¿Dónde está la academia?", a: "En la Calle Porto Lagos 1 (posterior), 28924 **Alcorcón** (Madrid). Abrimos de lunes a viernes de 9:30 a 13:00 y de 16:00 a 20:30." },
  { q: "¿Qué niveles y asignaturas dais?", a: "**Primaria, ESO, Bachillerato** y **Selectividad**, acceso a Grado Medio y Superior, acceso a la universidad para mayores de 25 e idiomas: 18 asignaturas de ciencias, letras e idiomas." },
  { q: "¿Dais clases particulares a domicilio u online?", a: "Sí. Además de las clases grupales en la academia, nuestros **profesores particulares** pueden ir a tu casa o darte la clase **online**, con horarios flexibles." },
  { q: "¿Cómo funciona el aula invertida?", a: "El alumno trabaja la teoría con los materiales que le damos y el tiempo de clase se dedica a **practicar, resolver dudas** y afianzar lo aprendido, al ritmo de cada uno." },
  { q: "¿Tenéis material gratuito?", a: "Sí: en Recursos tienes **más de 1000 archivos gratis** con apuntes, ejercicios y exámenes de ESO, Bachillerato y Selectividad." },
  { q: "¿Cómo reservo plaza?", a: "Rellena el formulario de **reserva de plaza**, escríbenos por WhatsApp o llámanos al 641 77 09 21. Te informamos gratis y sin compromiso." },
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
