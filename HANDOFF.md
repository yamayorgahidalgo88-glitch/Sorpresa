# Handoff: web de Ayoub Lahmany Barber Shop

Para continuar en otra sesión de Claude Code. Lee también `PRODUCT.md` y `README.md`.

## Qué es
Web one-page de una barbería real: **Ayoub Lahmany Barber Shop**, C/ Princesa Doña Sofía posterior 1, local 9B, 28924 Alcorcón. El dueño es Ayoub. Las reservas se hacen en su **Booksy**, y la web enlaza allí: https://booksy.com/es-es/86074_ayoub-lahmany-barber-shop_barberia_52935_alcorcon. Instagram: @ayoub_lahmany03. Valoración: 5,0 con 131 reseñas en Booksy (dato de octubre de 2026). Precios: los 11 servicios de Booksy, ya en la web.

## Dónde está
- Repo: `yamayorgahidalgo88-glitch/Sorpresa`. Rama vigente: **`claude/barbershop-reference-photos-yw9cmv`** (parte de `claude/barbershop-hairstyle-preview-irqt06`, que queda como historial). Todo está subido. No hay ningún PR abierto, y no hay que crearlo salvo que el usuario lo pida.
- Web publicada: **https://ayoub-lahmany-barber-la-quinta-del-bnitre.vercel.app**
- Vercel: equipo `team_AJTr7WqPBL2IVmRDgpky7Ac8` («la-quinta-del-bnitre»), proyecto `ayoub-lahmany-barber` (`prj_ub5vt9Rg3rh8zU38GpRsEyezOW6U`).
  - Vercel **no puede enlazar el repo**: la cuenta de GitHub de Vercel no tiene permiso de escritura. Para publicar, usa el MCP de Vercel `create_deployment` con `gitSource {type:"github", org:"yamayorgahidalgo88-glitch", repo:"Sorpresa", ref:"<rama vigente>"}`, `target:"production"`, `project:"ayoub-lahmany-barber"`, `teamId` el de arriba y `skipAutoDetectionConfirmation:"1"`.
  - La protección por SSO está solo en las previews; producción es pública.
- La página antigua de las flores sigue intacta en `/flores/`.

## Stack
HTML, CSS y JS estático sin compilación. Ya no hay función serverless ni variables de entorno.
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
  4. **Trabajos:** carrusel infinito con 14 fotos de su Booksy (portfolio y reseñas hechas en el local) que se mueve solo y se puede arrastrar.
  5. **Dónde estamos.**
  6. **Cierre:** «Tu silla te espera» con vídeo.
  7. **Barra inferior en móvil:** Precios, Dónde y Reservar.
- El segundo botón de la portada es «Ver precios» (antes «¿Qué corte te va?»).
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

## Asesor de cortes: RETIRADO (noviembre de 2026)
El usuario pidió quitar de momento toda la parte de la cara y los peinados («ya veremos qué hacemos»). Se borraron la sección `#asesor`, sus estilos, `advisor.js`, `face.js`, `cuts.js`, `turntable.js`, `api/try-on.js`, `scripts/generate-references.mjs` y `.env.example`. Para recuperarlo, todo está en el commit `e620a6c` (`git checkout e620a6c -- <ruta>`).

Lo que se habló para cuando vuelva:
- **Tiene que ser gratis.** fal.ai cobra por imagen, así que queda descartado; la clave `FAL_KEY` nunca llegó a añadirse (ni al entorno ni a Vercel).
- En la lista de cortes **no quiere fotos realistas genéricas**: quiere un **modelo 3D de una cabeza con ese corte, que se reconozca a la primera** (un mullet tiene que parecer un mullet).
- No hay modelos 3D de pelo gratuitos para estos 12 cortes (los que hay son de pago), y el pelo generado por código ya lo rechazó.
- Propuesta pendiente de su respuesta: bustos estilo escultura en dorado sobre negro. Imagen de frente con un modelo libre en Hugging Face (FLUX o Qwen Image Edit, cupo gratis diario), paso a 3D con TRELLIS o Hunyuan3D (gratis en Hugging Face) y visor con `<model-viewer>`. Empezar con el mullet como prueba. Haría falta un token gratuito de Hugging Face como `HF_TOKEN` en el entorno. Preguntó si lo prefiere así o más realista; aún no ha contestado.

## PENDIENTE
1. Decidir con el usuario si vuelve el asesor y cómo (ver arriba).
2. Recuerda al usuario que confirme con Ayoub el uso de su logo y de las fotos de Booksy (en algunas se ven caras de clientes), el horario semanal (la web remite a Booksy) y los precios.
3. Flujo de Impeccable sin cerrar:
   - Falta la revisión final de esta versión con el agente `impeccable-finish-reviewer`.
   - Hay que reescribir `DESIGN.md` y `.impeccable/design.json` con el agente `impeccable-documenter`: ahora describen el estilo cartel, ya obsoleto.
   - El contrato de dirección está en `.impeccable/surfaces/index-html.md`.

## Herramientas instaladas por el usuario (úsalas, se queja si no)
- **Impeccable**, en `.claude/skills/impeccable`: el detector se lanza con `.claude/skills/impeccable/scripts/impeccable detect --json index.html assets/css/site.css assets/js`. Los avisos de contraste «ivory on gold» son falsos positivos (ya comprobado en el navegador).
- **Skills de Emil Kowalski**, en `.claude/skills/`: `emil-design-eng`, `animate`, `review-animations`, etc. Cárgalas para cualquier trabajo de animación.
- **MCP de Playwright** para capturas. También vale Playwright por script; Chromium ya está instalado.
- **Plugin de Figma**: necesita autorización y no se ha usado.

## Convenciones
- Commits con las líneas de atribución que indique el system reminder. Sube siempre a la rama de arriba con `git push -u origin <rama>`.
- El usuario escribe en español, informal. Prefiere resultados visuales y que se los enseñes publicados en Vercel.
- Antes de proponer reescrituras grandes, pregunta el enfoque: ha rechazado varias direcciones.
