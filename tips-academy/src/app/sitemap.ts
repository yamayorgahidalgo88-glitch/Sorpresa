import type { MetadataRoute } from "next"

import { courses, posts, services, site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/quienes-somos",
    "/metodologia",
    "/asignaturas",
    "/servicios",
    ...services.map((s) => `/servicios/${s.slug}`),
    "/recursos",
    ...courses.map((c) => `/recursos/${c.slug}`),
    "/t-blog",
    ...posts.map((p) => `/t-blog/${p.slug}`),
    "/foro",
    "/matricula",
    "/contacto",
    "/aviso-legal",
    "/privacidad",
    "/cookies",
  ]
  return pages.map((p) => ({ url: `${site.url}${p || "/"}`, priority: p ? 0.6 : 1 }))
}
