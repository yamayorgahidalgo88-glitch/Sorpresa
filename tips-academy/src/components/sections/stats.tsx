"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Handwrite } from "@/components/board/handwrite"
import { StickyNote } from "@/components/board/sticky-note"
import CountUp from "@/components/reactbits/CountUp"
import { stats } from "@/lib/site"

const ROT = [-3, 2, -2, 3]

export function Stats() {
  return (
    <section aria-labelledby="stats-title" className="whiteboard pt-2 pb-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="stats-title" className="text-center">
          <Handwrite text="¡Tu academia de apoyo!" className="font-hand text-5xl font-bold text-ink sm:text-6xl" speed={55} />
        </h2>
        <ul className="mt-10 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StickyNote as="li" key={s.label} color={s.color} rotate={ROT[i]} className="group text-center hover:rotate-0 hover:-translate-y-1">
              {/* React Bits · CountUp */}
              <CountUp to={s.value} duration={2.2} separator="." className="font-hand text-6xl font-bold text-ink sm:text-7xl" />
              <Link href={s.href} className="mt-2 block font-semibold text-ink-deep after:absolute after:inset-0">
                {s.label}
              </Link>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-deep underline-offset-4 group-hover:underline">
                Ver más <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </StickyNote>
          ))}
        </ul>
      </div>
    </section>
  )
}
