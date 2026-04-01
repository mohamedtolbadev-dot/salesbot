"use client"

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { conversationsAPI } from "@/lib/api"
import { getStageConfig, getStageClassName, getScoreColor, timeAgo, getInitials } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Search, Download, MessageCircle, Sparkles,
  Users, CheckCircle, AlertCircle, Loader2,
  RefreshCw, ChevronRight, Trash2, AlertTriangle,
  X, ShoppingBag, Wrench,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

/* ─────────────── Stage Label Helper ─────────────── */
function useStageLabel() {
  const { t } = useLanguage()
  return (stage, type = "product") => {
    if (stage === "CLOSED") {
      return type === "service" ? t('conv.stage_booked') : t('conv.stage_ordered')
    }
    const labels = {
      GREETING: t('conv.stage_greeting'),
      DISCOVERY: t('conv.stage_discovery'),
      PITCHING: t('conv.stage_pitching'),
      OBJECTION: t('conv.stage_objection'),
      CLOSING: t('conv.stage_closing'),
      ABANDONED: t('conv.stage_abandoned'),
    }
    return labels[stage] || stage
  }
}

/* ─────────────── Skeleton ─────────────── */
function ConversationsSkeleton() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-5 pb-6">
      <style>{`
        @keyframes sk-shimmer {
          0%   { background-position: -700px 0; }
          100% { background-position:  700px 0; }
        }
        .sk {
          border-radius: 6px;
          background: linear-gradient(90deg,
            var(--color-background-secondary, rgba(0,0,0,0.06)) 25%,
            var(--color-background-tertiary,  rgba(0,0,0,0.11)) 50%,
            var(--color-background-secondary, rgba(0,0,0,0.06)) 75%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
        .sk-unread {
          border-radius: 4px;
          background: linear-gradient(90deg,
            rgba(83,74,183,0.30) 25%,
            rgba(83,74,183,0.52) 50%,
            rgba(83,74,183,0.30) 75%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
        .sk-bubble-agent {
          border-radius: 14px 14px 14px 4px;
          background: linear-gradient(90deg,
            var(--color-background-secondary, rgba(0,0,0,0.06)) 25%,
            var(--color-background-tertiary,  rgba(0,0,0,0.11)) 50%,
            var(--color-background-secondary, rgba(0,0,0,0.06)) 75%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
        .sk-bubble-customer {
          border-radius: 14px 14px 4px 14px;
          background: linear-gradient(90deg,
            rgba(83,74,183,0.38) 25%,
            rgba(83,74,183,0.62) 50%,
            rgba(83,74,183,0.38) 75%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="sk w-8 h-8 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <div className="sk h-4 w-[90px]" />
            <div className="sk h-[11px] w-[130px]" />
          </div>
        </div>
        <div className="sk h-8 w-[90px] rounded-lg" />
      </div>

      {/* Type Tabs */}
      <div className="sk h-10 w-[220px] rounded-xl" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[36, 48, 40, 52].map((w, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div className="sk w-8 h-8 rounded-lg" />
              <div className="sk h-5 rounded-md" style={{ width: w }} />
            </div>
            <div className="sk h-[26px] rounded-md w-10" />
            <div className="sk h-[11px] w-24" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-1.5 bg-card border border-border rounded-lg p-2">
          {[70, 64, 68, 72].map((w, i) => (
            <div key={i} className="sk h-[30px] rounded-lg" style={{ width: w }} />
          ))}
        </div>
        <div className="relative bg-card border border-border rounded-lg px-3 py-2.5 flex items-center">
          <div className="sk absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded" />
          <div className="sk h-3 w-[160px] mr-5" />
        </div>
      </div>

      {/* List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="sk w-9 h-9 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="sk h-[13px] w-20" />
                  </div>
                </div>
                <div className="sk h-[10px] w-10" />
              </div>
              <div className="sk h-[11px] w-40 mr-10" />
              <div className="flex items-center justify-between">
                <div className="sk h-[22px] w-14 rounded-md" />
                <div className="sk h-2 w-[72px] rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-2 hidden lg:flex bg-card border border-border rounded-xl min-h-[420px] items-center justify-center">
          <div className="sk w-16 h-16 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Animated Number ─────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = typeof value === "number" && !isNaN(value)
      ? Math.max(0, value)
      : 0
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
  return <>{display}</>
}

/* ─────────────── Score Bar ─────────────── */
function ScoreBar({ score, color, width = "w-10" }) {
  const safeScore = typeof score === "number" && !isNaN(score)
    ? Math.min(100, Math.max(0, score))
    : 0

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${width} h-[3px] bg-border rounded-full overflow-hidden`}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${safeScore}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{safeScore}%</span>
    </div>
  )
}

/* ─────────────── Stat Card ─────────────── */
function StatCard({ label, value, badge, icon: Icon, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      className="group bg-card border border-border rounded-xl p-3 sm:p-4 cursor-default transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={16} className="text-brand-600" />
        </div>
        <span className="text-[11px] sm:text-[12px] font-semibold text-brand-600 bg-secondary border border-brand-200 px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Avatar ─────────────── */
function Avatar({ name, size = "sm" }) {
  const dims = size === "lg" ? "w-11 h-11 text-sm"
             : size === "md" ? "w-10 h-10 text-sm"
             : "w-9 h-9 text-sm"
  return (
    <div className="relative shrink-0">
      <div className="absolute -inset-[2px] rounded-full bg-brand-600" />
      <div className={`${dims} rounded-full bg-brand-600 flex items-center justify-center font-bold text-white relative`}>
        {getInitials(name)}
      </div>
    </div>
  )
}

/* ─────────────── Message Bubble ─────────────── */
function MessageBubble({ msg, customerName }) {
  const isAgent = msg.role === "AGENT"
  return (
    <div className={cn("flex gap-2 items-end", !isAgent && "flex-row-reverse")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
          isAgent ? "bg-secondary text-brand-600" : "bg-brand-600 text-white"
        )}
      >
        {isAgent ? "و" : getInitials(customerName)}
      </div>
      <div className={cn(
        "rounded-2xl px-3 py-2 text-[14px] max-w-[75%] leading-relaxed",
        isAgent
          ? "bg-card border border-border text-foreground rounded-tl-sm"
          : "bg-brand-600 text-white rounded-tr-sm shadow-sm shadow-brand-600/20"
      )}>
        {msg.content}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   FILTER CONFIG — منتجات وخدمات
════════════════════════════════════════════════ */
const STAGE_FILTERS = {
  product: [
    { key: "all",      labelKey: "conv.filter_all"    },
    { key: "PITCHING", labelKey: "conv.filter_pitching" },
    { key: "OBJECTION",labelKey: "conv.filter_objection" },
    { key: "CLOSING",  labelKey: "conv.filter_closing"  },
    { key: "CLOSED",   labelKey: "conv.filter_closed"   },
  ],
  service: [
    { key: "all",      labelKey: "conv.filter_all"    },
    { key: "PITCHING", labelKey: "conv.filter_pitching" },
    { key: "OBJECTION",labelKey: "conv.filter_objection" },
    { key: "CLOSING",  labelKey: "conv.filter_booking"  },
    { key: "CLOSED",   labelKey: "conv.filter_closed"   },
  ],
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
function ConversationsContent() {
  const { t } = useLanguage()
  const getStageLabel = useStageLabel()
  const searchParams = useSearchParams()
  const [conversations, setConversations]   = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [convType, setConvType]             = useState("product") // ← التاب الرئيسي
  const [filter, setFilter]                 = useState("all")
  const [search, setSearch]                 = useState("")
  const [selected, setSelected]             = useState(null)
  const [messages, setMessages]             = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [deleteModal, setDeleteModal]       = useState({ open: false, id: null, name: "" })

  // عند تغيير التاب — صفّر الفلتر والمحادثة
  const handleTypeChange = useCallback((type) => {
    setConvType(type)
    setFilter("all")
    setSelected(null)
    setMessages([])
  }, [])

  const handleDeleteConversation = useCallback((id, name) => {
    setDeleteModal({ open: true, id, name })
  }, [])

  const confirmDelete = useCallback(async () => {
    const { id } = deleteModal
    if (!id) return
    try {
      await conversationsAPI.delete(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (selected?.id === id) { setSelected(null); setMessages([]) }
      setDeleteModal({ open: false, id: null, name: "" })
    } catch (err) {
      console.error("Delete error:", err)
      setDeleteModal({ open: false, id: null, name: "" })
    }
  }, [deleteModal, selected])

  const cancelDelete = useCallback(() => {
    setDeleteModal({ open: false, id: null, name: "" })
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const response = await conversationsAPI.getAll({})
      setConversations(response.data?.conversations || [])
    } catch {
      setError("load_error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // ── Auto-select conversation from URL ?id= param (e.g. from appointments page) ──
  useEffect(() => {
    const targetId = searchParams?.get("id")
    if (!targetId || conversations.length === 0) return
    const match = conversations.find(c => c.id === targetId)
    if (!match) return
    // Switch to the right type tab if needed
    const neededType = match.type === "service" ? "service" : "product"
    if (convType !== neededType) setConvType(neededType)
    setFilter("all")
    setSelected(match)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams])

  useEffect(() => {
    if (!selected?.id) { setMessages([]); return }
    ;(async () => {
      try {
        setMessagesLoading(true); setMessages([])
        const res = await conversationsAPI.getById(selected.id)
        setMessages(res.data?.messages || [])
      } catch { setMessages([]) }
      finally { setMessagesLoading(false) }
    })()
  }, [selected?.id])

  // ── فصل المحادثات حسب النوع ──
  const productConvs = useMemo(() =>
    conversations.filter(c => {
      if (c.stage === "ARCHIVED") return false
      return c.type !== "service"
    }), [conversations])

  const serviceConvs = useMemo(() =>
    conversations.filter(c => {
      if (c.stage === "ARCHIVED") return false
      return c.type === "service"
    }), [conversations])

  // ── المحادثات النشطة حسب التاب ──
  const activeConvs = convType === "product" ? productConvs : serviceConvs

  // ── فلترة حسب stage + بحث ──
  const filtered = useMemo(() => {
    let result = activeConvs
    if (filter !== "all") result = result.filter(c => c.stage === filter)
    if (search.trim()) {
      result = result.filter(c =>
        c.customer?.name?.includes(search) ||
        c.customer?.phone?.includes(search)
      )
    }
    return result
  }, [activeConvs, filter, search])

  const unreadCount = conversations.filter(c => !c.isRead).length

  // ── عداد كل فلتر ──
  const filterButtons = useMemo(() =>
    STAGE_FILTERS[convType].map(f => ({
      ...f,
      count: f.key === "all"
        ? activeConvs.length
        : activeConvs.filter(c => c.stage === f.key).length
    }))
  , [activeConvs, convType])

  // ── Stats حسب التاب ──
  const stats = useMemo(() => ({
    total:     activeConvs.length,
    closed:    activeConvs.filter(c => c.stage === "CLOSED").length,
    pitching:  activeConvs.filter(c => c.stage === "PITCHING").length,
    objection: activeConvs.filter(c => c.stage === "OBJECTION").length,
  }), [activeConvs])

  if (loading) return <ConversationsSkeleton />

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{t('common.load_error')}</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
      <button onClick={fetchConversations}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <RefreshCw size={15} /> {t('common.retry')}
      </button>
    </div>
  )

  /* ── Mobile full-screen detail ── */
  if (selected) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden"
          style={{ backgroundColor: "hsl(var(--card))" }}>
          <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-card shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
            <button onClick={() => { setSelected(null); setMessages([]) }}
              className="flex items-center gap-1 text-brand-600 font-semibold text-sm shrink-0">
              <ChevronRight size={22} />
              {unreadCount > 0 && (
                <span className="text-[12px] text-muted-foreground font-normal">{unreadCount}</span>
              )}
            </button>
            <Avatar name={selected.customer?.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground truncate">{selected.customer?.name}</p>
              <p className="text-[12px] text-muted-foreground">{selected.customer?.phone}</p>
            </div>
            <span className={cn("text-[12px] font-semibold px-2 py-1 rounded-md border",
              getStageClassName(selected.stage, selected.type))}>
              {getStageLabel(selected.stage, selected.type)}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
            <span className="text-[12px] text-muted-foreground font-medium">{t('conv.score')}</span>
            <div className="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${selected.score}%`, backgroundColor: getScoreColor(selected.score) }} />
            </div>
            <span className="text-[13px] font-bold tabular-nums shrink-0"
              style={{ color: getScoreColor(selected.score) }}>
              {selected.score}%
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messagesLoading
              ? <div className="flex items-center justify-center flex-1">
                  <Loader2 size={22} className="animate-spin text-brand-600" />
                </div>
              : messages.length === 0
              ? <div className="flex items-center justify-center flex-1 text-[14px] text-muted-foreground">
                  {t('conv.no_messages')}
                </div>
              : messages.map(msg => (
                  <MessageBubble key={msg.id || `${msg.role}-${msg.createdAt}`}
                    msg={msg} customerName={selected.customer?.name} />
                ))
            }
          </div>
          <div className="grid grid-cols-3 gap-2 px-3 py-3 border-t border-border shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
            {[
              { label: t('conv.messages'),   value: `${messages.length}` },
              { label: t('conv.duration'),   value: timeAgo(selected.createdAt) },
              { label: t('conv.order_val'), value: selected.totalAmount ? `${selected.totalAmount}` : "—" },
            ].map(item => (
              <div key={item.label} className="bg-secondary/50 border border-border rounded-lg p-2 text-center">
                <p className="text-[12px] text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-[13px] font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <MainLayout
          convType={convType} onTypeChange={handleTypeChange}
          productCount={productConvs.length} serviceCount={serviceConvs.length}
          stats={stats} filtered={filtered} filter={filter} setFilter={setFilter}
          search={search} setSearch={setSearch} filterButtons={filterButtons}
          selected={selected} setSelected={setSelected}
          messages={messages} messagesLoading={messagesLoading}
          unreadCount={unreadCount}
          onDeleteConversation={handleDeleteConversation}
          deleteModal={deleteModal} confirmDelete={confirmDelete} cancelDelete={cancelDelete}
        />
      </>
    )
  }

  return (
    <MainLayout
      convType={convType} onTypeChange={handleTypeChange}
      productCount={productConvs.length} serviceCount={serviceConvs.length}
      stats={stats} filtered={filtered} filter={filter} setFilter={setFilter}
      search={search} setSearch={setSearch} filterButtons={filterButtons}
      selected={selected} setSelected={setSelected}
      messages={messages} messagesLoading={messagesLoading}
      unreadCount={unreadCount}
      onDeleteConversation={handleDeleteConversation}
      deleteModal={deleteModal} confirmDelete={confirmDelete} cancelDelete={cancelDelete}
    />
  )
}

/* ─────────────── Main Layout ─────────────── */
function MainLayout({
  convType, onTypeChange, productCount, serviceCount,
  stats, filtered, filter, setFilter,
  search, setSearch, filterButtons,
  selected, setSelected, messages, messagesLoading,
  unreadCount, onDeleteConversation,
  deleteModal, confirmDelete, cancelDelete,
}) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <MessageCircle size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('nav.conversations')}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} ${t('notif.unread')}` : t('conv.all_read')}
            </p>
          </div>
        </div>
      </div>

      {/* ══ تاب منتجات / خدمات ══ */}
      <div className="flex gap-1 p-1 bg-secondary/50 border border-border rounded-2xl w-fit">
        {[
          {
            key: "product",
            labelKey: "nav.products",
            icon: ShoppingBag,
            count: productCount,
          },
          {
            key: "service",
            labelKey: "nav.services",
            icon: Wrench,
            count: serviceCount,
          },
        ].map(tab => {
          const Icon = tab.icon
          const active = convType === tab.key
          return (
            <button key={tab.key}
              onClick={() => onTypeChange(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              <Icon size={15} className={active ? "text-brand-600" : ""} />
              {t(tab.labelKey)}
              <span className={cn(
                "text-[12px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-border/80 text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Stats 4 كاردات حسب التاب ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={convType === "product" ? t('conv.total_product') : t('conv.total_service')}
          value={stats.total} icon={Users} badge={t('conv.filter_all')} delay={0} />
        <StatCard
          label={convType === "product" ? t('conv.closed_sales') : t('conv.closed_bookings')}
          value={stats.closed} icon={CheckCircle} badge={t('conv.filter_closed')} delay={80} />
        <StatCard
          label={t('conv.filter_pitching')}
          value={stats.pitching} icon={Sparkles} badge={t('conv.filter_pitching')} delay={160} />
        <StatCard
          label={t('conv.needs_attention')}
          value={stats.objection} icon={AlertCircle} badge={t('conv.filter_objection')} delay={240} />
      </div>

      {/* ── فلاتر المرحلة + بحث ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none bg-card border border-border rounded-lg p-2">
          {filterButtons.map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold border shrink-0 transition-all duration-200",
                filter === f.key
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-300"
              )}>
              {t(f.labelKey)}
              <span className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums",
                filter === f.key
                  ? "bg-white/20 text-white"
                  : "bg-border/80 text-muted-foreground"
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={convType === "product" ? t('conv.search_product') : t('conv.search_service')}
            className="w-full pr-9 pl-3 py-2 bg-card border border-border rounded-lg text-[14px] outline-none focus:border-brand-400 transition-colors duration-200" />
        </div>
      </div>

      {/* ── القائمة + التفاصيل ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* القائمة */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                {convType === "product"
                  ? <ShoppingBag size={22} className="text-brand-600" />
                  : <Wrench size={22} className="text-brand-600" />
                }
              </div>
              <p className="text-[14px] text-muted-foreground">
                {convType === "product" ? t('conv.no_product_convs') : t('conv.no_service_convs')}
              </p>
            </div>
          ) : (
            filtered.map((conv, idx) => {
              const safeScore = typeof conv.score === "number" && !isNaN(conv.score)
                ? conv.score
                : 0
              const stageLabel = getStageLabel(conv.stage, conv.type)
              const stageClassName = getStageClassName(conv.stage, conv.type)
              const stage = getStageConfig(conv.stage)
              const scoreColor = getScoreColor(safeScore)
              return (
                <ConvCard key={conv.id} conv={conv} stage={stage} scoreColor={scoreColor}
                  stageLabel={stageLabel}
                  stageClassName={stageClassName}
                  isSelected={selected?.id === conv.id}
                  onSelect={() => setSelected(conv)}
                  onDelete={onDeleteConversation}
                  delay={idx * 40}
                  convType={convType}
                  safeScore={safeScore}
                />
              )
            })
          )}
        </div>

        {/* التفاصيل */}
        <div className="col-span-2 hidden lg:block">
          {!selected ? (
            <div className="bg-card border border-border rounded-xl h-full min-h-[420px] flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                {convType === "product"
                  ? <ShoppingBag size={26} className="text-brand-600" />
                  : <Wrench size={26} className="text-brand-600" />
                }
              </div>
              <p className="text-[14px] text-muted-foreground font-medium">
                {convType === "product" ? t('conv.select_product') : t('conv.select_service')}
              </p>
            </div>
          ) : (
            <DetailPanel
              selected={selected}
              messages={messages}
              messagesLoading={messagesLoading}
              convType={convType}
            />
          )}
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} />
          <div
            className="relative w-full max-w-sm border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: "slideUp 0.3s ease-out forwards", backgroundColor: "var(--modal-surface, hsl(var(--card)))" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-red-500/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <p className="text-sm font-bold text-red-500">{t('conv.delete_title')}</p>
              </div>
              <button onClick={cancelDelete}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground font-medium mb-1">
                {t('conv.delete_confirm')}
                <span className="text-brand-600 font-bold mx-1">{deleteModal.name}</span>?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('conv.delete_warning')}
              </p>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-border/60 bg-secondary/20">
              <button onClick={cancelDelete}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all">
                {t('common.cancel')}
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                <Trash2 size={12} />
                {t('common.yes')}, {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── Conv Card ─────────────── */
function ConvCard({ conv, stageClassName, scoreColor, isSelected, onSelect, onDelete, delay, convType, safeScore }) {
  const { t } = useLanguage()
  const getStageLabel = useStageLabel()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div onClick={onSelect}
      className={cn(
        "group bg-card border rounded-xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]",
        isSelected
          ? "border-brand-400 shadow-md shadow-brand-600/10"
          : "border-border hover:border-brand-300 hover:shadow-md hover:shadow-brand-600/5"
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease, border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={conv.customer?.name} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-foreground truncate">
                {conv.customer?.name}
              </span>
              {!conv.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 animate-pulse" />
              )}
            </div>
            {!conv.isRead && (
              <span className="text-[12px] text-brand-600 font-semibold">{t('conv.new_message')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Badge نوع المحادثة */}
          <span className={cn(
            "text-[11px] px-1.5 py-0.5 rounded-md border font-semibold shrink-0",
            convType === "product"
              ? "bg-brand-50 text-brand-600 border-brand-200"
              : "bg-brand-100 text-brand-800 border-brand-200"
          )}>
            {convType === "product" ? `${t('nav.products')} 🛍️` : `${t('nav.services')} 🔧`}
          </span>
          <span className="text-[12px] text-muted-foreground">{timeAgo(conv.updatedAt)}</span>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground truncate mb-2.5">
        {conv.messages?.[conv.messages.length - 1]?.content || t('conv.no_messages')}
      </p>

      <div className="flex items-center justify-between">
        <span className={cn("text-[12px] font-semibold px-2 py-0.5 rounded-md border", stageClassName)}>
          {getStageLabel(conv.stage, conv.type)}
        </span>
        <div className="flex items-center gap-2">
          <ScoreBar score={safeScore} color={scoreColor} />
          <button
            onClick={e => { e.stopPropagation(); onDelete(conv.id, conv.customer?.name) }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
            title={t('conv.delete_title')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Detail Panel ─────────────── */
function DetailPanel({ selected, messages, messagesLoading, convType }) {
  const { t } = useLanguage()
  const getStageLabel = useStageLabel()
  const scoreColor = getScoreColor(selected.score)
  const stageClassName = getStageClassName(selected.stage, selected.type)
  const stage = getStageConfig(selected.stage)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <Avatar name={selected.customer?.name} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-bold text-foreground">{selected.customer?.name}</p>
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-md border font-bold",
                convType === "product"
                  ? "bg-brand-50 text-brand-600 border-brand-200"
                  : "bg-brand-100 text-brand-800 border-brand-200"
              )}>
                {convType === "product" ? `${t('nav.products')} 🛍️` : `${t('nav.services')} 🔧`}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground">{selected.customer?.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn("text-[12px] font-semibold px-2 py-1 rounded-md border", stageClassName)}>
            {getStageLabel(selected.stage, selected.type)}
          </span>
          <ScoreBar score={selected.score} color={scoreColor} width="w-16" />
        </div>
      </div>

      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0 max-h-80">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={22} className="animate-spin text-brand-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[14px] text-muted-foreground">
            {t('conv.no_messages')}
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id || `${msg.role}-${msg.createdAt}`}
              msg={msg}
              customerName={selected.customer?.name}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: t('conv.messages'), value: `${messages.length}` },
            { label: t('conv.duration'), value: timeAgo(selected.createdAt) },
            {
              label: convType === "product" ? t('conv.order_val') : t('conv.booking_val'),
              value: selected.totalAmount ? `${selected.totalAmount}` : "—"
            },
          ].map(item => (
            <div key={item.label}
              className="bg-secondary/50 border border-border rounded-lg p-2.5 text-center hover:bg-secondary transition-colors duration-150">
              <p className="text-[12px] text-muted-foreground mb-0.5">{item.label}</p>
              <p className="text-[14px] font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={null}>
      <ConversationsContent />
    </Suspense>
  )
}