# Handoff: web de Ayoub Lahmany Barber Shop

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
HTML, CSS y JS estático sin compilación, más una función serverless de Vercel en `api/try-on.js`.
- `index.html`
- `assets/css/site.css`
- `assets/js/`:
  - `main.js`
  - `motion.js`: GSAP y ScrollTrigger con Lenis desde CDN.
  - `reel.js`: carrusel infinito.
  - `advisor.js`: asesor de cortes.
  - `face.js`: MediaPipe Face Landmarker en el navegador.
  - `cuts.js`: 12 cortes, reglas por forma de cara y pictogramas de respaldo.
  - `turntable.js`: visor 360°.
- `scripts/dev.mjs`: servidor local con `PORT=4173 node scripts/dev.mjs`. Los procesos en segundo plano se cortan por límite de tiempo; lánzalo con `nohup … &`.
- `scripts/generate-references.mjs`: genera las fotos 360° (ver pendientes).

## Diseño actual (lo aprobó el usuario tras varias vueltas)
- **Negro y dorado.** Es la marca: el logo real está en `assets/img/logo-ayoub-lahmany.webp`, sacado de Booksy, con el fondo hecho transparente y sin redibujar. La versión pequeña, con trazo engrosado, es `logo-ayoub-lahmany-sm.webp`.
- **Tipografía:** Bodoni Moda para titulares y Jost para la interfaz, las dos alojadas en el propio sitio. Bodoni lleva `font-variation-settings: "opsz" 12` para que la «e» no parezca una «c». El usuario se quejó de eso; no lo quites.
- **Secciones:**
  1. **Portada:** vídeo a pantalla completa (`assets/video/hero.mp4`, o `hero-movil.mp4` en vertical), bandas de cine que se abren y el logo con un barrido de brillo.
  2. **Interludio:** vídeo de herramientas sin personas, en un marco que se abre al hacer scroll. Encima, la frase «Cortes a tu medida. Degradados limpios, barba perfilada y una cara cuidada. Ayoub Lahmany, en Alcorcón.», que se ilumina palabra a palabra.
  3. **Servicios y precios:** las tijeras recorren una línea discontinua.
  4. **Trabajos:** carrusel infinito con 14 fotos de su Booksy (portfolio y reseñas hechas en el local) que se mueve solo y se puede arrastrar.
  5. **Asesor de cortes.**
  6. **Dónde estamos.**
  7. **Cierre:** «Tu silla te espera» con vídeo.
  8. **Barra inferior en móvil.**
- **Botones:** el principal es de oro pulido, con un marco fino exterior y un brillo (`btn--glint` en la portada y el cierre). Los secundarios llevan esquinas doradas.
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

## Asesor de cortes (estado)
- El análisis de la cara se hace en el navegador. Mide largo/ancho, mandíbula, frente y simetría, clasifica en 6 formas y ordena los 12 cortes: solo los 3 primeros pueden ser «muy recomendado».
- Hay filtros (con/sin degradado, corto, medio, largo), consentimiento obligatorio, el botón «Borrar mi foto» y una vista de la foto en duotono dorado con calibres de medida.
- **Visor 360°** (`turntable.js`):
  - Muestra 8 ángulos por corte. Se gira arrastrando, con inercia, o con las flechas del teclado.
  - Lee `assets/img/cortes/manifest.json` y las imágenes `assets/img/cortes/<id>/<0-7>.webp`, además de `thumb.webp`.
  - **Esas imágenes todavía no existen**, así que el visor está oculto y la lista muestra pictogramas.
- **«Pruébatelo»** llama a `/api/try-on`.
  - Con `FAL_KEY` y la foto de referencia del corte ya publicada, usa `fal-ai/nano-banana/edit` con la foto del cliente y la referencia.
  - Sin referencia, cae a FLUX Kontext.
  - Sin clave, devuelve `not_configured` y la web muestra un aviso.
  - Límites: 3 pruebas por visita en el cliente y un límite por IP en el servidor.

## PENDIENTE (siguiente paso)
1. El usuario tiene que crear una clave de fal.ai y añadirla como **`FAL_KEY`**:
   - en el entorno cloud: menú del entorno, Edit, secretos o variable de entorno. Hace falta una sesión nueva para que la coja.
   - en Vercel: Settings → Environment Variables. Eso activa «Pruébatelo».
   - Nunca pidas que pegue la clave en el chat.
2. Cuando diga «genera las referencias», ejecuta `node scripts/generate-references.mjs`. Usa Nano Banana: primero un modelo base en 8 ángulos y luego cada corte de frente y en cada ángulo. Coste aproximado: 4 $ por unas 104 imágenes. Guarda una caché en `scripts/.cache/` y escribe `manifest.json`.
   - **Revisa una a una que cada corte sea fiel** (altura del degradado, largos, dirección del peinado) y regenera las que no lo sean, por ejemplo `node scripts/generate-references.mjs buzz` tras borrar la caché de ese corte.
   - Luego haz commit, push y vuelve a publicar.
3. Prueba «Pruébatelo» de punta a punta en producción con la clave puesta.
4. Recuerda al usuario que confirme con Ayoub el uso de su logo y de las fotos de Booksy (en algunas se ven caras de clientes), el horario semanal (la web remite a Booksy) y los precios.
5. Flujo de Impeccable sin cerrar:
   - Falta la revisión final de esta versión con el agente `impeccable-finish-reviewer`.
   - Hay que reescribir `DESIGN.md` y `.impeccable/design.json` con el agente `impeccable-documenter`: ahora describen el estilo cartel, ya obsoleto.
   - El contrato de dirección está en `.impeccable/surfaces/index-html.md`.
   - Hazlo cuando el diseño esté estable.

## Herramientas instaladas por el usuario (úsalas, se queja si no)
- **Impeccable**, en `.claude/skills/impeccable`: el detector se lanza con `.claude/skills/impeccable/scripts/impeccable detect --json index.html assets/css/site.css assets/js`. Los avisos de contraste «ivory on gold» son falsos positivos (ya comprobado en el navegador).
- **Skills de Emil Kowalski**, en `.claude/skills/`: `emil-design-eng`, `animate`, `review-animations`, etc. Cárgalas para cualquier trabajo de animación.
- **MCP de Playwright** para capturas. También vale Playwright por script; Chromium ya está instalado.
- **Plugin de Figma**: necesita autorización y no se ha usado.

## Convenciones
- Commits con las líneas de atribución que indique el system reminder. Sube siempre a la rama de arriba con `git push -u origin <rama>`.
- El usuario escribe en español, informal. Prefiere resultados visuales y que se los enseñes publicados en Vercel.
- Antes de proponer reescrituras grandes, pregunta el enfoque: ha rechazado varias direcciones.
