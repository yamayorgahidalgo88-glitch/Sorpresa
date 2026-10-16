import { UserRound } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SpotlightCard } from "@/components/reactbits/spotlight-card"
import { SectionHeading } from "@/components/section-heading"
import { team } from "@/lib/site"

const tints = [
  "from-sage-pale to-[#e6e2cf]",
  "from-gold-pale/70 to-[#efe3c8]",
  "from-[#e3d7cc] to-[#efe6dc]",
  "from-sage-pale/80 to-gold-pale/50",
]

export function Team() {
  return (
    <section id="equipo" aria-labelledby="equipo-title" className="bg-canvas py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHeading
          id="equipo-title"
          eyebrow="Equipo"
          title={
            <>
              Profesionales sanitarios <em>cerca de ti</em>
            </>
          }
          description="Un equipo multidisciplinar que se coordina para ofrecerte una atención integral. Pronto podrás conocer a cada profesional."
        />

        <ul className="-mx-4 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {team.map((member, i) => (
            <Reveal as="li" key={`${member.role}-${i}`} delay={i * 0.07} className="w-[78%] flex-none snap-start sm:w-auto">
              {/* Oura · person-card */}
              <SpotlightCard className="rounded-[24px]">
                <article>
                  {/* Marcador de posición: sustituir por un retrato profesional con consentimiento. */}
                  <div className={`relative grid aspect-[4/5] place-items-center rounded-[24px] bg-gradient-to-b ${tints[i % tints.length]}`}>
                    <UserRound className="size-20 text-stone/25" aria-hidden="true" strokeWidth={1} />
                    <span className="absolute bottom-4 left-4 rounded-full bg-canvas/85 px-3 py-1 text-xs text-stone">
                      Retrato pendiente
                    </span>
                  </div>
                  <div className="px-1 pt-5">
                    <h3 className="text-lg font-semibold text-ink">{member.name}</h3>
                    <p className="mt-1 text-stone">{member.role}</p>
                    <p className="mt-2 text-sm text-ash">{member.credential}</p>
                  </div>
                </article>
              </SpotlightCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
