"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { notificationsAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Bell, LogOut, Loader2, X, CheckCheck,
  LayoutDashboard, MessageCircle, BarChart3,
  ShoppingBag, Users, Settings,
  ShoppingCart, AlertTriangle, FileBarChart,
  WifiOff, Info, Mail,
} from "lucide-react"

/* ─────────────── Page map ─────────────── */
const PAGE_MAP = {
  "/dashboard":               { label: "لوحة التحكم", icon: LayoutDashboard },
  "/dashboard/conversations": { label: "المحادثات",   icon: MessageCircle   },
  "/dashboard/analytics":     { label: "التحليلات",   icon: BarChart3       },
  "/dashboard/products":      { label: "المنتجات",    icon: ShoppingBag     },
  "/dashboard/customers":     { label: "الزبائن",     icon: Users           },
  "/dashboard/settings":      { label: "الإعدادات",   icon: Settings        },
}

/* ─────────────── Notification type → icon ─────────────── */
const NOTIF_ICONS = {
  NEW_ORDER:       { icon: ShoppingCart,  cls: "text-brand-600 bg-brand-600/10"   },
  OBJECTION_ALERT: { icon: AlertTriangle, cls: "text-warning   bg-warning/10"     },
  DAILY_REPORT:    { icon: FileBarChart,  cls: "text-brand-400 bg-brand-400/10"   },
  AGENT_DOWN:      { icon: WifiOff,       cls: "text-danger    bg-danger/10"      },
  SYSTEM:          { icon: Info,          cls: "text-muted-foreground bg-secondary"},
}
function NotifIcon({ type }) {
  const cfg = NOTIF_ICONS[type] || { icon: Mail, cls: "text-muted-foreground bg-secondary" }
  const Ico = cfg.icon
  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cfg.cls)}>
      <Ico size={13} />
    </div>
  )
}

/* ─────────────── User initials helper ─────────────── */
function userInitial(user) {
  if (!user?.name) return "؟"
  const parts = user.name.trim().split(" ")
  return parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2)
}

/* ════════════════════════════════════════════════
   TopBar
════════════════════════════════════════════════ */
export function TopBar() {
  const pathname = usePathname()
  const router   = useRouter()
  const page     = PAGE_MAP[pathname] || { label: "SalesBot", icon: LayoutDashboard }
  const PageIcon = page.icon

  const [user, setUser]                         = useState(null)
  const [unreadCount, setUnreadCount]           = useState(0)
  const [showNotifs, setShowNotifs]             = useState(false)
  const [notifications, setNotifications]       = useState([])
  const [notifsLoading, setNotifsLoading]       = useState(false)

  /* ── Init: user + unread count ── */
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const stored = localStorage.getItem("user")
    if (stored) setUser(JSON.parse(stored))

    async function fetchCount() {
      try {
        const res = await notificationsAPI.getAll({ unread: true })
        setUnreadCount(res.data?.unreadCount || 0)
      } catch {}
    }

    fetchCount()
    const t = setInterval(fetchCount, 30_000)
    return () => clearInterval(t)
  }, [])

  /* ── Open notifications panel ── */
  async function openNotifs() {
    setShowNotifs(true)
    try {
      setNotifsLoading(true)
      const res = await notificationsAPI.getAll({ limit: 20 })
      setNotifications(res.data?.notifications || [])
    } catch {} finally {
      setNotifsLoading(false)
    }
  }

  async function markRead(id) {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
  }

  async function markAllRead() {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(n => n.map(x => ({ ...x, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <header className="h-14 bg-card border-b border-border px-4 md:px-5 flex items-center justify-between sticky top-0 z-10 shrink-0">

      {/* ── Left: page title ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
          <PageIcon size={14} className="text-brand-600" />
        </div>
        <h1 className="text-[13px] font-bold text-foreground">{page.label}</h1>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1.5 md:gap-2">

        {/* ─ Notifications ─ */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="relative p-2 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all duration-200"
          >
            <Bell size={15} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications panel */}
          {showNotifs && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />
              <div
                className="fixed top-14 left-3 sm:left-auto sm:right-auto w-[300px] border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ backgroundColor: "var(--modal-surface, var(--card))", maxHeight: "420px" }}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div>
                    <p className="text-[12px] font-bold text-foreground">الإشعارات</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} غير مقروءة` : "كل شيء مقروء"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        title="تعليم الكل كمقروء"
                        className="p-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-brand-600"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1">
                  {notifsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 size={18} className="animate-spin text-brand-600" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 h-24">
                      <Bell size={18} className="text-muted-foreground/40" />
                      <p className="text-[11px] text-muted-foreground">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markRead(n.id)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors duration-150 hover:bg-secondary/60",
                          !n.isRead && "bg-brand-600/5"
                        )}
                      >
                        <NotifIcon type={n.type} />

                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-foreground leading-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(n.createdAt).toLocaleDateString("ar-MA", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─ Theme toggle ─ */}
        <ThemeToggle />

        {/* ─ Divider ─ */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* ─ User + logout ─ */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            {userInitial(user)}
          </div>

          {/* Name */}
          <span className="hidden sm:block text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">
            {user?.storeName || user?.name || "المستخدم"}
          </span>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-muted-foreground hover:text-red-500 transition-all duration-200"
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </header>
  )
}