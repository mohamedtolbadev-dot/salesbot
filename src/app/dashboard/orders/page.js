"use client"

import { useState, useEffect, useCallback } from "react"
import { ordersAPI } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import {
  ClipboardList, Search, Plus, Loader2, Trash2, ChevronDown,
  Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw,
  Phone, User, Tag, DollarSign, MapPin, StickyNote, Hash, AlertTriangle, X,
  MessageCircle, Download,
} from "lucide-react"

/* ─── Status config (labels resolved via t() at render time) ─── */
const STATUS_CONFIG = {
  PENDING:   { key: "orders.pending",   color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock       },
  CONFIRMED: { key: "orders.confirmed", color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/20",     icon: CheckCircle2 },
  SHIPPED:   { key: "orders.shipped",   color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20", icon: Truck       },
  DELIVERED: { key: "orders.delivered", color: "text-green-600",  bg: "bg-green-500/10 border-green-500/20",  icon: Package     },
  CANCELLED: { key: "orders.cancelled", color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",      icon: XCircle     },
}

const STATUS_ORDER = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]

/* ─── Skeleton ──────────────────────────────────────────── */
function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-8">
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
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="sk w-9 h-9 rounded-2xl" />
          <div className="flex flex-col gap-1.5">
            <div className="sk h-5 w-24 rounded-md" />
            <div className="sk h-3 w-16 rounded-md" />
          </div>
        </div>
        <div className="sk h-9 w-28 rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[1,2,3,4,5,6].map((_, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="sk h-6 w-8 rounded-md" />
              <div className="sk w-6 h-6 rounded-lg" />
            </div>
            <div className="sk h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="sk h-10 rounded-xl" />

      {/* Orders grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1,2,3,4,5,6].map((_, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="sk w-10 h-10 rounded-xl" />
              <div className="sk h-5 w-20 rounded-lg" />
            </div>
            <div className="sk h-4 w-3/4 rounded-md" />
            <div className="flex flex-col gap-1">
              <div className="sk h-3 w-1/2 rounded-md" />
              <div className="sk h-3 w-2/3 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="sk h-4 w-16 rounded-md" />
              <div className="sk h-3 w-12 rounded-md" />
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
              <div className="sk h-7 w-16 rounded-lg" />
              <div className="sk h-7 w-7 rounded-lg" />
              <div className="sk h-7 w-7 rounded-lg ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const { t } = useLanguage()
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[13px] font-semibold border", cfg.bg, cfg.color)}>
      <Icon size={14} />
      {t(cfg.key)}
    </span>
  )
}

/* ─── Status Dropdown ─────────────────────────────────────── */
function StatusDropdown({ orderId, currentStatus, onUpdated, sendMessage }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function changeStatus(newStatus) {
    if (newStatus === currentStatus) { setOpen(false); return }
    setLoading(true)
    try {
      await ordersAPI.updateStatus(orderId, newStatus, { sendMessage })
      onUpdated(orderId, newStatus)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border px-2 py-1 rounded-lg transition-all"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        {t('orders.change')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-1 z-20 border border-border rounded-xl shadow-xl overflow-hidden w-36 bg-card">
            {STATUS_ORDER.map(s => {
              const cfg = STATUS_CONFIG[s]
              const Icon = cfg.icon
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors hover:bg-secondary",
                    s === currentStatus ? "bg-secondary/60 font-semibold" : ""
                  )}
                >
                  <Icon size={14} className={cfg.color} />
                  <span className={cfg.color}>{t(cfg.key)}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Delete Modal ────────────────────────────────────────── */
function DeleteModal({ open, name, onConfirm, onCancel, isProcessing }) {
  const { t } = useLanguage()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm border border-border rounded-2xl shadow-2xl overflow-hidden bg-card"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-red-500/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <p className="text-sm font-bold text-red-500">{t('orders.delete_title')}</p>
          </div>
          <button onClick={onCancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-foreground font-medium mb-1">
            {t('orders.delete_confirm')}
            <span className="text-brand-600 font-bold mx-1">{name}</span>?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('orders.delete_warning')}
          </p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border/60 bg-secondary/20">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={isProcessing}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {t('common.yes')}, {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Order Detail Modal ──────────────────────────────────── */
function OrderDetailModal({ order, onClose, onStatusChange, onDeleteRequest, sendMessage }) {
  const { t, language } = useLanguage()
  if (!order) return null

  const date = new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: "numeric", month: "long", year: "numeric",
  })
  const conversationLink = order.conversationId
    ? `/dashboard/conversations?id=${order.conversationId}`
    : null

  const rows = [
    { icon: Hash,       label: t('orders.order_id'),      value: order.id.slice(-8).toUpperCase() },
    { icon: User,       label: t('orders.customer_name'), value: order.customerName || "—" },
    { icon: Phone,      label: t('orders.customer_phone'),value: order.customerPhone || "—" },
    { icon: Tag,        label: t('orders.product_name'),  value: order.productName || "—" },
    { icon: Tag,        label: t('orders.qty'),           value: `${order.quantity || 1}` },
    { icon: DollarSign, label: t('orders.price'),         value: `${order.totalAmount || 0} ${t('common.currency')}` },
    { icon: MapPin,     label: t('common.address'),       value: order.address || "—" },
    { icon: Truck,      label: t('orders.tracking'),      value: order.trackingNumber || "—" },
    order.notes && { icon: StickyNote, label: t('common.notes'), value: order.notes },
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 " onClick={onClose} />
      <div className="relative w-full max-w-md border border-border rounded-2xl shadow-2xl bg-card flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t('common.details')}</p>
              <p className="text-[12px] text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2.5 px-3 rounded-xl bg-secondary border border-border">
                <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-muted-foreground">{label}</p>
                  <p className="text-[13px] font-semibold text-foreground break-words">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground text-center pt-1">{date}</p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border bg-secondary flex items-center gap-2 shrink-0">
          {conversationLink && (
            <a href={conversationLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border border-border hover:bg-brand-600/10 hover:border-brand-600/30 hover:text-brand-600 text-muted-foreground transition-all"
            >
              <MessageCircle size={14} />{t('orders.view_conv')}
            </a>
          )}
          <StatusDropdown
            orderId={order.id}
            currentStatus={order.status}
            onUpdated={(id, status) => { onStatusChange(id, status) }}
            sendMessage={sendMessage}
          />
          <button
            onClick={() => { onClose(); onDeleteRequest(order.id, order.productName) }}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border border-red-200 text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={14} />{t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Order Card ──────────────────────────────────────────── */
function OrderCard({ order, onStatusChange, onDeleteRequest, sendMessage, onOpenDetail }) {
  const { t, language } = useLanguage()

  const date = new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <div
      className="bg-card border border-border/60 rounded-2xl hover:border-brand-300 hover:shadow-md hover:shadow-brand-600/5 transition-all flex flex-col cursor-pointer"
      onClick={() => onOpenDetail(order)}
    >
      {/* Top section */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Icon + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Package size={18} className="text-white" />
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Product name */}
        <p className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2">{order.productName}</p>

        {/* Customer info */}
        <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User size={13} className="shrink-0" /> {order.customerName}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone size={13} className="shrink-0" /> {order.customerPhone}
          </span>
          {order.address && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={13} className="shrink-0" /> {order.address}
            </span>
          )}
        </div>

        {/* Amount + date */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
          <span className="text-[14px] font-bold text-brand-600">{order.totalAmount} {t('common.currency')}</span>
          <span className="text-[12px] text-muted-foreground/70">{date}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-2.5 border-t border-border/40 bg-secondary/20 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <StatusDropdown
          orderId={order.id}
          currentStatus={order.status}
          onUpdated={onStatusChange}
          sendMessage={sendMessage}
        />
        <button
          onClick={e => { e.stopPropagation(); onOpenDetail(order) }}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={t('common.details')}
        >
          <ChevronDown size={15} />
        </button>
        {order.conversationId && (
          <a
            href={`/dashboard/conversations?id=${order.conversationId}`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-brand-600/10 text-muted-foreground hover:text-brand-600 transition-colors"
            title={t('orders.view_conv')}
          >
            <MessageCircle size={15} />
          </a>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDeleteRequest(order.id, order.productName) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors ml-auto"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

/* ─── Add Order Modal ─────────────────────────────────────────── */
function AddOrderModal({ onClose, onCreated }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", productName: "",
    quantity: 1, totalAmount: "", address: "", notes: "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customerName || !form.customerPhone || !form.productName || !form.totalAmount) return
    setSaving(true)
    try {
      const res = await ordersAPI.create({ ...form, quantity: Number(form.quantity), totalAmount: Number(form.totalAmount) })
      onCreated(res.data)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-600 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg border border-border rounded-2xl shadow-2xl bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-secondary/50">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-600" />
            <p className="text-sm font-bold text-foreground">{t('orders.add_order')}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('orders.customer_name')} *</label>
              <input className={inputCls} value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('orders.customer_phone')} *</label>
              <input className={inputCls} value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('orders.product_name')} *</label>
              <input className={inputCls} value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('orders.price')} *</label>
              <input type="number" min="0" className={inputCls} value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('common.quantity')}</label>
              <input type="number" min="1" className={inputCls} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-muted-foreground">{t('common.address')}</label>
              <input className={inputCls} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-muted-foreground">{t('common.notes')}</label>
            <textarea className={cn(inputCls, "resize-none")} rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex gap-2 pt-1 border-t border-border/50">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-brand-600/20">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? t('common.saving') : t('orders.add_order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function OrdersPage() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [sendMessage, setSendMessage] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "", deleting: false })
  const [exporting, setExporting] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (search.trim()) params.search = search.trim()
      const res = await ordersAPI.getAll(params)
      console.log("[DEBUG] Frontend - Orders from API:", res.data?.map(o => ({ id: o.id.slice(-6), address: o.address })))
      setOrders(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, search])

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300)
    return () => clearTimeout(t)
  }, [fetchOrders])

  function handleStatusChange(orderId, newStatus) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  function handleDeleteRequest(id, name) {
    setDeleteModal({ open: true, id, name: name || "هذه الطلبية", deleting: false })
  }

  async function confirmDelete() {
    setDeleteModal(prev => ({ ...prev, deleting: true }))
    try {
      await ordersAPI.delete(deleteModal.id)
      setOrders(prev => prev.filter(o => o.id !== deleteModal.id))
      setDeleteModal({ open: false, id: null, name: "", deleting: false })
    } catch (err) {
      console.error(err)
      setDeleteModal(prev => ({ ...prev, deleting: false }))
    }
  }

  function cancelDelete() {
    setDeleteModal({ open: false, id: null, name: "", deleting: false })
  }

  function handleCreated(order) {
    setOrders(prev => [order, ...prev])
  }

  function handleExportCSV() {
    const confirmed = orders.filter(o => o.status === "CONFIRMED")
    if (confirmed.length === 0) return
    setExporting(true)
    try {
      const headers = [t('orders.customer_name'), t('orders.customer_phone'), t('orders.product_name'), t('common.quantity'), t('common.amount') + " COD", t('common.address'), t('common.notes'), t('common.date')]
      const rows = confirmed.map(o => [
        o.customerName || "",
        o.customerPhone || "",
        o.productName || "",
        o.quantity || 1,
        o.totalAmount || 0,
        o.address || "",
        o.notes || "",
        new Date(o.createdAt).toLocaleDateString(),
      ])
      const csvContent = [
        headers.join(","),
        ...rows.map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n")
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `orders-confirmed-${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  /* Stats */
  const stats = STATUS_ORDER.map(s => ({
    statusKey: s,
    translKey: STATUS_CONFIG[s].key,
    count: orders.filter(o => o.status === s).length,
    icon: STATUS_CONFIG[s].icon,
    color: STATUS_CONFIG[s].color,
    bg: STATUS_CONFIG[s].bg,
  }))
  const totalRevenue = orders
    .filter(o => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  if (loading && orders.length === 0) return <OrdersSkeleton />

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-600 border border-brand-600 flex items-center justify-center shrink-0">
            <ClipboardList size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">{t('orders.title')}</h1>
            <p className="text-[13px] text-muted-foreground">{orders.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting || orders.filter(o => o.status === "CONFIRMED").length === 0}
            title={`${t('common.export')} CSV (${orders.filter(o => o.status === "CONFIRMED").length} ${t('orders.confirmed')})`}
            className="flex items-center gap-1.5 border border-border px-3.5 py-2 rounded-xl text-sm font-medium text-foreground hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span className="hidden sm:inline">{t('common.export')}</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-all shadow-md shadow-brand-600/20"
          >
            <Plus size={16} /><span className="hidden sm:inline"> {t('orders.new')}</span>
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stats.map(({ statusKey, translKey, count, icon: Icon }) => (
          <button
            key={statusKey}
            onClick={() => setFilterStatus(filterStatus === statusKey ? '' : statusKey)}
            className={cn(
              "flex flex-col gap-1 p-4 rounded-xl border transition-all text-right",
              filterStatus === statusKey
                ? "bg-brand-600/10 border-brand-600/30 text-brand-800 shadow-sm"
                : "bg-card border-border/50 hover:border-brand-600/30 hover:bg-brand-600/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("text-xl font-bold", filterStatus === statusKey ? "text-brand-800" : "text-brand-600")}>{count}</span>
              <Icon size={16} className={cn("opacity-60", filterStatus === statusKey ? "text-brand-800" : "text-brand-600")} />
            </div>
            <p className="text-[12px] text-muted-foreground">{t(translKey)}</p>
          </button>
        ))}
        <div className="flex flex-col gap-1 p-4 rounded-xl border bg-card border-border/50 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-brand-600">{totalRevenue.toLocaleString()}</span>
            <DollarSign size={16} className="opacity-60 text-brand-600" />
          </div>
          <p className="text-[12px] text-muted-foreground">{t('orders.total')}</p>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('orders.search')}
            className="w-full pl-4 pr-9 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground px-4 py-2.5 bg-secondary/50 border border-border rounded-xl cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendMessage}
            onChange={e => setSendMessage(e.target.checked)}
            className="w-3.5 h-3.5 accent-brand-600"
          />
          {t('orders.send_whatsapp')}
        </label>
      </div>

      {/* ── Orders list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-brand-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border border-dashed border-border rounded-2xl">
          <ClipboardList size={32} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {filterStatus || search ? t('orders.no_match') : t('orders.no_orders')}
          </p>
          {!filterStatus && !search && (
            <button onClick={() => setShowAdd(true)}
              className="text-sm text-brand-600 font-semibold hover:text-brand-800 transition-colors">
              {t('orders.add_first')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onDeleteRequest={handleDeleteRequest}
              sendMessage={sendMessage}
              onOpenDetail={setDetailOrder}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddOrderModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={(id, status) => { handleStatusChange(id, status); setDetailOrder(prev => prev ? { ...prev, status } : prev) }}
          onDeleteRequest={handleDeleteRequest}
          sendMessage={sendMessage}
        />
      )}

      <DeleteModal
        open={deleteModal.open}
        name={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isProcessing={deleteModal.deleting}
      />
    </div>
  )
}
