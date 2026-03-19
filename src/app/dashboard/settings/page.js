"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { conversationsAPI } from "@/lib/api"
import { getStageConfig, getScoreColor, timeAgo, getInitials } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Search, Download, MessageCircle, Filter, Sparkles, Users, CheckCircle, AlertCircle, Loader2, RefreshCw, ChevronRight } from "lucide-react"

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filter !== "all") params.stage = filter
      if (search.trim()) params.search = search
      const response = await conversationsAPI.getAll(params)
      setConversations(response.data?.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("فشل في تحميل المحادثات")
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleSelectConversation = (conv) => {
    setSelected(conv)
  }

  const handleBack = () => {
    setSelected(null)
    setMessages([])
  }

  async function fetchMessages(conversationId) {
    try {
      setMessagesLoading(true)
      setMessages([])
      const response = await conversationsAPI.getById(conversationId)
      setMessages(response.data?.messages || [])
    } catch (err) {
      console.error("Error fetching messages:", err)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    if (!selected?.id) { setMessages([]); return }
    fetchMessages(selected.id)
  }, [selected?.id])

  const filtered = useMemo(() => {
    let list = conversations
    if (search.trim())
      list = list.filter(
        (c) => c.customer?.name?.includes(search) || c.customer?.phone?.includes(search)
      )
    return list
  }, [conversations, search])

  const unreadCount = conversations.filter((c) => !c.isRead).length

  const filterButtons = [
    { key: "all",       label: "الكل",    count: conversations.length },
    { key: "PITCHING",  label: "إقناع",   count: conversations.filter((c) => c.stage === "PITCHING").length },
    { key: "OBJECTION", label: "اعتراض",  count: conversations.filter((c) => c.stage === "OBJECTION").length },
    { key: "CLOSED",    label: "مكتملة",  count: conversations.filter((c) => c.stage === "CLOSED").length },
  ]

  // ── Early returns ──
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-3 sm:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-2xl h-20 sm:h-24" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-2xl h-16 sm:h-20" />
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
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors">
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // MOBILE: Full-screen conversation view (WhatsApp style)
  // ══════════════════════════════════════════════════════════
  if (selected) {
    return (
      <>
        {/* ── Mobile full screen ── */}
        <div className="fixed inset-0 z-40 flex flex-col lg:hidden" style={{ backgroundColor: 'var(--background)' }}>

          {/* Top bar — like WhatsApp */}
          <div
            className="flex items-center gap-3 px-3 py-3 border-b border-border bg-card shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-brand-600 font-medium text-sm shrink-0"
            >
              <ChevronRight size={22} />
              <span className="text-xs text-muted-foreground font-normal">
                {unreadCount > 0 ? unreadCount : ""}
              </span>
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-brand-600 shrink-0">
              {getInitials(selected.customer?.name)}
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {selected.customer?.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selected.customer?.phone}
              </p>
            </div>

            {/* Stage badge */}
            <span className={cn(
              "text-[10px] px-2 py-1 rounded-full border font-medium shrink-0",
              getStageConfig(selected.stage).className
            )}>
              {getStageConfig(selected.stage).label}
            </span>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0" style={{ backgroundColor: 'var(--background)' }}>
            <span className="text-[10px] text-muted-foreground">نقاط الإقناع</span>
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${selected.score}%`, backgroundColor: getScoreColor(selected.score) }}
              />
            </div>
            <span className="text-[11px] font-semibold shrink-0" style={{ color: getScoreColor(selected.score) }}>
              {selected.score}%
            </span>
          </div>

          {/* Messages — scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--background)' }}>
            {messagesLoading ? (
              <div className="flex items-center justify-center flex-1 h-full">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-muted-foreground text-xs">
                لا توجد رسائل
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id || `${msg.role}-${msg.content}-${msg.createdAt}`}
                  className={cn("flex gap-2 items-end", msg.role === "USER" ? "flex-row-reverse" : "")}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    msg.role === "AGENT" ? "bg-secondary text-brand-600" : "bg-brand-600 text-white"
                  )}>
                    {msg.role === "AGENT" ? "ل" : getInitials(selected.customer?.name)}
                  </div>
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-xs max-w-[75%] shadow-sm",
                    msg.role === "AGENT"
                      ? "bg-card border border-border text-foreground rounded-br-sm"
                      : "bg-brand-600 text-white rounded-bl-sm shadow-md shadow-brand-600/20"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer stats */}
          <div
            className="grid grid-cols-3 gap-2 px-3 py-3 border-t border-border shrink-0"
            style={{ backgroundColor: 'var(--background)', paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            {[
              { label: "الرسائل", value: `${messages.length}` },
              { label: "وقت المحادثة", value: timeAgo(selected.createdAt) },
              { label: "قيمة الطلب", value: selected.totalAmount ? `${selected.totalAmount} د` : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-2 text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-xs font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Desktop: render normally below (hidden on mobile since fixed overlay covers) ── */}
        <DesktopLayout
          conversations={conversations}
          filtered={filtered}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          selected={selected}
          setSelected={setSelected}
          handleSelectConversation={handleSelectConversation}
          messages={messages}
          messagesLoading={messagesLoading}
          unreadCount={unreadCount}
          filterButtons={filterButtons}
        />
      </>
    )
  }

  // ══════════════════════════════════════════════════════════
  // Default render (no conversation selected)
  // ══════════════════════════════════════════════════════════
  return (
    <DesktopLayout
      conversations={conversations}
      filtered={filtered}
      filter={filter}
      setFilter={setFilter}
      search={search}
      setSearch={setSearch}
      selected={selected}
      setSelected={setSelected}
      handleSelectConversation={handleSelectConversation}
      messages={messages}
      messagesLoading={messagesLoading}
      unreadCount={unreadCount}
      filterButtons={filterButtons}
    />
  )
}

// ══════════════════════════════════════════════════════════
// DesktopLayout — the original layout (list + detail side by side)
// On mobile: only the list is visible (detail is hidden unless selected covers it)
// ══════════════════════════════════════════════════════════
function DesktopLayout({
  conversations, filtered, filter, setFilter, search, setSearch,
  selected, setSelected, handleSelectConversation,
  messages, messagesLoading, unreadCount, filterButtons,
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-0 pb-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
            <MessageCircle size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">المحادثات</h1>
            <p className="text-[11px] text-muted-foreground">{unreadCount} غير مقروء</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-xs hover:bg-secondary hover:border-brand-200 transition-all duration-200 shrink-0">
          <Download size={13} className="text-brand-600" />
          <span className="hidden sm:inline">تصدير</span> CSV
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { label: "محادثات اليوم", sub: "الكل",     value: conversations.length,                                              icon: Users,        badge: "الكل" },
          { label: "مبيعات ناجحة", sub: "مكتملة",   value: conversations.filter((c) => c.stage === "CLOSED").length,          icon: CheckCircle,  badge: "مكتملة" },
          { label: "قيد المتابعة", sub: "إقناع",    value: conversations.filter((c) => c.stage === "PITCHING").length,         icon: Sparkles,     badge: "إقناع" },
          { label: "يحتاج تدخل",  sub: "اعتراض",   value: conversations.filter((c) => c.stage === "OBJECTION").length,        icon: AlertCircle,  badge: "اعتراض" },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="group relative bg-card border border-border rounded-xl p-3 sm:p-4 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Icon size={15} className="text-brand-600" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-brand-600 bg-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">{s.badge}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col gap-2.5">
        {/* Scrollable filters on mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {filterButtons.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border shrink-0",
                filter === f.key
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-200"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full",
                filter === f.key ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
              )}>
                {f.count}
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

      {/* ── Conversations List + Detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* List */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={22} className="text-brand-600" />
              </div>
              <p className="text-xs text-muted-foreground">لا توجد محادثات</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const stage = getStageConfig(conv.stage)
              const scoreColor = getScoreColor(conv.score)
              const isSelected = selected?.id === conv.id
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "bg-card border rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-[0.98]",
                    isSelected
                      ? "border-brand-400 bg-card shadow-md shadow-brand-600/10"
                      : "border-border hover:border-brand-300 hover:shadow-md hover:shadow-brand-600/5"
                  )}
                >
                  {/* Top row */}
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                        {getInitials(conv.customer?.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {conv.customer?.name}
                          </span>
                          {!conv.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 animate-pulse" />
                          )}
                        </div>
                        {!conv.isRead && (
                          <span className="text-[10px] text-brand-600">رسالة جديدة</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
                      {timeAgo(conv.updatedAt)}
                    </span>
                  </div>

                  {/* Last message */}
                  <p className="text-[11px] text-muted-foreground truncate mb-2 pr-10">
                    {conv.messages?.[0]?.content || "لا توجد رسائل"}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-center">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", stage.className)}>
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${conv.score}%`, backgroundColor: scoreColor }} />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: scoreColor }}>
                        {conv.score}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Detail panel — desktop only */}
        <div className="col-span-2 hidden lg:block">
          {!selected ? (
            <div className="bg-card border border-border rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                <MessageCircle size={32} className="text-brand-600" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">اختر محادثة لعرض تفاصيلها</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
              {/* Header */}
              <div className="p-4 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-brand-600">
                    {getInitials(selected.customer?.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selected.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.customer?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-2 py-1 rounded-full border font-medium", getStageConfig(selected.stage).className)}>
                    {getStageConfig(selected.stage).label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${selected.score}%`, backgroundColor: getScoreColor(selected.score) }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: getScoreColor(selected.score) }}>
                      {selected.score}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 flex flex-col gap-3 bg-card max-h-80 overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 size={20} className="animate-spin text-brand-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
                    لا توجد رسائل
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id || `${msg.role}-${msg.content}-${msg.createdAt}`}
                      className={cn("flex gap-2 items-end", msg.role === "USER" ? "flex-row-reverse" : "")}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        msg.role === "AGENT" ? "bg-secondary text-brand-600" : "bg-brand-600 text-white"
                      )}>
                        {msg.role === "AGENT" ? "ل" : getInitials(selected.customer?.name)}
                      </div>
                      <div className={cn(
                        "rounded-xl px-3 py-2 text-xs max-w-[75%] shadow-sm",
                        msg.role === "AGENT"
                          ? "bg-card border border-border text-foreground rounded-br-sm"
                          : "bg-brand-600 text-white rounded-bl-sm shadow-md shadow-brand-600/20"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "عدد الرسائل",   value: `${messages.length} رسالة` },
                    { label: "وقت المحادثة",  value: timeAgo(selected.createdAt) },
                    { label: "قيمة الطلب",    value: selected.totalAmount ? `${selected.totalAmount} درهم` : "—" },
                  ].map((item) => (
                    <div key={item.label} className="bg-card border border-border rounded-lg p-3 text-center hover:bg-secondary transition-colors">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}