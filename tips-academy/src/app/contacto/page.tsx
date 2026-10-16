import type { Metadata } from "next"

import { PageHero } from "@/components/page-hero"
import { Contact } from "@/components/sections/contact"

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con Tips Academy en Alcorcón: C/ Porto Lagos 1, posterior. Tel. 641 77 09 21. L–V 9:30–13:00 y 16:00–20:30.",
  alternates: { canonical: "/contacto" },
}

export default function ContactoPage() {
  return (
    <>
      <PageHero eyebrow="Contacto" title="¿En qué podemos" hand="ayudarte?" />
      <Contact />
    </>
  )
}
