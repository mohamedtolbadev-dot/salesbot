"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNav } from "@/components/dashboard/Sidebar"
import { TopBar } from "@/components/dashboard/TopBar"
import { Loader2 } from "lucide-react"

/* ─────────────── Loading Screen ─────────────── */
function LoadingScreen() {
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">

        {/* Icon ring */}
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <svg
            className="absolute -inset-1 animate-spin"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              cx="28" cy="28" r="26"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="40 122"
              strokeLinecap="round"
              className="text-brand-600"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-[13px] font-semibold text-foreground">جاري التحميل</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {"...".slice(0, dots)}{"   ".slice(dots)}
          </p>
        </div>

      </div>
    </div>
  )
}

/* ─────────────── Main Layout ─────────────── */
export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [status, setStatus] = useState("loading") // "loading" | "auth" | "unauth"

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user  = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      setStatus("unauth")
    } else {
      setStatus("auth")
    }
  }, [router])

  if (status === "loading") return <LoadingScreen />
  if (status === "unauth")  return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar — desktop ── */}
      <Sidebar />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* TopBar */}
        <TopBar />

        {/* Scroll container */}
        <main className="flex-1 overflow-y-auto bg-secondary/20 pb-20 md:pb-6">

          {/* Content wrapper - reduced padding on mobile */}
          <div className="w-full max-w-screen-xl mx-auto px-3 md:px-6 pt-3 md:pt-5">
            {children}
          </div>

        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <MobileNav />

    </div>
  )
}