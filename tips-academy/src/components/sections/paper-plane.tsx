"use client"

import { useRef } from "react"

import { prefersReducedMotion, useGSAP } from "@/lib/gsap"

const PATH =
  "M-40 820 C 200 760, 260 560, 420 600 S 620 820, 760 700 S 900 380, 1080 420 S 1300 300, 1480 120"

/**
 * Avión de papel que vuela por su estela al hacer scroll (sin ScrollTrigger: un oyente de scroll sencillo).
 * Rendimiento: los puntos de la trayectoria se calculan una sola vez; durante el scroll solo se
 * actualizan dos atributos (nada de medir el SVG en cada fotograma).
 */
export function PaperPlane() {
  const root = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const svg = root.current!
      const path = svg.querySelector<SVGPathElement>("#plane-path")!
      const reveal = svg.querySelector<SVGPathElement>("#plane-reveal")!
      const plane = svg.querySelector<SVGGElement>("#plane")!

      const len = reveal.getTotalLength()
      reveal.style.strokeDasharray = `${len}`
      const N = 160
      const pts = Array.from({ length: N + 1 }, (_, i) => {
        const a = reveal.getPointAtLength((len * i) / N)
        const b = reveal.getPointAtLength(Math.min(len, (len * (i + 1)) / N))
        return { x: a.x, y: a.y, r: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI }
      })
      void path

      const apply = (p: number) => {
        const f = p * N
        const i = Math.min(N - 1, Math.floor(f))
        const k = f - i
        const a = pts[i], b = pts[i + 1]
        plane.setAttribute("transform", `translate(${a.x + (b.x - a.x) * k} ${a.y + (b.y - a.y) * k}) rotate(${a.r})`)
        reveal.style.strokeDashoffset = `${len * (1 - p)}`
      }
      apply(0)

      // Un único oyente de scroll (pasivo, una vez por fotograma). La altura del hero se mide una vez.
      let h = svg.getBoundingClientRect().height + window.scrollY
      let queued = false
      const onScroll = () => {
        if (queued) return
        queued = true
        requestAnimationFrame(() => {
          queued = false
          apply(Math.min(1, Math.max(0, window.scrollY / h)))
        })
      }
      const onResize = () => (h = svg.getBoundingClientRect().height + window.scrollY)
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onResize)
      return () => {
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("resize", onResize)
      }
    },
    { scope: root }
  )

  return (
    <svg ref={root} aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 z-0 h-full w-full">
      <defs>
        <mask id="plane-mask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1700" height="1100">
          <path id="plane-reveal" d={PATH} fill="none" stroke="#fff" strokeWidth="14" />
        </mask>
      </defs>
      <path id="plane-path" mask="url(#plane-mask)" d={PATH} fill="none" stroke="#36a9e1" strokeWidth="2" strokeDasharray="8 10" strokeLinecap="round" opacity=".55" />
      <g id="plane" transform="translate(-80 -80)" className="motion-reduce:hidden">
        <path d="M-22 -10 L 26 0 L -22 12 L -12 1 Z" fill="#fff" stroke="#0c1f33" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-12 1 L 26 0 L -8 8 Z" fill="#d6ecff" stroke="#0c1f33" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
