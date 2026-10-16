"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Pause, Play } from "lucide-react"

import { posterSrc, videos, type VideoName } from "@/lib/videos"
import { cn } from "@/lib/utils"

type Props = {
  name: VideoName
  className?: string
  /** Muestra el botón de pausa (WCAG 2.2.2). */
  controls?: boolean
  controlsClassName?: string
  /** Prioridad de carga del póster (solo el vídeo del hero). */
  priority?: boolean
}

/**
 * Vídeo decorativo silencioso en bucle.
 * - No descarga el vídeo hasta que está cerca de la pantalla; se pausa al salir.
 * - Con «movimiento reducido» o «ahorro de datos» se queda en el póster (el usuario puede reproducirlo).
 */
export function AmbientVideo({ name, className, controls = true, controlsClassName, priority }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const allowAuto = useAutoplayAllowed()
  const [loaded, setLoaded] = useState(false)
  // El póster también se pide solo al acercarse a la pantalla (salvo el del hero).
  const [near, setNear] = useState(!!priority)

  useEffect(() => {
    const video = ref.current
    if (!video || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" })
    io.observe(video)
    return () => io.disconnect()
  }, [near])

  const visible = useRef(false)
  const wantPlay = useRef(false)

  // Al añadir las <source> hay que llamar a load(); después se reproduce si procede.
  useEffect(() => {
    const video = ref.current
    if (!video || !loaded) return
    video.load()
    if (wantPlay.current || (allowAuto && visible.current && !userPaused)) video.play().catch(() => {})
    wantPlay.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting
        if (entry.isIntersecting) {
          if (!allowAuto) return
          if (!loaded) setLoaded(true)
          else if (!userPaused) video.play().catch(() => {})
        } else if (!video.paused) {
          video.pause()
        }
      },
      { rootMargin: "200px 0px" }
    )
    io.observe(video)
    return () => io.disconnect()
  }, [allowAuto, userPaused, loaded])

  function toggle() {
    const video = ref.current
    if (!video) return
    if (!loaded) {
      wantPlay.current = true
      setUserPaused(false)
      setLoaded(true)
      return
    }
    if (video.paused) {
      setUserPaused(false)
      video.play().catch(() => {})
    } else {
      setUserPaused(true)
      video.pause()
    }
  }

  const base = `/videos/${videos[name].name}`

  return (
    <>
      <video
        ref={ref}
        className={cn("size-full object-cover", className)}
        poster={near ? posterSrc(name) : undefined}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...(priority ? { fetchPriority: "high" } : {})}
      >
        {loaded && (
          <>
            <source src={`${base}-480.mp4`} type="video/mp4" media="(max-width: 767px)" />
            <source src={`${base}-720.mp4`} type="video/mp4" />
          </>
        )}
      </video>
      {controls && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar vídeo de fondo" : "Reproducir vídeo de fondo"}
          className={cn(
            "absolute z-10 grid size-11 place-items-center rounded-full border border-white/40 bg-black/25 text-white backdrop-blur-md transition-colors hover:bg-black/45",
            controlsClassName ?? "right-4 bottom-4"
          )}
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
      )}
    </>
  )
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** Reproducción automática solo sin «movimiento reducido» ni «ahorro de datos». */
function useAutoplayAllowed() {
  return useSyncExternalStore(
    subscribeMotion,
    () => {
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
      return !window.matchMedia(REDUCE_QUERY).matches && !saveData
    },
    () => false
  )
}
