import type { MetadataRoute } from "next"

import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/quienes-somos", "/metodologia", "/servicios", "/contacto", "/aviso-legal", "/privacidad", "/cookies"].map((p) => ({
    url: `${site.url}${p || "/"}`,
    changeFrequency: p ? "monthly" : "weekly",
    priority: p ? 0.6 : 1,
  }))
}
