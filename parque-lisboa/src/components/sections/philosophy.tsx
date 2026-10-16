import { TextReveal } from "@/components/magicui/text-reveal"
import { Reveal } from "@/components/motion/reveal"

export function Philosophy() {
  return (
    <section id="filosofia" aria-labelledby="filosofia-title" className="bg-canvas py-28 sm:py-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <Reveal>
          <h2 id="filosofia-title" className="eyebrow text-ink">
            Nuestra forma de cuidar
          </h2>
        </Reveal>
        <TextReveal className="mt-8 font-display text-[2rem] leading-[1.2] font-light text-ink sm:text-5xl sm:leading-[1.15]">
          Creemos que cuidar de tu salud empieza por escucharte. Por eso dedicamos tiempo a cada persona, explicamos cada paso con claridad y te acompañamos durante todo el proceso.
        </TextReveal>
      </div>
    </section>
  )
}
