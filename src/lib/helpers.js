// تنسيق المبلغ بالدرهم المغربي
export function formatAmount(amount, locale = "ar-MA") {
  if (amount === undefined || amount === null) return locale === "fr-FR" ? "0 DH" : "0 درهم"
  const currency = locale === "fr-FR" ? " DH" : " درهم"
  return amount.toLocaleString(locale) + currency
}

// وقت نسبي بالعربية
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2) return "الآن"
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${days} يوم`
}

// لون وتسمية مرحلة المحادثة
export function getStageConfig(stage) {
  const configs = {
    GREETING: { label: "ترحيب", className: "bg-secondary text-muted-foreground border-border" },
    DISCOVERY: { label: "استكشاف", className: "bg-blue-100 text-blue-800 border-blue-200" },
    PITCHING: { label: "إقناع", className: "bg-brand-50 text-brand-800 border-brand-200" },
    OBJECTION: { label: "اعتراض", className: "bg-red-100 text-red-800 border-red-200" },
    CLOSED: { label: "مكتملة", className: "bg-green-100 text-green-800 border-green-200" },
    ABANDONED: { label: "مهجورة", className: "bg-gray-100 text-gray-500 border-gray-200" },
  }
  return configs[stage] || configs.GREETING
}

// ✅ دالة تعيد label حسب stage + type
export function getStageLabel(stage, type = "product") {
  if (stage === "CLOSED") {
    return type === "service"
      ? "تم الحجز 📅"
      : "تم الطلب ✅"
  }
  return getStageConfig(stage).label
}

// ✅ دالة تعيد className حسب stage + type
export function getStageClassName(stage, type = "product") {
  if (stage === "CLOSED") {
    return type === "service"
      ? "bg-brand-50 text-brand-700 border-brand-200"
      : "bg-brand-50 text-brand-700 border-brand-200"
  }
  return getStageConfig(stage).className
}

// لون score حسب النسبة
export function getScoreColor(score) {
  if (score >= 70) return "#534AB7"
  if (score >= 40) return "#BA7517"
  return "#E24B4A"
}

// لون وتسمية تصنيف الزبون
export function getCustomerTagConfig(tag) {
  const configs = {
    VIP: { label: "VIP", className: "bg-teal-100 text-teal-800 border-teal-200" },
    NEW: { label: "جديد", className: "bg-brand-50 text-brand-800 border-brand-200" },
    REGULAR: { label: "عادي", className: "bg-green-100 text-green-800 border-green-200" },
    PROSPECT: { label: "محتمل", className: "bg-amber-100 text-amber-800 border-amber-200" },
  }
  return configs[tag] || configs.REGULAR
}

// توليد الحرف الأول من الاسم
export function getInitials(name) {
  if (!name || typeof name !== 'string') return "؟"
  return name.charAt(0).toUpperCase()
}
