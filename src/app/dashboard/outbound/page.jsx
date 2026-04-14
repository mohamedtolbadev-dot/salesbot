"use client"

import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useAgentStore } from "@/store/agentStore"
import { timeAgo } from "@/lib/helpers"
import fetchAPI, { productsAPI, servicesAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Send, Phone, User, Package, Wrench, MessageSquare,
  Loader2, Trash2, Search, Filter, TrendingUp,
  Clock, CheckCircle2, XCircle, MessageCircle,
  Rocket, Sparkles, ChevronDown, AlertCircle
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS (Same pattern as settings.jsx)
// ═══════════════════════════════════════════════════════════════

function Field({ label, hint, icon: Icon, children, delay = 0 }) {
  return (
    <div
      className="flex flex-col gap-2 animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
          {Icon && (
            <span className="p-0.5 rounded bg-brand-600/10">
              <Icon size={13} className="text-brand-600" />
            </span>
          )}
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p className="text-[12px] text-muted-foreground/60 leading-relaxed flex items-center gap-1">
          <Sparkles size={10} className="text-brand-600/40" />
          {hint}
        </p>
      )}
    </div>
  )
}

function Section({ title, children, className = "", delay = 0, rightAction = null }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-brand-600/10 hover:border-brand-600/30",
        "animate-slideUp",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <div className="relative px-5 py-4 border-b border-border/50 bg-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-600" />
            <p className="text-sm font-bold text-foreground/80 tracking-wide">{title}</p>
          </div>
          {rightAction}
        </div>
      )}
      <div className="relative p-5">{children}</div>
    </div>
  )
}

function AnimatedButton({ children, onClick, disabled, variant = "primary", className = "", loading = false }) {
  const [isPressed, setIsPressed] = useState(false)

  const variants = {
    primary: "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40",
    secondary: "bg-secondary border border-border hover:border-brand-600/30 hover:bg-secondary/80",
    danger: "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
    ghost: "hover:bg-secondary text-muted-foreground hover:text-foreground",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "relative overflow-hidden px-5 py-3 rounded-xl text-sm font-semibold",
        "transition-all duration-200 ease-out",
        "active:scale-[0.98]",
        isPressed && "scale-[0.98]",
        variants[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </span>
    </button>
  )
}

function Toggle({ on, onToggle, label, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 group">
      {(label || sub) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-sm font-semibold text-foreground">{label}</p>}
          {sub && <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
        </div>
      )}
      <button
        onClick={onToggle}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full transition-all duration-300 ease-spring",
          on
            ? "bg-brand-600 shadow-lg shadow-brand-600/30"
            : "bg-border hover:bg-border/80"
        )}
      >
        <span className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ease-spring",
          on ? "right-1 translate-x-0" : "right-6 translate-x-0"
        )}>
          {on && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={10} className="text-brand-600 fill-brand-600" />
            </span>
          )}
        </span>
      </button>
    </div>
  )
}

const inputCls = `
  w-full px-4 py-3 bg-secondary/50 border border-border/60 rounded-xl text-sm
  outline-none transition-all duration-300
  focus:border-brand-600/50 focus:bg-secondary focus:ring-4 focus:ring-brand-600/5
  hover:border-border/80
  placeholder:text-muted-foreground/40
`

const textareaCls = inputCls + " resize-none leading-relaxed min-h-[100px]"

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const configs = {
    PENDING: { color: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock, label: "Pending" },
    SENT: { color: "bg-blue-50 text-blue-600 border-blue-200", icon: Send, label: "Sent" },
    REPLIED: { color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: MessageCircle, label: "Replied" },
    CONVERTED: { color: "bg-green-50 text-green-600 border-green-200", icon: CheckCircle2, label: "Converted" },
    FAILED: { color: "bg-red-50 text-red-600 border-red-200", icon: XCircle, label: "Failed" },
  }

  const config = configs[status] || configs.PENDING
  const Icon = config.icon

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.color
    )}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// PHONE NORMALIZATION
// ═══════════════════════════════════════════════════════════════

function normalizePhone(phone) {
  if (!phone) return ""
  let normalized = phone.replace(/\D/g, "")
  if (normalized.startsWith("0")) {
    normalized = "212" + normalized.substring(1)
  }
  if (!normalized.startsWith("212") && normalized.length === 9) {
    normalized = "212" + normalized
  }
  return normalized
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function OutboundPage() {
  const { t, language } = useLanguage()
  const { agent, fetchAgent } = useAgentStore()

  // ── Form State ──
  const [phone, setPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [itemType, setItemType] = useState("product")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  // ── Data State ──
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    replied: 0,
    converted: 0,
    failed: 0,
    replyRate: 0,
    todayCount: 0,
  })

  // ── UI State ──
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState(null)

  // ── Fetch Data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch leads
      const leadsRes = await fetchAPI(`/api/outbound/leads?status=${statusFilter}&search=${searchQuery}`)

      if (leadsRes.success) {
        setLeads(leadsRes.data.leads)
        setStats(leadsRes.data.stats)
      }

      // Fetch products & services
      console.log("📦 Fetching products and services...")
      const [productsRes, servicesRes] = await Promise.all([
        productsAPI.getAll(),
        servicesAPI.getAll(),
      ])

      console.log("📦 Products response:", productsRes)
      console.log("📦 Services response:", servicesRes)

      if (productsRes.success) {
        setProducts(productsRes.data || [])
        console.log(`✅ Loaded ${productsRes.data?.length || 0} products`)
      } else {
        console.error("❌ Failed to load products:", productsRes.error)
      }
      
      if (servicesRes.success) {
        setServices(servicesRes.data || [])
        console.log(`✅ Loaded ${servicesRes.data?.length || 0} services`)
      } else {
        console.error("❌ Failed to load services:", servicesRes.error)
      }

    } catch (err) {
      console.error("❌ Error fetching data:", err)
      setError(t("common.error"))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Computed ──
  const selectedItem = itemType === "product"
    ? products.find(p => p.id === selectedItemId)
    : services.find(s => s.id === selectedItemId)

  const normalizedPhone = normalizePhone(phone)
  const phonePreview = normalizedPhone
    ? normalizedPhone.length > 4
      ? "******" + normalizedPhone.slice(-4)
      : "****"
    : ""

  // ── Preview Message ──
  const previewMessage = (() => {
    if (customMessage) {
      return customMessage
        .replace(/{name}/g, customerName || "")
        .replace(/{product}/g, selectedItem?.name || "")
        .replace(/{service}/g, selectedItem?.name || "")
        .replace(/{price}/g, selectedItem?.price || "")
    }

    // Fallback template
    const name = customerName || ""
    const itemName = selectedItem?.name || ""
    const price = selectedItem?.price || ""
    const agentName = agent?.name || "Wakil"
    const lang = agent?.language || "darija"

    if (lang === "french") {
      return `Bonjour ${name} ! 👋\n${agentName} ici.\nNous avons ${itemName} disponible${price ? ` à ${price} DH` : ""}.\nÇa vous intéresse ? Répondez-moi 😊`
    }

    if (lang === "darija") {
      return `مرحبا ${name}! 👋\nأنا ${agentName}.\nعندنا ${itemName}${price ? ` بـ ${price} درهم` : ""} 🔥\nواش تحب تعرف أكثر؟ 😊`
    }

    return `مرحباً ${name}! 👋\nأنا ${agentName}.\nلدينا ${itemName}${price ? ` بسعر ${price} درهم` : ""}.\nهل يهمك الأمر؟ 😊`
  })()

  // ── Handlers ──
  const handleSend = async () => {
    console.log("🚀 handleSend clicked", { normalizedPhone, agent })
    
    if (!normalizedPhone) {
      setError(t("outbound.error_phone_required") || "رقم الهاتف مطلوب")
      return
    }

    if (!agent?.outboundEnabled) {
      setError(t("outbound.error_not_enabled") || "ميزة Outbound غير مفعلة في الإعدادات")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const payload = {
        customerPhone: phone,
        customerName: customerName || null,
        itemId: selectedItemId || null,
        itemType,
        customMessage: customMessage || null,
      }
      console.log("📤 Sending payload:", payload)
      
      const res = await fetchAPI("/api/outbound/send", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      console.log("📥 Response:", res)

      if (res.success) {
        // Reset form
        setPhone("")
        setCustomerName("")
        setSelectedItemId("")
        setCustomMessage("")
        // Refresh leads
        fetchData()
      } else {
        setError(res.error || t("outbound.error_send_failed") || "فشل الإرسال")
      }
    } catch (err) {
      console.error("❌ Send error:", err)
      setError(t("outbound.error_send_failed") || "فشل الإرسال")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t("outbound.confirm_delete"))) return

    try {
      const res = await fetchAPI(`/api/outbound/leads/${id}`, {
        method: "DELETE",
      })

      if (res.success) {
        fetchData()
      }
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                <Send size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t("outbound.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("outbound.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-brand-600/10 text-brand-600 rounded-full text-sm font-medium">
                {stats.todayCount} {t("outbound.today")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Send Form */}
        <Section
          title={t("outbound.send_section")}
          rightAction={
            !agent?.outboundEnabled && (
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                {t("outbound.disabled_warning")}
              </span>
            )
          }
        >
          <div className="grid gap-5">
            {/* Phone & Name Row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("outbound.phone")} icon={Phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06XXXXXXXX أو 212XXXXXXXXX"
                  className={inputCls}
                />
                {normalizedPhone && (
                  <p className="text-xs text-muted-foreground">
                    {t("outbound.preview")}: {phonePreview}
                  </p>
                )}
              </Field>

              <Field label={t("outbound.customer_name")} icon={User} hint={t("outbound.name_hint")}>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("outbound.name_placeholder")}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Item Type Toggle */}
            <Field label={t("outbound.item_type")}>
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                <button
                  onClick={() => { setItemType("product"); setSelectedItemId("") }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    itemType === "product"
                      ? "bg-brand-600 text-white shadow-md"
                      : "hover:bg-secondary"
                  )}
                >
                  <Package size={16} />
                  {t("outbound.product")}
                </button>
                <button
                  onClick={() => { setItemType("service"); setSelectedItemId("") }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    itemType === "service"
                      ? "bg-brand-600 text-white shadow-md"
                      : "hover:bg-secondary"
                  )}
                >
                  <Wrench size={16} />
                  {t("outbound.service")}
                </button>
              </div>
            </Field>

            {/* Item Select */}
            <Field label={itemType === "product" ? t("outbound.select_product") : t("outbound.select_service")}>
              <div className="relative">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className={cn(inputCls, "appearance-none cursor-pointer")}
                >
                  <option value="">{t("outbound.no_item")}</option>
                  {(itemType === "product" ? products : services).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.price} DH
                      {itemType === "product" && item.stock !== undefined && ` (${item.stock} ${t("outbound.in_stock")})`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </Field>

            {/* Custom Message */}
            <Field
              label={t("outbound.custom_message")}
              hint={t("outbound.message_hint")}
              icon={MessageSquare}
            >
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t("outbound.message_placeholder")}
                className={textareaCls}
              />
            </Field>

            {/* Preview Box */}
            <div className="p-4 rounded-xl bg-green-50/50 border border-green-200/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">{t("outbound.preview_title")}</span>
                <span className="ml-auto px-2 py-0.5 bg-green-600 text-white text-[10px] rounded-full">WhatsApp</span>
              </div>
              <p className="text-sm text-green-800 whitespace-pre-line leading-relaxed">
                {previewMessage}
              </p>
            </div>

            {/* Send Button */}
            <AnimatedButton
              onClick={handleSend}
              disabled={!normalizedPhone || !agent?.outboundEnabled || isSending}
              loading={isSending}
              className="w-full sm:w-auto"
            >
              <Rocket size={18} />
              {t("outbound.send_button")}
            </AnimatedButton>
          </div>
        </Section>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("outbound.stat_total"), value: stats.total, icon: Send, color: "bg-blue-50 text-blue-600" },
            { label: t("outbound.stat_replied"), value: stats.replied, icon: MessageCircle, color: "bg-yellow-50 text-yellow-600" },
            { label: t("outbound.stat_converted"), value: stats.converted, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
            { label: t("outbound.stat_rate"), value: `${stats.replyRate}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-card border border-border hover:border-brand-600/30 transition-all"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", stat.color)}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "", label: t("outbound.filter_all") },
            { key: "SENT", label: t("outbound.filter_sent") },
            { key: "REPLIED", label: t("outbound.filter_replied") },
            { key: "CONVERTED", label: t("outbound.filter_converted") },
            { key: "FAILED", label: t("outbound.filter_failed") },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                statusFilter === filter.key
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-secondary hover:bg-secondary/80 text-foreground/70"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("outbound.search_placeholder")}
            className={cn(inputCls, "pl-11")}
          />
        </div>

        {/* Leads Table */}
        <Section title={t("outbound.leads_section")}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-600" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("outbound.empty_state")}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">{t("outbound.empty_hint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("outbound.table_customer")}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("outbound.table_item")}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("outbound.table_status")}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("outbound.table_sent")}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("outbound.table_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-600/10 flex items-center justify-center text-brand-600 font-semibold text-sm">
                            {lead.customerName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.customerName || t("outbound.unknown")}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.customerPhone.length > 4
                                ? "******" + lead.customerPhone.slice(-4)
                                : "****"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {lead.itemName ? (
                          <div>
                            <p className="text-sm font-medium">{lead.itemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.itemPrice} DH • {lead.itemType === "product" ? t("outbound.product") : t("outbound.service")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">
                          {timeAgo(lead.sentAt || lead.createdAt, t)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title={t("outbound.delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
