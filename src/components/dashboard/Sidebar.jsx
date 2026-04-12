"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { cn } from "@/lib/utils"
import { conversationsAPI, ordersAPI, appointmentsAPI } from "@/lib/api"
import fetchAPI from "@/lib/api"
import { useMobileMenu } from "@/contexts/MobileMenuContext"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  MessageCircle, BarChart3, ShoppingBag,
  Users, Settings, LayoutDashboard, Wrench, Calendar, ClipboardList,
  FileText, ShieldCheck, UserCog,
} from "lucide-react"

const navItems = [
  { key: "nav.dashboard",     href: "/dashboard",               icon: LayoutDashboard },
  { key: "nav.conversations", href: "/dashboard/conversations",  icon: MessageCircle   },
  { key: "nav.orders",        href: "/dashboard/orders",         icon: ClipboardList   },
  { key: "nav.appointments",  href: "/dashboard/appointments",   icon: Calendar        },
  { key: "nav.analytics",     href: "/dashboard/analytics",      icon: BarChart3       },
  { key: "nav.products",      href: "/dashboard/products",       icon: ShoppingBag     },
  { key: "nav.services",      href: "/dashboard/services",       icon: Wrench          },
  { key: "nav.customers",     href: "/dashboard/customers",      icon: Users           },
  { key: "nav.invoices",      href: "/dashboard/invoices",       icon: FileText        },
  { key: "nav.settings",      href: "/dashboard/settings",       icon: Settings        },
]

const adminNavItems = [
  { key: "nav.admin_invoices", href: "/dashboard/admin/invoices", icon: ShieldCheck },
  { key: "nav.admin_users",    href: "/dashboard/admin/users",    icon: UserCog     },
]

function getLastSeen(key) {
  if (typeof window === "undefined") return new Date(0).toISOString()
  return localStorage.getItem(key) || new Date(0).toISOString()
}
function markSeen(key) {
  if (typeof window !== "undefined") localStorage.setItem(key, new Date().toISOString())
}

function getUserRoleFromStorage() {
  if (typeof window === "undefined") return "USER"
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user?.role || "USER"
  } catch { return "USER" }
}

async function fetchAndSyncRole() {
  try {
    const res = await fetchAPI("/api/auth/me")
    const role = res?.data?.role || res?.role || "USER"
    const stored = JSON.parse(localStorage.getItem("user") || "{}")
    localStorage.setItem("user", JSON.stringify({ ...stored, role }))
    return role
  } catch { return getUserRoleFromStorage() }
}

/* ══════════════════════════════════════
   Unified Hook: role + counts + markAsSeen + polling
══════════════════════════════════════ */
function useNavCountsAndRole({ pollingMs = null } = {}) {
  const [role, setRole] = useState("USER")
  const [unreadCount, setUnreadCount] = useState(0)
  const [newOrdersBadge, setNewOrdersBadge] = useState(0)
  const [newApptsBadge, setNewApptsBadge] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Role fetch with sync (guarded)
  useEffect(() => {
    let cancelled = false
    setRole(getUserRoleFromStorage())
    fetchAndSyncRole().then((r) => {
      if (!cancelled) setRole(r)
    })
    return () => { cancelled = true }
  }, [])

  // Fetch counts (guarded)
  const refresh = useCallback(() => {
    // Conversations
    conversationsAPI.getAll()
      .then((res) => {
        if (!mounted) return
        const convs = res.data?.conversations || []
        setUnreadCount(convs.filter(c => !c.isRead).length)
      })
      .catch(() => {})

    // Orders
    ordersAPI.getAll()
      .then((res) => {
        if (!mounted) return
        const orders = Array.isArray(res.data) ? res.data : []
        const last = getLastSeen('sb_seenOrders')
        setNewOrdersBadge(orders.filter(o => new Date(o.createdAt) > new Date(last)).length)
      })
      .catch(() => {})

    // Appointments
    appointmentsAPI.getAll()
      .then((res) => {
        if (!mounted) return
        const appts = Array.isArray(res.data) ? res.data : []
        const last = getLastSeen('sb_seenAppts')
        setNewApptsBadge(appts.filter(a => new Date(a.createdAt) > new Date(last)).length)
      })
      .catch(() => {})
  }, [mounted])

  // Initial fetch + optional polling
  useEffect(() => {
    refresh()
    if (!pollingMs) return
    const interval = setInterval(refresh, pollingMs)
    return () => clearInterval(interval)
  }, [refresh, pollingMs])

  // Allow other pages to trigger a count refresh (e.g. after marking a conversation read)
  useEffect(() => {
    if (typeof window === "undefined") return
    const onRefresh = () => refresh()
    window.addEventListener("sb:counts-refresh", onRefresh)
    return () => window.removeEventListener("sb:counts-refresh", onRefresh)
  }, [refresh])

  // Mark as seen handlers
  const markAsSeen = useCallback((type) => {
    if (type === "conversations") {
      setUnreadCount(0)
    } else if (type === "orders") {
      markSeen('sb_seenOrders')
      setNewOrdersBadge(0)
    } else if (type === "appointments") {
      markSeen('sb_seenAppts')
      setNewApptsBadge(0)
    }
  }, [])

  return {
    role,
    unreadCount,
    newOrdersBadge,
    newApptsBadge,
    markAsSeen,
    refresh,
  }
}

/* ══════════════════════════════════════
   MobileNav — Drawer only
══════════════════════════════════════ */
export function MobileNav() {
  const pathname = usePathname()
  const { isOpen, close } = useMobileMenu()
  const { t, isRTL } = useLanguage()
  const { role, unreadCount, newOrdersBadge, newApptsBadge, markAsSeen } = useNavCountsAndRole()

  useEffect(() => { close() }, [pathname])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={close}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 z-50 h-screen w-[270px]",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          "border-border/50 shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        )}
        style={{ backgroundColor: "var(--drawer-bg)" }}
      >

        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0"
          style={{ backgroundColor: "var(--drawer-bg)" }}
        >
          <Logo href="/dashboard" />
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems
            .filter(item => role !== "SUPER_ADMIN" || item.href !== "/dashboard/invoices")
            .map((item) => {
              const Icon = item.icon
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
              const badge = ({"/dashboard/conversations": unreadCount, "/dashboard/orders": newOrdersBadge, "/dashboard/appointments": newApptsBadge})[item.href] || 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    close()
                    if (item.href === "/dashboard/conversations") { markAsSeen("conversations") }
                    if (item.href === "/dashboard/orders") { markAsSeen("orders") }
                    if (item.href === "/dashboard/appointments") { markAsSeen("appointments") }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                    active
                      ? "bg-brand-600/10 text-brand-700 font-semibold"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn("shrink-0", active ? "text-brand-600" : "text-muted-foreground")}
                  />
                  <span className="flex-1">{t(item.key)}</span>
                  {badge > 0 && (
                    <span className="bg-brand-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          {role === "SUPER_ADMIN" && (
            <>
              <div className="my-1 border-t border-border/50" />
              <p className="px-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">{t('nav.admin')}</p>
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                      active ? "bg-brand-600/10 text-brand-700 font-semibold" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    )}>
                    <Icon size={20} className={cn("shrink-0", active ? "text-brand-600" : "text-muted-foreground")} />
                    <span className="flex-1">{t(item.key)}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div
          className="p-3 border-t border-border/50 shrink-0"
          style={{ backgroundColor: "var(--drawer-bg)" }}
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/10">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Wakil.ma</p>
              <p className="text-xs text-muted-foreground">{t('plan.pro')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS variable for drawer background */}
      <style>{`
        :root                { --drawer-bg: #ffffff; }
        .dark                { --drawer-bg: #0f0f0f; }
        [data-theme="dark"]  { --drawer-bg: #0f0f0f; }
      `}</style>
    </>
  )
}

/* ══════════════════════════════════════
   Sidebar — Desktop only
══════════════════════════════════════ */
export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { role, unreadCount, newOrdersBadge, newApptsBadge, markAsSeen } = useNavCountsAndRole({ pollingMs: 30_000 })

  return (
    <aside className="hidden md:flex w-[200px] h-screen flex-col bg-card border-l border-border/50 shrink-0 overflow-hidden">
      <div className="flex items-center px-4 h-14 border-b border-border/50 shrink-0">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex-1 p-2.5 flex flex-col gap-1 overflow-y-auto">
        {navItems
          .filter(item => role !== "SUPER_ADMIN" || item.href !== "/dashboard/invoices")
          .map((item) => {
            const Icon = item.icon
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
            const badge = ({"/dashboard/conversations": unreadCount, "/dashboard/orders": newOrdersBadge, "/dashboard/appointments": newApptsBadge})[item.href] || 0
            return (
              <Link key={item.href} href={item.href}
                onClick={() => {
                  if (item.href === "/dashboard/conversations") { markAsSeen("conversations") }
                  if (item.href === "/dashboard/orders") { markAsSeen("orders") }
                  if (item.href === "/dashboard/appointments") { markAsSeen("appointments") }
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200 border border-transparent",
                  active
                    ? "bg-brand-600/10 text-brand-700 font-semibold border-brand-600/30 shadow-sm shadow-brand-600/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/50"
                )}>
                <Icon size={16} className={cn("shrink-0 transition-colors", active ? "text-brand-600" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{t(item.key)}</span>
                {badge > 0 && (
                  <span className="bg-brand-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center leading-none shrink-0 shadow-sm">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            )
          })}
        {role === "SUPER_ADMIN" && (
          <>
            <div className="my-1 border-t border-border/50" />
            <p className="px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">{t('nav.admin')}</p>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium",
                    "transition-all duration-200 border border-transparent",
                    active
                      ? "bg-brand-600/10 text-brand-700 font-semibold border-brand-600/30 shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/50"
                  )}>
                  <Icon size={16} className={cn("shrink-0", active ? "text-brand-600" : "text-muted-foreground")} />
                  <span className="flex-1 truncate">{t(item.key)}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/70 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            W
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Wakil.ma</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t('plan.pro')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}