import { academicServices, mapsLinkHref, type Post, serviceHref, site } from "@/lib/site"

export function academyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": `${site.url}/#academy`,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email,
    image: `${site.url}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Calle Porto Lagos 1, posterior",
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: "ES",
    },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: site.social.map((s) => s.href),
    hasMap: mapsLinkHref,
    areaServed: { "@type": "City", name: site.address.city },
    knowsLanguage: ["es", "en"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Clases y cursos",
      itemListElement: academicServices.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.seoDescription ?? s.text, url: `${site.url}${serviceHref(s.slug)}` },
      })),
    },
  }
}

/** Migas de pan para buscadores: [{ name, path }] desde la portada. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const all = [{ name: "Inicio", path: "/" }, ...items]
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path === "/" ? "" : it.path}`,
    })),
  }
}

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.iso,
    mainEntityOfPage: `${site.url}/t-blog/${post.slug}`,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@id": `${site.url}/#academy` },
    inLanguage: "es-ES",
  }
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
}
