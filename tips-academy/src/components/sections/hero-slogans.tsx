"use client"

import TextType from "@/components/reactbits/TextType"

/** Lápiz que "escribe": va al final del texto y se mueve como en una mano. */
function Pencil() {
  return (
    <span className="pencil-writing relative -ml-[calc(0.25rem+0.18em)] inline-block h-[1.3em] w-[1.3em] origin-bottom-left">
      <svg viewBox="0 0 40 40" className="absolute bottom-0 left-0 size-full drop-shadow-[1px_2px_1px_rgb(0_0_0/0.18)]" aria-hidden="true">
        {/* cuerpo inclinado: la punta queda abajo a la izquierda, como al escribir */}
        <g transform="rotate(-50 6 34)">
          <path d="M6 34 L12 31 L12 37 Z" fill="#f2c79b" />
          <path d="M6 34 L8.2 32.9 L8.2 35.1 Z" fill="#2b2b2b" />
          <rect x="12" y="31" width="26" height="6" fill="#ffd02f" />
          <rect x="12" y="33.2" width="26" height="1.6" fill="#f5b800" />
          <rect x="38" y="31" width="4" height="6" fill="#b9b9b9" />
          <rect x="42" y="31" width="5" height="6" rx="1.5" fill="#ff8fa3" />
        </g>
      </svg>
    </span>
  )
}

/** React Bits · TextType: los eslóganes de la academia se escriben y se borran solos. */
export function HeroSlogans() {
  return (
    <p className="mt-5 min-h-[2.8rem] font-hand text-[1.9rem] leading-tight sm:text-[2.2rem]">
      <TextType
        as="span"
        text={[
          "Aprender también puede ser divertido.",
          "Prepara la EvAU de la mejor manera posible.",
          "Cada alumno, a su ritmo.",
          "Nunca es tarde para mejorar tu futuro.",
          "Entre todos hacemos TIPS.",
        ]}
        typingSpeed={60}
        deletingSpeed={28}
        pauseDuration={2200}
        initialDelay={1800}
        cursorCharacter={<Pencil />}
        cursorBlinkDuration={0}
        className="text-marker-blue"
      />
    </p>
  )
}
