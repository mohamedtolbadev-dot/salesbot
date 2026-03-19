"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNav } from "@/components/dashboard/Sidebar"
import { TopBar } from "@/components/dashboard/TopBar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
    } else {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* TopBar */}
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 bg-muted/10 pb-20 md:pb-5">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  )
}
