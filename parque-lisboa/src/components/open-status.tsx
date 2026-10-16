"use client"

import { useEffect, useState } from "react"

import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

type Status = { open: boolean; label: string }

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function compute(now: Date): Status {
  // Hora local de Madrid, independientemente de la zona del visitante.
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  const dayIndex = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"].findIndex((d) =>
    get("weekday").toLowerCase().startsWith(d)
  )
  const minutes = Number(get("hour")) * 60 + Number(get("minute"))
  const isWorkday = (site.hours.weekdays as readonly number[]).includes(dayIndex)

  if (isWorkday) {
    for (const slot of site.hours.slots) {
      if (minutes >= toMinutes(slot.opens) && minutes < toMinutes(slot.closes)) {
        return { open: true, label: `Abierto ahora · hasta las ${slot.closes}` }
      }
    }
    const next = site.hours.slots.find((s) => minutes < toMinutes(s.opens))
    if (next) return { open: false, label: `Cerrado ahora · abrimos a las ${next.opens}` }
  }
  return { open: false, label: `Cerrado ahora · ${site.hours.days.toLowerCase()}` }
}

export function OpenStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    const tick = () => setStatus(compute(new Date()))
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className={cn("inline-flex min-h-5 items-center gap-2 pl-1 text-sm font-medium", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === null ? "bg-muted-foreground/40" : status.open ? "bg-primary shadow-[0_0_0_4px_rgb(46_125_50/0.18)]" : "bg-brand-olive/60"
        )}
      />
      <span>{status?.label ?? site.hours.summary}</span>
    </span>
  )
}
