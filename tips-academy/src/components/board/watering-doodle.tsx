"use client"

import { useRef } from "react"

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

/**
 * "Regar desiertos": regadera dibujada a rotulador que riega y hace crecer una planta.
 * Se dibuja con DrawSVG al entrar en pantalla; las gotas caen en bucle.
 */
export function WateringDoodle({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 85%", once: true } })
      tl.from(".wd-can", { drawSVG: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.1 })
        .from(".wd-can-wrap", { rotate: 14, svgOrigin: "150 100", duration: 0.7, ease: "back.out(2)" }, "-=0.2")
        .from(".wd-ground", { drawSVG: 0, duration: 0.5 }, "<")
        .from(".wd-stem", { drawSVG: 0, duration: 0.9, ease: "power1.out" })
        .from(".wd-leaf", { drawSVG: 0, scale: 0.3, transformOrigin: "50% 100%", duration: 0.6, stagger: 0.2, ease: "back.out(2)" }, "-=0.3")
        .from(".wd-flower", { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(3)" })
      gsap.fromTo(
        ".wd-drop",
        { y: 0, autoAlpha: 0 },
        { y: 34, autoAlpha: 1, duration: 0.9, ease: "power1.in", stagger: { each: 0.3, repeat: -1 }, delay: 1.2 }
      )
    },
    { scope: ref }
  )

  return (
    <svg ref={ref} viewBox="0 0 240 150" aria-hidden="true" focusable="false" className={cn("overflow-visible", className)}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Regadera, inclinada como al regar */}
        <g className="wd-can-wrap">
          <path className="wd-can" d="M120 40 C 118 70, 122 92, 130 100 L 180 100 C 188 92, 190 70, 188 40 Z" stroke="#36a9e1" strokeWidth="3.2" fill="#d6ecff" />
          <path className="wd-can" d="M126 40 C 140 30, 168 30, 182 40" stroke="#36a9e1" strokeWidth="3.2" />
          <path className="wd-can" d="M188 52 C 214 50, 220 82, 186 88" stroke="#36a9e1" strokeWidth="3.2" />
          <path className="wd-can" d="M122 70 L 82 34 M 74 28 L 88 24 L 92 38 Z" stroke="#36a9e1" strokeWidth="3.2" />
        </g>
        {/* Gotas */}
        {[74, 82, 90].map((x, i) => (
          <path key={x} className="wd-drop" d={`M${x} ${58 + i * 3} q 3 5 0 8 q -3 -3 0 -8 Z`} fill="#36a9e1" stroke="#36a9e1" strokeWidth="1.5" />
        ))}
        {/* Suelo y planta */}
        <path className="wd-ground" d="M30 136 C 60 132, 100 138, 140 134" stroke="#a86f3d" strokeWidth="3" />
        <path className="wd-stem" d="M78 136 C 76 120, 82 108, 80 92" stroke="#2f9e55" strokeWidth="3.2" />
        <path className="wd-leaf" d="M79 118 C 62 116, 56 104, 58 98 C 70 100, 78 108, 79 118 Z" stroke="#2f9e55" strokeWidth="2.6" fill="#d2f6dc" />
        <path className="wd-leaf" d="M80 108 C 96 104, 102 92, 100 86 C 88 88, 81 98, 80 108 Z" stroke="#2f9e55" strokeWidth="2.6" fill="#d2f6dc" />
        <g className="wd-flower">
          <circle cx="80" cy="86" r="6" fill="#ffd02f" stroke="#f5a524" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="80" cy="76" rx="4.5" ry="7" fill="#ffd8f4" stroke="#e5484d" strokeWidth="1.6" transform={`rotate(${a} 80 86)`} />
          ))}
          <circle cx="80" cy="86" r="5" fill="#ffd02f" />
        </g>
      </g>
    </svg>
  )
}
