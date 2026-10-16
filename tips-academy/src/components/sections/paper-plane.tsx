"use client"

import { useRef } from "react"

import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap"

/** Avión de papel que vuela por su estela al hacer scroll (MotionPath + DrawSVG + ScrollTrigger). */
export function PaperPlane() {
  const root = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const path = root.current!.querySelector<SVGPathElement>("#plane-path")!
      const plane = root.current!.querySelector<SVGGElement>("#plane")!
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 1 },
      })
      // La estela es discontinua: se revela con una máscara que se dibuja con DrawSVG.
      const reveal = root.current!.querySelector<SVGPathElement>("#plane-reveal")!
      tl.fromTo(reveal, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none" }, 0).to(
        plane,
        { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true }, ease: "none" },
        0
      )
    },
    { scope: root }
  )

  return (
    <svg
      ref={root}
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <mask id="plane-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1700" height="1100">
          <path id="plane-reveal" d="M-40 820 C 200 760, 260 560, 420 600 S 620 820, 760 700 S 900 380, 1080 420 S 1300 300, 1480 120" fill="none" stroke="#fff" strokeWidth="14" />
        </mask>
      </defs>
      <path
        id="plane-path"
        mask="url(#plane-mask)"
        d="M-40 820 C 200 760, 260 560, 420 600 S 620 820, 760 700 S 900 380, 1080 420 S 1300 300, 1480 120"
        fill="none"
        stroke="#36a9e1"
        strokeWidth="2"
        strokeDasharray="8 10"
        strokeLinecap="round"
        opacity=".55"
      />
      <g id="plane" transform="translate(-80 -80)" className="motion-reduce:hidden">
        <path d="M-22 -10 L 26 0 L -22 12 L -12 1 Z" fill="#fff" stroke="#0c1f33" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-12 1 L 26 0 L -8 8 Z" fill="#d6ecff" stroke="#0c1f33" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
