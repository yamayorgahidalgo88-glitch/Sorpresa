import { UserRound } from "lucide-react"

import { BlurFade } from "@/components/magicui/blur-fade"
import { SectionHeading } from "@/components/section-heading"
import { team } from "@/lib/site"

export function Team() {
  return (
    <section id="equipo" aria-labelledby="equipo-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="equipo-title"
          eyebrow="Equipo"
          title="Profesionales sanitarios cerca de ti"
          description="Un equipo multidisciplinar que se coordina para ofrecerte una atención integral. Pronto podrás conocer a cada profesional."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <BlurFade as="li" key={`${member.role}-${i}`} delay={i * 0.06}>
              <article className="group h-full overflow-hidden rounded-3xl border bg-card">
                {/* Marcador de posición: sustituir por una foto profesional con consentimiento. */}
                <div className="relative grid aspect-[4/3] place-items-center bg-[linear-gradient(160deg,var(--brand-mint),#d5ead6)]">
                  <UserRound className="size-16 text-primary/35" aria-hidden="true" strokeWidth={1.25} />
                  <span className="absolute top-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
                    Foto pendiente
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-brand-deep">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{member.credential}</p>
                </div>
              </article>
            </BlurFade>
          ))}
        </ul>
      </div>
    </section>
  )
}
