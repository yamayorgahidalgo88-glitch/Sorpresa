import { Approach } from "@/components/sections/approach"
import { Contact } from "@/components/sections/contact"
import { Faq } from "@/components/sections/faq"
import { Hero } from "@/components/sections/hero"
import { Location } from "@/components/sections/location"
import { Reviews } from "@/components/sections/reviews"
import { Services } from "@/components/sections/services"
import { Team } from "@/components/sections/team"
import { faqJsonLd, jsonLd } from "@/lib/structured-data"

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd())} />
      <Hero />
      <Services />
      <Approach />
      <Team />
      <Reviews />
      <Location />
      <Contact />
      <Faq />
    </>
  )
}
