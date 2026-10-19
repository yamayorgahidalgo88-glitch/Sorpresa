import { noteBg } from "@/components/board/sticky-note"
import { subjects, type Sticky } from "@/lib/site"

const COLORS: Sticky[] = ["yellow", "rose", "teal", "orange", "sky", "mint", "coral"]
const ROT = [-2, 1.5, -1, 2, -1.5, 1]

/** Asignaturas que se ofrecen en la academia, con sus niveles (misma lista que en /asignaturas). */
export function SubjectsOffered({ className = "whiteboard" }: { className?: string }) {
  return (
    <section aria-labelledby="asignaturas-ofrecidas" className={`${className} py-14 sm:py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="asignaturas-ofrecidas" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Asignaturas que ofrecemos
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-slate">
          En clases grupales y particulares, en cualquiera de estos niveles. Si no ves la tuya, pregúntanos.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {subjects.map((s, i) => (
            <li
              key={s.name}
              style={{ rotate: `${ROT[i % ROT.length]}deg` }}
              className={`rounded-[4px] p-4 shadow-[0_12px_20px_-14px_rgb(12_31_51/0.45)] ${noteBg[COLORS[i % COLORS.length]]}`}
            >
              <p className="font-hand text-[1.6rem] leading-tight font-bold text-ink">{s.name}</p>
              <p className="mt-1 text-xs text-ink/70">{s.levels}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
