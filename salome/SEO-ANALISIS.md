# Análisis SEO · Salomé Recio, talleres de arte en Alcorcón

Fecha: 13 de noviembre de 2026
Webs analizadas:
- **Nueva (prototipo):** https://salome-recio-talleres.vercel.app/
- **Actual (Wix):** https://creatividadsalome.wixsite.com/salo

Herramientas: repositorio `claude-seo` (chequeo automático de 47 puntos on-page con `page_checks.py`, guía de SEO local), medición de imágenes servidas y búsquedas reales en Google para las palabras clave del negocio.

---

## 1. Resumen en 30 segundos

- **La parte técnica de la web nueva está muy bien:** pasa 45 de 47 chequeos y solo tiene dos avisos menores (título y descripción un poco largos).
- **Lo que falta para posicionar en Alcorcón no está en el código, está fuera de la web:**
  1. Un **dominio propio** (ahora es `vercel.app`).
  2. Una **ficha de Google Business Profile** (la de Google Maps).
  3. **Reseñas.**
  4. **Una página por cada tipo de taller.**
- **Buena noticia:** apenas hay competencia online para "talleres de arte para niños en Alcorcón". Google enseña sobre todo PDFs del Ayuntamiento y directorios. Una web bien hecha y una ficha de Google Maps pueden colocarse arriba con relativa facilidad.

### Puntuación

| Área | Web nueva | Web Wix actual |
|---|---|---|
| SEO on-page (título, H1, descripción, enlaces) | 85/100 ████████░░ | 35/100 ███░░░░░░░ |
| Contenido | 55/100 █████░░░░░ | 45/100 ████░░░░░░ |
| Técnico (indexación, velocidad, móvil) | 85/100 ████████░░ | 55/100 █████░░░░░ |
| Datos estructurados (schema) | 65/100 ██████░░░░ | 0/100 ░░░░░░░░░░ |
| Imágenes | 90/100 █████████░ | 60/100 ██████░░░░ |
| **SEO local** (Google Maps, reseñas, directorios) | **20/100** ██░░░░░░░░ | 20/100 ██░░░░░░░░ |
| **Global** | **≈ 65/100** | ≈ 35/100 |

El SEO local pesa más que nada para un negocio de barrio. Ahí es donde está el margen de mejora.

---

## 2. Comparativa directa (datos del chequeo automático)

| Punto | Web nueva | Wix actual |
|---|---|---|
| Título | "Talleres de arte para niños y familias en Alcorcón \| Salomé Recio" (65 car.) | "Inicio \| Salo" (13 car.): no dice qué ni dónde |
| Meta descripción | Sí (168 car.) | **No tiene** |
| H1 | 1, incluye "talleres de arte… Alcorcón" | 1, solo el eslogan |
| Canonical | Sí, a sí misma | Sí |
| Datos estructurados | `LocalBusiness` + `Person` + 3 servicios | **Ninguno** |
| Imagen para compartir (og:image) | Sí | **No** |
| Peso del HTML | 23 KB | **1,39 MB** (60 veces más) |
| Palabras de contenido | 546 | 417 |
| robots.txt / sitemap.xml | Sí / Sí | Los de Wix |
| Avisos | 2 medios | 3 medios + 4 leves |

---

## 3. Problemas encontrados en la web nueva (por prioridad)

### 🔴 Críticos (bloquean el posicionamiento local)

1. **No hay ficha de Google Business Profile.** Es el factor nº 1 para salir en el mapa de Google ("talleres de arte cerca de mí"). Sin ficha, no apareces en Maps.
2. **El dominio es `salome-recio-talleres.vercel.app`.** Funciona, pero un dominio propio (por ejemplo `salomerecio.es` o `tallerescreativosalcorcon.es`) da confianza, se recuerda y no depende de Vercel. Hay que comprarlo antes de darlo de alta en Google.
3. **No hay reseñas.** Las reseñas pesan alrededor de un 20 % en el ranking local. A partir de unas 10 reseñas se nota el efecto.

### 🟠 Altos

4. **Una sola página para todo.** Google posiciona páginas, no webs. Hoy solo hay una URL que compite a la vez por "taller de pintura", "cerámica", "arte en familia", "cumpleaños"… Lo más eficaz para el SEO local es **una página por servicio**, por ejemplo:
   - `/talleres-de-arte-para-ninos-alcorcon`
   - `/taller-de-ceramica-para-ninos-alcorcon`
   - `/arte-en-familia-alcorcon`
   - `/ilustracion-personalizada`
   - `/talleres-en-colegios-y-eventos` (y cumpleaños, si los hace)
5. **Faltan las palabras que la gente busca.** El texto dice "arcilla" y "barro", pero la gente busca **"cerámica"**. Tampoco aparecen "cumpleaños", "extraescolares", "campamento", "edades" ni "precio", y son búsquedas habituales de padres.
6. **Faltan datos que Google y los padres quieren ver:** edades, horarios, precio orientativo, dónde se hacen los talleres (dirección o al menos barrio), número máximo de niños y qué incluye cada taller.

### 🟡 Medios

7. **Título algo largo** (65 caracteres; puede cortarse en los resultados a partir de ~60). Propuesta: *"Talleres de arte para niños en Alcorcón | Salomé Recio"* (55).
8. **Meta descripción algo larga** (168; se corta hacia 160). Propuesta (151): *"Talleres de pintura, cerámica y collage para niños y familias en Alcorcón. También llevamos los talleres a tu colegio, cumpleaños o evento."* (Lo de cumpleaños, solo si es verdad).
9. **Las URL de cada despliegue de Vercel también son públicas** (por ejemplo `salome-recio-talleres-xxxx.vercel.app`). El canonical evita el contenido duplicado, pero conviene activar la protección de los despliegues de prueba cuando haya dominio propio.
10. **El schema `LocalBusiness` está incompleto:** sin dirección, coordenadas, horario, `priceRange` ni `sameAs` (Instagram, Google). Se completa en cuanto Salomé dé esos datos (ver sección 6).

### 🟢 Bajos / ya bien

- ✅ Todas las imágenes tienen texto alternativo y medidas (sin saltos de diseño al cargar).
- ✅ Imágenes en AVIF y ligeras: la más pesada pesa 91 KB y la imagen para compartir 147 KB.
- ✅ HTML muy ligero (23 KB), versión móvil, `lang="es"`, título y H1 coherentes con el contenido.
- ✅ `robots.txt`, `sitemap.xml` y `llms.txt` (este último ayuda a que ChatGPT o Perplexity entiendan el negocio).
- ⚠️ **Fotos generadas con IA:** 5 de las imágenes se llaman literalmente `ai-generated-IMAGE.jpg`. Para la confianza de los padres (y para lo que Google llama E-E-A-T, la experiencia real) es mucho mejor usar **fotos reales de sus talleres**.

---

## 4. Lo que hay en Google ahora mismo (competencia)

Búsquedas hechas el 13/11/2026:

| Búsqueda | Qué aparece | Lectura |
|---|---|---|
| "talleres de arte para niños Alcorcón" | PDFs del Ayuntamiento (guías de cursos), Centro del Títere, Planomato, Universidad de Alcalá | **Ningún estudio privado bien posicionado** → hueco libre |
| "taller de cerámica Alcorcón niños" | Nada específico de Alcorcón para niños; guías antiguas municipales | **Oportunidad clara**: nadie cubre esta búsqueda |
| "talleres creativos cumpleaños niños Alcorcón pintura" | Atrápalo (Materia Gris, taller Glow Art), Cronoshare (animadores), Asociación Bitácora | Poca oferta específica de cumpleaños artísticos |

Directorios que Google ya posiciona para estas búsquedas y en los que conviene aparecer: **Planomato (sección Alcorcón niños), Cronoshare, Atrápalo** y la **guía de cursos del Ayuntamiento** (preguntar si admiten actividades privadas o colaboraciones).

---

## 5. Plan de acción

### Esta semana (gratis o casi)
1. **Crear la ficha de Google Business Profile.**
   - Categoría principal: "Taller de arte" o "Escuela de arte". Secundarias: "Centro de actividades infantiles", "Ilustrador", "Taller de cerámica".
   - Si no hay local abierto al público, configurarla como **negocio que se desplaza**, con zona de servicio Alcorcón y alrededores, y la dirección oculta.
   - Subir 10-15 fotos reales.
2. **Comprar el dominio** y conectarlo en Vercel. Después hay que actualizar el canonical, el sitemap y el schema (lo hago yo).
3. **Pedir las primeras reseñas** a familias que ya hayan ido a sus talleres, con un enlace directo a la ficha de Google. Responder siempre a cada reseña.
4. **Darse de alta en Bing Places** (alimenta a ChatGPT y Copilot), Apple Maps, Planomato y Cronoshare.

### Este mes
5. **Crear las páginas por servicio** (sección 3, punto 4). Cada una con:
   - qué se hace, edades, duración, precio orientativo y dónde;
   - 3-4 fotos reales;
   - 3-5 preguntas frecuentes;
   - un botón de WhatsApp.
   - Al menos 60-70 % de texto propio por página, nada de copiar y pegar cambiando la palabra.
6. **Sección de preguntas frecuentes** en la portada: ¿desde qué edad?, ¿qué materiales se usan?, ¿hay que llevar algo?, ¿hacéis cumpleaños?, ¿cuánto cuesta?
7. **Galería de trabajos reales** de los niños (con permiso de las familias). Es contenido único que nadie más tiene.
8. **Enlazar el Instagram** desde la web y la web desde Instagram, y añadirlo al schema (`sameAs`).

### Siguientes meses
9. Publicar con regularidad en la ficha de Google: fotos de cada taller y fechas de los próximos.
10. Buscar menciones locales: AMPAs de colegios de Alcorcón, prensa local (Vivir Ediciones Alcorcón), centros culturales. Las listas tipo "mejores talleres para niños en…" son el factor nº 1 para salir en las respuestas de ChatGPT.
11. Si se amplía la zona: páginas para Móstoles, Leganés o Fuenlabrada **solo si de verdad da talleres allí**, y con contenido distinto en cada una.

---

## 6. Datos que necesitamos de Salomé

Sin esto no se pueden completar ni la web ni la ficha de Google:

- [ ] ¿Tiene local donde se hacen los talleres? Dirección (aunque no se publique el número).
- [ ] Horarios y días de los talleres.
- [ ] Edades de cada taller.
- [ ] Precios o "desde X €".
- [ ] ¿Hace cerámica con torno o modelado a mano? ¿Cuece las piezas?
- [ ] ¿Hace cumpleaños? ¿Extraescolares en colegios? ¿Campamentos en vacaciones?
- [ ] Enlace de Instagram (y otras redes).
- [ ] Fotos reales de talleres y trabajos.
- [ ] Nombre de dominio que le guste.

---

## 7. Schema listo para cuando tengamos los datos

Sustituye al actual. Los valores entre `<>` son los que faltan; no se publica nada inventado.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://<dominio>/#negocio",
  "name": "Salomé Recio · Talleres de arte",
  "url": "https://<dominio>/",
  "telephone": "+34635333792",
  "email": "creatividad.salome@gmail.com",
  "image": "https://<dominio>/img/<foto-real-taller>.webp",
  "logo": "https://<dominio>/img/logo-salome-recio-transparente.webp",
  "priceRange": "<desde X €>",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "<calle, si hay local>",
    "addressLocality": "Alcorcón",
    "postalCode": "<CP>",
    "addressRegion": "Madrid",
    "addressCountry": "ES"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": <lat>, "longitude": <lng> },
  "areaServed": [{ "@type": "City", "name": "Alcorcón" }],
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["<Monday>"], "opens": "<17:00>", "closes": "<19:00>" }
  ],
  "sameAs": ["https://www.instagram.com/<usuario>", "<enlace de Google Maps>"]
}
```

Y en cada página de servicio, un bloque `Service` (o `Course`, si son talleres con fechas e inscripción), con `provider` apuntando a `#negocio`.

> Nota: no se recomienda el schema `FAQPage` para conseguir resultados enriquecidos (Google los retiró en mayo de 2026). Las preguntas frecuentes sí conviene tenerlas como texto normal en la página, porque ayudan a Google y a los buscadores con IA.

---

## Fuentes de las búsquedas

- [Planomato · Alcorcón, niños](https://www.planomato.com/es/alcorcon/niños)
- [Planomato · Construye títere caracol (Alcorcón)](https://www.planomato.com/es/alcorcon/p/construye-titere-caracol)
- [Ayuntamiento de Alcorcón · Guía de cursos 2026-2027 (PDF)](https://www.ayto-alcorcon.es/sites/default/files/2026-09/DeCerca.%20GUIA%20DE%20CURSOS%202026-2027_0.pdf)
- [Ayuntamiento de Alcorcón · Folleto cursos y talleres 2024 (PDF)](https://ayto-alcorcon.es/sites/default/files/2024-07/00%20Folleto%20-%20Cursos%20y%20Talleres%20%5BWeb%5D.pdf)
- [Ayuntamiento de Alcorcón · Escuela de familias 2025 (PDF)](https://ayto-alcorcon.es/sites/default/files/2025-01/Folleto%20escuela%20de%20familias%20enero-junio%202025.pdf)
- [Atrápalo · Taller de pintura Glow Art (Alcorcón)](https://www.atrapalo.com/actividades/taller-de-pintura-glow-art-opcion-menores_e4919567/)
- [Cronoshare · Animadores infantiles en Alcorcón](https://www.cronoshare.com/servicios/animadores-infantiles/madrid/alcorcon)
- [Vivir Ediciones (prensa local)](https://vivirediciones.es/?p=883143)
- [Time Out · Actividades en Alcorcón](https://www.timeout.es/madrid/es/noticias/los-castillos-de-alcorcon-se-llenan-de-actividades-terrorificas-para-celebrar-halloween-102923)
