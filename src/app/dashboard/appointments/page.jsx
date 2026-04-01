"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { appointmentsAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  Calendar, Clock, CheckCircle, XCircle, Trash2, AlertCircle,
  RefreshCw, Loader2, Phone, FileText, Bell,
  MessageSquare, AlertTriangle, CalendarDays, CalendarCheck,
  CalendarX, CalendarClock, CalendarRange, Ban, MessageCircle, Eye, ExternalLink, X,
} from "lucide-react"

/* ════════════════════════════════════════════════
   Helpers
════════════════════════════════════════════════ */

function formatAppointmentTime(isoDate, locale = "fr-FR") {
  return new Date(isoDate).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAppointmentDate(isoDate, locale = "fr-FR") {
  return new Date(isoDate).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatShortDate(isoDate, locale = "fr-FR") {
  return new Date(isoDate).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
  })
}

// ✅ مقارنة آمنة محلياً — تتجنب مشاكل UTC/Timezone
function isSameDay(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function isToday(isoDate) {
  return isSameDay(isoDate, new Date())
}

function isThisWeek(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return d >= startOfWeek && d < endOfWeek
}

function isThisMonth(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isNow(isoDate) {
  const diff = Math.abs(new Date(isoDate) - new Date())
  return diff < 30 * 60 * 1000
}

function isPast(isoDate) {
  return new Date(isoDate) < new Date()
}

function getStatusConfig(status, t) {
  const configs = {
    PENDING:   { label: t ? t('appt.status_pending')   : "En attente", className: "bg-amber-50 text-amber-600 border-amber-200" },
    CONFIRMED: { label: t ? t('appt.status_confirmed') : "Confirmé",   className: "bg-green-50 text-green-600 border-green-200" },
    CANCELLED: { label: t ? t('appt.status_cancelled') : "Annulé",     className: "bg-red-50 text-red-500 border-red-200" },
    COMPLETED: { label: t ? t('appt.status_completed') : "Terminé",    className: "bg-blue-50 text-blue-600 border-blue-200" },
  }
  return configs[status] || configs.PENDING
}

function getInitials(name, unknown = "?") {
  return name?.charAt(0) || unknown
}

/* ════════════════════════════════════════════════
   Skeleton
════════════════════════════════════════════════ */
function AppointmentsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-6" dir="rtl">
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
        .sk-brand {
          border-radius: 6px;
          background: linear-gradient(90deg,
            rgba(83,74,183,0.30) 25%,
            rgba(83,74,183,0.52) 50%,
            rgba(83,74,183,0.30) 75%
          );
          background-size: 700px 100%;
          animation: sk-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="sk w-8 h-8 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <div className="sk h-4 w-[70px]" />
            <div className="sk h-[11px] w-[110px]" />
          </div>
        </div>
        <div className="sk h-8 w-[100px] rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[36, 48, 40, 52].map((w, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div className="sk h-[11px]" style={{ width: w }} />
              <div className="sk w-7 h-7 rounded-lg" />
            </div>
            <div className="sk h-[26px] rounded-md w-10" />
            <div className="sk-brand h-[11px] w-24" />
          </div>
        ))}
      </div>

      <div className="sk h-10 w-[180px] rounded-xl" />

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {[66, 52, 56, 68, 72].map((w, i) => (
          <div key={i} className="sk h-[30px] rounded-lg flex-shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Appointments grid - 3 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            {/* Header with avatar and status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="sk w-10 h-10 rounded-full" />
                <div>
                  <div className="sk h-[13px] w-20 mb-1" />
                  <div className="sk h-[10px] w-24" />
                </div>
              </div>
              <div className="sk h-5 w-14 rounded-md" />
            </div>
            {/* Info row */}
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <div className="sk h-3 w-12" />
              <div className="sk h-3 w-20" />
              <div className="sk h-3 w-16" />
            </div>
            {/* Buttons row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
              <div className="sk h-7 w-16 rounded-lg" />
              <div className="sk h-7 w-16 rounded-lg" />
              <div className="sk h-7 w-20 rounded-lg" />
              <div className="flex-1"></div>
              <div className="sk h-7 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Animated Number
════════════════════════════════════════════════ */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = typeof value === "number" && !isNaN(value) ? value : 0
    const duration = 800
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(tick)
      else setDisplay(target)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{display.toLocaleString("ar-MA")}</>
}

/* ════════════════════════════════════════════════
   Stat Card
════════════════════════════════════════════════ */
function StatCard({ label, value, sub, icon: Icon, accentIcon: AccentIcon, delay = 0 }) {
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
        <p className="text-[15px] font-medium text-muted-foreground flex items-center gap-1.5">
          {AccentIcon && <AccentIcon size={16} className="text-brand-600" />}
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={18} className="text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[15px] text-brand-600 flex items-center gap-1 font-semibold mt-1">
        {sub}
      </p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ════════════════════════════════════════════════
   Avatar
════════════════════════════════════════════════ */
function Avatar({ name, size = "sm" }) {
  const dims = size === "md" ? "w-10 h-10 text-sm"
             : size === "lg" ? "w-12 h-12 text-base"
             : "w-10 h-10 text-sm"
  return (
    <div className="relative shrink-0">
      <div className="absolute -inset-[2px] rounded-full bg-brand-600" />
      <div className={`${dims} rounded-full bg-brand-600 flex items-center justify-center font-bold text-white relative`}>
        {getInitials(name)}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Status Badge
════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const { t } = useLanguage()
  const config = getStatusConfig(status, t)
  return (
    <span className={cn("text-[14px] font-semibold px-2 py-0.5 rounded-md border", config.className)}>
      {config.label}
    </span>
  )
}

/* ════════════════════════════════════════════════
   Appointment Card
════════════════════════════════════════════════ */
function AppointmentCard({ appointment, onUpdateStatus, onDelete, isProcessing, onSendMessage, onShowDetails, onGoToConversation }) {
  const { t, locale } = useLanguage()
  const now  = isNow(appointment.date)
  const past = isPast(appointment.date) && appointment.status === "PENDING"

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 sm:p-5 transition-all duration-200",
        now ? "border-brand-400 shadow-md shadow-brand-600/10" : "border-border hover:border-brand-300 hover:shadow-md",
        past && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={appointment.customerName} />
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-foreground truncate">{appointment.customerName}</p>
            <p className="text-[14px] text-muted-foreground flex items-center gap-1">
              <Phone size={14} />
              {appointment.customerPhone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {now && (
            <span className="text-[14px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('appt.now')}
            </span>
          )}
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[15px] text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock size={15} className="text-brand-600" />
          {formatAppointmentTime(appointment.date, locale)}
        </span>
        <span className="flex items-center gap-1">
          <FileText size={15} className="text-brand-600" />
          {appointment.serviceName}
        </span>
        <button
          onClick={() => onShowDetails(appointment)}
          className="flex items-center gap-1 text-brand-600 hover:text-brand-800 transition-colors"
          title={t('appt.details_title_btn')}
        >
          <Eye size={15} />
          {t('appt.details')}
        </button>
        {appointment.conversationId && (
          <button
            onClick={() => onGoToConversation(appointment.conversationId)}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
            title={t('appt.conversation_title')}
          >
            <MessageCircle size={15} />
            {t('appt.conversation')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          {appointment.status === "PENDING" && (
            <>
              <button
                onClick={() => onUpdateStatus(appointment.id, "CONFIRMED")}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-[14px] font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {t('appt.confirm')}
              </button>
              <button
                onClick={() => onUpdateStatus(appointment.id, "CANCELLED")}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-[14px] font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                {t('appt.cancel_action')}
              </button>
            </>
          )}
          {appointment.status === "CONFIRMED" && (isPast(appointment.date) || isNow(appointment.date)) && (
            <button
              onClick={() => onUpdateStatus(appointment.id, "COMPLETED")}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {t('appt.complete')}
            </button>
          )}
          {!appointment.confirmationSent && appointment.status === "PENDING" && (
            <button
              onClick={() => onSendMessage(appointment.id, "confirm")}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-2 bg-brand-600 text-white text-[14px] font-semibold rounded-lg hover:bg-brand-800 active:scale-95 transition-all disabled:opacity-50"
              title={t('appt.confirm_wa')}
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
              {t('appt.confirm_wa')}
            </button>
          )}
          {!appointment.reminderSent && !isPast(appointment.date) && (
            <button
              onClick={() => onSendMessage(appointment.id, "reminder")}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white text-[14px] font-semibold rounded-lg hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
              title={t('appt.reminder_wa')}
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              {t('appt.reminder_wa')}
            </button>
          )}
          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && !appointment.cancellationSent && (
            <button
              onClick={() => onSendMessage(appointment.id, "cancel")}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white text-[14px] font-semibold rounded-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
              title={t('appt.cancel_wa')}
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
              {t('appt.cancel_wa')}
            </button>
          )}
        </div>
        <div className="flex-1"></div>
        <button
          onClick={() => onDelete(appointment.id, appointment.customerName)}
          disabled={isProcessing}
          className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 text-[14px] font-semibold rounded-lg hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Week Day Column
════════════════════════════════════════════════ */
function WeekDayColumn({ date, appointments, onUpdateStatus, onDelete, isProcessing, onSendMessage, onShowDetails, onGoToConversation }) {
  const { t, locale } = useLanguage()
  // ✅ مقارنة آمنة بدل toDateString()
  const dayApps = appointments.filter(a => isSameDay(a.date, date))
  const isTodayCol = isToday(date)

  return (
    <div className={cn(
      "bg-card border rounded-xl overflow-hidden",
      isTodayCol ? "border-brand-400" : "border-border"
    )}>
      <div className={cn(
        "px-3 py-2 text-center border-b",
        isTodayCol ? "bg-brand-600 text-white border-brand-600" : "bg-secondary/40 border-border"
      )}>
        <p className="text-[14px] font-semibold">{formatShortDate(date, locale)}</p>
        <p className="text-[13px] opacity-80">{dayApps.length} {t('appt.count')}</p>
      </div>
      <div className="p-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
        {dayApps.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-4">{t('appt.no_appointments')}</p>
        ) : (
          dayApps.map(app => (
            <div
              key={app.id}
              className={cn(
                "p-2 rounded-lg border text-[14px] cursor-pointer transition-all hover:shadow-sm",
                app.status === "PENDING"   && "bg-amber-50 border-amber-200",
                app.status === "CONFIRMED" && "bg-green-50 border-green-200",
                app.status === "CANCELLED" && "bg-red-50 border-red-200",
                app.status === "COMPLETED" && "bg-blue-50 border-blue-200",
              )}
            >
              <p className="font-semibold text-foreground">{formatAppointmentTime(app.date)}</p>
              <p className="text-muted-foreground truncate">{app.customerName}</p>
              <p className="text-[13px] text-brand-600">{app.serviceName}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Delete Modal
════════════════════════════════════════════════ */
function DeleteModal({ open, name, onConfirm, onCancel, isProcessing }) {
  const { t } = useLanguage()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm border border-border rounded-2xl shadow-2xl overflow-hidden bg-card"
        style={{ animation: "slideUp 0.3s ease-out forwards" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-red-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="text-sm font-bold text-red-500">{t('appt.delete_title')}</p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <XCircle size={18} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-foreground font-medium mb-1">
            {t('appt.delete_question')}
            <span className="text-brand-600 font-bold mx-1">{name}</span>?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('appt.delete_warning')}
          </p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border/60 bg-secondary/20">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all">
            {t('appt.cancel_action')}
          </button>
          <button onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {t('appt.delete_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Appointment Details Modal
════════════════════════════════════════════════ */
function AppointmentDetailsModal({ open, appointment, onClose, onUpdateStatus, isProcessing }) {
  const { t, locale } = useLanguage()
  const [selectedStatus, setSelectedStatus] = useState(appointment?.status || "PENDING")
  
  useEffect(() => {
    if (appointment) {
      setSelectedStatus(appointment.status)
    }
  }, [appointment])

  if (!open || !appointment) return null

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    const oldStatus = selectedStatus
    setSelectedStatus(newStatus)
    
    try {
      await onUpdateStatus(appointment.id, newStatus)
    } catch (err) {
      // استرجاع الحالة القديمة عند الفشل
      setSelectedStatus(oldStatus)
    }
  }

  const statusOptions = [
    { value: "PENDING", },
    { value: "CONFIRMED", },
    { value: "CANCELLED", },
    { value: "COMPLETED",  },
  ].map(opt => {
    const config = getStatusConfig(opt.value, t)
    return {
      value: opt.value,
      label: `${config.label}`,
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md border border-border rounded-2xl shadow-2xl overflow-hidden bg-card"
        style={{ animation: "slideUp 0.3s ease-out forwards" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-brand-600/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <CalendarCheck size={18} className="text-brand-600" />
            </div>
            <p className="text-sm font-bold text-brand-600">{t('appt.details_modal_title')}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="px-5 py-4 space-y-4">
          {/* العميل */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600/10 flex items-center justify-center text-brand-600 font-bold">
              {getInitials(appointment.customerName, t('appt.unknown'))}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">{appointment.customerName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone size={13} />
                {appointment.customerPhone}
              </p>
            </div>
          </div>

          {/* الخدمة والتاريخ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-1">{t('appt.service_label')}</p>
              <p className="text-[15px] font-semibold text-foreground">{appointment.serviceName || "—"}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-1">{t('appt.date_label')}</p>
              <p className="text-[15px] font-semibold text-foreground">{formatAppointmentDate(appointment.date, locale)}</p>
            </div>
          </div>

          {/* الوقت والحالة */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-1">{t('appt.time_label')}</p>
              <p className="text-[15px] font-semibold text-foreground">{formatAppointmentTime(appointment.date, locale)}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-1">{t('appt.status_label')}</p>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  disabled={isProcessing}
                  className="w-full text-[15px] font-semibold bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-brand-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className={opt.color}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {isProcessing && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-brand-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* معرف المحادثة */}
          {appointment.conversationId && (
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-2">{t('appt.conv_id')}</p>
              <p className="text-sm font-mono text-foreground bg-background rounded-lg p-2 break-all">
                {appointment.conversationId}
              </p>
            </div>
          )}

          {/* الملاحظات */}
          {appointment.notes && (
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[12px] text-muted-foreground mb-1">{t('appt.notes')}</p>
              <p className="text-[15px] text-foreground">{appointment.notes}</p>
            </div>
          )}

          {/* معلومات إضافية */}
          <div className="text-[12px] text-muted-foreground border-t border-border/50 pt-3">
            <p>{t('appt.created_at')} {new Date(appointment.createdAt).toLocaleDateString(locale)}</p>
            {appointment.updatedAt !== appointment.createdAt && (
              <p>{t('appt.updated_at')} {new Date(appointment.updatedAt).toLocaleDateString(locale)}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 px-5 py-4 border-t border-border/60 bg-secondary/20">
          {appointment.conversationId && (
            <a 
              href={`/dashboard/conversations?id=${appointment.conversationId}`}
              target="_blank"
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={14} />
              {t('appt.open_conv')}
            </a>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all">
            {t('appt.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  const { t, locale, dir } = useLanguage()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [view, setView]                 = useState("today")
  const [statusFilter, setStatusFilter] = useState("all")
  const [processingId, setProcessingId] = useState(null)
  const [deleteModal, setDeleteModal]   = useState({ open: false, id: null, name: "" })
  const [detailsModal, setDetailsModal] = useState({ open: false, appointment: null })
  const [toast, setToast] = useState(null)

  function showToast(message, type = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  // ✅ دالة مساعدة لتنسيق التاريخ المحلي بدون UTC offset
  const toLocalDateStr = (d) => {
    const y   = d.getFullYear()
    const m   = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const fetchAppointments = useCallback(async () => {
    try {
      // فقط نظهر Skeleton في التحميل الأولي
      if (appointments.length === 0) {
        setLoading(true)
      }
      setError(null)
      
      const params = {}

      const today = new Date()

      if (view === "today") {
        const todayStr = toLocalDateStr(today)
        params.from = todayStr
        params.to   = todayStr
      } else {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        params.from = toLocalDateStr(startOfWeek)
        params.to   = toLocalDateStr(endOfWeek)
      }

      const response = await appointmentsAPI.getAll(params)
      setAppointments(response.data || [])
    } catch (err) {
      setError(t('appt.load_fail'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [view])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const handleUpdateStatus = useCallback(async (id, status) => {
    try {
      setProcessingId(id)
      // ✅ استخدام updateStatusWithMessage لإرسال رسالة AI تلقائية
      const result = await appointmentsAPI.updateStatusWithMessage(id, status, true)
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      
      // إظهار toast بنجاح مع معلومات الرسالة المرسلة
      const statusLabels = {
        CONFIRMED: t('appt.toast_confirmed'),
        CANCELLED: t('appt.toast_cancelled'),
        COMPLETED: t('appt.toast_completed'),
        PENDING:   t('appt.toast_pending'),
      }
      
      if (result.messageSent) {
        showToast(`✅ ${statusLabels[status]} ${t('appt.toast_wa_notified')}`, "success")
      } else {
        showToast(`✅ ${statusLabels[status]}`, "success")
      }
    } catch (err) {
      console.error(err)
      showToast(t('appt.update_fail'), "error")
    } finally {
      setProcessingId(null)
    }
  }, [])

  const handleShowDetails = useCallback((appointment) => {
    setDetailsModal({ open: true, appointment })
  }, [])

  const handleCloseDetails = useCallback(() => {
    setDetailsModal({ open: false, appointment: null })
  }, [])

  const handleGoToConversation = useCallback((conversationId) => {
    window.open(`/dashboard/conversations?id=${conversationId}`, '_blank')
  }, [])

  const handleSendMessage = useCallback(async (appointmentId, type) => {
    try {
      setProcessingId(appointmentId)
      await appointmentsAPI.sendMessage(appointmentId, type)
      // تحديث الموعد في القائمة
      setAppointments(prev => prev.map(a => {
        if (a.id === appointmentId) {
          return {
            ...a,
            confirmationSent: type === "confirm" ? true : a.confirmationSent,
            reminderSent: type === "reminder" ? true : a.reminderSent,
            cancellationSent: type === "cancel" ? true : a.cancellationSent,
            status: type === "confirm" ? "CONFIRMED" : type === "cancel" ? "CANCELLED" : a.status,
          }
        }
        return a
      }))
      // إظهار رسالة نجاح بألوان مختلفة حسب نوع الرسالة
      const toastConfig = {
        confirm:  { message: `✅ ${t('appt.toast_confirm_sent')}`,  type: "success" },
        reminder: { message: `🔔 ${t('appt.toast_reminder_sent')}`, type: "info" },
        cancel:   { message: `❌ ${t('appt.toast_cancel_sent')}`,   type: "warning" },
      }
      const config = toastConfig[type] || toastConfig.confirm
      showToast(config.message, config.type)
    } catch (err) {
      console.error(err)
      showToast(`❌ ${t('appt.send_fail')}: ${err.message || t('appt.unknown_error')}`, "error")
    } finally {
      setProcessingId(null)
    }
  }, [])

  const handleDelete = useCallback((id, name) => {
    setDeleteModal({ open: true, id, name })
  }, [])

  const confirmDelete = useCallback(async () => {
    const { id } = deleteModal
    if (!id) return
    try {
      setProcessingId(id)
      await appointmentsAPI.delete(id)
      setAppointments(prev => prev.filter(a => a.id !== id))
      setDeleteModal({ open: false, id: null, name: "" })
    } catch (err) {
      console.error(err)
      showToast(t('appt.delete_fail'), "error")
    } finally {
      setProcessingId(null)
    }
  }, [deleteModal])

  const cancelDelete = useCallback(() => {
    setDeleteModal({ open: false, id: null, name: "" })
  }, [])

  const stats = useMemo(() => ({
    today:     appointments.filter(a => isToday(a.date)).length,
    confirmed: appointments.filter(a => a.status === "CONFIRMED" && isThisWeek(a.date)).length,
    pending:   appointments.filter(a => a.status === "PENDING"   && isThisWeek(a.date)).length,
    cancelled: appointments.filter(a => a.status === "CANCELLED" && isThisWeek(a.date)).length,
  }), [appointments])

  const weekDates = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }, [])

  const filteredAppointments = useMemo(() => {
    let list = [...appointments]

    if (view === "today") {
      list = list.filter(a => isToday(a.date))
    }

    if (statusFilter !== "all") {
      list = list.filter(a => a.status === statusFilter)
    }

    return list.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [appointments, view, statusFilter])

  const statusButtons = [
    { key: "all",       label: t('appt.filter_all'),           icon: CalendarRange, count: appointments.length },
    { key: "CONFIRMED", label: t('appt.status_confirmed'),     icon: CalendarCheck, count: appointments.filter(a => a.status === "CONFIRMED").length },
    { key: "PENDING",   label: t('appt.status_pending'),       icon: CalendarClock, count: appointments.filter(a => a.status === "PENDING").length },
    { key: "CANCELLED", label: t('appt.status_cancelled'),     icon: CalendarX,     count: appointments.filter(a => a.status === "CANCELLED").length },
    { key: "COMPLETED", label: t('appt.status_completed'),     icon: CalendarDays,  count: appointments.filter(a => a.status === "COMPLETED").length },
  ]

  const monthCount = appointments.filter(a => isThisMonth(a.date)).length

  if (loading && appointments.length === 0) return <AppointmentsSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" dir={dir}>
        <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
          <AlertCircle size={20} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-foreground">{t('appt.load_error')}</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <button onClick={fetchAppointments}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
          <RefreshCw size={15} /> {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-6" dir={dir}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Calendar size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('appt.title')}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5 hidden sm:block">{monthCount} {t('appt.month_count')}</p>
          </div>
        </div>
        
        {/* Mobile: Menu Button | Desktop: Info Badge */}
        <div className="flex items-center gap-2">
          {/* Menu Button - Mobile Only */}
          <button
            onClick={() => {
              // Dispatch custom event to open sidebar drawer
              window.dispatchEvent(new CustomEvent('open-mobile-nav'))
            }}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold active:scale-95 transition-all"
            aria-label={t('appt.open_menu')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="hidden sm:inline">{t('appt.menu')}</span>
          </button>
          
          {/* Info Badge - Desktop & Tablet */}
          <div className="hidden sm:flex items-center gap-1.5 bg-secondary border border-border px-3 py-1.5 rounded-lg">
            <MessageSquare size={14} className="text-brand-600" />
            <span className="text-[13px] text-muted-foreground">
              {t('appt.from_whatsapp')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('appt.stat_today')}     value={stats.today}     sub={t('appt.count')}     icon={Calendar}    accentIcon={CalendarDays}  delay={0}   />
        <StatCard label={t('appt.stat_confirmed')}  value={stats.confirmed} sub={t('appt.this_week')} icon={CheckCircle} accentIcon={CalendarCheck} delay={80}  />
        <StatCard label={t('appt.stat_pending')}    value={stats.pending}   sub={t('appt.this_week')} icon={Clock}       accentIcon={CalendarClock} delay={160} />
        <StatCard label={t('appt.stat_cancelled')}  value={stats.cancelled} sub={t('appt.this_week')} icon={XCircle}     accentIcon={CalendarX}     delay={240} />
      </div>

      {/* ── View Tabs ── */}
      <div className="flex gap-1 p-1 bg-secondary/50 border border-border rounded-2xl w-fit">
        {[
          { key: "today", label: t('appt.view_today'), icon: CalendarDays  },
          { key: "week",  label: t('appt.view_week'),  icon: CalendarRange },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
              view === tab.key
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={15} className={view === tab.key ? "text-brand-600" : "text-muted-foreground"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Status Filters ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {statusButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setStatusFilter(btn.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold border shrink-0 transition-all duration-200",
              statusFilter === btn.key
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-brand-300"
            )}
          >
            <btn.icon size={14} className={statusFilter === btn.key ? "text-white" : "text-muted-foreground"} />
            {btn.label}
            <span className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums",
              statusFilter === btn.key ? "bg-white/20 text-white" : "bg-border/80 text-muted-foreground"
            )}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Timeline View ── */}
      {view === "today" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full bg-card border border-border rounded-xl p-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-brand-600" />
              </div>
              <p className="text-[14px] text-muted-foreground">
                {statusFilter !== "all"
                  ? `${t('appt.no_status')} "${getStatusConfig(statusFilter, t).label}"`
                  : t('appt.no_today')
                }
              </p>
            </div>
          ) : (
            filteredAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onSendMessage={handleSendMessage}
                onShowDetails={handleShowDetails}
                onGoToConversation={handleGoToConversation}
                isProcessing={processingId === appointment.id}
              />
            ))
          )}
        </div>
      )}

      {/* ── Week Grid View ── */}
      {view === "week" && (
        <>
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-7 gap-2">
            {weekDates.map(date => (
              <WeekDayColumn
                key={date.toISOString()}
                date={date}
                appointments={appointments}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onSendMessage={handleSendMessage}
                onShowDetails={handleShowDetails}
                onGoToConversation={handleGoToConversation}
                isProcessing={processingId}
              />
            ))}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-4">
            {weekDates.map(date => {
              // ✅ مقارنة آمنة بدل toDateString()
              const dayApps = appointments.filter(a => isSameDay(a.date, date))
              if (dayApps.length === 0 && statusFilter !== "all") return null
              return (
                <div key={date.toISOString()} className="flex flex-col gap-2">
                  <h3 className={cn(
                    "text-[14px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1.5 w-fit",
                    isToday(date) ? "bg-brand-600 text-white" : "bg-secondary text-foreground"
                  )}>
                    <CalendarDays size={14} />
                    {formatAppointmentDate(date, locale)}
                  </h3>
                  {dayApps.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground px-2">{t('appt.no_appointments')}</p>
                  ) : (
                    dayApps
                      .filter(a => statusFilter === "all" || a.status === statusFilter)
                      .map(app => (
                        <AppointmentCard
                          key={app.id}
                          appointment={app}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDelete}
                          onSendMessage={handleSendMessage}
                          onShowDetails={handleShowDetails}
                          onGoToConversation={handleGoToConversation}
                          isProcessing={processingId === app.id}
                        />
                      ))
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={deleteModal.open}
        name={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isProcessing={processingId === deleteModal.id}
      />

      {/* ── Appointment Details Modal ── */}
      <AppointmentDetailsModal
        open={detailsModal.open}
        appointment={detailsModal.appointment}
        onClose={handleCloseDetails}
        onUpdateStatus={handleUpdateStatus}
        isProcessing={processingId === detailsModal.appointment?.id}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2.5 px-5 py-3 rounded-2xl",
          "text-sm font-medium shadow-xl border",
          "animate-slideUp whitespace-nowrap",
          toast.type === "success" &&
            "bg-brand-600 text-white border-brand-400",
          toast.type === "error" &&
            "bg-red-600 text-white border-red-500",
          toast.type === "info" &&
            "bg-amber-500 text-white border-amber-400",
          toast.type === "warning" &&
            "bg-red-500 text-white border-red-400",
        )}>
          {toast.type === "success" && "✅"}
          {toast.type === "error"   && "❌"}
          {toast.type === "info"    && "🔔"}
          {toast.type === "warning" && "⚠️"}
          {toast.message}
        </div>
      )}

    </div>
  )
}