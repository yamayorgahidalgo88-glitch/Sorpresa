import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/section-heading"

const steps = [
  { title: "Nos cuentas qué te pasa", text: "Por teléfono, WhatsApp o formulario. Te damos cita en el horario que mejor te encaje." },
  { title: "Valoración inicial", text: "El profesional revisa tu historia, explora y te explica con claridad lo que observa." },
  { title: "Plan a tu medida", text: "Acordamos objetivos realistas y el tipo de sesiones según tus necesidades." },
  { title: "Seguimiento", text: "Revisamos tu evolución y ajustamos el plan siempre que haga falta." },
]

/** Banda de color tierra (Oura · rampa salvia) que marca el ritmo del scroll. */
export function Approach() {
  return (
    <section aria-labelledby="como-title" className="bg-sage-pale py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHeading
          id="como-title"
          eyebrow="Cómo trabajamos"
          title={
            <>
              Una atención sin prisas, <em>de principio a fin</em>
            </>
          }
        />
        <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08}>
              {/* Oura · stat-badge */}
              <span
                aria-hidden="true"
                className="grid size-24 place-items-center rounded-full bg-canvas font-display text-4xl font-light text-forest"
              >
                {i + 1}
              </span>
              <h3 className="mt-7 text-xl font-semibold text-forest">
                <span className="sr-only">Paso {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-forest/80">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
