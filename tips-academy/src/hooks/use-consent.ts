"use client"

import { useSyncExternalStore } from "react"

/**
 * Consentimiento para contenido de terceros (Google Maps).
 * La web no instala cookies propias no técnicas: el mapa solo se carga
 * si el usuario lo acepta expresamente. La elección se guarda en localStorage.
 */

const KEY = "tips-consent-external"
const EVENT = "ccpl-consent-change"

export type ConsentValue = "granted" | "denied" | null

// Respaldo en memoria por si localStorage no está disponible (modo privado, bloqueos…).
let memory: ConsentValue = null

function read(): ConsentValue {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === "granted" || v === "denied" ? v : memory
  } catch {
    return memory
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

export function setExternalConsent(value: ConsentValue) {
  memory = value
  try {
    if (value) window.localStorage.setItem(KEY, value)
    else window.localStorage.removeItem(KEY)
  } catch {
    // almacenamiento no disponible: la elección dura solo esta visita
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useExternalConsent(): ConsentValue {
  return useSyncExternalStore(subscribe, read, () => null)
}
