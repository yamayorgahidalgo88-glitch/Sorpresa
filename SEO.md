# SEO local: qué está hecho y qué falta

Objetivo: salir arriba en Google con «peluquería Alcorcón», «barbería Alcorcón» y «peluquería barata Alcorcón». Se basa en el informe «Keywords y SEO local para una peluquería económica en Alcorcón».

## Hecho en la web (6-11-2026)
- **Título:** «Peluquería en Alcorcón · Corte hombre 11 € · Ayoub Lahmany».
- **Meta descripción:** incluye barbería, precios (11 €, 9 €, 5 €), degradados, las reseñas y la reserva en Booksy.
- **H1:** «Ayoub Lahmany Barber Shop: peluquería y barbería en Alcorcón». El H1 es el logo, y el texto queda oculto a la vista pero lo leen Google y los lectores de pantalla.
- **Bajo el logo, visible:** «Peluquería y barbería en Alcorcón. Corte de caballero, 11 €». El precio aparece arriba del todo, como recomienda el informe.
- **Títulos con la palabra clave:** «Precios de nuestros servicios», «Nuestros trabajos» y «¿Cómo llegar a la peluquería?».
- **Galería:** las 14 fotos llevan un texto alternativo descriptivo que termina en «corte de hombre en Alcorcón». Son fotos reales, no de stock.
- **Preguntas frecuentes:** cinco preguntas desplegables (precio del corte de hombre en Alcorcón, niños, cita, pago, dónde está Ayoub Lahmany).
- **Datos estructurados (JSON-LD):**
  - `HairSalon` con nombre, dirección (NAP), logo, fotos, `priceRange: €`, los 11 servicios con precio, la acción de reservar en Booksy, y los enlaces a Booksy e Instagram.
  - `FAQPage` con las preguntas.
  - No se marca la nota de Booksy como valoración: Google no admite reseñas de terceros en ese marcado.
- **Metadatos y rastreo:**
  - Etiqueta `canonical`, Open Graph con imagen `assets/img/og.jpg` y `geo.placename`.
  - `robots.txt` y `sitemap.xml`.
  - La página antigua `/flores/` lleva `noindex`.
- **Tono:** «precio justo con calidad demostrada». No dice «la más barata de Alcorcón», porque hay competencia a 9 € y no es comprobable.

## Auditoría con claude-seo (13-11-2026)
Detalle en `LOCAL-SEO-ANALYSIS.md`. Nota estimada de SEO local: 60/100.
- **Una sola dirección oficial:** `https://ayoub-lahmany-barber.vercel.app/` en canonical, og, JSON-LD, `robots.txt` y `sitemap.xml`. La larga (`…-la-quinta-del-bnitre.vercel.app`) sigue abriendo la web, pero su `canonical` apunta a la corta, así que Google se queda con la corta. Para que además redirija hay que configurarlo a mano en Vercel: *Settings → Domains*, en la larga elegir *Redirect to* la corta (308). Un `redirects` en `vercel.json` no funciona en estos dominios automáticos de Vercel: se probó el 13-11-2026.
- **`llms.txt`** con los datos y precios, para buscadores con IA.
- **Faltan:** teléfono, Bing Places y Apple Maps (además de lo de abajo).

## Lo que más pesa y no se hace en la web (para Ayoub)
Según Google, el mapa (Local Pack) se ordena por **relevancia, distancia y prominencia**. Para «peluquería Alcorcón» manda el mapa, no la web.

1. **Perfil de Empresa de Google** (business.google.com):
   - Categoría principal «Barbería»; secundarias «Peluquería» y «Peluquería para hombres».
   - Nombre real, sin añadir «barata».
   - Servicios con precio.
   - Horario completo.
   - 15 o más fotos: fachada, interior y cortes. Luego subir 2–4 nuevas por semana.
   - Como web, poner la de la barbería, no la de Booksy.
2. **Reseñas en Google:**
   - Un QR en el espejo y en la caja, y pedírsela a cada cliente al terminar.
   - Responder a todas.
   - Objetivo: más de 100 en Google con nota de 4,8 o más.
3. **NAP idéntico** (nombre, dirección y teléfono escritos igual) en Google, Booksy, la web, Apple Maps, Bing Places, Páginas Amarillas, Cylex, infoisinfo, lomejordelbarrio y solicitalo.net. **Falta el teléfono:** cuando lo tengamos, se añade a la web y al marcado.
4. **Booksy:**
   - Nombres de servicio estándar: «Corte caballero», «Corte para niño», «Arreglo de barba», «Corte fade».
   - Perfil completo al 100 %.
   - Portfolio con 20 o más fotos.
   - Calendario abierto a 4 semanas.
   - Promociones en horas valle.
   - Boost solo cuando haya huecos libres.
5. **Dominio propio:** la web está en un subdominio de vercel.app. Un dominio como `ayoublahmany.es` (unos 10 €/año) posiciona mejor y da confianza. Si se compra, hay que cambiar la URL en `index.html` (canonical, og y JSON-LD), `robots.txt`, `sitemap.xml` y `llms.txt`.
6. **Google Search Console:**
   - Dar de alta la web y enviar `sitemap.xml`.
   - Comprobar los datos estructurados con la Prueba de resultados enriquecidos.
7. **Medir cada mes:**
   - Posición en el mapa para «peluquería Alcorcón» y «barbería Alcorcón».
   - Clics en «Cómo llegar».
   - Reservas de Booksy según su origen.
   - Número y nota de las reseñas.

## Siguientes pasos en la web (cuando haya contenido real)
- Páginas propias para «Corte de pelo de niño en Alcorcón» y «Corte de caballero en Alcorcón», con galería, si Ayoub quiere más peso en esas búsquedas.
- Contenido local una o dos veces al mes (barrios como Parque Lisboa, San José de Valderas o Ensanche Sur; la vuelta al cole). Solo si se mantiene; si no, mejor no hacerlo.
