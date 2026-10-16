"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"

const GlassCrossScene = dynamic(() => import("./glass-cross-scene"), { ssr: false })

/** WebGL con GPU real. Con renderizado por software (sin aceleración) la escena sería demasiado pesada. */
function hasGpuWebGL() {
  try {
    const c = document.createElement("canvas")
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return false
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ""
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

/**
 * Cruz 3D de cristal. Se carga en diferido (cuando el navegador está libre)
 * para no afectar a la carga inicial; mientras tanto se ve un respaldo estático.
 */
export function Hero3D({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData || (navigator.hardwareConcurrency ?? 4) <= 2 || !hasGpuWebGL()) return
    const start = () => setEnabled(true)
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(start, 1200)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {/* Respaldo estático (sin WebGL / mientras carga) */}
      <div
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-700",
          ready ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="absolute size-[55%] translate-x-[-18%] translate-y-[-12%] rounded-full bg-brand-lime/50 blur-3xl" />
        <div className="absolute size-[50%] translate-x-[20%] translate-y-[16%] rounded-full bg-gold-soft/60 blur-3xl" />
        <svg viewBox="0 0 100 100" className="relative w-[46%] drop-shadow-[0_30px_40px_rgb(34_66_40/0.25)]">
          <defs>
            <linearGradient id="fallback-cross" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#dcebd2" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M38 8h24a4 4 0 0 1 4 4v22a4 4 0 0 0 4 4h22a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H70a4 4 0 0 0-4 4v22a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4V66a4 4 0 0 0-4-4H8a4 4 0 0 1-4-4V42a4 4 0 0 1 4-4h22a4 4 0 0 0 4-4V12a4 4 0 0 1 4-4z"
            fill="url(#fallback-cross)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      {enabled && (
        <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
          <GlassCrossScene onReady={onReady} />
        </div>
      )}
    </div>
  )
}
