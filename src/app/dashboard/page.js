"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { statsAPI, conversationsAPI, agentAPI } from "@/lib/api"
import { getStageConfig, getScoreColor, getInitials } from "@/lib/helpers"
import {
  Bot, TrendingUp, Plus, ChevronLeft, MessageCircle,
  BarChart3, Sparkles, ArrowUpRight, ShoppingBag,
  AlertCircle, RefreshCw, Activity, Zap, Settings2,
  Brain, Star, Globe, Languages,
} from "lucide-react"

/* ─────────────── Animated Counter ─────────────── */
function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0
    const duration = 900
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.floor(eased * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{display.toLocaleString("ar-MA")}{suffix}</>
}

/* ─────────────── Score Bar ─────────────── */
function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  )
}

/* ─────────────── Stage Funnel Bar ─────────────── */
function FunnelBar({ label, count, pct, delay }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-secondary/40 transition-colors duration-200 cursor-default group">
      <span className="text-[11px] text-muted-foreground font-medium min-w-[50px] group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: "var(--brand-600, #534AB7)",
            width: animated ? pct : "0%",
            transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <span className="text-[11px] font-bold text-foreground min-w-[18px] text-left">{count}</span>
    </div>
  )
}

/* ─────────────── Stat Card ─────────────── */
function StatCard({ icon: Icon, label, value, badge, badgeVariant = "default", delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="group rounded-xl p-4 overflow-hidden cursor-default transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      style={{
        backgroundColor: "#534AB7",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={15} className="text-white" />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/15 border border-white/20 text-white/90">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-white tabular-nums">
        <AnimatedNumber value={typeof value === "number" ? value : 0} />
      </p>
      <p className="text-[11px] text-white/70 mt-1 font-medium">{label}</p>
      <div className="mt-3 h-[2px] w-0 bg-white/50 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Agent Info Chip ─────────────── */
function AgentChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-white/8 hover:bg-white/14 border border-white/12 rounded-lg px-3 py-2 transition-colors duration-200 cursor-default">
      <Icon size={11} className="text-white/50 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-white/45 leading-none mb-0.5">{label}</p>
        <p className="text-[11px] font-semibold text-white truncate leading-tight">{value}</p>
      </div>
    </div>
  )
}

/* ─────────────── Main Page ─────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState([])
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchDashboardData() }, [])

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
      setError("فشل في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-secondary/60 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-secondary/60 rounded-xl h-72 animate-pulse" />
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
          <AlertCircle size={20} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">فشل في تحميل البيانات</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          <RefreshCw size={13} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  /* ── Main render ── */
  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* ── 1. Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">لوحة التحكم</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("ar-MA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:border-brand-300 hover:text-brand-600 transition-all duration-200"
          >
            <Bot size={13} />
            <span className="hidden sm:inline">تخصيص Agent</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/products")}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-800 transition-colors duration-200 shadow-sm"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">منتج جديد</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MessageCircle} label="محادثات اليوم" value={stats.todayConversations} badge="+12%" badgeVariant="up" delay={0} />
        <StatCard icon={ShoppingBag}  label="مبيعات اليوم"   value={stats.todaySales}          badge={`${stats.conversionRate}%`} delay={80} />
        <StatCard icon={Sparkles}     label="قيد الإقناع"    value={stats.pitching}            badge="Agent" badgeVariant="up" delay={160} />
        <StatCard icon={BarChart3}    label="إيرادات اليوم"  value={stats.todayRevenue || 0}   badge="د.م" delay={240} />
      </div>

      {/* ── 3. Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Conversations Panel ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg">

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <MessageCircle size={13} className="text-brand-600" />
              </div>
              <span className="text-[13px] font-semibold">آخر المحادثات</span>
              <span className="hidden sm:flex items-center justify-center text-[10px] font-semibold text-brand-600 bg-brand-600/10 border border-brand-200 rounded-md px-2 py-0.5">
                {stats.todayConversations} اليوم
              </span>
            </div>
            <button
              onClick={() => router.push("/dashboard/conversations")}
              className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:gap-1 transition-all duration-200"
            >
              عرض الكل
              <ChevronLeft size={12} />
            </button>
          </div>

          {/* Desktop Table — no blurry/semi-transparent header */}
          <table className="w-full hidden md:table">
            <thead>
              <tr>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-secondary border-b border-border">الزبون</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-secondary border-b border-border">آخر رسالة</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-secondary border-b border-border">المرحلة</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-secondary border-b border-border">النتيجة</th>
              </tr>
            </thead>
            <tbody>
              {conversations.slice(0, 5).map((conv, idx) => {
                const stage = getStageConfig(conv.stage)
                const scoreColor = getScoreColor(conv.score)
                const lastMessage = conv.messages?.[0]?.content || "لا رسائل"
                return (
                  <tr
                    key={conv.id}
                    onClick={() => router.push("/dashboard/conversations")}
                    className="border-t border-border hover:bg-secondary cursor-pointer transition-colors duration-150 group"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
                            {getInitials(conv.customer?.name)}
                          </div>
                          {!conv.isRead && (
                            <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-brand-600 border-2 border-card" />
                          )}
                        </div>
                        <span className="text-[12px] font-semibold text-foreground group-hover:text-brand-600 transition-colors">
                          {conv.customer?.name || "زبون"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-[11px] text-muted-foreground truncate group-hover:text-foreground transition-colors">{lastMessage}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${stage.className}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={conv.score} color={scoreColor} />
                    </td>
                  </tr>
                )
              })}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-[12px] text-muted-foreground">
                    لا توجد محادثات حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {conversations.slice(0, 5).map((conv) => {
              const stage = getStageConfig(conv.stage)
              const scoreColor = getScoreColor(conv.score)
              return (
                <div
                  key={conv.id}
                  onClick={() => router.push("/dashboard/conversations")}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary active:bg-secondary cursor-pointer transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
                      {getInitials(conv.customer?.name)}
                    </div>
                    {!conv.isRead && (
                      <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-brand-600 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-foreground truncate">{conv.customer?.name || "زبون"}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${stage.className}`}>{stage.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.messages?.[0]?.content || "لا رسائل"}</p>
                  </div>
                  <span className="text-[11px] font-bold shrink-0 tabular-nums" style={{ color: scoreColor }}>{conv.score}%</span>
                </div>
              )
            })}
            {conversations.length === 0 && (
              <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">لا توجد محادثات</p>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Stages Funnel */}
          <div className="bg-card border border-border rounded-xl p-4 transition-shadow duration-300 hover:shadow-lg group">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <Activity size={13} className="text-brand-600" />
              </div>
              <p className="text-[13px] font-semibold">مراحل المحادثات</p>
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                { label: "ترحيب",    count: stats.stages?.greeting || 0, pct: "100%", delay: 200 },
                { label: "استكشاف", count: stats.stages?.discovery || 0, pct: "74%",  delay: 280 },
                { label: "إقناع",   count: stats.stages?.pitching  || 0, pct: "47%",  delay: 360 },
                { label: "اعتراض",  count: stats.stages?.objection || 0, pct: "26%",  delay: 440 },
                { label: "إغلاق",   count: stats.stages?.closed    || 0, pct: "17%",  delay: 520 },
              ].map(s => (
                <FunnelBar key={s.label} {...s} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">معدل الإغلاق</span>
              <span className="text-[11px] font-bold text-brand-600">{stats.conversionRate}%</span>
            </div>
          </div>

          {/* ── Agent Card — redesigned ── */}
          <div
            className="rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
            style={{ backgroundColor: "#534AB7" }}
          >
            {/* Top section */}
            <div className="px-4 pt-4 pb-3">

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with ring */}
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 0 0 2px rgba(255,255,255,0.25)" }}
                    >
                      <Brain size={18} className="text-white" />
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                      style={{ borderColor: "#534AB7" }} />
                  </div>

                  <div>
                    <p className="text-[14px] font-bold text-white leading-tight tracking-tight">
                      {agent?.name || "ليلى"}
                    </p>
                    <p className="text-[10px] text-white/55 mt-0.5">مساعدة مبيعات ذكية</p>
                  </div>
                </div>

                {/* Live pill */}
                <div
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300">نشطة</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.1)" }} />

              {/* Info chips 2×2 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <AgentChip icon={Globe}     label="المجال"      value={agent?.domain   || "—"} />
                <AgentChip icon={Languages} label="اللغة"       value={agent?.language || "—"} />
                <AgentChip icon={Sparkles}  label="الأسلوب"     value={agent?.style    || "—"} />
                <AgentChip icon={MessageCircle} label="رسائل اليوم"
                  value={
                    <AnimatedNumber value={stats?.todayConversations ?? 0} />
                  }
                />
              </div>
            </div>

            {/* Performance bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/50">معدل الإقناع</span>
                <span className="text-[10px] font-bold text-white/80">{stats?.conversionRate ?? 0}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${stats?.conversionRate ?? 0}%`,
                    background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.9))",
                    transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold transition-all duration-200 hover:gap-3 active:scale-[0.98]"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
            >
              <Settings2 size={12} />
              تعديل شخصية Agent
              <ArrowUpRight size={12} />
            </button>
          </div>

          {/* Quick Actions Strip */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
            <button
              onClick={() => router.push("/dashboard/conversations")}
              className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 group"
            >
              <MessageCircle size={15} className="text-brand-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-muted-foreground">المحادثات</span>
            </button>
            <div className="w-px h-8 bg-border" />
            <button
              onClick={() => router.push("/dashboard/products")}
              className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 group"
            >
              <ShoppingBag size={15} className="text-brand-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-muted-foreground">المنتجات</span>
            </button>
            <div className="w-px h-8 bg-border" />
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 group"
            >
              <Zap size={15} className="text-brand-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-muted-foreground">الإعدادات</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}