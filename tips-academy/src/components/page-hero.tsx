import { Handwrite } from "@/components/board/handwrite"
import { Scribble } from "@/components/board/scribble"

export function PageHero({ title, hand, children }: { title: string; hand?: string; children?: React.ReactNode }) {
  return (
    <section className="whiteboard relative overflow-hidden border-b border-hairline">
      <Scribble kind="sparkle" className="absolute top-10 right-[8%] size-12" color="#f5a524" strokeWidth={3} trigger="load" delay={0.8} />
      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-14">
        <h1 className="max-w-4xl text-5xl leading-[1.05] font-bold tracking-[-0.03em] text-ink sm:text-6xl">
          {title}{" "}
          {hand && <Handwrite text={hand} trigger="load" delay={0.2} className="font-hand text-[1.1em] text-marker-blue" />}
        </h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">{children}</div>}
      </div>
    </section>
  )
}
