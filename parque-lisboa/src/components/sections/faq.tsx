import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { faqs } from "@/lib/site"

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-canvas py-28 sm:py-40">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          id="faq-title"
          eyebrow="Preguntas frecuentes"
          title={
            <>
              Resolvemos <em>tus dudas</em>
            </>
          }
          description="Si no encuentras la respuesta, llámanos y te ayudamos."
        />
        <Reveal>
          <Accordion type="single" collapsible className="w-full border-t border-hairline">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-hairline">
                <AccordionTrigger className="py-6 text-lg font-semibold text-ink hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-stone">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
