"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

export function Providers({ children }: { children: React.ReactNode }) {
  useSmoothScroll()
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

/**
 * Desplazamiento suave con Lenis. No se activa si el usuario prefiere
 * movimiento reducido. Los enlaces internos (#ancla) se desplazan con
 * la misma inercia y compensan la cabecera fija.
 */
function useSmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches) return

    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 0.9 })

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null
      if (!link || link.target === "_blank") return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -80, duration: 1.2 })
      history.pushState(null, "", url.hash)
      // Mover el foco al destino para teclado y lectores de pantalla
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      lenis.destroy()
    }
  }, [])
}
