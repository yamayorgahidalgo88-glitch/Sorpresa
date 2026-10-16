import { ClipboardList, HeartHandshake, MessageCircle, Repeat } from "lucide-react"

import { BlurFade } from "@/components/magicui/blur-fade"
import { SectionHeading } from "@/components/section-heading"

const steps = [
  {
    icon: MessageCircle,
    title: "Nos cuentas qué te pasa",
    text: "Por teléfono, WhatsApp o formulario. Te damos cita en el horario que mejor te encaje.",
  },
  {
    icon: ClipboardList,
    title: "Valoración inicial",
    text: "El profesional revisa tu historia, explora y te explica con claridad lo que observa.",
  },
  {
    icon: HeartHandshake,
    title: "Plan a tu medida",
    text: "Acordamos objetivos realistas y el tipo de sesiones según tus necesidades.",
  },
  {
    icon: Repeat,
    title: "Seguimiento",
    text: "Revisamos tu evolución y ajustamos el plan siempre que haga falta.",
  },
]

export function Approach() {
  return (
    <section aria-labelledby="como-title" className="relative overflow-hidden bg-brand-deep py-20 text-white sm:py-28">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgb(172_255_54/0.18),transparent_40%),radial-gradient(circle_at_0%_100%,rgb(46_125_50/0.55),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="como-title"
          tone="dark"
          eyebrow="Cómo trabajamos"
          title="Una atención sin prisas, de principio a fin"
          description="Queremos que entiendas cada paso y que te sientas acompañado durante todo el proceso."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <BlurFade as="li" key={step.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-lime text-brand-deep">
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-3xl text-white/25" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">
                  <span className="sr-only">Paso {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{step.text}</p>
              </div>
            </BlurFade>
          ))}
        </ol>
      </div>
    </section>
  )
}
