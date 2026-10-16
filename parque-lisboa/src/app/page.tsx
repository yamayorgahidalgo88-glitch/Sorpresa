import { Approach } from "@/components/sections/approach"
import { Breathe } from "@/components/sections/breathe"
import { Contact } from "@/components/sections/contact"
import { Faq } from "@/components/sections/faq"
import { Hero } from "@/components/sections/hero"
import { Location } from "@/components/sections/location"
import { Philosophy } from "@/components/sections/philosophy"
import { Reviews } from "@/components/sections/reviews"
import { Services } from "@/components/sections/services"
import { Team } from "@/components/sections/team"
import { faqJsonLd, jsonLd } from "@/lib/structured-data"

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd())} />
      <Hero />
      <Philosophy />
      <Services />
      <Approach />
      <Team />
      <Breathe />
      <Reviews />
      <Location />
      <Contact />
      <Faq />
    </>
  )
}
