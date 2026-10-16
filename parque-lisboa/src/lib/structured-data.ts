import { faqs, site, visibleServices } from "@/lib/site"

export function clinicJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${site.url}/#clinic`,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/icon.svg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.streetSchema,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed: [{ "@type": "City", name: "Alcorcón" }],
    openingHoursSpecification: site.hours.slots.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: slot.opens,
      closes: slot.closes,
    })),
    availableService: visibleServices.map((s) => ({
      "@type": "MedicalTherapy",
      name: s.title,
      description: s.summary,
    })),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.maps.query)}`,
    sameAs: [site.instagram],
  }
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

/** Serializa JSON-LD evitando que una cadena cierre la etiqueta <script>. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
}
