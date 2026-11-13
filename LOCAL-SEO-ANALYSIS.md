# Auditoría de SEO local con claude-seo (13-11-2026)

Web: https://ayoub-lahmany-barber.vercel.app/
Herramienta: [claude-seo](https://github.com/AgriciDaniel/claude-seo) v2.6.0, habilidad `seo-local` y comprobaciones automáticas `page_checks`, `parse_html`, `content_quality` y `gbp_deprecation_lint`.
Objetivo (de `SEO.md`): salir arriba con «peluquería Alcorcón», «barbería Alcorcón» y «peluquería barata Alcorcón».

## Nota de SEO local: 60/100 (estimación)

| Dimensión (peso) | Nota | Por qué |
|---|---|---|
| Perfil de Empresa de Google (25 %) | 15/25 | La web enlaza la ficha de Google (`sameAs`), muestra el horario y tiene el botón de Google Maps. La ficha en sí no se puede revisar desde aquí. |
| Reseñas (20 %) | 12/20 | 5,0 con 135 reseñas en Booksy. No sabemos cuántas hay en Google, que es lo que cuenta para el mapa. |
| SEO en la página (20 %) | 14/20 | Alcorcón está en el título, el H1 y los títulos de sección, y la dirección se ve en la página. Falta el teléfono y no hay páginas por servicio. |
| NAP y directorios (15 %) | 8/15 | El nombre y la dirección coinciden en la página y en el marcado. Falta el teléfono, y no se ha podido comprobar la presencia en directorios. |
| Datos estructurados (10 %) | 9/10 | `HairSalon` es el tipo correcto, con coordenadas, horario, precios y reserva. Solo falta `telephone`. |
| Enlaces y autoridad local (10 %) | 2/10 | No hay menciones locales (prensa, listas de «mejores barberías», asociaciones). |

**Tipo de negocio:** local físico, con dirección. **Sector:** peluquería y barbería (`HairSalon`).

## Comprobaciones automáticas
- **Antes:** 1 aviso alto. El `canonical` apuntaba a `ayoub-lahmany-barber-la-quinta-del-bnitre.vercel.app` y la web también se abre en `ayoub-lahmany-barber.vercel.app`. Dos direcciones con el mismo contenido reparten la fuerza en Google.
- **Después del arreglo:** 0 avisos en 45 comprobaciones.
- **Título:** 58 caracteres, con buena relación con el contenido.
- **Meta descripción:** 149 caracteres.
- **Estructura:** un solo H1 y ningún salto de nivel en los títulos.
- **Imágenes:** las 17 tienen tamaño. Los 2 logos con `alt` vacío están bien, porque el enlace o el H1 ya llevan el nombre.
- **Marcado:** 2 bloques JSON-LD válidos.
- **Texto:** calidad 94/100, sin relleno ni frases de IA.
- **Perfil de Empresa:** sin enlaces a funciones de Google ya retiradas (chat, business.site).

## Cambios hechos en la web
1. **Una sola dirección oficial:** `https://ayoub-lahmany-barber.vercel.app/` en `canonical`, Open Graph, JSON-LD, `robots.txt` y `sitemap.xml`.
2. **La dirección larga** sigue abriendo la web, pero con el `canonical` hacia la corta. Si además se quiere que redirija, hay que configurarlo en el panel de Vercel: *Settings → Domains*, en la larga elegir *Redirect to* la corta. En `vercel.json` no funciona con los dominios automáticos de Vercel.
3. **`llms.txt`** con nombre, dirección, horario, precios y reserva. Así ChatGPT, Perplexity y otros buscadores con IA lo leen fácil. En búsquedas locales, la IA convierte mucho más que Google orgánico.
4. **`sitemap.xml`:** fecha actualizada.

## Diez acciones por prioridad
1. **Crítica.** Conseguir el teléfono de la peluquería y añadirlo a la web (enlace `tel:`), al JSON-LD y escrito igual en Google, Booksy y los directorios.
2. **Crítica.** Ficha de Google:
   - Categoría principal «Barbería» y secundarias «Peluquería» y «Peluquería para hombres».
   - Servicios con precio.
   - 15 o más fotos.
   - Como web, la de la peluquería.
3. **Alta.** Pedir reseñas en Google de forma constante, sin rachas de más de 2 o 3 semanas sin ninguna. Usar un QR en el espejo y responder a todas. Sin filtrar a quién se le pide: Google lo prohíbe.
4. **Alta.** Dar de alta la web en Google Search Console y enviar `sitemap.xml`.
5. **Alta.** Dar de alta el negocio en **Bing Places**: es lo que usan ChatGPT, Copilot y Alexa.
6. **Alta.** Dar de alta el negocio en **Apple Maps** (Apple Business Connect).
7. **Media.** Directorios con el nombre, la dirección y el teléfono idénticos: Páginas Amarillas, Cylex, infoisinfo, Yelp, Foursquare y Facebook.
8. **Media.** Dominio propio (p. ej. `ayoublahmany.es`). Si se compra, se cambia la dirección oficial y la redirección en un minuto.
9. **Media.** Páginas propias para «Corte de pelo de niño en Alcorcón» y «Corte de caballero en Alcorcón». Según Whitespark, es el factor nº 1 de SEO local orgánico. Solo si hay fotos y texto reales para cada una.
10. **Baja.** Menciones locales: listas de «mejores barberías de Alcorcón», prensa del barrio y colaboraciones con clubes o colegios.

## Lo que esta auditoría no ha podido medir
- **Datos que no son de la web:** posición real en el mapa de Google (haría falta un seguimiento por cuadrícula), reseñas de Google, datos de la ficha de Google, enlaces externos y autoridad del dominio. Hacen falta Search Console, la ficha de Google o herramientas de pago (DataForSEO, Ahrefs, BrightLocal).
- **Pruebas que se bloquearon:** las que necesitan conectarse por su cuenta (PageSpeed, `agentic_check`, `preload_check`). El proxy de este entorno no lo permite, así que se analizó el HTML descargado.
