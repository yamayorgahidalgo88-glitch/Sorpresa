import type { Metadata } from "next"

import { LoginCard } from "@/components/login-card"

export const metadata: Metadata = {
  title: "Aula Virtual",
  description: "Accede al Aula Virtual de Tips Academy.",
  alternates: { canonical: "/aula-virtual" },
}

export default function AulaVirtualPage() {
  return (
    <div className="whiteboard py-14 sm:py-20">
      <div className="mx-auto max-w-md px-4">
        <LoginCard />
      </div>
    </div>
  )
}
