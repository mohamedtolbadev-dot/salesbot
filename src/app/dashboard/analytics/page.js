"use client"

import { useState, useEffect, useRef } from "react"
import { statsAPI } from "@/lib/api"
import { formatAmount } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, Users, MessageCircle,
  ShoppingBag, Zap, BarChart3, Clock, Smile,
  RefreshCcw, AlertCircle, RefreshCw, Activity,
} from "lucide-react"

/* ─────────────── Animated Number ─────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const raw = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0
    const duration = 900
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.floor(eased * raw))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(raw)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{display.toLocaleString("ar-MA")}</>
}

/* ─────────────── Animated Progress Bar ─────────────── */
function ProgressBar({ pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div className="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  )
}

/* ─────────────── Bar Chart Column ─────────────── */
function ChartBar({ val, maxVal, day, isToday, delay }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  const heightPct = (val / maxVal) * 100
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <span className={cn(
        "text-[10px] font-bold tabular-nums transition-colors",
        isToday ? "text-brand-600" : "text-muted-foreground"
      )}>{val}</span>
      <div className="w-full flex items-end" style={{ height: "80px" }}>
        <div
          className="w-full rounded-t-md"
          style={{
            height: animated ? `${Math.max(heightPct, 4)}%` : "4px",
            backgroundColor: isToday ? "#534AB7" : "#AFA9EC",
            transition: "height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        isToday ? "text-brand-600" : "text-muted-foreground"
      )}>{day}</span>
    </div>
  )
}

/* ─────────────── Stat Card ─────────────── */
function StatCard({ label, rawValue, display, sub, icon: Icon, isUp = true, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="group bg-card border border-border rounded-xl p-4 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon size={14} className="text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        {rawValue !== undefined ? <AnimatedNumber value={rawValue} /> : display}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {isUp
          ? <TrendingUp size={11} className="text-brand-600" />
          : <TrendingDown size={11} className="text-red-500" />
        }
        <p className={cn("text-[11px] font-semibold", isUp ? "text-brand-600" : "text-red-500")}>{sub}</p>
      </div>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Main Page ─────────────── */
export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePeriod, setActivePeriod] = useState(0)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)
      const response = await statsAPI.getStats()
      setStats(response.data)
    } catch (err) {
      setError("فشل في تحميل التحليلات")
    } finally {
      setLoading(false)
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-secondary/60 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-secondary/60 rounded-xl h-52 animate-pulse" />
          <div className="bg-secondary/60 rounded-xl h-52 animate-pulse" />
        </div>
        <div className="bg-secondary/60 rounded-xl h-36 animate-pulse" />
      </div>
    )
  }

  /* ── Error ── */
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
          onClick={fetchStats}
          className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          <RefreshCw size={13} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const weeklyChart = stats?.weeklyChart || []
  const weeklyDays  = stats?.weeklyDays  || []
  const maxVal      = Math.max(...weeklyChart, 1)

  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* ── 1. Header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <BarChart3 size={15} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">التحليلات</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">نظرة عامة على الأداء</p>
          </div>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center bg-secondary border border-border rounded-lg p-1 gap-0.5">
          {["أسبوع", "شهر", "3 أشهر"].map((p, i) => (
            <button
              key={p}
              onClick={() => setActivePeriod(i)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200",
                activePeriod === i
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="إجمالي محادثات"
          rawValue={stats?.weekConversations || 0}
          sub="هذا الأسبوع"
          icon={MessageCircle}
          delay={0}
        />
        <StatCard
          label="معدل التحويل"
          display={(stats?.conversionRate || 0) + "%"}
          sub="نسبة الإغلاق"
          icon={TrendingUp}
          delay={80}
        />
        <StatCard
          label="إجمالي المبيعات"
          display={formatAmount(stats?.weekRevenue || 0)}
          sub="إيرادات الأسبوع"
          icon={ShoppingBag}
          delay={160}
        />
        <StatCard
          label="متوسط قيمة طلب"
          display={formatAmount(stats?.avgOrderValue || 0)}
          sub="متوسط المبيعات"
          icon={Zap}
          delay={240}
        />
      </div>

      {/* ── 3. Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-300 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <BarChart3 size={13} className="text-brand-600" />
              </div>
              <p className="text-[13px] font-semibold">المحادثات اليومية</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#AFA9EC" }} />
                السابق
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-brand-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-600" />
                اليوم
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2">
            {weeklyChart.map((val, i) => (
              <ChartBar
                key={i}
                val={val}
                maxVal={maxVal}
                day={weeklyDays[i] || ""}
                isToday={i === weeklyChart.length - 1}
                delay={i * 60}
              />
            ))}
          </div>
        </div>

        {/* Stages */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-300 transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
              <Users size={13} className="text-brand-600" />
            </div>
            <p className="text-[13px] font-semibold">مراحل المحادثات</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "ترحيب",    count: stats?.stages?.greeting  || 0, color: "#534AB7" },
              { label: "استكشاف", count: stats?.stages?.discovery || 0, color: "#7F77DD" },
              { label: "إقناع",   count: stats?.stages?.pitching  || 0, color: "#534AB7" },
              { label: "اعتراض",  count: stats?.stages?.objection || 0, color: "#E24B4A" },
              { label: "إغلاق",   count: stats?.stages?.closed    || 0, color: "#0F6E56" },
            ].map((s, idx) => {
              const total = stats?.stages?.greeting || 1
              const pct   = Math.round((s.count / total) * 100)
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3 py-1 px-1 rounded-lg hover:bg-secondary/40 transition-colors cursor-default group/row"
                >
                  {/* Color dot */}
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[11px] font-medium text-muted-foreground min-w-[48px] group-hover/row:text-foreground transition-colors">
                    {s.label}
                  </span>
                  <ProgressBar pct={pct} color={s.color} delay={200 + idx * 80} />
                  <span className="text-[11px] font-bold text-foreground min-w-[24px] text-left tabular-nums">
                    {s.count}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">معدل الإغلاق</span>
            <span className="text-[11px] font-bold text-brand-600">{stats?.conversionRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* ── 4. Objection Reasons ── */}
      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-brand-300 transition-all duration-300 group">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
            <TrendingDown size={13} className="text-brand-600" />
          </div>
          <p className="text-[13px] font-semibold">أسباب الاعتراض الأكثر شيوعاً</p>
        </div>
        <div className="flex flex-col gap-3">
          {(stats?.objectionReasons || []).map((item, i) => {
            const maxCount = stats?.objectionReasons?.[0]?.count || 1
            const pct      = Math.round((item.count / maxCount) * 100)
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-1 px-1 rounded-lg hover:bg-secondary/40 transition-colors cursor-default group/row"
              >
                {/* Rank Badge */}
                <span className="w-5 h-5 rounded-md bg-secondary flex items-center justify-center text-[9px] font-bold text-brand-600 shrink-0">
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground min-w-[100px] group-hover/row:text-foreground transition-colors">
                  {item.reason}
                </span>
                <ProgressBar pct={pct} color="#BA7517" delay={300 + i * 80} />
                <span className="text-[11px] font-bold text-foreground min-w-[24px] text-left tabular-nums">
                  {item.count}
                </span>
              </div>
            )
          })}
          {(!stats?.objectionReasons || stats.objectionReasons.length === 0) && (
            <p className="text-center text-[12px] text-muted-foreground py-4">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* ── 5. Extra Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "متوسط وقت الرد", value: stats?.avgResponseTime || "0s",         icon: Clock,       delay: 0   },
          { label: "رضا الزبائن",    value: (stats?.satisfactionRate || 0) + "%",    icon: Smile,       delay: 80  },
          { label: "نسبة العودة",    value: (stats?.returnRate || 0) + "%",          icon: RefreshCcw,  delay: 160 },
        ].map(({ label, value, icon: Icon, delay }, i) => (
          <ExtraStatCard key={label} label={label} value={value} icon={Icon} delay={delay} />
        ))}
      </div>

    </div>
  )
}

/* ─────────────── Extra Stat Card ─────────────── */
function ExtraStatCard({ label, value, icon: Icon, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="group bg-card border border-border rounded-xl p-4 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default flex items-center gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
        <Icon size={17} className="text-brand-600" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums mt-0.5">
          {value}
        </p>
      </div>
      <div className="mr-auto h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-6 transition-all duration-500" />
    </div>
  )
}