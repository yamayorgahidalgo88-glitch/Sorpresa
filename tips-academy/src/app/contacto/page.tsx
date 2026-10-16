import type { Metadata } from "next"

import { Contact } from "@/components/sections/contact"

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con Tips Academy en Alcorcón: C/ Porto Lagos 1, posterior. Tel. 641 77 09 21. L–V 9:30–13:00 y 16:00–20:30.",
  alternates: { canonical: "/contacto" },
}

export default function ContactoPage() {
  return <Contact headingLevel="h1" />
}
