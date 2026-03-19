"use client"

import { useState, useEffect } from "react"
import { statsAPI } from "@/lib/api"
import { formatAmount } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageCircle,
  ShoppingBag,
  Zap,
  BarChart3,
  Clock,
  Smile,
  RefreshCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)
      const response = await statsAPI.getStats()
      setStats(response.data)
    } catch (err) {
      console.error("Error fetching stats:", err)
      setError("فشل في تحميل التحليلات")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-secondary animate-pulse rounded-2xl h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-secondary animate-pulse rounded-2xl h-64" />
          <div className="bg-secondary animate-pulse rounded-2xl h-64" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">فشل في تحميل البيانات</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors">
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const weeklyChart = stats?.weeklyChart || []
  const weeklyDays  = stats?.weeklyDays  || []
  const maxVal      = Math.max(...weeklyChart, 1)

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <BarChart3 size={18} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">التحليلات</h1>
            <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-secondary p-1 rounded-lg">
          {["أسبوع", "شهر", "3 أشهر"].map((p, i) => (
            <button
              key={p}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                i === 0
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي محادثات",  value: stats?.weekConversations || 0,          sub: "+18%",          icon: MessageCircle },
          { label: "معدل التحويل",    value: (stats?.conversionRate || 0) + "%",      sub: "+3%",           icon: TrendingUp    },
          { label: "إجمالي المبيعات", value: formatAmount(stats?.weekRevenue || 0),   sub: "هذا الأسبوع",  icon: ShoppingBag   },
          { label: "متوسط قيمة طلب", value: formatAmount(stats?.avgOrderValue || 0), sub: "+12%",          icon: Zap           },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-200 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={16} className="text-brand-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-xs text-brand-600 flex items-center gap-1 font-medium">
              <TrendingUp size={12} />
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* بار شارت */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <BarChart3 size={14} className="text-brand-600" />
            </div>
            <p className="text-sm font-semibold">المحادثات اليومية</p>
          </div>
          <div className="flex items-end gap-2 h-24 mb-2">
            {weeklyChart.map((val, i) => {
              const heightPct = (val / maxVal) * 100
              const isToday   = i === weeklyChart.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">{val}</span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isToday ? "#534AB7" : "#AFA9EC",
                      minHeight: "4px",
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            {weeklyDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 text-center text-xs font-medium",
                  i === weeklyDays.length - 1 ? "text-brand-600" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* مراحل المحادثات */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <Users size={14} className="text-brand-600" />
            </div>
            <p className="text-sm font-semibold">مراحل المحادثات</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "ترحيب",    count: stats?.stages?.greeting  || 0, color: "#534AB7" },
              { label: "استكشاف", count: stats?.stages?.discovery || 0, color: "#7F77DD" },
              { label: "إقناع",   count: stats?.stages?.pitching  || 0, color: "#534AB7" },
              { label: "اعتراض",  count: stats?.stages?.objection || 0, color: "#E24B4A" },
              { label: "إغلاق",   count: stats?.stages?.closed    || 0, color: "#0F6E56" },
            ].map((s) => {
              const total = stats?.stages?.greeting || 1
              const pct   = Math.round((s.count / total) * 100)
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground min-w-[50px]">{s.label}</span>
                  <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground min-w-[24px] text-left">{s.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 4. أسباب الاعتراض ── */}
      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-200 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
            <TrendingDown size={14} className="text-brand-600" />
          </div>
          <p className="text-sm font-semibold">أسباب الاعتراض الأكثر شيوعاً</p>
        </div>
        <div className="flex flex-col gap-3">
          {(stats?.objectionReasons || []).map((item, i) => {
            const maxCount = stats?.objectionReasons?.[0]?.count || 1
            const pct      = Math.round((item.count / maxCount) * 100)
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{item.reason}</span>
                <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: "#BA7517" }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground min-w-[24px] text-left">{item.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Stats إضافية ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "متوسط وقت الرد", value: stats?.avgResponseTime || "0s",              icon: Clock      },
          { label: "رضا الزبائن",    value: (stats?.satisfactionRate || 0) + "%",         icon: Smile      },
          { label: "نسبة العودة",    value: (stats?.returnRate || 0) + "%",               icon: RefreshCcw },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-lg hover:border-brand-200 transition-all duration-300 group">
            <div className="w-8 h-8 rounded-lg bg-secondary mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon size={18} className="text-brand-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
