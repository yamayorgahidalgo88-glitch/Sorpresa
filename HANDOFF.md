# Handoff: web de Ayoub Lahmany Barber Shop

> **Responde siempre en español al usuario.** Todas las respuestas, explicaciones y preguntas deben ir en español.

Para continuar en otra sesión de Claude Code. Lee también `PRODUCT.md` y `README.md`.

## Qué es
Web one-page de una barbería real: **Ayoub Lahmany Barber Shop**, C/ Princesa Doña Sofía posterior 1, local 9B, 28924 Alcorcón. El dueño es Ayoub. Las reservas se hacen en su **Booksy**, y la web enlaza allí: https://booksy.com/es-es/86074_ayoub-lahmany-barber-shop_barberia_52935_alcorcon. Instagram: @ayoub_lahmany03. Valoración: 5,0 con 131 reseñas en Booksy (dato de octubre de 2026). Precios: los 11 servicios de Booksy, ya en la web.

## Dónde está
- Repo: `yamayorgahidalgo88-glitch/Sorpresa`, rama **`claude/barbershop-hairstyle-preview-irqt06`**. Todo está subido. No hay ningún PR abierto, y no hay que crearlo salvo que el usuario lo pida.
- Web publicada: **https://ayoub-lahmany-barber-la-quinta-del-bnitre.vercel.app**
- Vercel: equipo `team_AJTr7WqPBL2IVmRDgpky7Ac8` («la-quinta-del-bnitre»), proyecto `ayoub-lahmany-barber` (`prj_ub5vt9Rg3rh8zU38GpRsEyezOW6U`).
  - Vercel **no puede enlazar el repo**: la cuenta de GitHub de Vercel no tiene permiso de escritura. Para publicar, usa el MCP de Vercel `create_deployment` con `gitSource {type:"github", org:"yamayorgahidalgo88-glitch", repo:"Sorpresa", ref:"claude/barbershop-hairstyle-preview-irqt06"}`, `target:"production"`, `project:"ayoub-lahmany-barber"`, `teamId` el de arriba y `skipAutoDetectionConfirmation:"1"`.
  - La protección por SSO está solo en las previews; producción es pública.
- La página antigua de las flores sigue intacta en `/flores/`.

## Stack
HTML, CSS y JS estático sin compilación.
- `index.html`
- `assets/css/site.css`
- `assets/js/`:
  - `main.js`
  - `motion.js`: GSAP y ScrollTrigger con Lenis desde CDN.
  - `reel.js`: carrusel infinito.
- `scripts/dev.mjs`: servidor local con `PORT=4173 node scripts/dev.mjs`. Los procesos en segundo plano se cortan por límite de tiempo; lánzalo con `nohup … &`.

## Diseño actual (lo aprobó el usuario tras varias vueltas)
- **Negro y dorado.** Es la marca: el logo real está en `assets/img/logo-ayoub-lahmany.webp`, sacado de Booksy, con el fondo hecho transparente y sin redibujar. La versión pequeña, con trazo engrosado, es `logo-ayoub-lahmany-sm.webp`.
- **Tipografía:** Bodoni Moda para titulares y Jost para la interfaz, las dos alojadas en el propio sitio. Bodoni lleva `font-variation-settings: "opsz" 12` para que la «e» no parezca una «c». El usuario se quejó de eso; no lo quites.
- **Secciones:**
  1. **Portada:** vídeo a pantalla completa (`assets/video/hero.mp4`, o `hero-movil.mp4` en vertical), bandas de cine que se abren y el logo con un barrido de brillo.
  2. **Interludio:** vídeo de herramientas sin personas, en un marco que se abre al hacer scroll. Encima, la frase «Cortes a tu medida. Degradados limpios, barba perfilada y una cara cuidada. Ayoub Lahmany, en Alcorcón.», que se ilumina palabra a palabra.
  3. **Servicios y precios:** las tijeras recorren una línea discontinua.
  4. **Cortes reales en Alcorcón:** carrusel infinito (`reel.js`) con 14 fotos de su Booksy (portfolio y reseñas hechas en el local), que se mueve solo y se puede arrastrar con inercia.
  5. **Preguntas frecuentes** (7 desplegables, añadidas por SEO).
  6. **Cómo llegar a la barbería:** dirección y botones (Cómo llegar, Instagram). Sin frases sueltas: el usuario quitó «Horario y huecos libres en Booksy», la de los pagos y «Ambiente para niños».
  7. **Cierre:** «Tu silla te espera» con vídeo.
  8. **Barra inferior en móvil:** Precios (icono €), Ubicación (icono de pin) y Reservar.
- **Cabecera:** sin botón de reservar (lo quitó el usuario). A la derecha, el estado del local según la hora de Madrid: «Abierto · Cierra a las 14:00» (punto verde encendido que parpadea despacio; cerrado, punto rojo encendido y fijo) o «Cerrado · Abre mañana a las 10:00» (`assets/js/hours.js`). El horario sale de Booksy (L–S 10:00–14:00 y 15:00–21:00, domingo cerrado) porque Google no se pudo consultar desde la sesión: si el usuario da el de Google y es distinto, cambia `HOURS` en `hours.js` y `openingHoursSpecification` en el JSON-LD.
- **Botones:** los secundarios (Cómo llegar, Instagram) se rellenan de oro al pulsarlos. El principal es de oro pulido, con un marco fino exterior y un brillo (`btn--glint` en la portada y el cierre). Los secundarios llevan esquinas doradas.
- Los vídeos son de **Mixkit** (licencia gratuita) y se citan en el pie.

## Lo que el usuario NO quiere (ya probado y rechazado)
- El estilo cartel fluorescente amarillo y rosa.
- Las herramientas 3D hechas con three.js: parecían de juguete.
- Los capítulos de vídeo con barberos que no son Ayoub, y la sección que se quedaba fija al hacer scroll («va raro al bajar»).
- La cinta de texto en movimiento (marquee).
- La sección «El local».
- Las frases debajo de los títulos.
- Expresiones como «hecho a mano» o «el sillón de Ayoub».
- Los cortes 3D generados por código sobre una cabeza escaneada: «no se parecen a los cortes reales».
- Muy importante: **los cortes deben ser fieles a la realidad**.

## Asesor de cortes: QUITADO (6-11-2026)
El usuario decidió quitar de la web el asesor de cortes con IA y todo lo suyo (sección, enlaces, `advisor.js`, `face.js`, `cuts.js`, `turntable.js`, `api/try-on.js`, `scripts/generate-references.mjs`): «no le veo futuro para este proyecto; a lo mejor para uno más adelante». Si algún día se recupera, está en el historial de git (commit anterior a «Remove haircut advisor»). No vuelvas a proponerlo ni la clave de fal.ai para esta web.

## SEO local (hecho el 6-11-2026; detalle en `SEO.md`)
- Título «Peluquería en Alcorcón · Corte hombre 11 € · Ayoub Lahmany», meta descripción, H1 con texto oculto «peluquería y barbería en Alcorcón», línea visible bajo el logo: «Corte de caballero: 11 €» (con dos puntos, lo pidió el usuario).
- Títulos con palabra clave, `alt` locales en la galería, sección de preguntas frecuentes, JSON-LD `HairSalon` (NAP, 11 servicios con precio, Booksy) y `FAQPage` (sin `aggregateRating` de Booksy, a propósito).
- `canonical`, Open Graph con `assets/img/og.jpg`, `robots.txt`, `sitemap.xml`, `noindex` en `/flores/`.
- Si se compra dominio propio, cambiar la URL en `index.html` (canonical, og, JSON-LD), `robots.txt` y `sitemap.xml`.
- Falta el **teléfono** de la barbería: cuando lo dé el usuario, añadirlo a la web y al JSON-LD.
- Lo que más pesa (Perfil de Empresa de Google, reseñas, NAP, Booksy, Search Console) es trabajo fuera de la web: lista en `SEO.md`.

## PENDIENTE (siguiente paso)
1. El usuario irá pidiendo más ajustes de diseño.
2. Teléfono de la barbería: añadirlo a la web y al JSON-LD cuando lo dé.
3. Quizá dominio propio más adelante (ver `SEO.md`).
4. Recuerda al usuario que confirme con Ayoub el uso de su logo y de las fotos de Booksy (en algunas se ven caras de clientes), el horario semanal (la web remite a Booksy) y los precios.
5. Flujo de Impeccable sin cerrar: revisión final con `impeccable-finish-reviewer` y reescribir `DESIGN.md` y `.impeccable/design.json` con `impeccable-documenter` (describen el estilo cartel, obsoleto). Hazlo cuando el diseño esté estable.

## Herramientas instaladas por el usuario (úsalas, se queja si no)
- **Impeccable**, en `.claude/skills/impeccable`: el detector se lanza con `.claude/skills/impeccable/scripts/impeccable detect --json index.html assets/css/site.css assets/js`. Los avisos de contraste «ivory on gold» son falsos positivos (ya comprobado en el navegador).
- **Skills de Emil Kowalski**, en `.claude/skills/`: `emil-design-eng`, `animate`, `review-animations`, etc. Cárgalas para cualquier trabajo de animación.
- **MCP de Playwright** para capturas. También vale Playwright por script; Chromium ya está instalado.
- **Plugin de Figma**: necesita autorización y no se ha usado.

## Convenciones
- Commits con las líneas de atribución que indique el system reminder. Sube siempre a la rama de arriba con `git push -u origin <rama>`.
- El usuario escribe en español, informal. Prefiere resultados visuales y que se los enseñes publicados en Vercel.
- Antes de proponer reescrituras grandes, pregunta el enfoque: ha rechazado varias direcciones.
