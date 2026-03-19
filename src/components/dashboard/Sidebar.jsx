"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { cn } from "@/lib/utils"
import { conversationsAPI } from "@/lib/api"
import {
  MessageCircle,
  BarChart3,
  ShoppingBag,
  Users,
  Settings,
  LayoutDashboard,
} from "lucide-react"

// ── Mobile Bottom Navigation ──
export function MobileNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    conversationsAPI.getAll()
      .then((res) => {
        const convs = res.data?.conversations || []
        setUnreadCount(convs.filter(c => !c.isRead).length)
      })
      .catch(() => {})
  }, [])

  const mobileNav = [
    { label: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { label: "محادثات", href: "/dashboard/conversations", icon: MessageCircle },
    { label: "منتجات", href: "/dashboard/products", icon: ShoppingBag },
    { label: "زبائن", href: "/dashboard/customers", icon: Users },
    { label: "إعدادات", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-border/50 flex items-center justify-around px-2 py-2 shadow-lg">
      {mobileNav.map((item) => {
        const Icon = item.icon
        const active = item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative",
              active ? "text-brand-600" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <Icon size={20} />
              {item.href === "/dashboard/conversations" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {active && <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-brand-600" />}
          </Link>
        )
      })}
    </nav>
  )
}

const navItems = [
  { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { label: "المحادثات", href: "/dashboard/conversations", icon: MessageCircle },
  { label: "التحليلات", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "المنتجات", href: "/dashboard/products", icon: ShoppingBag },
  { label: "الزبائن", href: "/dashboard/customers", icon: Users },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = () => {
      conversationsAPI.getAll()
        .then((res) => {
          const convs = res.data?.conversations || []
          setUnreadCount(convs.filter(c => !c.isRead).length)
        })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="hidden md:flex w-[220px] h-screen flex-col bg-card border-r border-border/50 shrink-0 overflow-hidden">
      {/* قسم 1 — Logo + Agent Status */}
      <div className="p-4 border-b border-border/30 bg-card">
        <Logo />
        <div className="flex items-center gap-2 mt-3 px-2 py-1.5 rounded-md bg-success/5 border border-success/10">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          <span className="text-[10px] font-medium text-success">Agent نشط</span>
        </div>
      </div>

      {/* قسم 2 — Navigation */}
      <nav className="flex-1 p-2.5 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2",
                "rounded-lg text-xs transition-all duration-200",
                "border border-transparent",
                active
                  ? "bg-gradient-to-r from-brand-600/15 to-brand-600/5 text-brand-700 font-semibold border-brand-200/30 shadow-sm shadow-brand-600/10"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/50"
              )}
            >
              <Icon
                size={15}
                className={cn(
                  "shrink-0 transition-all duration-200",
                  active ? "text-brand-600" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === "/dashboard/conversations" && unreadCount > 0 && (
                <span className="bg-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center leading-none shrink-0 shadow-sm shadow-brand-600/30">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* قسم 3 — User Info */}
      <div className="p-3 border-t border-border/30 bg-card">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/70 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm shadow-brand-600/30">
            بو
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">
              بوتيك ليلى
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">خطة برو ✨</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
