import { Handwrite } from "@/components/board/handwrite"
import { noteBg } from "@/components/board/sticky-note"
import { team } from "@/lib/site"
import { cn } from "@/lib/utils"

const ROT = [-3, 2, -1.5, 3, -2, 1.5]
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")

export function Team() {
  return (
    <section id="equipo" aria-labelledby="equipo-title" className="whiteboard py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-sky-dark">Nuestro equipo</p>
          <h2 id="equipo-title" className="mt-3 text-4xl leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-5xl">
            Profes titulados y con{" "}
            <Handwrite text="muchísimo entusiasmo" className="font-hand text-[1.15em] text-marker-red" speed={45} />
          </h2>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:gap-x-10">
          {team.map((t, i) => (
            <li
              key={t.name}
              style={{ "--r": `${ROT[i]}deg` } as React.CSSProperties}
              className="group relative origin-top rotate-(--r) rounded-[6px] bg-white p-3 pb-5 shadow-[0_2px_4px_rgb(0_0_0/0.06),0_20px_30px_-20px_rgb(12_31_51/0.45)] transition-transform duration-500 hover:rotate-0 hover:[animation:swing_1.2s_ease-in-out] sm:p-4 sm:pb-6"
            >
              {/* Chincheta */}
              <span aria-hidden="true" className="absolute -top-3 left-1/2 z-10 size-6 -translate-x-1/2 rounded-full bg-marker-red shadow-[inset_-3px_-3px_0_rgb(0_0_0/0.2),0_3px_4px_rgb(0_0_0/0.25)]" />
              {/* Retrato pendiente: avatar con iniciales */}
              <div className={cn("grid aspect-square place-items-center rounded-[3px]", noteBg[t.color])}>
                <span className="font-hand text-6xl font-bold text-ink/80 sm:text-7xl">{initials(t.name)}</span>
              </div>
              <h3 className="mt-4 font-hand text-2xl leading-tight font-bold text-ink sm:text-3xl">{t.name}</h3>
              <p className="mt-1 text-sm leading-snug text-slate">{t.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
