"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { conversationsAPI } from "@/lib/api"
import { getStageConfig, getScoreColor, timeAgo, getInitials } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  Search, Download, MessageCircle, Sparkles,
  Users, CheckCircle, AlertCircle, Loader2,
  RefreshCw, ChevronRight, Activity,
  RotateCcw, Trash2, AlertTriangle, X,
} from "lucide-react"
import Link from 'next/link';

/* ─────────────── Animated Number ─────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = typeof value === "number" ? value : 0
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
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${width} h-[3px] bg-border rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}%</span>
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
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={14} className="text-brand-600" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-semibold text-brand-600 bg-secondary border border-brand-200 px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Avatar ─────────────── */
function Avatar({ name, size = "sm" }) {
  const dims = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-9 h-9 text-xs" : "w-8 h-8 text-xs"
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
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          color: isAgent ? "#534AB7" : "white",
          backgroundColor: isAgent ? "var(--secondary)" : "#534AB7",
        }}
      >
        {isAgent ? "و" : getInitials(customerName)}
      </div>
      <div className={cn(
        "rounded-2xl px-3 py-2 text-[12px] max-w-[75%] leading-relaxed",
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
   Main Page
════════════════════════════════════════════════ */
export default function ConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" })

  const handleDeleteConversation = useCallback((id, name) => {
    setDeleteModal({ open: true, id, name })
  }, [])

  const confirmDelete = useCallback(async () => {
    const { id } = deleteModal
    if (!id) return
    
    try {
      await conversationsAPI.delete(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setMessages([])
      }
      setDeleteModal({ open: false, id: null, name: "" })
    } catch {
      alert("فشل في حذف المحادثة")
    }
  }, [deleteModal, selected])

  const cancelDelete = useCallback(() => {
    setDeleteModal({ open: false, id: null, name: "" })
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filter !== "all") params.stage = filter
      if (search.trim()) params.search = search
      const response = await conversationsAPI.getAll(params)
      setConversations(response.data?.conversations || [])
    } catch {
      setError("فشل في تحميل المحادثات")
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (!selected?.id) { setMessages([]); return }
    ;(async () => {
      try {
        setMessagesLoading(true)
        setMessages([])
        const res = await conversationsAPI.getById(selected.id)
        setMessages(res.data?.messages || [])
      } catch {
        setMessages([])
      } finally {
        setMessagesLoading(false)
      }
    })()
  }, [selected?.id])

  const filtered = useMemo(() => {
    let result = conversations
    // إخفاء المحادثات المكتملة (الأرشيف) إلا إذا تم تفعيل العرض
    if (!showArchived) {
      result = result.filter(c => c.stage !== "CLOSED")
    }
    if (!search.trim()) return result
    return result.filter(
      (c) => c.customer?.name?.includes(search) || c.customer?.phone?.includes(search)
    )
  }, [conversations, search, showArchived])

  const unreadCount = conversations.filter((c) => !c.isRead).length

  const filterButtons = [
    { key: "all",       label: "الكل",   count: conversations.filter(c => !showArchived ? c.stage !== "CLOSED" : true).length },
    { key: "PITCHING",  label: "إقناع",  count: conversations.filter((c) => c.stage === "PITCHING").length },
    { key: "OBJECTION", label: "اعتراض", count: conversations.filter((c) => c.stage === "OBJECTION").length },
    { key: "CLOSED",    label: "مكتملة", count: conversations.filter((c) => c.stage === "CLOSED").length },
  ]

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-secondary/60 rounded-xl h-24 animate-pulse" />)}
        </div>
        <div className="flex flex-col gap-2.5">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-secondary/60 rounded-xl h-20 animate-pulse" />)}
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error) {
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
          onClick={fetchConversations}
          className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          <RefreshCw size={13} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  /* ── Mobile full-screen detail ── */
  if (selected) {
    return (
      <>
        {/* Mobile overlay - solid background supporting both light & dark mode */}
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden" style={{ backgroundColor: 'hsl(var(--card))' }}>

          {/* Top bar */}
          <div
            className="flex items-center gap-3 px-3 py-3 border-b border-border bg-card shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <button
              onClick={() => { setSelected(null); setMessages([]) }}
              className="flex items-center gap-1 text-brand-600 font-semibold text-sm shrink-0"
            >
              <ChevronRight size={20} />
              {unreadCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-normal">{unreadCount}</span>
              )}
            </button>
            <Avatar name={selected.customer?.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{selected.customer?.name}</p>
              <p className="text-[10px] text-muted-foreground">{selected.customer?.phone}</p>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-md border", getStageConfig(selected.stage).className)}>
              {getStageConfig(selected.stage).label}
            </span>
          </div>

          {/* Score strip */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
            <span className="text-[10px] text-muted-foreground font-medium">نقاط الإقناع</span>
            <div className="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${selected.score}%`, backgroundColor: getScoreColor(selected.score) }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: getScoreColor(selected.score) }}>
              {selected.score}%
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messagesLoading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 size={22} className="animate-spin text-brand-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-[12px] text-muted-foreground">
                لا توجد رسائل
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id || `${msg.role}-${msg.createdAt}`}
                  msg={msg}
                  customerName={selected.customer?.name}
                />
              ))
            )}
          </div>

          {/* Footer stats */}
          <div
            className="grid grid-cols-3 gap-2 px-3 py-3 border-t border-border shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            {[
              { label: "الرسائل",      value: `${messages.length}` },
              { label: "وقت المحادثة", value: timeAgo(selected.createdAt) },
              { label: "قيمة الطلب",   value: selected.totalAmount ? `${selected.totalAmount} د` : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/50 border border-border rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-[11px] font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: still renders the main layout behind */}
        <MainLayout
          conversations={conversations}
          filtered={filtered}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          selected={selected}
          setSelected={setSelected}
          messages={messages}
          messagesLoading={messagesLoading}
          unreadCount={unreadCount}
          filterButtons={filterButtons}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          onDeleteConversation={handleDeleteConversation}
        />
      </>
    )
  }

  return (
    <MainLayout
      conversations={conversations}
      filtered={filtered}
      filter={filter}
      setFilter={setFilter}
      search={search}
      setSearch={setSearch}
      selected={selected}
      setSelected={setSelected}
      messages={messages}
      messagesLoading={messagesLoading}
      unreadCount={unreadCount}
      filterButtons={filterButtons}
      showArchived={showArchived}
      setShowArchived={setShowArchived}
      onDeleteConversation={handleDeleteConversation}
    />
  )
}

/* ════════════════════════════════════════════════
   Main Layout
════════════════════════════════════════════════ */
function MainLayout({
  conversations, filtered, filter, setFilter,
  search, setSearch, selected, setSelected,
  messages, messagesLoading, unreadCount, filterButtons,
  showArchived, setShowArchived, onDeleteConversation,
}) {
  return (
    <div className="flex flex-col gap-5 pb-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <MessageCircle size={15} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">المحادثات</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} غير مقروء` : "كل المحادثات مقروءة"}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground hover:border-brand-300 hover:text-brand-600 transition-all duration-200">
          <Download size={13} />
          <span className="hidden sm:inline">تصدير</span> CSV
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="إجمالي المحادثات" value={conversations.filter(c => !showArchived ? c.stage !== "CLOSED" : true).length}                                               icon={Users}        badge="الكل"    delay={0}   />
        <StatCard label="مبيعات مكتملة"    value={conversations.filter(c => c.stage === "CLOSED").length}             icon={CheckCircle}  badge="مكتملة"  delay={80}  />
        <StatCard label="قيد الإقناع"      value={conversations.filter(c => c.stage === "PITCHING").length}           icon={Sparkles}     badge="إقناع"   delay={160} />
        <StatCard label="يحتاج تدخل"       value={conversations.filter(c => c.stage === "OBJECTION").length}          icon={AlertCircle}  badge="اعتراض"  delay={240} />
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between bg-card border border-border rounded-lg p-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all duration-200",
                  filter === f.key
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-300"
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md tabular-nums",
                  filter === f.key ? "bg-white/20 text-white" : "bg-border/80 text-muted-foreground"
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          
          {/* زر عرض المكتملة */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all duration-200",
              showArchived
                ? "bg-brand-100 text-brand-700 border-brand-300"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-300"
            )}
          >
            <RotateCcw size={14} />
            {showArchived ? "إخفاء المكتملة" : "عرض المكتملة"}
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم..."
            className="w-full pr-9 pl-3 py-2 bg-card border border-border rounded-lg text-[12px] outline-none focus:border-brand-400 transition-colors duration-200"
          />
        </div>
      </div>

      {/* ── List + Detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Conversation List */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={20} className="text-brand-600" />
              </div>
              <p className="text-[12px] text-muted-foreground">لا توجد محادثات</p>
            </div>
          ) : (
            filtered.map((conv, idx) => {
              const stage = getStageConfig(conv.stage)
              const scoreColor = getScoreColor(conv.score)
              const isSelected = selected?.id === conv.id
              return (
                <ConvCard
                  key={conv.id}
                  conv={conv}
                  stage={stage}
                  scoreColor={scoreColor}
                  isSelected={isSelected}
                  onSelect={() => setSelected(conv)}
                  onDelete={onDeleteConversation}
                  delay={idx * 40}
                />
              )
            })
          )}
        </div>

        {/* Detail Panel — desktop */}
        <div className="col-span-2 hidden lg:block">
          {!selected ? (
            <div className="bg-card border border-border rounded-xl h-full min-h-[420px] flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <MessageCircle size={26} className="text-brand-600" />
              </div>
              <p className="text-[12px] text-muted-foreground font-medium">اختر محادثة لعرض تفاصيلها</p>
            </div>
          ) : (
            <DetailPanel
              selected={selected}
              messages={messages}
              messagesLoading={messagesLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Conversation Card ─────────────── */
function ConvCard({ conv, stage, scoreColor, isSelected, onSelect, onDelete, delay }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group bg-card border rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-[0.98]",
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
      {/* Top */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={conv.customer?.name} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-foreground truncate">{conv.customer?.name}</span>
              {!conv.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 animate-pulse" />
              )}
            </div>
            {!conv.isRead && (
              <span className="text-[10px] text-brand-600 font-semibold">رسالة جديدة</span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(conv.updatedAt)}</span>
      </div>

      {/* Last message */}
      <p className="text-[11px] text-muted-foreground truncate mb-2.5 pr-10">
        {conv.messages?.[0]?.content || "لا توجد رسائل"}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border", stage.className)}>
          {stage.label}
        </span>
        <div className="flex items-center gap-2">
          <ScoreBar score={conv.score} color={scoreColor} />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(conv.id, conv.customer?.name)
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="حذف المحادثة"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Detail Panel ─────────────── */
function DetailPanel({ selected, messages, messagesLoading }) {
  const scoreColor = getScoreColor(selected.score)
  const stage = getStageConfig(selected.stage)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <Avatar name={selected.customer?.name} size="md" />
          <div>
            <p className="text-[13px] font-bold text-foreground">{selected.customer?.name}</p>
            <p className="text-[11px] text-muted-foreground">{selected.customer?.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-md border", stage.className)}>
            {stage.label}
          </span>
          <ScoreBar score={selected.score} color={scoreColor} width="w-16" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0 max-h-80">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-brand-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">
            لا توجد رسائل
          </div>
        ) : (
          messages.map((msg) => (
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
            { label: "عدد الرسائل",   value: `${messages.length} رسالة` },
            { label: "وقت المحادثة",  value: timeAgo(selected.createdAt) },
            { label: "قيمة الطلب",    value: selected.totalAmount ? `${selected.totalAmount} درهم` : "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-secondary/50 border border-border rounded-lg p-2.5 text-center hover:bg-secondary transition-colors duration-150"
            >
              <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
              <p className="text-[12px] font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}