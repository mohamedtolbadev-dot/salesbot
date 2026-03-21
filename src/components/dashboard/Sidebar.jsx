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
  Wrench,
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
    { label: "خدمات", href: "/dashboard/services", icon: Wrench },
    { label: "زبائن", href: "/dashboard/customers", icon: Users },
    { label: "إعدادات", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border flex items-center justify-around px-2 py-2 shadow-lg" style={{ backgroundColor: 'hsl(var(--card))' }}>
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
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative hover:bg-secondary/80 active:scale-95",
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
  { label: "الخدمات", href: "/dashboard/services", icon: Wrench },
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
    <aside className="hidden md:flex w-[200px] h-screen flex-col bg-card border-r border-border/50 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
            <span className="text-brand-600 font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">SalesBot</p>
            <p className="text-[10px] text-muted-foreground">AI Sales Agent</p>
          </div>
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
                "flex items-center gap-2.5 px-3 py-2.5",
                "rounded-xl text-xs transition-all duration-200",
                "border border-transparent",
                active
                  ? "bg-brand-600/10 text-brand-700 font-semibold border-brand-600/30 shadow-sm shadow-brand-600/10"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/50"
              )}
            >
              <Icon
                size={16}
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

      {/* Footer */}
      <div className="p-3 border-t border-border/50 bg-card">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/70 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm shadow-brand-600/30">
            بو
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              بوتيك ليلى
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">خطة برو</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
