import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

export const alt = `${site.name} · Fisioterapia, rehabilitación y podología en Alcorcón`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f7f1e8",
          color: "#1c1b1a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(45deg, #2e7d32, #acff36)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="9 9 22 22">
              <path d="M16.5 9h7v7.5H31v7h-7.5V31h-7v-7.5H9v-7h7.5z" fill="#fff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: "#4a4741" }}>Centro Clínico</span>
            <span style={{ fontSize: 22, letterSpacing: 8, color: "#6b665f" }}>PARQUE LISBOA</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#1c1b1a" }}>FISIOTERAPIA · REHABILITACIÓN · PODOLOGÍA</span>
          <span style={{ fontSize: 92, lineHeight: 1.02, maxWidth: 1000, fontFamily: "serif" }}>
            Cuidamos de cómo te mueves, en Alcorcón.
          </span>
          <span style={{ fontSize: 30, color: "#4a4741" }}>
            {site.address.street} · Tel. {site.phone.display}
          </span>
        </div>
      </div>
    ),
    size
  )
}
