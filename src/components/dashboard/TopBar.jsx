"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { useMobileMenu } from "@/contexts/MobileMenuContext"
import { notificationsAPI } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import {
  Bell, LogOut, Loader2, X, CheckCheck, Menu,
  LayoutDashboard, MessageCircle, BarChart3,
  ShoppingBag, Users, Settings, Calendar, ClipboardList,
  ShoppingCart, AlertTriangle, FileBarChart,
  WifiOff, Info, Mail,
} from "lucide-react"

/* ─────────────── Page map keys ─────────────── */
const PAGE_MAP_KEYS = {
  "/dashboard":               { key: "nav.dashboard",     icon: LayoutDashboard },
  "/dashboard/conversations": { key: "nav.conversations", icon: MessageCircle   },
  "/dashboard/orders":        { key: "nav.orders",        icon: ClipboardList   },
  "/dashboard/appointments":  { key: "nav.appointments",  icon: Calendar        },
  "/dashboard/analytics":     { key: "nav.analytics",     icon: BarChart3       },
  "/dashboard/products":      { key: "nav.products",      icon: ShoppingBag     },
  "/dashboard/customers":     { key: "nav.customers",     icon: Users           },
  "/dashboard/settings":      { key: "nav.settings",      icon: Settings        },
}

/* ─────────────── Notification navigation ─────────────── */
const NOTIF_LINKS = {
  NEW_ORDER:        "/dashboard/orders",
  NEW_CONVERSATION: "/dashboard/conversations",
  OBJECTION_ALERT:  "/dashboard/conversations",
  DAILY_REPORT:     "/dashboard/analytics",
  AGENT_DOWN:       "/dashboard/settings",
  SYSTEM:           "/dashboard/settings",
}

/* ─────────────── Relative time ─────────────── */
function notifTimeAgo(dateStr, language) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  const isAr = language === "ar"
  if (diff < 60)   return isAr ? "الآن"          : "à l'instant"
  if (diff < 3600) { const m = Math.floor(diff / 60);   return isAr ? `منذ ${m} د`    : `il y a ${m} min` }
  if (diff < 86400){ const h = Math.floor(diff / 3600); return isAr ? `منذ ${h} س`    : `il y a ${h}h`    }
  const d = Math.floor(diff / 86400);              return isAr ? `منذ ${d} يوم` : `il y a ${d}j`
}

/* ─────────────── Notification icons ─────────────── */
const NOTIF_ICONS = {
  NEW_ORDER:        { icon: ShoppingCart,  cls: "text-brand-600 bg-brand-600/10"      },
  NEW_CONVERSATION: { icon: MessageCircle, cls: "text-green-600 bg-green-600/10"      },
  OBJECTION_ALERT:  { icon: AlertTriangle, cls: "text-warning bg-warning/10"          },
  DAILY_REPORT:     { icon: FileBarChart,  cls: "text-brand-400 bg-brand-400/10"      },
  AGENT_DOWN:       { icon: WifiOff,       cls: "text-danger bg-danger/10"            },
  SYSTEM:           { icon: Info,          cls: "text-muted-foreground bg-secondary"  },
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
  const pathname           = usePathname()
  const router             = useRouter()
  const { open: openMenu } = useMobileMenu()

  const { t, language, setLanguage, isRTL } = useLanguage()
  const pageCfg   = PAGE_MAP_KEYS[pathname] || { key: "nav.dashboard", icon: LayoutDashboard }
  const PageIcon  = pageCfg.icon
  const pageLabel = t(pageCfg.key)

  const [user, setUser]                   = useState(null)
  const [unreadCount, setUnreadCount]     = useState(0)
  const [showNotifs, setShowNotifs]       = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const stored = localStorage.getItem("user")
    if (stored) setUser(JSON.parse(stored))

    const fetchCount = async () => {
      try {
        const res = await notificationsAPI.getAll({ unread: true })
        setUnreadCount(res.data?.unreadCount || 0)
      } catch {}
    }

    fetchCount()
    const intervalId = setInterval(fetchCount, 30_000)
    return () => clearInterval(intervalId)
  }, [])

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

  async function handleNotifClick(notif) {
    if (!notif.isRead) {
      try {
        await notificationsAPI.markAsRead(notif.id)
        setNotifications(n => n.map(x => x.id === notif.id ? { ...x, isRead: true } : x))
        setUnreadCount(c => Math.max(0, c - 1))
      } catch {}
    }
    const link = NOTIF_LINKS[notif.type]
    if (link) {
      setShowNotifs(false)
      router.push(link)
    }
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
    <header className="h-14 bg-card border-b border-border/50 px-3 md:px-5 flex items-center justify-between sticky top-0 z-30 shrink-0 gap-2">

      {/* ── Right: Menu button (mobile) + Page title ── */}
      <div className="flex items-center gap-2 min-w-0">

        {/* Menu button — mobile only */}
        <button
          onClick={openMenu}
          className="md:hidden p-2 rounded-xl bg-secondary/60 border border-border/50 active:scale-95 transition-all duration-200 shrink-0"
          aria-label="Menu"
        >
          <Menu size={17} className="text-foreground" />
        </button>

        {/* Page title with icon — desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <PageIcon size={14} className="text-brand-600" />
          </div>
          <h1 className="text-[15px] font-semibold text-foreground truncate">{pageLabel}</h1>
        </div>

        {/* Page title — mobile: icon + text */}
        <div className="md:hidden flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center shrink-0">
            <PageIcon size={12} className="text-brand-600" />
          </div>
          <h1 className="text-[14px] font-semibold text-foreground truncate">{pageLabel}</h1>
        </div>
      </div>

      {/* ── Left: actions ── */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">

        {/* Language switcher */}
        <div className="flex items-center rounded-lg border border-border/50 overflow-hidden text-[11px] font-bold">
          <button
            onClick={() => setLanguage('fr')}
            className={cn(
              "px-2 py-1 transition-colors",
              language === 'fr'
                ? "bg-brand-600 text-white"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={cn(
              "px-2 py-1 transition-colors",
              language === 'ar'
                ? "bg-brand-600 text-white"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            AR
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="relative p-2 rounded-lg hover:bg-secondary border border-transparent hover:border-border/50 transition-all duration-200"
          >
            <Bell size={15} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications panel — full-width on mobile, fixed width on desktop */}
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div
                className={cn(
                  "fixed z-50 flex flex-col overflow-hidden",
                  "border border-border/50 rounded-2xl shadow-2xl shadow-black/10",
                  "animate-in fade-in slide-in-from-top-2 duration-200",
                  // Mobile: full-width with margins
                  "top-[60px] left-3 right-3",
                  // Desktop: anchored, fixed width
                  "sm:absolute sm:top-[calc(100%+8px)] sm:left-auto sm:right-0 sm:w-[320px]",
                  // Override fixed on desktop
                  "sm:fixed-none",
                )}
                style={{
                  backgroundColor: "var(--modal-surface, var(--card))",
                  maxHeight: "min(420px, calc(100dvh - 80px))",
                  // On desktop, revert to absolute-like via inset reset
                }}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{t('notif.title')}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} ${t('notif.unread')}` : t('notif.all_read')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        title={t('notif.mark_all')}
                        className="p-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border/50 transition-colors text-muted-foreground hover:text-brand-600"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border/50 transition-colors text-muted-foreground hover:text-foreground"
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
                      <p className="text-[11px] text-muted-foreground">{t('notif.no_notifs')}</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0",
                          "cursor-pointer transition-colors hover:bg-secondary/60",
                          !n.isRead && "bg-brand-600/5"
                        )}
                      >
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground leading-tight">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {notifTimeAgo(n.createdAt, language)}
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

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider — hidden on very small screens */}
        <div className="hidden xs:block w-px h-5 bg-border/50 mx-0.5" />

        {/* User avatar + logout */}
        <div className="flex items-center gap-1 md:gap-1.5">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shrink-0">
            {userInitial(user)}
          </div>

          {/* Name — only on sm+ */}
          <span className="hidden sm:block text-[12px] font-medium text-muted-foreground truncate max-w-[70px]">
            {user?.name || "User"}
          </span>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={t('topbar.logout')}
            className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-muted-foreground hover:text-red-500 transition-all duration-200"
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </header>
  )
}