"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { customersAPI, statsAPI } from "@/lib/api"
import { formatAmount, getCustomerTagConfig } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  Search, Users, TrendingUp, Crown,
  Sparkles, Download, Star,
  AlertCircle, RefreshCw,
} from "lucide-react"

/* ─────────────── Animated Number ─────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0
    const duration = 800
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
  return <>{display.toLocaleString("ar-MA")}</>
}

/* ─────────────── Stat Card ─────────────── */
function StatCard({ label, value, rawValue, sub, icon: Icon, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="group bg-card border border-border rounded-xl p-4 cursor-default transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={14} className="text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        {rawValue !== undefined ? <AnimatedNumber value={rawValue} /> : value}
      </p>
      <p className="text-[11px] text-brand-600 flex items-center gap-1 font-semibold mt-1">
        <TrendingUp size={10} />
        {sub}
      </p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Customer Avatar ─────────────── */
function CustomerAvatar({ name, size = "sm" }) {
  const dims = size === "md" ? "w-9 h-9 text-xs" : "w-8 h-8 text-xs"
  return (
    <div className="relative shrink-0">
      <div className="absolute -inset-[2px] rounded-full bg-brand-600" />
      <div className={cn(dims, "rounded-full bg-brand-600 flex items-center justify-center font-bold text-white relative")}>
        {name?.charAt(0) || "؟"}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [tagFilter, setTagFilter] = useState("all")
  const [search, setSearch]       = useState("")

  useEffect(() => { fetchData() }, [tagFilter, search])

  async function fetchData() {
    try {
      setLoading(true); setError(null)
      const [customersData, statsData] = await Promise.all([
        customersAPI.getAll({
          tag:    tagFilter !== "all" ? tagFilter : undefined,
          search: search.trim() || undefined,
        }),
        statsAPI.getStats(),
      ])
      setCustomers(customersData.data || [])
      setStats(statsData.data)
    } catch {
      setError("فشل في تحميل الزبائن")
    } finally {
      setLoading(false)
    }
  }

  const tagButtons = [
    { key: "all",      label: "الكل",    icon: null,     count: customers.length },
    { key: "VIP",      label: "VIP",     icon: Crown,    count: customers.filter(c => c.tag === "VIP").length },
    { key: "NEW",      label: "جدد",     icon: Sparkles, count: customers.filter(c => c.tag === "NEW").length },
    { key: "REGULAR",  label: "عاديون",  icon: null,     count: customers.filter(c => c.tag === "REGULAR").length },
    { key: "PROSPECT", label: "محتملون", icon: null,     count: customers.filter(c => c.tag === "PROSPECT").length },
  ]

  const filtered = useMemo(() => {
    let list = customers
    if (tagFilter !== "all") list = list.filter(c => c.tag === tagFilter)
    if (search.trim()) list = list.filter(c => c.name?.includes(search) || c.phone?.includes(search))
    return list
  }, [customers, tagFilter, search])

  const avgSpent = Math.round(
    customers.reduce((s, c) => s + (c.totalSpent || 0), 0) /
    Math.max(1, customers.filter(c => (c.orders || 0) > 0).length)
  )

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="bg-secondary/60 rounded-xl h-24 animate-pulse" />)}
      </div>
      <div className="flex flex-col gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className="bg-secondary/60 rounded-xl h-16 animate-pulse" />)}
      </div>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">فشل في تحميل البيانات</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
      <button onClick={fetchData} className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <RefreshCw size={13} /> إعادة المحاولة
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 pb-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Users size={15} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">الزبائن</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">{customers.length} زبون مسجل</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground hover:border-brand-300 hover:text-brand-600 transition-all duration-200">
          <Download size={13} />
          <span className="hidden sm:inline">تصدير</span> CSV
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="إجمالي الزبائن"
          rawValue={customers.length}
          sub="+23 هذا الشهر"
          icon={Users}
          delay={0}
        />
        <StatCard
          label="زبائن عادوا"
          value={(stats?.returnRate || 0) + "%"}
          sub="نسبة العودة"
          icon={TrendingUp}
          delay={80}
        />
        <StatCard
          label="متوسط الإنفاق"
          value={formatAmount(avgSpent)}
          sub="للزبون الواحد"
          icon={Star}
          delay={160}
        />
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {tagButtons.map((t) => {
            const Ico = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTagFilter(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all duration-200",
                  tagFilter === t.key
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-300"
                )}
              >
                {Ico && <Ico size={11} />}
                {t.label}
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md tabular-nums",
                  tagFilter === t.key ? "bg-white/20 text-white" : "bg-border/80 text-muted-foreground"
                )}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم..."
            className="w-full pr-9 pl-3 py-2 bg-card border border-border rounded-lg text-[12px] outline-none focus:border-brand-400 transition-colors duration-200"
          />
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-brand-600" />
          </div>
          <p className="text-[12px] text-muted-foreground">لا توجد زبائن</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((customer, idx) => {
              const tagConfig = getCustomerTagConfig(customer.tag)
              return (
                <MobileCustomerCard
                  key={customer.id}
                  customer={customer}
                  tagConfig={tagConfig}
                  delay={idx * 40}
                />
              )
            })}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <table className="w-full">
              <thead>
                <tr>
                  {["الزبون", "الرقم", "الطلبات", "إجمالي الإنفاق", "آخر تفاعل", "التصنيف"].map(h => (
                    <th key={h} className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-secondary/40 border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, idx) => {
                  const tagConfig = getCustomerTagConfig(customer.tag)
                  return (
                    <DesktopCustomerRow
                      key={customer.id}
                      customer={customer}
                      tagConfig={tagConfig}
                      delay={idx * 30}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────── Mobile Card ─────────────── */
function MobileCustomerCard({ customer, tagConfig, delay }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-brand-300 hover:shadow-md transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease, border-color 0.2s",
      }}
    >
      <CustomerAvatar name={customer.name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[12px] font-bold text-foreground truncate">{customer.name}</p>
          <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0", tagConfig.className)}>
            {tagConfig.label}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
        <div className="flex items-center gap-2.5 mt-1">
          <span className="text-[10px] text-muted-foreground">{customer.orders} طلبات</span>
          {customer.totalSpent > 0 && (
            <span className="text-[10px] font-bold text-brand-600 tabular-nums">{formatAmount(customer.totalSpent)}</span>
          )}
          <span className="text-[10px] text-muted-foreground mr-auto">{customer.lastSeen}</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Desktop Row ─────────────── */
function DesktopCustomerRow({ customer, tagConfig, delay }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <tr
      className="border-t border-border hover:bg-secondary/40 cursor-pointer transition-colors duration-150 group"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CustomerAvatar name={customer.name} />
          <span className="text-[12px] font-bold text-foreground group-hover:text-brand-600 transition-colors">
            {customer.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-[11px] text-muted-foreground">{customer.phone}</td>
      <td className="px-4 py-3 text-[11px] font-medium text-foreground tabular-nums">{customer.orders} طلبات</td>
      <td className="px-4 py-3">
        <span className={cn("text-[11px] font-bold tabular-nums", customer.totalSpent > 0 ? "text-brand-600" : "text-muted-foreground")}>
          {customer.totalSpent > 0 ? formatAmount(customer.totalSpent) : "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-[11px] text-muted-foreground">{customer.lastSeen}</td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", tagConfig.className)}>
          {tagConfig.label}
        </span>
      </td>
    </tr>
  )
}