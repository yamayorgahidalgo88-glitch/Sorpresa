"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap"

export function Providers({ children }: { children: React.ReactNode }) {
  useSmoothScroll()
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

/**
 * Lenis + GSAP ScrollTrigger en un único bucle (integración recomendada en el README de Lenis).
 * Desactivado con «movimiento reducido». Los enlaces #ancla se desplazan con la misma inercia.
 */
function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 })
    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null
      if (!link || link.target === "_blank") return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -90, duration: 1.3 })
      history.pushState(null, "", url.hash)
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
    }
    document.addEventListener("click", onClick, true)

    return () => {
      document.removeEventListener("click", onClick, true)
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}
