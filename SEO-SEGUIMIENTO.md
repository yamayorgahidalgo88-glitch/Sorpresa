# Seguimiento SEO de ayoublahmany.es

Objetivo: salir arriba con «peluquería Alcorcón», «barbería Alcorcón» y «peluquería barata Alcorcón», y con el nombre «Ayoub Lahmany».
Herramienta: [claude-seo](https://github.com/AgriciDaniel/claude-seo) v2.6.0. Las posiciones reales **no se pueden medir desde el entorno de trabajo** (Google bloquea las consultas automáticas, Semrush de la cuenta no tiene unidades). Se miden con Search Console y la ficha de Google, y se apuntan aquí cada semana.

## Línea base: 17-11-2026

| Dato | Valor | Cómo se ha sacado |
|---|---|---|
| Comprobaciones técnicas de la portada | 0 avisos en 47 | `page_checks` sobre la web publicada |
| Comprobaciones de `aviso-legal.html` | 1 aviso medio: sin Open Graph | `page_checks` |
| Calidad del texto | 95/100 (aviso «repetitivo» por repetir precios, es normal) | `content_quality` |
| Marcado `HairSalon` + `FAQPage` | 2 bloques válidos, con teléfono y precios | `page_checks` |
| Enlaces a funciones retiradas de Google | ninguno | `gbp_deprecation_lint` |
| `canonical` | `https://ayoublahmany.es/` (y la dirección `vercel.app` apunta a ella) | HTML publicado |
| `robots.txt`, `sitemap.xml`, `llms.txt` | correctos, con el dominio nuevo | descarga directa |
| Indexada en Bing | **No** (`site:ayoublahmany.es` sin resultados) | búsqueda en Bing |
| Indexada en Google | no comprobable desde aquí; mirar en Search Console | — |
| Nota de SEO local (estimación) | **≈66/100** (el 13-11 era ≈60) | tabla de abajo |

### Nota de SEO local (estimación)

| Dimensión (peso) | 13-11 | 17-11 | Qué ha cambiado |
|---|---|---|---|
| Ficha de Google (25 %) | 15 | 15 | La ficha existe (`kgmid /g/11vk7fxtm4`). No se puede revisar si está completa ni reclamada. |
| Reseñas (20 %) | 12 | 12 | 135 en Booksy. Reseñas de Google: sin dato. |
| SEO en la página (20 %) | 14 | 17 | Teléfono añadido y visible, dominio propio, sin animación de entrada, más fluida. |
| Nombre, dirección y teléfono (15 %) | 8 | 10 | El teléfono ya coincide en web y marcado. Directorios sin comprobar. |
| Datos estructurados (10 %) | 9 | 10 | `telephone` añadido. |
| Enlaces y autoridad (10 %) | 2 | 2 | Dominio nuevo, sin enlaces externos. |

## Registro semanal (rellenar cada lunes)

Datos de **Search Console → Rendimiento** (últimos 7 días) y de la **ficha de Google → Rendimiento**.

| Fecha | Páginas indexadas | Impresiones | Clics | Posición media | «peluquería Alcorcón» | «barbería Alcorcón» | «peluquería barata Alcorcón» | «Ayoub Lahmany» | Reseñas Google (nº y nota) | Llamadas / ruta / web (ficha) |
|---|---|---|---|---|---|---|---|---|---|---|
| 17-11-2026 | sin dato | 0 | 0 | — | — | — | — | — | sin dato | sin dato |
| | | | | | | | | | | |
| | | | | | | | | | | |

Para sacar la posición de cada búsqueda: Search Console → Rendimiento → filtro «Consulta» → escribir la búsqueda.

## Qué esperar (hipótesis, no mediciones)

| Fase | Cuándo | Qué debería pasar |
|---|---|---|
| Indexación | 1-14 días | Google y Bing descubren la web. Empiezan los primeros datos en Search Console. |
| Nombre propio | 2-6 semanas | «Ayoub Lahmany» debería dar la web entre las primeras, junto a Booksy, Instagram y la ficha. |
| Mapa local | 1-3 meses | «barbería Alcorcón» y «peluquería Alcorcón» dependen sobre todo de la ficha de Google, las reseñas y la cercanía de quien busca. |
| Resultados orgánicos | 3-6 meses | Salir en la primera página con búsquedas genéricas exige reseñas en Google, directorios y páginas por servicio. |

## Acciones pendientes, por prioridad

1. Ficha de Google: reclamarla o verificarla, con categorías, servicios con precio, 15+ fotos y la web `ayoublahmany.es`.
2. Reseñas en Google de forma constante (QR en el espejo y mensaje a los clientes de Booksy).
3. Search Console: enviar el sitemap y pedir la indexación de la portada.
4. Bing Places y Apple Maps (Bing alimenta a ChatGPT y Copilot).
5. Directorios con el mismo nombre, dirección y teléfono: Páginas Amarillas, Cylex, infoisinfo, Yelp, Foursquare, Facebook.
6. Páginas propias por servicio («Corte de niño en Alcorcón», «Corte de caballero en Alcorcón»), solo con fotos y texto reales.
7. Menciones locales (listas de mejores barberías, prensa del barrio).
8. Añadir Open Graph a `aviso-legal.html` (aviso medio, poca prioridad).
