"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { notificationsAPI } from "@/lib/api"
import { Bell, Bot, LogOut, Loader2, X, CheckCheck, LayoutDashboard, MessageCircle, BarChart3, ShoppingBag, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const pageNames = {
  "/dashboard": { label: "لوحة التحكم", icon: LayoutDashboard },
  "/dashboard/conversations": { label: "المحادثات", icon: MessageCircle },
  "/dashboard/analytics": { label: "التحليلات", icon: BarChart3 },
  "/dashboard/products": { label: "المنتجات", icon: ShoppingBag },
  "/dashboard/customers": { label: "الزبائن", icon: Users },
  "/dashboard/settings": { label: "الإعدادات", icon: Settings },
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const page = pageNames[pathname] || { label: "SalesBot", icon: LayoutDashboard }
  const PageIcon = page.icon
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Fetch notifications count and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          setLoading(false)
          return
        }

        // Get user from localStorage
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        
        // Get unread notifications count
        const response = await notificationsAPI.getAll({ unread: true })
        setUnreadCount(response.data?.unreadCount || 0)
      } catch (err) {
        console.error("Error fetching notifications:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch all notifications when opening drawer
  const handleOpenNotifications = async () => {
    setShowNotifications(true)
    try {
      setNotificationsLoading(true)
      const response = await notificationsAPI.getAll({ limit: 20 })
      setNotifications(response.data?.notifications || [])
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setNotificationsLoading(false)
    }
  }

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking all as read:", err)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      NEW_ORDER: "🎉",
      OBJECTION_ALERT: "⚠️",
      DAILY_REPORT: "📊",
      AGENT_DOWN: "❌",
      SYSTEM: "ℹ️"
    }
    return icons[type] || "📬"
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <header className="h-14 bg-card border-b border-border/30 px-3 md:px-4 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-sm shadow-brand-600/5">
      {/* اسم الصفحة */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-brand-100 flex items-center justify-center border border-brand-200/30">
          <PageIcon size={14} className="text-brand-600" />
        </div>
        <h1 className="text-sm font-semibold text-foreground">{page.label}</h1>
      </div>

      {/* يمين */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Agent Status */}
        <div className="hidden sm:flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-full px-3 py-1.5 shadow-sm shadow-success/10">
          <Bot size={12} className="text-success" />
          <span className="text-[10px] font-semibold text-success">
            {user?.name || "Agent"} نشط
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-md hover:bg-secondary/80 transition-all duration-200 border border-transparent hover:border-border/30"
          >
            <Bell size={16} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold shadow-sm shadow-brand-600/40">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowNotifications(false)}
              />
              
              {/* Panel */}
              <div className="fixed top-14 left-0 w-72 border border-border rounded-xl flex flex-col shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px]" style={{ backgroundColor: 'var(--modal-surface)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card">
                  <div>
                    <h2 className="text-xs font-semibold text-foreground">الإشعارات</h2>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {unreadCount} غير مقروءة
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="p-1.5 rounded-md hover:bg-secondary/70 transition-all duration-200 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 group"
                        title="تعليم الكل كمقروء"
                      >
                        <CheckCheck size={14} className="group-hover:text-success" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1.5 rounded-md hover:bg-secondary/70 transition-all duration-200 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto max-h-72">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center h-28">
                      <Loader2 size={18} className="animate-spin text-brand-600" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex items-center justify-center h-28 text-muted-foreground">
                      <p className="text-xs">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "border-b border-border/20 px-4 py-3 transition-all duration-200 cursor-pointer hover:bg-secondary/40",
                          !notification.isRead && "bg-brand-50 border-b border-brand-100/30"
                        )}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-2.5">
                          <div className="text-lg mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                              {new Date(notification.createdAt).toLocaleDateString("ar-MA", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5 shadow-sm shadow-brand-600/40" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-5 bg-border/20" />

        {/* Avatar & Logout */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-brand-600/30">
            {user?.name ? user.name.charAt(0).toUpperCase() : "؟"}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground hidden sm:block truncate max-w-[80px]">
            {user?.storeName || user?.name || "المستخدم"}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-danger/10 transition-all duration-200 text-muted-foreground hover:text-danger border border-transparent hover:border-danger/20"
            title="تسجيل الخروج"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
