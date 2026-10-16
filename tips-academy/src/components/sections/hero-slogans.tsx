"use client"

import TextType from "@/components/reactbits/TextType"

/** React Bits · TextType: los eslóganes de la academia se escriben y se borran solos. */
export function HeroSlogans() {
  return (
    <p className="mt-6 min-h-[2.6rem] font-hand text-[1.9rem] leading-tight text-ink-deep sm:text-[2.2rem]">
      <span className="text-steel">Aquí: </span>
      <TextType
        as="span"
        text={[
          "A estudiar también se aprende.",
          "Prepara la EvAU de la mejor manera posible.",
          "Hacer del juego una profesión.",
          "Nunca es tarde para mejorar tu futuro.",
          "Entre todos hacemos TIPS.",
        ]}
        typingSpeed={55}
        deletingSpeed={28}
        pauseDuration={2200}
        initialDelay={1800}
        cursorCharacter="✎"
        cursorClassName="text-marker-red"
        className="text-marker-blue"
      />
    </p>
  )
}
