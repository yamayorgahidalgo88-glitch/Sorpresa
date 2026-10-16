import { ImageResponse } from "next/og"

export const alt = "Tips Academy · Academia de apoyo e inglés en Alcorcón"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const NOTES = [
  { t: "Mates", c: "#fff1a8", x: 760, y: 90, r: -6 },
  { t: "Inglés B2·C1", c: "#d6ecff", x: 930, y: 230, r: 5 },
  { t: "EvAU", c: "#ffd8f4", x: 780, y: 380, r: -3 },
]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#ffffff",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(28,28,30,.15) 1.5px, transparent 0)",
          backgroundSize: "28px 28px",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 640 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#0b5d8a" }}>Academias de apoyo en Alcorcón</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "#1c1c1e", lineHeight: 1, marginTop: 18 }}>tips</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#1c1c1e", marginTop: 8 }}>Academy</div>
          <div style={{ display: "flex", fontSize: 32, color: "#4f5566", marginTop: 28, lineHeight: 1.3 }}>
            Clases de apoyo · Selectividad · Cambridge · Robótica · Técnicas de estudio
          </div>
          <div style={{ display: "flex", marginTop: 34, background: "#1d3b5a", color: "#fff", fontSize: 28, fontWeight: 700, padding: "14px 30px", borderRadius: 999, alignSelf: "flex-start" }}>
            Tlf. 641 77 09 21
          </div>
        </div>
        {NOTES.map((n) => (
          <div
            key={n.t}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              width: 250,
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: n.c,
              transform: `rotate(${n.r}deg)`,
              fontSize: 40,
              fontWeight: 700,
              color: "#1c1c1e",
              boxShadow: "0 16px 30px -12px rgba(12,31,51,.35)",
            }}
          >
            {n.t}
          </div>
        ))}
      </div>
    ),
    size
  )
}
