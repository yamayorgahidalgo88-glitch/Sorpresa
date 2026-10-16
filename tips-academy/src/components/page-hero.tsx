import { Handwrite } from "@/components/board/handwrite"
import { Scribble } from "@/components/board/scribble"

export function PageHero({ eyebrow, title, hand, children }: { eyebrow: string; title: string; hand?: string; children?: React.ReactNode }) {
  return (
    <section className="whiteboard relative overflow-hidden border-b border-hairline">
      <Scribble kind="sparkle" className="absolute top-10 right-[8%] size-12" color="#f5a524" strokeWidth={3} trigger="load" delay={0.8} />
      <Scribble kind="swirl" className="absolute bottom-8 left-[60%] hidden h-12 w-28 md:block" color="var(--sky)" strokeWidth={3} trigger="load" delay={1} />
      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20">
        <p className="text-sm font-semibold text-sky-dark">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-5xl leading-[1.05] font-bold tracking-[-0.03em] text-ink sm:text-6xl">
          {title}{" "}
          {hand && <Handwrite text={hand} trigger="load" delay={0.2} className="font-hand text-[1.1em] text-marker-blue" />}
        </h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">{children}</div>}
      </div>
    </section>
  )
}
