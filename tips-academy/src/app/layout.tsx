import type { Metadata, Viewport } from "next"
import { Caveat, Plus_Jakarta_Sans } from "next/font/google"

import { Providers } from "@/components/providers"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { WhatsAppChat } from "@/components/whatsapp-chat"
import { site } from "@/lib/site"
import { academyJsonLd, jsonLd } from "@/lib/structured-data"
import "./globals.css"

// Plus Jakarta Sans sustituye a Roobert PRO (Miro): geométrica y cercana.
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
// Caveat: la letra "a mano" de rotulador y tiza.
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" })

const title = "Tips Academy · Academia de apoyo e inglés en Alcorcón"
// Mientras sea una propuesta, no se indexa (evita contenido duplicado con la web actual).
const indexable = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description: site.description,
  keywords: ["academia Alcorcón", "clases de apoyo Alcorcón", "academia de inglés Alcorcón", "Selectividad EvAU Alcorcón", "clases particulares Alcorcón"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_ES", url: "/", siteName: site.name, title, description: site.description },
  twitter: { card: "summary_large_image", title, description: site.description },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = { themeColor: "#36a9e1", width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${hand.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Marca que hay JS: las escrituras "al entrar en pantalla" esperan a ser visibles */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-[60] rounded-full bg-navy px-5 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(academyJsonLd())} />
        {/* Filtro de tiza: borde irregular */}
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter id="chalk-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
          </filter>
        </svg>
        <Providers>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <WhatsAppChat />
        </Providers>
      </body>
    </html>
  )
}
