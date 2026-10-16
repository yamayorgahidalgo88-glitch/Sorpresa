import type { Metadata, Viewport } from "next"
import { DM_Sans, Forum } from "next/font/google"

import { Providers } from "@/components/providers"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { site } from "@/lib/site"
import { clinicJsonLd, jsonLd } from "@/lib/structured-data"
import "./globals.css"

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const display = Forum({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" })

const title = "Fisioterapia, rehabilitación y podología en Alcorcón | Centro Clínico Parque Lisboa"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "fisioterapia Alcorcón",
    "rehabilitación Alcorcón",
    "podología Alcorcón",
    "podólogo Alcorcón",
    "fisioterapeuta Parque Lisboa",
    "centro clínico Alcorcón",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  other: {
    "geo.region": "ES-MD",
    "geo.placename": "Alcorcón",
  },
}

export const viewport: Viewport = {
  themeColor: "#2e7d32",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(clinicJsonLd())} />
        <Providers>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  )
}
