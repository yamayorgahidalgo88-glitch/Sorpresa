import { Faq } from "@/components/faq"
import { Blog } from "@/components/sections/blog"
import { Contact } from "@/components/sections/contact"
import { Hero } from "@/components/sections/hero"
import { MethodBoard } from "@/components/sections/method-board"
import { Resources } from "@/components/sections/resources"
import { Reviews } from "@/components/sections/reviews"
import { Services } from "@/components/sections/services"
import { Stats } from "@/components/sections/stats"
import { SubjectsMarquee } from "@/components/sections/subjects-marquee"
import { Team } from "@/components/sections/team"
import { homeFaq } from "@/lib/site"

export default function Home() {
  return (
    <>
      <Hero />
      <SubjectsMarquee />
      <MethodBoard />
      <Stats />
      <Services />
      <Resources />
      <Team />
      <Reviews />
      <Blog />
      <Faq items={homeFaq} />
      <Contact />
    </>
  )
}
