"use client"

import { useState, useEffect, useMemo } from "react"
import { customersAPI, statsAPI } from "@/lib/api"
import { formatAmount, getCustomerTagConfig } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Search, Users, TrendingUp, MessageCircle, Crown, Sparkles, Download, Star, ArrowUpRight, AlertCircle, RefreshCw } from "lucide-react"

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tagFilter, setTagFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [tagFilter, search])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      const [customersData, statsData] = await Promise.all([
        customersAPI.getAll({
          tag: tagFilter !== "all" ? tagFilter : undefined,
          search: search.trim() || undefined,
        }),
        statsAPI.getStats(),
      ])
      setCustomers(customersData.data || [])
      setStats(statsData.data)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("فشل في تحميل الزبائن")
    } finally {
      setLoading(false)
    }
  }

  const tagButtons = [
    { key: "all",      label: "الكل",      count: customers.length },
    { key: "VIP",      label: "VIP",       count: customers.filter((c) => c.tag === "VIP").length },
    { key: "NEW",      label: "جدد",       count: customers.filter((c) => c.tag === "NEW").length },
    { key: "REGULAR",  label: "عاديون",    count: customers.filter((c) => c.tag === "REGULAR").length },
    { key: "PROSPECT", label: "محتملون",   count: customers.filter((c) => c.tag === "PROSPECT").length },
  ]

  const filtered = useMemo(() => {
    let list = customers
    if (tagFilter !== "all") list = list.filter((c) => c.tag === tagFilter)
    if (search.trim())
      list = list.filter((c) => c.name?.includes(search) || c.phone?.includes(search))
    return list
  }, [customers, tagFilter, search])

  // ── Early returns ──
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-3 sm:px-0">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-2xl h-20 sm:h-24" />
          ))}
        </div>
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-lg h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">فشل في تحميل البيانات</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-0 pb-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
            <Users size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">الزبائن</h1>
            <p className="text-[11px] text-muted-foreground">{customers.length} زبون مسجل</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs font-medium hover:bg-secondary hover:border-brand-200 transition-all duration-200 shrink-0">
          <Download size={13} className="text-brand-600" />
          <span className="hidden sm:inline">تصدير</span> CSV
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3">
        {[
          {
            label: "إجمالي الزبائن",
            value: customers.length,
            sub: "+23 هذا الشهر",
            icon: Users,
          },
          {
            label: "زبائن عادوا",
            value: (stats?.returnRate || 0) + "%",
            sub: "نسبة العودة",
            icon: TrendingUp,
          },
          {
            label: "متوسط الإنفاق",
            value: formatAmount(
              Math.round(
                customers.reduce((s, c) => s + (c.totalSpent || 0), 0) /
                  Math.max(1, customers.filter((c) => (c.orders || 0) > 0).length)
              )
            ),
            sub: "للزبون",
            icon: Star,
          },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{s.label}</p>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Icon size={15} className="text-brand-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300">{s.value}</p>
                <p className="text-[10px] text-brand-600 flex items-center gap-1 font-medium mt-0.5">
                  <TrendingUp size={11} />
                  {s.sub}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col gap-2.5">
        {/* Tag filters — scrollable horizontally on mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {tagButtons.map((t) => (
            <button
              key={t.key}
              onClick={() => setTagFilter(t.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border shrink-0",
                tagFilter === t.key
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-200"
              )}
            >
              {t.key === "VIP" && <Crown size={11} />}
              {t.key === "NEW" && <Sparkles size={11} />}
              {t.label}
              <span
                className={cn(
                  "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full",
                  tagFilter === t.key ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم..."
            className="w-full pr-9 pl-3 py-2.5 bg-card border border-border rounded-lg text-xs outline-none focus:border-brand-400 transition-all duration-200"
          />
        </div>
      </div>

      {/* ── Customers List ── */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-brand-600" />
          </div>
          <p className="text-xs text-muted-foreground">لا توجد زبائن</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((customer) => {
              const tagConfig = getCustomerTagConfig(customer.tag)
              return (
                <div
                  key={customer.id}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-brand-200 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {customer.name?.charAt(0) || "؟"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-foreground truncate">{customer.name}</p>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0", tagConfig.className)}>
                        {tagConfig.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{customer.orders} طلبات</span>
                      {customer.totalSpent > 0 && (
                        <span className="text-[10px] font-semibold text-brand-600">{formatAmount(customer.totalSpent)}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground mr-auto">{customer.lastSeen}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-brand-600/10 transition-all duration-500">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">الزبون</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">الرقم</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">الطلبات</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">إجمالي الإنفاق</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">آخر تفاعل</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground p-3">التصنيف</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const tagConfig = getCustomerTagConfig(customer.tag)
                  return (
                    <tr
                      key={customer.id}
                      className="border-t border-border hover:bg-secondary/50 transition-all duration-200 cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                            {customer.name?.charAt(0) || "؟"}
                          </div>
                          <span className="text-xs font-semibold text-foreground">{customer.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{customer.phone}</td>
                      <td className="p-3 text-xs font-medium text-foreground">{customer.orders} طلبات</td>
                      <td className="p-3">
                        <span className={cn("text-xs font-semibold", customer.totalSpent > 0 ? "text-brand-600" : "text-muted-foreground")}>
                          {customer.totalSpent > 0 ? formatAmount(customer.totalSpent) : "—"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{customer.lastSeen}</td>
                      <td className="p-3">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", tagConfig.className)}>
                          {tagConfig.label}
                        </span>
                      </td>
                    </tr>
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