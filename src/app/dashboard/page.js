"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { statsAPI, conversationsAPI, agentAPI } from "@/lib/api"
import { getStageConfig, getScoreColor, getInitials } from "@/lib/helpers"
import { Bot, TrendingUp, Plus, ChevronLeft, MessageCircle, BarChart3, Sparkles, ArrowUpRight, ShoppingBag, AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState([])
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const [statsData, conversationsData, agentData] = await Promise.all([
        statsAPI.getStats(),
        conversationsAPI.getAll({ limit: 5 }),
        agentAPI.get(),
      ])
      setStats(statsData.data)
      setConversations(conversationsData.data?.conversations || [])
      setAgent(agentData.data)
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("فشل في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-secondary animate-pulse rounded-2xl h-20 sm:h-24" />)}
        </div>
        <div className="bg-secondary animate-pulse rounded-2xl h-64" />
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
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors">
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    // ↓ gap أصغر على الموبايل
    <div className="flex flex-col gap-4 sm:gap-6">

      {/* ── 1. Page Header ── */}
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-foreground">لوحة التحكم</h1>
          {/* ↓ التاريخ مختصر على الموبايل */}
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString("ar-MA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
            {new Date().toLocaleDateString("ar-MA", { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          {/* ↓ على الموبايل: أيقونة فقط بدون نص */}
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-1.5 border border-border px-2.5 sm:px-3 py-2 rounded-lg text-xs text-foreground hover:bg-secondary hover:border-brand-200 transition-all duration-200"
          >
            <Bot size={14} className="text-brand-600" />
            <span className="hidden sm:inline">تخصيص Agent</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-800 transition-all duration-200 shadow-md shadow-brand-600/20"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">منتج جديد</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stats Row ── */}
      {/* ↓ 2 كولومن على الموبايل، 4 على lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* كارد 1: محادثات اليوم */}
        <div className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <MessageCircle size={15} className="text-brand-600" />
              </div>
              {/* ↓ badge مختصر على الموبايل */}
              <span className="flex items-center gap-1 text-[10px] text-brand-600 bg-secondary px-1.5 sm:px-2 py-1 rounded-full font-medium">
                <TrendingUp size={10} />
                <span className="hidden sm:inline">+12%</span>
                <span className="sm:hidden">↑</span>
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300">{stats.todayConversations}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">محادثات اليوم</p>
          </div>
        </div>

        {/* كارد 2: مبيعات اليوم */}
        <div className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <ShoppingBag size={15} className="text-brand-600" />
              </div>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 sm:px-2 py-1 rounded-full font-medium">
                {stats.conversionRate}%
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300">{stats.todaySales}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">مبيعات اليوم</p>
          </div>
        </div>

        {/* كارد 3: قيد الإقناع */}
        <div className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Sparkles size={15} className="text-brand-600" />
              </div>
              <span className="flex items-center gap-1 text-[10px] text-brand-600 bg-secondary px-1.5 sm:px-2 py-1 rounded-full font-medium">
                <Bot size={10} />
                <span className="hidden sm:inline">Agent</span>
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300">{stats.pitching}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">قيد الإقناع</p>
          </div>
        </div>

        {/* كارد 4: إيرادات اليوم */}
        <div className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <BarChart3 size={15} className="text-brand-600" />
              </div>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 sm:px-2 py-1 rounded-full font-medium">
                د.م
              </span>
            </div>
            {/* ↓ الأرقام الكبيرة تتكيف مع عرض الموبايل */}
            <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 truncate">
              {stats.todayRevenue?.toLocaleString("ar-MA")}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">إيرادات اليوم</p>
          </div>
        </div>
      </div>

      {/* ── 3. Main Grid ── */}
      {/* ↓ على الموبايل: عمود واحد مكدس، على lg: عمودان */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* المحادثات — col-span-2 */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-brand-600/10 transition-all duration-500">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-card to-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center transition-transform hover:scale-110">
                  <MessageCircle size={14} className="text-brand-600" />
                </div>
                <span className="text-sm font-semibold">آخر المحادثات</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-brand-600 border border-brand-200 font-medium shadow-sm hidden sm:inline-flex">
                  {stats.todayConversations} اليوم
                </span>
                <button
                  onClick={() => router.push("/dashboard/conversations")}
                  className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-0.5 transition-all hover:gap-1 font-medium"
                >
                  عرض الكل
                  <ChevronLeft size={12} />
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">الزبون</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">آخر رسالة</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">المرحلة</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {conversations.slice(0, 4).map((conv) => {
                  const stage = getStageConfig(conv.stage)
                  const scoreColor = getScoreColor(conv.score)
                  const lastMessage = conv.messages?.[0]?.content || "لا رسائل"
                  return (
                    <tr
                      key={conv.id}
                      onClick={() => router.push("/dashboard/conversations")}
                      className="border-t border-border hover:bg-secondary/50 cursor-pointer transition-all duration-300 hover:shadow-sm group"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0 transition-transform group-hover:scale-110">
                            {getInitials(conv.customer?.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground group-hover:text-brand-600 transition-colors">{conv.customer?.name || "زبون"}</span>
                            {!conv.isRead && (
                              <span className="text-[10px] text-brand-600 animate-pulse">رسالة جديدة</span>
                            )}
                          </div>
                          {!conv.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 animate-pulse shadow-sm shadow-brand-600/50" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[140px]">
                        <span className="truncate block group-hover:text-foreground transition-colors">{lastMessage}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all hover:shadow-sm ${stage.className}`}>{stage.label}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${conv.score}%`, backgroundColor: scoreColor }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: scoreColor }}>{conv.score}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {conversations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-muted-foreground">لا توجد محادثات حالياً</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-border">
              {conversations.slice(0, 4).map((conv) => {
                const stage = getStageConfig(conv.stage)
                const scoreColor = getScoreColor(conv.score)
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push("/dashboard/conversations")}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer transition-colors active:bg-secondary/70"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {getInitials(conv.customer?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{conv.customer?.name || "زبون"}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${stage.className}`}>{stage.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{conv.messages?.[0]?.content || "لا رسائل"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-semibold" style={{ color: scoreColor }}>{conv.score}%</span>
                      {!conv.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />}
                    </div>
                  </div>
                )
              })}
              {conversations.length === 0 && (
                <p className="p-8 text-center text-xs text-muted-foreground">لا توجد محادثات</p>
              )}
            </div>
          </div>
        </div>

        {/* العمود الجانبي */}
        <div className="flex flex-col gap-4">

          {/* مراحل المحادثات */}
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 hover:shadow-xl hover:shadow-brand-600/10 transition-all duration-500 group">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <BarChart3 size={14} className="text-brand-600" />
              </div>
              <p className="text-sm font-semibold">مراحل المحادثات</p>
            </div>
            {[
              { label: "ترحيب",    count: stats.stages?.greeting  || 0, pct: "100%" },
              { label: "استكشاف", count: stats.stages?.discovery  || 0, pct: "74%"  },
              { label: "إقناع",   count: stats.stages?.pitching   || 0, pct: "47%"  },
              { label: "اعتراض",  count: stats.stages?.objection  || 0, pct: "26%"  },
              { label: "إغلاق",   count: stats.stages?.closed     || 0, pct: "17%"  },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 mb-2 last:mb-0 group/item hover:bg-secondary/30 rounded-lg px-2 py-1.5 transition-colors cursor-pointer">
                <span className="text-xs text-muted-foreground min-w-[46px] font-medium group-hover/item:text-foreground transition-colors">{s.label}</span>
                <div className="flex-1 h-1.5 sm:h-2 bg-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: s.pct, backgroundColor: "#534AB7" }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground min-w-[18px] text-left">{s.count}</span>
              </div>
            ))}
          </div>

          {/* AI Agent Card */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-3 sm:p-4 text-white hover:shadow-2xl hover:shadow-brand-600/30 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold">{agent?.name || "ليلى"}</p>
                  <p className="text-[10px] sm:text-xs text-brand-200">بائعة ذكية</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-medium">نشطة</span>
              </div>
            </div>

            {/* ↓ على الموبايل: عمودان، على sm: عمودان كذلك */}
            <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
              {[
                { label: "المجال",       value: agent?.domain   || "—" },
                { label: "اللغة",        value: agent?.language || "—" },
                { label: "الأسلوب",      value: agent?.style    || "—" },
                { label: "رسائل اليوم",  value: stats?.todayConversations || 0, highlight: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`p-2 rounded-lg transition-all hover:scale-105 ${item.highlight ? "bg-white/20" : "bg-white/10"}`}
                >
                  <p className="text-[10px] text-brand-200 mb-0.5">{item.label}</p>
                  <p className="text-xs font-semibold truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/dashboard/settings")}
              className="w-full bg-white/20 hover:bg-white/30 rounded-lg py-2.5 sm:py-2 text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1 hover:gap-2 active:scale-95"
            >
              تعديل شخصية Agent
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}