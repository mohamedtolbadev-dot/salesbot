// منطق AI Agent — يحلل ويرد على الرسائل

import { prisma } from "@/lib/prisma"

// دالة تطبيع رقم الهاتف (منع التكرار)
export function normalizePhone(phone) {
  if (!phone) return null
  
  let normalized = phone.replace(/\D/g, "")
  
  // ✅ [FIX] دعم الأرقام الدولية (فرنسا، أمريكا/كندا)
  if (normalized.startsWith("33") && normalized.length === 11) {
    // Phone normalized (FR)
    return normalized
  }
  if (normalized.startsWith("1") && normalized.length === 11) {
    // Phone normalized (US/CA)
    return normalized
  }
  
  if (normalized.startsWith("0")) {
    normalized = "212" + normalized.substring(1)
  }
  
  if (!normalized.startsWith("212") && normalized.length === 9) {
    normalized = "212" + normalized
  }
  
  return normalized
}

function getAppointmentFallbackMessage(status, { customerName, date, time, serviceName }, agentLanguage) {
  const name = customerName || ""
  const lang = agentLanguage === "french" ? "french"
             : agentLanguage === "darija"  ? "darija"
             : "arabic"

  const messages = {
    french: {
      CONFIRMED: `Bonjour ${name} ! ✅\nVotre rendez-vous a été confirmé.\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}\nÀ bientôt ! 😊`,
      CANCELLED: `Bonjour ${name},\nNous sommes désolés, votre rendez-vous a été annulé. ❌\n📅 ${date} - ${serviceName}\nContactez-nous pour plus d'informations. 🙏`,
      COMPLETED: `Merci ${name} ! 🎉\nVotre rendez-vous s'est bien passé. ✅\nNous espérons vous revoir bientôt ! 😊`,
      PENDING:   `Bonjour ${name} ! ⏳\nVotre rendez-vous est en attente de confirmation.\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}`,
    },
    arabic: {
      CONFIRMED: `مرحبا ${name}! ✅\nتم تأكيد موعدك\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}\nننتظرك! 😊`,
      CANCELLED: `مرحبا ${name}،\nنأسف لإبلاغك بإلغاء الموعد ❌\n📅 ${date} - ${serviceName}\nللاستفسار تواصل معنا. 🙏`,
      COMPLETED: `شكراً لك ${name}! 🎉\nتم إتمام موعدك بنجاح ✅\nنرحب بك دائماً 😊`,
      PENDING:   `مرحبا ${name}! ⏳\nموعدك في الانتظار\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}`,
    },
    darija: {
      CONFIRMED: `مرحبا ${name}! ✅\nتأكد الموعد ديالك\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}\nكنتسناوك! 😊`,
      CANCELLED: `مرحبا ${name},\nعذراً، تلغى الموعد ديالك ❌\n📅 ${date} - ${serviceName}\nتواصل معانا للمعلومات. 🙏`,
      COMPLETED: `شكراً ${name}! 🎉\nكمل الموعد ديالك بنجاح ✅\nنرحبو بيك دايماً 😊`,
      PENDING:   `مرحبا ${name}! ⏳\nالموعد ديالك في الانتظار\n📅 ${date}\n⏰ ${time}\n⌛ ${serviceName}`,
    },
  }

  return messages[lang][status] || messages["french"][status]
}

/**
 * Render template with variable substitution
 * Supports: {name}, {{name}}, {service}, {{service}}, {date}, {{date}}, {time}, {{time}}, {status}, {{status}}
 * Also supports: {product}, {{product}}, {amount}, {{amount}}, {tracking}, {{tracking}}, {trackingUrl}, {{trackingUrl}}
 * Falls back to empty string if template is null/undefined or empty after trim
 */
export function renderTemplate(template, vars) {
  // ✅ Hardened: check for null/undefined/empty after trim
  if (!template || typeof template !== 'string' || !template.trim()) return null

  let result = template
  const mappings = {
    // Support both {var} and {{var}} formats for backward compatibility
    '\\{\\{name\\}\\}': vars.customerName || vars.name || '',
    '\\{name\\}': vars.customerName || vars.name || '',
    '\\{\\{service\\}\\}': vars.serviceName || vars.service || '',
    '\\{service\\}': vars.serviceName || vars.service || '',
    '\\{\\{product\\}\\}': vars.productName || vars.product || '',
    '\\{product\\}': vars.productName || vars.product || '',
    '\\{\\{date\\}\\}': vars.date || '',
    '\\{date\\}': vars.date || '',
    '\\{\\{time\\}\\}': vars.time || '',
    '\\{time\\}': vars.time || '',
    '\\{\\{status\\}\\}': vars.status || '',
    '\\{status\\}': vars.status || '',
    '\\{\\{amount\\}\\}': String(vars.totalAmount || vars.amount || ''),
    '\\{amount\\}': String(vars.totalAmount || vars.amount || ''),
    '\\{\\{tracking\\}\\}': vars.trackingNumber || vars.tracking || '',
    '\\{tracking\\}': vars.trackingNumber || vars.tracking || '',
    '\\{\\{trackingUrl\\}\\}': vars.trackingUrl || '',
    '\\{trackingUrl\\}': vars.trackingUrl || '',
  }

  for (const [pattern, value] of Object.entries(mappings)) {
    result = result.replace(new RegExp(pattern, 'g'), value)
  }

  return result.trim()
}

// دالة توليد رسالة تحديث حالة الموعد
export async function generateStatusUpdateMessage({
  agent,
  appointment,
  newStatus,
  customerName,
}) {
  try {
    const statusLabels = {
      PENDING:   { label: "في الانتظار", emoji: "" },
      CONFIRMED: { label: "مؤكد ", emoji: "" },
      CANCELLED: { label: "ملغي ", emoji: "" },
      COMPLETED: { label: "مكتمل ", emoji: "" },
    }

    const statusInfo = statusLabels[newStatus] || statusLabels.PENDING
    const date = new Date(appointment.date).toLocaleDateString("ar-MA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    const time = new Date(appointment.date).toLocaleTimeString("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // [NEW] Try custom template first (from agent settings)
    const templateMap = {
      CONFIRMED: agent?.appointmentConfirmMessage,
      CANCELLED: agent?.appointmentCancellationMessage,
      COMPLETED: agent?.appointmentConfirmMessage, // reuse confirm for completion
      PENDING:   agent?.appointmentConfirmMessage, // reuse for pending
    }

    const customTemplate = templateMap[newStatus]
    if (customTemplate) {
      const renderedMessage = renderTemplate(customTemplate, {
        name: customerName,
        customerName,
        service: appointment.serviceName,
        serviceName: appointment.serviceName,
        date,
        time,
        status: statusInfo.label,
      })

      if (renderedMessage && renderedMessage.length > 5) {
        console.log(` [StatusUpdate] Using custom template for ${newStatus}`)
        return { message: renderedMessage, usedTemplate: true }
      }
    }

    const systemPrompt = `أنت ${agent?.name || "مساعد"}، مساعد ذكي للمتجر.

معلومات الموعد:
- الخدمة: ${appointment.serviceName}
- التاريخ: ${date}
- الوقت: ${time}
- الحالة الجديدة: ${statusInfo.label}

أسلوبك: ${
  agent?.style === "friendly" ? "ودود وحنون" :
  agent?.style === "formal"   ? "رسمي ومحترف" :
                               "مقنع وحازم"
}

لغة التواصل: ${
  agent?.language === "darija" ? "الدارجة المغربية" :
  agent?.language === "french" ? "الفرنسية" :
                                "العربية الفصحى"
}

تعليمات:
- اكتب رسالة قصيرة ومفيدة للزبون ${customerName || ""}
- أخبره بحالة موعده الجديدة
- لا تذكر أنك AI
- لا تستخدم أكثر من 3-4 أسطر
- ابدأ بتحية ودية

مثال على الرد عند التأكيد:
"مرحبا [الاسم]! 👋
تم تأكيد موعدك ✅
📅 ${date}
⏰ ${time}
⌛ ${appointment.serviceName}
ننتظرك! 😊"

مثال على الرد عند الإلغاء:
"مرحبا [الاسم]،
نأسف لإبلاغك بإلغاء الموعد ❌
📅 ${date} - ${appointment.serviceName}
للاستفسار تواصل معنا.
شكراً لتفهمك 🙏"

مثال على الرد عند الإتمام:
"شكراً لك ${customerName || "عزيزي"}! 🎉
تم إتمام موعدك بنجاح ✅
نرجو أن تكون تجربتك ممتازة.
نرحب بك دائماً 😊"

اكتب رسالة مناسبة للحالة: ${statusInfo.label}`

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wakil.ma.ma",
          "X-Title": "Wakil.ma",
        },
        body: JSON.stringify({
          // ✅ FIX: استخدام GPT-4o Mini عبر OpenRouter
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `اكتب رسالة إشعار للزبون بحالة موعده الجديدة: ${statusInfo.label}` },
          ],
          // ✅ FIX: زيادة max_tokens لتجنب الردود الناقصة
          max_tokens: 400,
          temperature: 0.7,
        }),
      }
    )

    // ✅ OpenRouter validation parity (same as generateAIReply)
    if (!response.ok) {
      // ✅ PII Safe: don't log error response body
      console.error(`❌ OpenRouter HTTP ${response.status}: API error (body hidden for PII safety)`)
      throw new Error(`OpenRouter HTTP ${response.status}`)
    }

    const data = await response.json()

    // ✅ Validate response structure (same as generateAIReply)
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid JSON response from OpenRouter')
      throw new Error('Invalid JSON response')
    }
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ Empty or missing choices array')
      throw new Error('Empty choices array')
    }
    if (!data.choices[0]?.message?.content) {
      console.error('❌ Missing message content in response')
      throw new Error('Missing message content')
    }

    let message = data.choices[0].message.content

    if (!message) {
      message = getAppointmentFallbackMessage(newStatus, {
        customerName, date, time, serviceName: appointment.serviceName,
      }, agent?.language)
    }

    return { message: message.trim() }
  } catch (error) {
    // ✅ PII Safe: log only status code and short ID, not error content
    console.error(`❌ generateStatusUpdateMessage error: status=${newStatus}, appt=${appointment?.id?.slice(0, 6)}...`)
    // Return fallback message on error
    return {
      message: `مرحبا ${customerName || "عزيزي"}!
تم تحديث حالة موعدك
الرجاء التواصل للاستفسار.`,
      error: true,
      errorDetails: error.message,
    }
  }
}

// دالة آمنة لجلب الصور
function parseImages(imagesField) {
  if (!imagesField) return []
  
  try {
    if (typeof imagesField === 'string') {
      const parsed = JSON.parse(imagesField)
      return Array.isArray(parsed) ? parsed.filter(img => img && img.trim()) : []
    }
    if (Array.isArray(imagesField)) {
      return imagesField.filter(img => img && (typeof img === 'string') && img.trim())
    }
  } catch (e) {
    console.error("❌ Error parsing images:", e)
  }
  return []
}

/* ════════════════════════════════════════════════
   🧠 استخراج التاريخ والوقت من رسائل المحادثة
   يفهم: الدارجة + العربية + الأرقام
════════════════════════════════════════════════ */
function extractDateFromMessages(allMessages) {
  const text = allMessages

  // 🔍 DEBUG (sanitized)
  console.log(`🔍 [extractDateFromMessages] Input length: ${text?.length || 0}`)

  // ─── 1. أرقام صريحة: 2024-01-15 أو 15/01/2024 أو 15-01-2024 ───
  const numericPatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}-\d{2}-\d{4})/,
  ]
  for (const pattern of numericPatterns) {
    const match = text.match(pattern)
    if (match) {
      // تحويل 15/01/2024 لـ 2024-01-15
      const normalized = match[1].includes("/")
        ? match[1].split("/").reverse().join("-")
        : match[1].includes("-") && match[1].length === 10 && !match[1].startsWith("20")
          ? match[1].split("-").reverse().join("-")
          : match[1]
      const parsed = new Date(normalized)
      const now = new Date()
      if (!isNaN(parsed.getTime()) && parsed >= now) {
        console.log(`📅 [extractDate] Numeric pattern matched`)
        return parsed
      } else if (!isNaN(parsed.getTime())) {
        console.log(`⚠️ [extractDate] Date is in the past, will use fallback`)
      }
    }
  }

  // ─── 2. "اليوم" / "today" ───
  if (/اليوم|today/i.test(text)) {
    console.log(`📅 [extractDate] Matched: اليوم`)
    return new Date()
  }

  // ─── 3. "غدا" / "بكرة" / "غدًا" / "tomorrow" ───
  if (/غد[اً]|بكرة|بكره|tomorrow/i.test(text)) {
    console.log(`📅 [extractDate] Matched: غدا/بكرة`)
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }

  // ─── 4. "بعد غد" / "بعد بكرة" / "day after tomorrow" ───
  if (/بعد غد|بعد بكرة|بعد بكره|day after tomorrow/i.test(text)) {
    console.log(`📅 [extractDate] Matched: بعد غد`)
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d
  }

  // ─── 5. أيام الأسبوع ───
  // الأقرب في المستقبل (إذا فات يرجع للأسبوع الجاي)
  const dayMap = [
    { names: ["الأحد", "الحد", "حد", "sunday"],       day: 0 },
    { names: ["الاثنين", "التنين", "تنين", "monday"],  day: 1 },
    { names: ["الثلاثاء", "التلات", "تلات", "ثلاثا", "tuesday"], day: 2 },
    { names: ["الأربعاء", "الربع", "ربع", "wednesday"], day: 3 },
    { names: ["الخميس", "خميس", "خاميس", "thursday"], day: 4 },
    { names: ["الجمعة", "جمعة", "الجمعه", "جمعه", "friday"], day: 5 },
    { names: ["السبت", "سبت", "saturday"],             day: 6 },
  ]

  for (const { names, day } of dayMap) {
    if (names.some(n => text.includes(n))) {
      const today = new Date()
      const todayDay = today.getDay()
      let diff = day - todayDay
      // إذا نفس اليوم أو فات → الأسبوع الجاي
      if (diff <= 0) diff += 7
      const d = new Date()
      d.setDate(today.getDate() + diff)
      console.log(`📅 [extractDate] Day name matched: day=${day}, diff=${diff}`)
      return d
    }
  }

  // 🔍 DEBUG: Log if no day matched (sanitized)
  console.log(`🔍 [extractDate] No day matched, checked ${dayMap.length} day patterns`)

  // ─── 6. "هذا الأسبوع" / "الأسبوع الجاي" ───
  if (/هذا الأسبوع|هاد الأسبوع|هاد لأسبوع/i.test(text)) {
    console.log(`📅 [extractDate] Matched: هذا الأسبوع`)
    const d = new Date()
    d.setDate(d.getDate() + 3) // منتصف الأسبوع كافتراضي
    return d
  }

  if (/الأسبوع الجاي|الأسبوع الجاي|الجمعة الجاية/i.test(text)) {
    console.log(`📅 [extractDate] Matched: الأسبوع الجاي`)
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  }

  // ─── 7. "بعد أسبوع" ───
  if (/بعد أسبوع|بعد اسبوع|next week/i.test(text)) {
    console.log(`📅 [extractDate] Matched: بعد أسبوع`)
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  }

  console.log(`📅 [extractDate] No date pattern found — will use fallback`)
  return null
}

function extractTimeFromMessages(allMessages) {
  // HH:MM أو H:MM
  const timePattern = /\b(\d{1,2}):(\d{2})\b/
  const match = allMessages.match(timePattern)
  if (match) {
    const hours   = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      console.log(`⏰ [extractTime] Matched: ${hours}:${minutes}`)
      return { hours, minutes }
    }
  }

  // "الساعة X" بالأرقام أو الكلمات
  const hourWords = {
    "واحدة": 1,  "واحد": 1,
    "جوج": 2,    "اثنين": 2,  "اثنتين": 2,
    "تلاتة": 3,  "ثلاثة": 3,
    "ربعة": 4,   "أربعة": 4,
    "خمسة": 5,
    "ستة": 6,
    "سبعة": 7,
    "تمنية": 8,  "ثمانية": 8,
    "تسعة": 9,
    "عشرة": 10,
    "حداش": 11,  "إحدى عشرة": 11,
    "طناش": 12,  "اثنا عشرة": 12,
  }

  // "الساعة 3" أو "الساعة 10"
  const digitHourMatch = allMessages.match(/الساعة\s+(\d{1,2})/)
  if (digitHourMatch) {
    const h = parseInt(digitHourMatch[1], 10)
    if (h >= 1 && h <= 23) {
      console.log(`⏰ [extractTime] Digit hour: ${h}`)
      return { hours: h, minutes: 0 }
    }
  }

  // "الساعة خمسة" etc.
  for (const [word, hour] of Object.entries(hourWords)) {
    if (allMessages.includes(`الساعة ${word}`) || allMessages.includes(`الساعه ${word}`)) {
      console.log(`⏰ [extractTime] Word hour: ${word} = ${hour}`)
      return { hours: hour, minutes: 0 }
    }
  }

  // "الصباح" / "المساء" hint
  if (/الصباح|صباحاً|صباحا/i.test(allMessages)) {
    return { hours: 9, minutes: 0 }
  }
  if (/المساء|مساءً|مساء|العشية/i.test(allMessages)) {
    return { hours: 17, minutes: 0 }
  }

  // "15h30" أو "15h" أو "9h" — الصيغة الفرنسية/المغربية الشائعة
  const frenchHourMatch = allMessages.match(/\b(\d{1,2})h(\d{2})?\b/i)
  if (frenchHourMatch) {
    const h = parseInt(frenchHourMatch[1], 10)
    const m = frenchHourMatch[2] ? parseInt(frenchHourMatch[2], 10) : 0
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      console.log(`⏰ [extractTime] French format: ${h}h${m || ''}`)
      return { hours: h, minutes: m }
    }
  }

  return null
}

/* ════════════════════════════════════════════════
   🔢 استخراج الكمية من رسائل المحادثة
════════════════════════════════════════════════ */
function extractQuantityFromMessages(allMessages) {
  const numberWords = {
    "واحد": 1, "واحدة": 1,
    "جوج": 2,  "اثنين": 2, "اثنتين": 2,
    "تلاتة": 3, "ثلاثة": 3,
    "ربعة": 4,  "أربعة": 4,
    "خمسة": 5,
  }

  // ✅ [FIX] أولاً: ابحث عن الكمية في سياق فعل الشراء فقط
  const buyContext = /(?:بغيت|اريد|نبغي|خود|اعطيني|طلب|bgit|bghit|bghiti|nbghi|nbi|n9der|khdini|3tini)\s+(\S+)/i
  const contextMatch = allMessages.match(buyContext)
  if (contextMatch) {
    const afterBuy = contextMatch[1]
    for (const [word, qty] of Object.entries(numberWords)) {
      if (afterBuy.includes(word)) {
        console.log(`🔢 [extractQuantity] Buy-context word: "${word}" = ${qty}`)
        return qty
      }
    }
    const num = parseInt(afterBuy, 10)
    if (!isNaN(num) && num >= 1 && num <= 100) {
      console.log(`🔢 [extractQuantity] Buy-context numeric: ${num}`)
      return num
    }
  }

  // رقمي صريح: "بغيت 3" أو "3 حبات" — مع التحقق من سياق الشراء
  const numericMatch = allMessages.match(
    /(?:بغيت|اريد|نبغي|خود|اعطيني|طلب|نحتاج|ناخذ|bgit|bghit|bghiti|nbghi|nbi|khdini|3tini)\s*(?:حبة|حبات|قطعة|قطع|وحدة|وحدات|وحده|pieces?|pcs)?\s*(\d+)|(\d+)\s*(?:حبة|حبات|قطعة|قطع|وحدة|وحدات|pieces?|pcs)/i
  )
  if (numericMatch) {
    const qty = parseInt(numericMatch[1] || numericMatch[2], 10)
    // ✅ [FIX] ما نعتبرش رقم كبير (95-99) ككمية — غالباً يكون مخزون أو سعر
    if (qty >= 1 && qty <= 20) {
      console.log(`🔢 [extractQuantity] Numeric match: ${qty}`)
      return qty
    }
    if (qty > 20 && qty <= 100) {
      console.log(`⚠️ [extractQuantity] Ignoring suspicious quantity: ${qty} (likely stock/salary reference)`)
    }
  }

  // ✅ [FIX] كلمات العدد فقط في جمل الشراء (تجنب "جوج أيام" = 2)
  const buySegments = allMessages.match(/(?:بغيت|اريد|نبغي|خود|اعطيني|طلب|bgit|bghit|bghiti|nbghi|nbi|khdini|3tini)[^.،\n]{0,30}/gi) || []
  for (const seg of buySegments) {
    for (const [word, qty] of Object.entries(numberWords)) {
      if (seg.includes(word)) {
        console.log(`🔢 [extractQuantity] Segment word: "${word}" = ${qty}`)
        return qty
      }
    }
  }

  // ✅ [NEW] Arabizi fallback: "bgit 3" / "bghit 2" even without Arabic keywords
  const arabiziDirect = allMessages.match(/\b(?:bgit|bghit|bghiti|nbghi|nbi)\s+(\d{1,2})\b/i)
  if (arabiziDirect) {
    const qty = parseInt(arabiziDirect[1], 10)
    if (!isNaN(qty) && qty >= 1 && qty <= 20) {
      console.log(`🔢 [extractQuantity] Arabizi direct: ${qty}`)
      return qty
    }
  }

  return 1
}

/* ════════════════════════════════════════════════
   📍 تنظيف العنوان المستخرج
════════════════════════════════════════════════ */
function cleanExtractedAddress(raw) {
  if (!raw) return null
  let addr = raw.trim()

  // ❌ حذف labels اللي كتجي من ملخصات (Adresse/Address/العنوان)
  addr = addr
    .replace(/^\s*(adresse|address)\s*[:：\-،,]?\s*/i, '')
    .replace(/^\s*(العنوان|عنوان)\s*[:：\-،,]?\s*/i, '')
    .trim()

  // ❌ تنظيف علامات الترقيم الزائدة فقط (بدون حذف أرقام أو أجزاء من العنوان)
  addr = addr.replace(/[\s،,.\-:؟?!]+$/, '').trim()

  // ❌ إذا بقات غير label، تجاهل
  if (!addr || /^adresse$/i.test(addr) || /^address$/i.test(addr) || /^العنوان$/i.test(addr) || /^عنوان$/i.test(addr)) {
    return null
  }

  return addr.length > 4 ? addr : null
}

/* ════════════════════════════════════════════════
   📍 استخراج العنوان كما كتبه الزبون (نهائي)
   الهدف: نخزنو نفس النص بدون إضافة/نقصان
════════════════════════════════════════════════ */
function extractLiteralAddressFromUserMessages(userMsgs) {
  const msgs = Array.isArray(userMsgs) ? userMsgs : []
  if (msgs.length === 0) return null

  const MARKETING_HINT = /نصيحة|باقة|درهم|توفير|هدية|عرض|تخفيض|promo|offer|discount/i
  const ADDRESS_HINT = /(?:^|\b)(adresse|address|العنوان|عنوان|حي|شارع|زنقة|تجزئة|دوار|سكن|ساكن|التوصيل|نوصل|وصل|rue|av\.?|avenue|bd\.?|boulevard|quartier|résidence|lotissement|immeuble|appt|appartement|hay|hayy|haye|hey|ra9m|rakm|rqm|dar|maison)(?:\b|:)/i
  const CITY_HINT = /(?:\b(?:fes|fès|casa|casablanca|kaza|marrakech|marrakesh|tanger|tangier|agadir|rabat|sale|salé|meknes|oujda|tetouan|tétouan|taza|beni\s*mellal)\b)|(?:الدار\s*البيضاء|كازا|الرباط|سلا|فاس|مكناس|مراكش|طنجة|أكادير|وجدة|تطوان|تازة|بني\s*ملال|آسفي|الجديدة|القنيطرة)/i

  for (let i = msgs.length - 1; i >= 0; i--) {
    const raw = typeof msgs[i]?.content === "string" ? msgs[i].content : ""
    if (!raw.trim()) continue
    if (MARKETING_HINT.test(raw)) continue

    // خذ أول سطر غير فارغ (الزبون كيرسل سطر واحد غالباً)
    const firstLine = raw.split("\n").map(s => s.trim()).find(Boolean) || ""
    if (!firstLine) continue

    if (ADDRESS_HINT.test(firstLine) || CITY_HINT.test(firstLine)) {
      // فقط حذف prefix إذا كان label، بدون لمس باقي النص
      const cleaned = cleanExtractedAddress(firstLine)
      return cleaned || firstLine.trim()
    }
  }

  return null
}

/* ════════════════════════════════════════════════
   📍 استخراج (المدينة + العنوان) بشكل منفصل
   - المدينة: إذا قدرنا نعرفها من نفس الرسالة
   - العنوان: نفس نص الزبون (بدون "Adresse:" فقط) ثم نحيد المدينة من البداية إذا كانت مكتوبة
════════════════════════════════════════════════ */
function extractCityAndAddressFromUserMessages(userMsgs) {
  const msgs = Array.isArray(userMsgs) ? userMsgs : []
  if (msgs.length === 0) return { city: null, address: null }

  const MARKETING_HINT = /نصيحة|باقة|درهم|توفير|هدية|عرض|تخفيض|promo|offer|discount/i
  const CITY_ONLY_HINT = /^(?:\s*(?:adresse|address|المدينة|مدينة)\s*[:：\-،,]?\s*)?(rabat|sale|salé|fes|fès|casa|casablanca|kaza|marrakech|tanger|agadir|meknes|oujda|tetouan|tétouan|taza|beni\s*mellal|الرباط|سلا|فاس|الدار\s*البيضاء|كازا|مراكش|طنجة|أكادير|مكناس|وجدة|تطوان|تازة|بني\s*ملال)\s*$/i
  const ADDRESS_ONLY_HINT = /(?:^|\b)(?:حي|شارع|زنقة|تجزئة|دوار|سكن|ساكن|التوصيل|نوصل|وصل|rue|av\.?|avenue|bd\.?|boulevard|quartier|résidence|lotissement|immeuble|appt|appartement|hay|hayy|haye|hey|ra9m|rakm|rqm|dar|maison)\b/i

  // NOTE: \b word-boundary is unreliable for Arabic letters, so we use includes() for Arabic city detection.
  const ARABIC_CITY_ALIASES = [
    { city: "فاس", aliases: ["فاس"] },
    { city: "الرباط", aliases: ["الرباط", "رباط"] },
    { city: "سلا", aliases: ["سلا"] },
    { city: "مكناس", aliases: ["مكناس"] },
    { city: "مراكش", aliases: ["مراكش"] },
    { city: "طنجة", aliases: ["طنجة"] },
    { city: "أكادير", aliases: ["أكادير", "اكادير"] },
    { city: "وجدة", aliases: ["وجدة"] },
    { city: "تطوان", aliases: ["تطوان"] },
    { city: "تازة", aliases: ["تازة"] },
    { city: "بني ملال", aliases: ["بني ملال", "بنيملال"] },
    { city: "الدار البيضاء", aliases: ["الدار البيضاء", "الدارالبيضاء"] },
    { city: "كازا", aliases: ["كازا"] },
    { city: "آسفي", aliases: ["آسفي", "اسفي"] },
    { city: "الجديدة", aliases: ["الجديدة"] },
    { city: "القنيطرة", aliases: ["القنيطرة", "قنيطرة"] },
  ]

  const LATIN_CITY_MAP = [
    { city: "فاس", re: /\b(fes|fès)\b/i },
    { city: "الرباط", re: /\b(rabat)\b/i },
    { city: "الدار البيضاء", re: /\b(casa|casablanca|kaza)\b/i },
    { city: "مراكش", re: /\b(marrakech|marrakesh)\b/i },
    { city: "طنجة", re: /\b(tanger|tangier|tanga)\b/i },
    { city: "أكادير", re: /\b(agadir)\b/i },
    { city: "مكناس", re: /\b(meknes)\b/i },
    { city: "وجدة", re: /\b(oujda)\b/i },
    { city: "تطوان", re: /\b(tetouan|tétouan)\b/i },
    { city: "تازة", re: /\b(taza)\b/i },
    { city: "بني ملال", re: /\b(beni\s*mellal)\b/i },
    { city: "سلا", re: /\b(sale|salé)\b/i },
  ]

  function normalizeForArabicCity(line) {
    return String(line || "")
      .replace(/^\s*(?:المدينة|مدينة)\s*[:：\-،,]?\s*/i, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  function detectCity(line) {
    const l = normalizeForArabicCity(line)
    const latin = LATIN_CITY_MAP.find(e => e.re.test(l))
    if (latin) return latin.city
    // Arabic includes
    for (const entry of ARABIC_CITY_ALIASES) {
      for (const a of entry.aliases) {
        if (l.includes(a)) return entry.city
      }
    }
    return null
  }

  // 1) Find latest address-like user message (keep it as-is)
  let addressRaw = null
  let addressIdx = -1
  for (let i = msgs.length - 1; i >= 0; i--) {
    const raw = typeof msgs[i]?.content === "string" ? msgs[i].content.trim() : ""
    if (!raw) continue
    if (MARKETING_HINT.test(raw)) continue
    const firstLine = raw.split("\n").map(s => s.trim()).find(Boolean) || ""
    if (!firstLine) continue
    if (ADDRESS_ONLY_HINT.test(firstLine) && !CITY_ONLY_HINT.test(firstLine)) {
      addressRaw = cleanExtractedAddress(firstLine) || firstLine
      addressIdx = i
      break
    }
  }

  // 2) Find latest city message (prefer one close to address message)
  let city = null
  const searchFrom = addressIdx >= 0 ? addressIdx : msgs.length - 1
  for (let i = searchFrom; i >= 0; i--) {
    const raw = typeof msgs[i]?.content === "string" ? msgs[i].content.trim() : ""
    if (!raw) continue
    if (MARKETING_HINT.test(raw)) continue
    const firstLine = raw.split("\n").map(s => s.trim()).find(Boolean) || ""
    if (!firstLine) continue
    const detected = detectCity(firstLine)
    if (detected) { city = detected; break }
  }

  // 3) If we didn't find an address message, fall back to literal (may be city+address in one line)
  if (!addressRaw) {
    const literal = extractLiteralAddressFromUserMessages(msgs)
    if (!literal) return { city, address: null }
    addressRaw = literal.trim()
  }

  // 4) If address line contains a city token at the beginning, strip it (keep address only)
  const cityInAddress = detectCity(addressRaw)
  let addressOnly = addressRaw
  if (cityInAddress) {
    city = city || cityInAddress
    // remove city token (arabic/latin) from start only
    addressOnly = addressOnly
      .replace(/^\s*(?:المدينة|مدينة)\s*[:：\-،,]?\s*/i, "")
      .replace(new RegExp(`^\\s*(?:${cityInAddress})\\s*`, "i"), "")
      .replace(/^[\s,،;\-:]+/, "")
      .trim()
  }

  return { city, address: addressOnly || addressRaw }
}

/* ════════════════════════════════════════════════
   📍 استخراج العنوان — نسخة محسّنة
   ════════════════════════════════════════════════ */
function extractAddressFromMessages(allMessages) {
  // ✅ تصفية رسائل البوت أولاً (تحتوي على إيموجيات التأكيد أو كلمات النظام)
  const clientOnly = allMessages
    .split('\n')
    .filter(line => {
      const isBotLine =
        /[📦📍💰🚀✅🎉]/.test(line) ||
        /(?:قيدت|صافي أخويا|هادي هي المعلومات|تم تأكيد|غادي يتصل|المجموع|الطلبية|طلبك داز|ناضي!|تأكد الموعد|كمل الموعد)/i.test(line) ||
        /^\s*(adresse|address)\s*:?$/i.test(line)
      return !isBotLine
    })
    .join('\n')

  const text = clientOnly.toLowerCase()

  const patterns = [
    // ══════════════ Arabizi — النمط الكامل ══════════════

    // "hay ryad ra9m dar 22" — النمط الكامل مع رقم
    /\b(?:hay|hayy|haye|hey)\s+([a-z][a-z0-9\s]*?(?:ra9m|rakm|rqm|n°?|num|numero)\s*(?:dar|d|bt|beit|bayt|maison)?\s*\d+[a-z]?)/i,

    // "hay [اسم الحي]" — بدون رقم
    /\b(?:hay|hayy|haye|hey)\s+([a-z][a-z\s]{2,30}?)(?=\s+(?:ra9m|rakm|rqm|bgit|bghit|\d)|$)/i,

    // "hay [اسم]" بدون قيود
    /\b(?:hay|hayy|haye|hey)\s+([a-z][a-z\s]{2,25})/i,

    // "ra9m dar 22" / "rakm dar 15"
    /\b(?:ra9m|rakm|rqm|num|n°?|numero)\s*(?:dar|d|bt|beit|bayt|maison|appart)?\s*(\d+[a-z]?)/i,

    // مدينة + عنوان arabizi: "fes hay ryad ra9m dar 22"
    /\b(?:fes|fès|casa|casablanca|kaza|marrakech|marrakesh|tanger|tanga|agadir|rabat|sale|salé|meknes|oujda|tetouan|taza|beni\s*mellal)\b[,\s]+(?:hay\s+)?([a-z][^\n,]{4,80})/i,

    // "dar/bayt [رقم]"
    /\b(?:dar|dari|bayt|beit)\s+(?:ra9m|rakm|rqm|n°?)?\s*(\d+[a-z]*)/i,

    // "3ndi/andi [عنوان]"
    /\b(?:3nd|3ndi|andi|3andi|andni|3andni)\s+([a-z][^\n,]{4,60})/i,

    // ══════════════ فرنسي ══════════════

    // "rue/avenue/boulevard/résidence [اسم]"
    /\b(?:rue|avenue|av\.?|boulevard|bd\.?|résidence|rés\.?|lotissement|lot\.?|quartier|immeuble|appt?\.?)\s+([^\n,،]{4,80})/i,

    // "[رقم], rue [اسم]"
    /(\d+[,\s]+(?:rue|avenue|boulevard|bd|résidence|quartier|lotissement)\s+[^\n,،]{4,60})/i,

    // ══════════════ عربي / درجة ══════════════

    // ✅ [FIX] مدينة + حي/شارع كامل: "فاس حي رياض رقم دار 33" (نحتفظ بالمدينة)
    /((?:\b(?:فاس|الرباط|سلا|مكناس|مراكش|طنجة|أكادير|وجدة|تطوان|تازة|بني\s*ملال|الدار\s*البيضاء|كازا|آسفي|الجديدة|القنيطرة)\b)\s+(?:حي|شارع|زنقة|تجزئة|دوار)?\s*[^\n,.،]{5,100})/i,

    // "حي/شارع/زنقة/تجزئة [اسم]"
    /(?:حي|شارع|زنقة|تجزئة|دوار|سيدي|حومة)\s+([^\n,.،]{4,80})/i,

    // "عنواني/العنوان/سكن/ساكن [...]"
    /(?:عنواني|العنوان|سكن|ساكن)\s*(?:هو|فى|في|ف)?\s*[:\-]?\s*([^\n,.،]{4,80})/i,

    // "التوصيل/نوصل لـ [...]"
    /(?:التوصيل|توصيل|نوصل|وصل)\s*(?:ل|لـ|لي|لها|ليه)?\s*[:\-]?\s*([^\n,.،]{4,80})/i,

    // مدن مغربية بالعربية (مع العنوان كامل بعدها)
    /((?:الدار البيضاء|كازا|الرباط|سلا|فاس|مكناس|مراكش|طنجة|أكادير|وجدة|تطوان|تازة|بني ملال|آسفي|الجديدة|القنيطرة|ورزازات|الحسيمة|الناظور|العيون|تزنيت|إنزكان|تمارة)(?:[،,\s]+[^\n,.،]{5,80})?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const raw = (match[1] || match[0] || '').trim()
      const address = cleanExtractedAddress(raw)
      if (address) {
        console.log(`📍 [extractAddress] ✅ Pattern matched: "${address.slice(0, 50)}"`)
        return address
      }
    }
  }
  
  // ══════════════ Fallback بالكلمات المفتاحية ══════════════
  const keywords = [
    'عنوان', 'سكن', 'ساكن', 'التوصيل', 'نوصلك', 'فين',
    'hay', 'ra9m', 'rakm', 'rue', 'quartier', 'résidence',
    'fes', 'casa', 'marrakech', 'tanger', 'agadir', 'rabat', 'meknes'
  ]

  for (const kw of keywords) {
    const idx = text.indexOf(kw)
    if (idx !== -1) {
      const after = text.slice(idx + kw.length, idx + kw.length + 120)
      const raw = after.replace(/^[\s:،,\-?؟]+/, '').split(/[\n,.،]/)[0]
      const address = cleanExtractedAddress(raw)
      if (address) {
        console.log(`📍 [extractAddress] 🔑 Keyword "${kw}": "${address.slice(0, 50)}"`)
        return address
      }
    }
  }

  console.warn('📍 [extractAddress] ❌ No address found in client messages')
  return null
}

// ✅ FIX: Prompt جديد — شخصية حية بدل قواعد روبوتية
function buildSystemPrompt(agent, items, objectionReplies, selectedItem, isService = false, customerHistory = null, appointmentsHistory = null, ordersHistory = null, currentStage = null, customerName = null, customerTag = null) {
  const itemTypeLabel = isService ? "الخدمات" : "المنتجات"
  
  let itemsList
  let hasImages = false
  let stockWarning = ""
  
  // Helper: format duration with correct unit
  const formatDurationForAI = (item) => {
    if (!isService || !item.duration) return ""
    const unitMap = { minutes: "دقيقة", hours: "ساعة", days: "يوم", weeks: "أسبوع", months: "شهر" }
    const unit = unitMap[item.durationUnit] || "دقيقة"
    return ` — ${item.duration} ${unit}`
  }

  // Helper: format price (range if priceMax exists)
  const formatPriceForAI = (item) => {
    if (item.priceMax && item.priceMax > item.price) {
      return `${item.price}-${item.priceMax} درهم`
    }
    return `${item.price} درهم`
  }

  // Helper: format service extras (category + features)
  const formatServiceExtras = (item) => {
    if (!isService) return ""
    let extras = ""
    const catMap = { web: "تطوير ويب", design: "تصميم", marketing: "تسويق رقمي", consulting: "استشارات", training: "تكوين", beauty: "تجميل", health: "صحة", repair: "إصلاح وصيانة", other: "أخرى" }
    if (item.category && catMap[item.category]) extras += ` [${catMap[item.category]}]`
    try {
      const features = item.features ? (typeof item.features === "string" ? JSON.parse(item.features) : item.features) : []
      if (features.length > 0) extras += ` (${features.join("، ")})`
    } catch {}
    return extras
  }

  if (selectedItem) {
    const images = parseImages(selectedItem.images)
    hasImages = images.length > 0
    const durationInfo = formatDurationForAI(selectedItem)
    const priceInfo = formatPriceForAI(selectedItem)
    const serviceExtras = formatServiceExtras(selectedItem)
    // ✅ FIX: إضافة معلومات المخزون للـ AI
    const stockInfo = !isService && selectedItem.stock !== undefined && selectedItem.stock !== null
      ? (selectedItem.stock > 0 ? ` (المخزون: ${selectedItem.stock})` : ` ⚠️ نفد من المخزون`)
      : ""
    stockWarning = !isService && selectedItem.stock !== undefined && selectedItem.stock <= 0
    itemsList = `- ${selectedItem.name}: ${priceInfo}${durationInfo}${serviceExtras}${stockInfo}`
    if (selectedItem.description) itemsList += `\n  الوصف: ${selectedItem.description}`
    if (hasImages) itemsList += `\n- ${images.length} صورة متوفرة`
  } else {
    const allImages = items.filter(p => p.isActive).flatMap(p => parseImages(p.images))
    hasImages = allImages.length > 0
    itemsList = items
      .filter(p => p.isActive)
      .map(p => {
        const durationInfo = formatDurationForAI(p)
        const priceInfo = formatPriceForAI(p)
        const serviceExtras = formatServiceExtras(p)
        const stockInfo = !isService && p.stock !== undefined && p.stock !== null
          ? (p.stock > 0 ? ` (المخزون: ${p.stock})` : ` ⚠️ نفد`)
          : ""
        return `- ${p.name}: ${priceInfo}${durationInfo}${serviceExtras}${stockInfo}`
      })
      .join("\n")
  }

  const objectionsList = objectionReplies
    .map(o => `"${o.trigger}" → رد: "${o.reply}"`)
    .join("\n")

  const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"
  const lang = agent.language === "darija" ? "darija" : agent.language === "french" ? "french" : "arabic"

  // ✅ [FIX] Custom instructions per mode (product vs service)
  const customInstructions = (isService
    ? (agent.serviceInstructions ?? agent.instructions)
    : (agent.productInstructions ?? agent.instructions)
  )?.trim()
  
  // ✅ Detect consultative services (need discovery/discussion before booking)
  const consultativeCategories = ["web", "design", "marketing", "consulting", "training"]
  const serviceCategory = selectedItem?.category || items?.find(i => i.isActive)?.category || null
  const isConsultative = isService && (
    (serviceCategory && consultativeCategories.includes(serviceCategory)) ||
    (customInstructions && customInstructions.length > 200)
  )

  const stockRule = !isService && selectedItem?.stock !== undefined
    ? (selectedItem.stock === 0
        ? `\n⚠️ هذا المنتج نفد من المخزون (stock = 0). قول: "واه معلبالي هاد المنتج sold out دابا 😅" — ما تبيعش حاجة ما عندكش!`
        : `\n✅ هذا المنتج متوفر في المخزون (${selectedItem.stock} قطعة). ممنوع تقول sold out أو نفد. بيع عادي!`)
    : ""

  const imagesRule = hasImages
    ? `\n📸 المنتج عنده صور متوفرة. إذا طلب الصور: ضيف [SEND_IMAGES] في آخر الرسالة مباشرة، بدون أعذار وبدون "ما عنديش تصاور".`
    : ""
  
  const personalities = {
    darija: {
      intro: customInstructions ? `أنت ${agent.name} — خبير مبيعات ذكي على واتساب.
${customInstructions}${stockRule}${imagesRule}` : `أنت ${agent.name} — حرايفي وبائع مغربي ناضي في واتساب.
شخصيتك: ولد الشعب، مطور، كايعرف يبيع ويشري، وقريب من الكليان.
تهضر دارجة حرة ديال ولاد البلاد (بلا بروتوكول، بلا رسميات خاوية).
هدفك: تجمع المعلومات (السلعة + شحال + العنوان) وتدوز الـ Confirmation في أسرع وقت.${stockRule}${imagesRule}`,
      whoAreYou: `أنا ${agent.name} 😊، هاني معاك، شنو حب الخاطر؟`,
      robotReply: `والو خويا، أنا غير ${agent.name} اللي معاك 😄`,
      summaryProduct: `صافي ناضي 👌 ها الخلاصة:
📦 [المنتج] × [العدد]
📍 [فين]
💰 [المجموع] درهم
واش نأكدو؟`,
      summaryService: `صافي مزيان 👌 هاهو الحجز:
📋 [الخدمة]
📅 [النهار]
⏰ [الوقت]
نأكدوه؟`,
      summaryConsultative: `صافي خويا 👌 ها الملخص:
📋 [الباقة/الخدمة المختارة]
👤 [الاسم]
📞 [رقم الهاتف]
🏢 [نوع النشاط/المشروع]
💰 [الثمن]
واش نأكدو؟`,
      confirmProduct: `ناضي! الطلب ديالك داز 🚀
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `الحجز ديالك تأكد 🎉 مرحبا بيك!
${confirmTag}
[STAGE:CLOSED]`,
      confirmConsultative: `تم التأكيد 🎉 غادي نتواصلو معاك قريباً باش نبداو الخدمة!
${confirmTag}
[STAGE:CLOSED]`,
    },
    french: {
      intro: customInstructions ? `Tu es ${agent.name} — expert sur WhatsApp.
${customInstructions}${stockRule}${imagesRule}` : `Tu es ${agent.name} — vendeur expert sur WhatsApp.
Style: dynamique, malin, confiant, proche du client.
Tu parles français naturel comme dans une vraie conversation WhatsApp.
Objectif: confirmer la commande en minimum de messages.`,
      whoAreYou: `C'est ${agent.name} 😊 je peux t'aider avec quoi?`,
      robotReply: `Non c'est ${agent.name} 😄`,
      summaryProduct: `Top 👌
📦 [Produit] × [Qté]
📍 [Adresse]
💰 [Total] DH
On valide?`,
      summaryService: `Ça marche 👌
📋 [Service]
📅 [Date]
⏰ [Heure]
On confirme?`,
      summaryConsultative: `Parfait 👌 Récap:
📋 [Formule choisie]
👤 [Nom]
📞 [Téléphone]
🏢 [Type d'activité]
💰 [Prix]
On valide?`,
      confirmProduct: `Commande reçue 🎉 On t'envoie ça vite!
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `C'est réservé 🎉 À bientôt!
${confirmTag}
[STAGE:CLOSED]`,
      confirmConsultative: `C'est confirmé 🎉 On vous contacte très vite pour démarrer!
${confirmTag}
[STAGE:CLOSED]`,
    },
    arabic: {
      intro: customInstructions ? `أنت ${agent.name} — خبير على واتساب.
${customInstructions}${stockRule}${imagesRule}` : `أنت ${agent.name} — بائع خبير على واتساب.
شخصيتك: نشيط، ذكي، واثق، قريب من الزبون.
تتكلم عربية بسيطة وعفوية كأي شخص على واتساب.
هدفك: تأكيد الطلب بأقل رسائل ممكن.`,
      whoAreYou: `أنا ${agent.name} 😊 بشو ما بدك أساعدك؟`,
      robotReply: `لا، أنا ${agent.name} 😄`,
      summaryProduct: `من عيوني 👌
📦 [المنتج] × [الكمية]
📍 [العنوان]
💰 [المجموع] درهم
نعتمد؟`,
      summaryService: `تمام 👌
📋 [الخدمة]
📅 [التاريخ]
⏰ [الوقت]
نعتمد؟`,
      summaryConsultative: `تمام 👌 الملخص:
📋 [الباقة/الخدمة]
👤 [الاسم]
📞 [الهاتف]
🏢 [نوع النشاط]
💰 [السعر]
نؤكد؟`,
      confirmProduct: `أبشر! رح يوصلك بأقرب 🎉
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `تم تأكيد الحجز 🎉
${confirmTag}
[STAGE:CLOSED]`,
      confirmConsultative: `تم التأكيد 🎉 سنتواصل معك قريباً لبدء العمل!
${confirmTag}
[STAGE:CLOSED]`,
    }
  }

  const p = personalities[lang]

  // ═══ Build goal, summary, rules based on mode ═══
  let goalSection, summarySection, confirmSection, rulesSection

  if (!isService) {
    // ── Product mode ──
    goalSection = "تأكيد الطلبية بأقل رسائل ممكن: المنتج + الكمية + العنوان = ملخص → تأكيد"
    summarySection = p.summaryProduct
    confirmSection = p.confirmProduct
    rulesSection = `═══ قواعد تقنية فقط ═══
- 1-3 أسطر في كل رد — لا أكثر
- سؤال واحد فقط في كل رسالة  
- لا تأكيد بدون ملخص أولاً
- لا ملخص بدون عنوان
- كل رد ينتهي بـ [STAGE:xxx]
${hasImages ? "- أضف [SEND_IMAGES] إذا طلب صور\n" : ""}- ${confirmTag} فقط بعد موافقة الزبون على الملخص`

  } else if (isConsultative) {
    // ── Consultative service mode (web, marketing, consulting, training, design) ──
    goalSection = `أنت مستشار محترف، ماشي غير بائع. هدفك:
1. 🔍 [DISCOVERY] افهم احتياجات الزبون: شنو بغى بالضبط؟ شنو نشاطه؟ شنو أهدافه؟ واش عنده موقع/حل حالي؟
2. 💡 [PITCHING] اقترح عليه الحل الأنسب من الباقات/الخدمات + وضح ليه علاش هاد الحل مناسب ليه
3. 🛡️ [OBJECTION] جاوب على أسئلته واعتراضاته بثقة ومعرفة
4. 📋 [CLOSING] لمن يكون مقتنع: جمع المعلومات (الباقة + الاسم + نوع النشاط) وعطيه ملخص → أكد

⚠️ ممنوع تسرع فالتأكيد! خاصك تفهم الزبون مزيان قبل ما تقترح. اسأل على الأقل 2-3 أسئلة استكشافية.
⚠️ ما تعرضش كل الباقات دفعة وحدة إلا طلب. اقترح الأنسب حسب ما فهمتي.`
    summarySection = p.summaryConsultative
    confirmSection = p.confirmConsultative
    rulesSection = `═══ قواعد تقنية ═══
- 2-5 أسطر في كل رد — كافي باش توصل الفكرة
- سؤال أو سؤالين في كل رسالة كحد أقصى
- كن طبيعي ومحترف، عطي أمثلة وقيمة مضافة
- لا تأكيد بدون ملخص أولاً
- لا ملخص بدون ما تفهم احتياجات الزبون
- كل رد ينتهي بـ [STAGE:xxx]
${hasImages ? "- أضف [SEND_IMAGES] إذا طلب صور أو أمثلة\n" : ""}- ${confirmTag} فقط بعد موافقة الزبون على الملخص
- استعمل المراحل: GREETING → DISCOVERY → PITCHING → OBJECTION → CLOSING → CLOSED`

  } else {
    // ── Quick booking service mode (beauty, health, repair, etc.) ──
    goalSection = "تأكيد الحجز بأقل رسائل ممكن: الخدمة + التاريخ + الوقت = ملخص → تأكيد"
    summarySection = p.summaryService
    confirmSection = p.confirmService
    rulesSection = `═══ قواعد تقنية فقط ═══
- 1-3 أسطر في كل رد — لا أكثر
- سؤال واحد فقط في كل رسالة  
- لا تأكيد بدون ملخص أولاً
- كل رد ينتهي بـ [STAGE:xxx]
${hasImages ? "- أضف [SEND_IMAGES] إذا طلب صور\n" : ""}- ${confirmTag} فقط بعد موافقة الزبون على الملخص`
  }

  // ═══ WhatsApp formatting rules (applies to all modes) ═══
  const formattingRules = `═══ تنسيق WhatsApp — مهم جداً ═══
- *Bold*: استعمل نجمة وحدة على كل جانب: *كلمة* (ممنوع ** مزدوجة)
- استعمل Bold غير للعناوين والكلمات المهمة فقط، ماشي كل جملة
- استعمل ✅ أو • أو ▸ كـ bullet points، ماشي * أو -
- كل نقطة فسطر وحدها (سطر جديد)
- خلي سطر فارغ بين الأقسام المختلفة
- ممنوع تخلط bold (*) مع bullet (*) فنفس السطر
- الإيموجي فالبداية ديال السطر، ماشي فالوسط
- أمثلة صحيحة:
  ✅ Design responsive
  ✅ Hébergement 1 an مجاني
  ✅ *Nom de domaine* .ma أو .com
- أمثلة غالطة:
  * *Page d'accueil*: الصفحة (❌ خلط bullet مع bold)
  **Formulaire** (❌ نجمة مزدوجة)`

  return `${p.intro}

${itemsList ? `المنتجات/الخدمات المتاحة:\n${itemsList}\n` : ""}
${objectionsList ? `\n═══ ردود الاعتراضات ═══\n${objectionsList}\n` : ""}
${customerHistory ? `\n═══ تاريخ الزبون ═══\n${customerHistory}\n` : ""}

═══ هويتك إذا سُئلت ═══
"من أنت؟" → ${p.whoAreYou}
"هل أنت روبوت/AI؟" → ${p.robotReply}

═══ هدفك ═══
${goalSection}

═══ نموذج الملخص والتأكيد ═══
${summarySection}

عند الموافقة (نعم/واخا/تمام/ok):
${confirmSection}

${rulesSection}

${formattingRules}
${currentStage && currentStage !== "GREETING" ? `\nالمرحلة الحالية: ${currentStage} ← تابع منها مباشرة` : ""}`
}

const SCORE_MAP = {
  GREETING:  10,
  DISCOVERY: 35,
  OBJECTION: 25,
  PITCHING:  55,
  CLOSING:   80,
  CLOSED:    100,
}

// توليد رد AI عبر OpenRouter
export async function generateAIReply({
  agent,
  items,
  objectionReplies,
  conversationHistory,
  userMessage,
  selectedItem,
  isService = false,
  customerHistory = null,
  appointmentsHistory = null,
  ordersHistory = null,
  currentStage = null,
  customerName = null,
  customerTag = null,
}) {
  let attempts = 0
  const maxAttempts = 2
  
  while (attempts < maxAttempts) {
    attempts++
    
    try {
      const systemPrompt = buildSystemPrompt(
        agent, items, objectionReplies, selectedItem, isService, customerHistory, appointmentsHistory, ordersHistory, currentStage, customerName, customerTag
      )

      // ✅ [DEBUG] Log when custom instructions are being used
      if (agent.instructions?.trim()) {
        console.log(`🎯 [generateAIReply] Using custom instructions for agent: ${agent.name}`)
      }

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role === "AGENT" ? "assistant" : "user",
          content: msg.content,
        })),
        { role: "user", content: userMessage },
      ]

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://wakil.ma",
            "X-Title": "wakil.ma",
          },
          body: JSON.stringify({
            // ✅ FIX: استخدام GPT-4o Mini عبر OpenRouter
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            // ✅ FIX: زيادة max_tokens لتجنب الردود الناقصة
            max_tokens: 800,
            temperature: 0.7,
          }),
        }
      )

      // ✅ Validate HTTP response before parsing
      if (!response.ok) {
        // ✅ PII Safe: don't log error response body (may contain sensitive info)
        console.error(`❌ OpenRouter HTTP ${response.status}: API error (body hidden for PII safety)`)
        throw new Error(`OpenRouter HTTP ${response.status}`)
      }

      const data = await response.json()

      // ✅ Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid JSON response from OpenRouter')
        throw new Error('Invalid JSON response')
      }
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('❌ Empty or missing choices array:', Object.keys(data))
        throw new Error('Empty choices array')
      }
      if (!data.choices[0]?.message?.content) {
        console.error('❌ Missing message content in response')
        throw new Error('Missing message content')
      }

      let reply = data.choices[0].message.content

      console.log(`🤖 [generateAIReply] RAW AI RESPONSE`)

      // استخراج المرحلة
      const stageMatch = reply.match(/\[STAGE:(\w+)\]/)
      let stage = stageMatch ? stageMatch[1] : null
      
      console.log(`🤖 [generateAIReply] Stage detected: ${stage} from match: ${stageMatch?.[0]}`)

      // اكتشاف المرحلة من رد AI إذا نسي الـ tag
      if (!stage && conversationHistory.length > 0) {
        const userLower = userMessage.toLowerCase()
        
        if (userLower.includes("غدا") || userLower.includes("اليوم") || 
            userLower.includes("الساعة") || userLower.includes("مع") ||
            userLower.match(/\d{1,2}:\d{2}/)) {
          stage = "CLOSING"
        }
        else if (userLower.includes("نعم") || userLower.includes("أكد") || 
                 userLower.includes("تمام") || userLower.includes("حسنا") ||
                 userLower === "اوك" || userLower === "ok") {
          stage = "CLOSED"
        }
        else if (userLower.includes("بغيت نحجز") || userLower.includes("بغيت نشر") ||
                 userLower.includes("حجز") || userLower.includes("شراء")) {
          stage = "PITCHING"
        }
      }

      // اكتشاف التأكيد
      const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"
      let orderConfirmed = reply.includes(confirmTag) || reply.includes("[ORDER_CONFIRMED]") || reply.includes("[BOOKING_CONFIRMED]")
      
      console.log(`🤖 [generateAIReply] orderConfirmed check: isService=${isService}, confirmTag=${confirmTag}`)
      console.log(`🤖 [generateAIReply] Initial orderConfirmed=${orderConfirmed}, stage=${stage}`)
      
      // ✅ [FIX] تأكيد الطلب — يشترط أن الـ Agent أرسل ملخصاً فعلاً قبل قبول كلمة التأكيد
      if (!orderConfirmed && stage === "CLOSING") {
        const userLower = userMessage.toLowerCase()
        const confirmWords = ["نعم", "أكد", "تمام", "واخا", "يلاه", "موافق", "بالصح", "صحيح", "آسفي", "حسن", "مزيان", "اوك", "ok"]
        const lastAgentMsg = conversationHistory
          .filter(m => m.role === "AGENT")
          .slice(-1)[0]?.content || ""
        const summaryIndicators = isService
          ? ["📋", "📅", "⏰", "نأكد", "نأكدوه", "On confirme", "نعتمد"]
          : ["📦", "📍", "💰", "نأكدو", "On valide", "نعتمد", "درهم"]
        const agentSentSummary = summaryIndicators.some(s => lastAgentMsg.includes(s))
        if (confirmWords.some(w => userLower.includes(w)) && agentSentSummary) {
          orderConfirmed = true
          reply = reply + "\n" + confirmTag + "\n[STAGE:CLOSED]"
          console.log(`✅ [FIX] تأكيد بعد ملخص — orderConfirmed=true`)
        } else if (confirmWords.some(w => userLower.includes(w)) && !agentSentSummary) {
          console.log(`⚠️ [FIX] كلمة تأكيد بدون ملخص — تجاهل`)
        }
      }
      
      console.log(`🤖 [generateAIReply] Final orderConfirmed=${orderConfirmed}`)

      const lastAgentMessages = conversationHistory
        .filter(m => m.role === "AGENT")
        .slice(-3)
      
      const isDuplicateReply = lastAgentMessages.some(m => 
        m.content && reply && 
        m.content.length > 80 && reply.length > 80 &&
        (
          m.content.substring(0, 80) === reply.substring(0, 80) ||
          m.content === reply
        )
      )
      
      if (isDuplicateReply && !orderConfirmed) {
        console.warn("⚠️ AI كرر نفس الرد - نطلب الانتقال للمرحلة التالية.")
        if (!stage || stage === "GREETING") {
          reply = reply + "\n[STAGE:DISCOVERY]"
        } else if (stage === "DISCOVERY") {
          reply = reply + "\n[STAGE:PITCHING]"
        } else if (stage === "PITCHING") {
          reply = reply + "\n[STAGE:CLOSING]"
        }
      }

      const sendImages = /\[SEND[_ ]IMAGES?\]/i.test(reply)
      const cancelOrder = reply.includes("[CANCEL_ORDER]")
      const cancelAppointment = reply.includes("[CANCEL_APPOINTMENT]")

      // ✅ FIX: إصلاح cleanReply لإضافة \n? قبل الـ tags لتجنب قطع جزء من النص
      const cleanReply = reply
        .replace(/\n?\[STAGE:\w+\]/g, "")
        .replace(/\n?\[ORDER_CONFIRMED\]/g, "")
        .replace(/\n?\[BOOKING_CONFIRMED\]/g, "")
        .replace(/\n?\[SEND[_ ]IMAGES?\]/gi, "")
        .replace(/\n?\[CANCEL_ORDER\]/g, "")
        .replace(/\n?\[CANCEL_APPOINTMENT\]/g, "")
        .trim()

      return {
        reply: cleanReply,
        stage: stage || "GREETING",
        score: SCORE_MAP[stage] || 10,
        orderConfirmed,
        sendImages,
        cancelOrder,
        cancelAppointment,
      }
    } catch (error) {
      // ✅ PII Safe: don't log error.message (may contain sensitive API response data)
      console.error(`❌ generateAIReply error (محاولة ${attempts}/${maxAttempts}): [hidden for PII safety]`)
      if (attempts >= maxAttempts) {
        return {
          reply: "عذراً، حدث خطأ تقني. حاول مرة أخرى 😊",
          stage: "GREETING",
          score: 10,
          orderConfirmed: false,
          sendImages: false,
          cancelOrder: false,
          cancelAppointment: false,
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

function detectReorderIntent(text) {
  const t = String(text || "").toLowerCase()
  if (!t.trim()) return false
  // Darija/Arabic/French/English common patterns
  return (
    /(\b(again|re-?order|another)\b)/i.test(t) ||
    /(مرة\s*أخرى|مره\s*اخرى|بغيت\s*نطلب\s*مرة\s*أخرى|بغيت\s*نطلب\s*مره\s*اخرى|عاود|عاودت|زيد|زيدي|نفس|نفسو|نفسها|نفس\s*منتج|نفس\s*المنتج)/i.test(t) ||
    /(encore|recommander|même\s+produit|la\s+même)/i.test(t)
  )
}

function detectSameProductIntent(text) {
  const t = String(text || "").toLowerCase()
  return /(نفس|نفسو|نفسها|نفس\s*منتج|نفس\s*المنتج|same|même\s+produit)/i.test(t)
}

function detectRebookIntent(text) {
  const t = String(text || "").toLowerCase()
  if (!t.trim()) return false
  return /(بغيت\s*(نحجز|نحدد|ندير)\s*(مرة\s*أخرى|مره\s*اخرى)|مرة\s*أخرى|مره\s*اخرى|عاود|زيد|حجز\s*جديد|موعد\s*جديد|rebook|book\s*again|réserver\s*encore|rdv\s*encore|rendez-?vous\s*encore|reservation\s*encore|réservation\s*encore)/i.test(
    t
  )
}

function detectSameServiceIntent(text) {
  const t = String(text || "").toLowerCase()
  if (!t.trim()) return false
  return /(نفس\s*(الخدمة|سيرفيس)|نفسها|نفسو|same\s*service|même\s*service|la\s*même\s*prestation)/i.test(
    t
  )
}

function detectTrackingIntent(text) {
  const t = String(text || "").toLowerCase()
  if (!t.trim()) return false
  return /(فين\s*وصل|فين\s*واصلة|فين\s*جات|واش\s*وصلات|واش\s*وصل|تتبع|تراكن|tracking|suivi|où\s*est|elle\s*est\s*où)/i.test(t)
}

function detectAppointmentStatusIntent(text) {
  const t = String(text || "").toLowerCase()
  if (!t.trim()) return false
  return /(فين\s*وصل\s*الموعد|فين\s*وصل\s*الحجز|واش\s*تأكد\s*الموعد|واش\s*تأكد\s*الحجز|اش\s*من\s*حالة\s*الموعد|اش\s*من\s*حالة\s*الحجز|rendez-?vous|rdv|réservation|reservation|confirmé|confirmée|confirm|status)/i.test(
    t
  )
}

function formatAppointmentStatusLabel(status, lang = "darija") {
  const ar = {
    PENDING: "في الانتظار ⏳",
    CONFIRMED: "مؤكد ✅",
    CANCELLED: "ملغي ❌",
    COMPLETED: "مكتمل ✅",
  }
  const fr = {
    PENDING: "En attente ⏳",
    CONFIRMED: "Confirmé ✅",
    CANCELLED: "Annulé ❌",
    COMPLETED: "Terminé ✅",
  }
  const map = lang === "french" ? fr : ar
  return map[status] || status
}

function formatOrderStatusLabel(status, lang = "darija") {
  const ar = {
    PENDING: "في الانتظار ⏳",
    CONFIRMED: "مؤكدة ✅",
    SHIPPED: "فـ الطريق 🚚",
    DELIVERED: "تسلّمات 📦",
    CANCELLED: "ملغية ❌",
  }
  const fr = {
    PENDING: "En attente ⏳",
    CONFIRMED: "Confirmée ✅",
    SHIPPED: "Expédiée 🚚",
    DELIVERED: "Livrée 📦",
    CANCELLED: "Annulée ❌",
  }
  const map = lang === "french" ? fr : ar
  return map[status] || status
}

function safeObj(x) {
  if (!x || typeof x !== "object") return {}
  if (Array.isArray(x)) return {}
  return x
}

// معالجة رسالة واردة كاملة
export async function processIncomingMessage({
  userId,
  customerPhone,
  customerName,
  messageText,
  whatsappMediaId = null,
}) {
  try {
    console.log(`🔍 [processIncomingMessage] userId=${userId}, hasPhone=${!!customerPhone}, hasName=${!!customerName}`)
    
    // 1. جلب Agent مع المنتجات والردود
    const agent = await prisma.agent.findUnique({
      where: { userId },
      include: {
        objectionReplies: {
          orderBy: { order: "asc" }
        }
      }
    })

    if (!agent || !agent.isActive) {
      console.log(`⏸️ [processIncomingMessage] Agent not found or inactive`)
      return { reply: null, skipped: true, imageUrls: [] }
    }
    console.log(`✅ [processIncomingMessage] Agent found: ${agent.id}`)

    // تطبيع رقم الهاتف
    const normalizedPhone = normalizePhone(customerPhone)
    if (!normalizedPhone) {
      console.error(`❌ [processIncomingMessage] Invalid phone number provided`)
      return { reply: null, skipped: true, imageUrls: [] }
    }
    console.log(`📞 [processIncomingMessage] Phone normalized`)

    // 2. إيجاد أو إنشاء الزبون
    let customer = await prisma.customer.findFirst({
      where: { userId, phone: normalizedPhone }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          name: customerName,
          phone: normalizedPhone,
          tag: "NEW",
        }
      })
      console.log(`✅ [processIncomingMessage] Created new customer: ${customer.id}`)
    } else {
      console.log(`✅ [processIncomingMessage] Found existing customer: ${customer.id}`)
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeen: new Date() }
      })
    }

    // 3. إيجاد أو إنشاء محادثة نشطة
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        customerId: customer.id,
        stage: { notIn: ["CLOSED", "ABANDONED", "ARCHIVED"] },
        updatedAt: { gte: oneDayAgo }
      },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 50 }
      },
      orderBy: { updatedAt: "desc" }
    })
    
    if (!conversation) {
      const duplicateCustomers = await prisma.customer.findMany({
        where: { userId, phone: normalizedPhone },
        select: { id: true }
      })
      const customerIds = duplicateCustomers.map(c => c.id)
      
      if (customerIds.length > 0) {
        for (const withDateFilter of [true, false]) {
          conversation = await prisma.conversation.findFirst({
            where: {
              userId,
              customerId: { in: customerIds },
              stage: { notIn: ["CLOSED", "ABANDONED", "ARCHIVED"] },
              ...(withDateFilter && { updatedAt: { gte: oneDayAgo } }),
            },
            include: {
              messages: { orderBy: { createdAt: "asc" }, take: 50 }
            },
            orderBy: { updatedAt: "desc" }
          })
          if (conversation) break
        }
        if (conversation && conversation.customerId !== customer.id) {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { customerId: customer.id }
          })
        }
      }
    }

    const isServiceMode = agent.mode === "service"

    if (!conversation) {
      // 🔧 FIX: التحقق من وجود محادثة CLOSED حديثة (آخر 24 ساعة) وإعادة فتحها
      const recentClosedConversation = await prisma.conversation.findFirst({
        where: {
          userId,
          customerId: customer.id,
          stage: "CLOSED",
          updatedAt: { gte: oneDayAgo }
        },
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 50 }
        },
        orderBy: { updatedAt: "desc" }
      })

      if (recentClosedConversation) {
        // إعادة فتح المحادثة المغلقة حديثاً
        conversation = await prisma.conversation.update({
          where: { id: recentClosedConversation.id },
          data: {
            stage: "DISCOVERY",
            updatedAt: new Date()
          }
          // ✅ [FIX] لا نحمل messages هنا، نحملهم منفصلاً باش نضمن freshness
        })

        // ✅ [FIX] إعادة تحميل الرسائل بشكل منفصل من DB للتأكد من freshness
        const freshMessages = await prisma.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "asc" },
          take: 50
        })
        conversation.messages = freshMessages

        console.log(`🔄 [processIncomingMessage] Reopened recent CLOSED conversation: ${conversation.id} | Loaded ${freshMessages.length} fresh messages`)
      } else {
        // أرشفة المحادثات القديمة وإنشاء محادثة جديدة
        const archivedCount = await prisma.conversation.updateMany({
          where: { userId, customerId: customer.id, stage: "CLOSED" },
          data: { stage: "ARCHIVED" }
        })
        if (archivedCount.count > 0) {
          console.log(`📦 Archived ${archivedCount.count} old CLOSED conversation(s)`)
        }

        conversation = await prisma.conversation.create({
          data: {
            userId,
            customerId: customer.id,
            stage: "GREETING",
            score: 10,
            type: isServiceMode ? "service" : "product",
            context: {},
          },
          include: { messages: true }
        })
        console.log(`✅ Created new conversation: ${conversation.id}`)
      }
    }

    // Ensure context is always an object
    conversation.context = safeObj(conversation.context)

    // 4. حفظ رسالة الزبون
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: messageText,
        ...(whatsappMediaId ? { whatsappMediaId } : {}),
      }
    })

    // ✅ إضافة الرسالة الجديدة للـ context لضمان دخولها في الاستخراج
    conversation.messages = [...(conversation.messages || []), { role: "USER", content: messageText }]

    // ✅ Re-book flow (Services): reuse last confirmed appointment details
    if (isServiceMode && detectRebookIntent(messageText)) {
      try {
        const ctx = safeObj(conversation.context)
        const lastCtx = safeObj(ctx.lastConfirmedService)

        const lastAppointment = await prisma.appointment.findFirst({
          where: {
            userId,
            customerId: customer.id,
            status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
          },
          orderBy: { date: "desc" },
          select: { id: true, serviceId: true, serviceName: true, date: true, status: true },
        })

        const base = lastAppointment || (lastCtx.serviceName ? { serviceName: lastCtx.serviceName, date: lastCtx.date } : null)
        const wantsSame = detectSameServiceIntent(messageText) || /نفس/i.test(String(messageText || ""))

        if (base?.serviceName && wantsSame) {
          const lang = agent.language === "french" ? "french" : agent.language === "arabic" ? "arabic" : "darija"
          const dateStr = base.date
            ? new Date(base.date).toLocaleDateString(lang === "french" ? "fr-MA" : "ar-MA", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : null
          const timeStr = base.date
            ? new Date(base.date).toLocaleTimeString(lang === "french" ? "fr-MA" : "ar-MA", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null

          const ask =
            lang === "french"
              ? `Parfait 👌 Tu veux la même prestation "${base.serviceName}".\n\nTu veux garder le même créneau (${dateStr || "—"} à ${timeStr || "—"}) ou tu changes la date/heure ?`
              : `مزيان 👌 بغيتي نفس الخدمة "${base.serviceName}".\n\nواش نخلي نفس النهار والساعة (${dateStr || "—"} فـ ${timeStr || "—"}) ولا تبدّل التاريخ/الوقت؟`

          await prisma.message.create({
            data: { conversationId: conversation.id, role: "AGENT", content: ask },
          })
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              stage: "DISCOVERY",
              updatedAt: new Date(),
              isRead: false,
              score: Math.max(conversation.score || 0, 55),
              context: {
                ...ctx,
                rebook: {
                  startedAt: new Date().toISOString(),
                  base: {
                    serviceId: base.serviceId || lastCtx.serviceId || null,
                    serviceName: base.serviceName || null,
                    date: base.date || lastCtx.date || null,
                  },
                },
              },
            },
          })

          return { reply: ask, stage: "DISCOVERY", score: Math.max(conversation.score || 0, 55), orderConfirmed: false, imageUrls: [], conversationId: conversation.id }
        }
      } catch (e) {
        console.error("❌ [processIncomingMessage] rebook flow error:", e?.message || e)
      }
      // fall back to normal AI flow
    }

    // ✅ Deterministic intent (Services): appointment status / confirmation
    if (isServiceMode && detectAppointmentStatusIntent(messageText)) {
      try {
        const latest = await prisma.appointment.findFirst({
          where: { userId, customerId: customer.id },
          orderBy: { date: "desc" },
          select: {
            serviceName: true,
            status: true,
            date: true,
          },
        })

        if (latest) {
          const lang = agent.language === "french" ? "french" : agent.language === "arabic" ? "arabic" : "darija"
          const statusLabel = formatAppointmentStatusLabel(latest.status, lang)
          const date = new Date(latest.date).toLocaleDateString(lang === "french" ? "fr-MA" : "ar-MA", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          const time = new Date(latest.date).toLocaleTimeString(lang === "french" ? "fr-MA" : "ar-MA", {
            hour: "2-digit",
            minute: "2-digit",
          })

          const replyText =
            lang === "french"
              ? `Bien sûr 😊\n🔧 Service: ${latest.serviceName}\n📌 Statut: ${statusLabel}\n📅 ${date} — ${time}`
              : `أكيد 😊\n🔧 الخدمة: ${latest.serviceName}\n📌 الحالة: ${statusLabel}\n📅 ${date} — ${time}`

          await prisma.message.create({
            data: { conversationId: conversation.id, role: "AGENT", content: replyText },
          })
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              updatedAt: new Date(),
              isRead: false,
              context: {
                ...safeObj(conversation.context),
                lastAppointmentStatusAskedAt: new Date().toISOString(),
                lastAppointmentSnapshot: {
                  serviceName: latest.serviceName,
                  status: latest.status,
                  date: latest.date,
                },
              },
            },
          })

          return { reply: replyText, stage: conversation.stage, score: conversation.score, orderConfirmed: false, imageUrls: [], conversationId: conversation.id }
        }
      } catch (e) {
        console.error("❌ [processIncomingMessage] appointment status intent error:", e?.message || e)
      }
      // fall back to normal AI flow
    }

    // ✅ Deterministic intent: "Where is my order?" / tracking
    if (!isServiceMode && detectTrackingIntent(messageText)) {
      try {
        const latest = await prisma.order.findFirst({
          where: { userId, customerId: customer.id },
          orderBy: { createdAt: "desc" },
          select: {
            productName: true,
            status: true,
            trackingNumber: true,
            createdAt: true,
            city: true,
          },
        })
        if (latest) {
          const lang = agent.language === "french" ? "french" : agent.language === "arabic" ? "arabic" : "darija"
          const statusLabel = formatOrderStatusLabel(latest.status, lang)
          const date = new Date(latest.createdAt).toLocaleDateString(lang === "french" ? "fr-MA" : "ar-MA")
          const trackingLink =
            latest.trackingNumber && agent.trackingUrlTemplate
              ? String(agent.trackingUrlTemplate).replace(/\{tracking\}/g, latest.trackingNumber)
              : null

          const replyText =
            lang === "french"
              ? `Bien sûr 😊\n📦 Commande: ${latest.productName}\n📌 Statut: ${statusLabel}\n📅 Date: ${date}${
                  latest.trackingNumber ? `\n🔎 Tracking: ${latest.trackingNumber}` : ""
                }${trackingLink ? `\n🔗 Lien: ${trackingLink}` : ""}`
              : `أكيد 😊\n📦 الطلبية: ${latest.productName}\n📌 الحالة: ${statusLabel}\n📅 التاريخ: ${date}${
                  latest.trackingNumber ? `\n🔎 رقم التتبع: ${latest.trackingNumber}` : ""
                }${trackingLink ? `\n🔗 رابط التتبع: ${trackingLink}` : ""}`

          await prisma.message.create({
            data: { conversationId: conversation.id, role: "AGENT", content: replyText },
          })
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              updatedAt: new Date(),
              isRead: false,
              context: {
                ...safeObj(conversation.context),
                lastOrderStatusAskedAt: new Date().toISOString(),
                lastOrderSnapshot: {
                  productName: latest.productName,
                  status: latest.status,
                  trackingNumber: latest.trackingNumber || null,
                  createdAt: latest.createdAt,
                },
              },
            },
          })

          return { reply: replyText, stage: conversation.stage, score: conversation.score, orderConfirmed: false, imageUrls: [], conversationId: conversation.id }
        }
      } catch (e) {
        console.error("❌ [processIncomingMessage] tracking intent error:", e?.message || e)
      }
      // If no order found, fall back to normal AI flow
    }

    // 4.5 جلب تاريخ الزبون
    let customerHistory = null
    try {
      const pastConversations = await prisma.conversation.findMany({
        where: { userId, customerId: customer.id, stage: "ARCHIVED" },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          totalAmount: true,
          updatedAt: true,
          type: true,
          messages: {
            where: { role: "USER" },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { content: true }
          }
        }
      })

      if (pastConversations.length > 0) {
        const historyLines = pastConversations.map((conv, i) => {
          const date = conv.updatedAt.toLocaleDateString("ar-MA")
          const amount = conv.totalAmount ? `بقيمة ${conv.totalAmount} درهم` : ""
          const lastMessages = conv.messages.map(m => m.content).join(" | ")
          return `- محادثة ${i + 1} (${date}): ${
            conv.type === "service" ? "حجز خدمة" : "شراء منتج"
          } ${amount}${lastMessages ? ` — آخر رسائله: "${lastMessages}"` : ""}`
        })
        customerHistory = [
          `هذا الزبون تعامل معنا ${pastConversations.length} مرة سابقاً:`,
          ...historyLines,
          `إجمالي مشترياته: ${customer.totalSpent} درهم`,
          `عدد طلباته: ${customer.ordersCount}`,
        ].join("\n")
      }
    } catch (err) {
      console.error("❌ Error fetching customer history:", err)
    }

    // 4.6 جلب مواعيد الزبون الحالية
    let appointmentsHistory = null
    try {
      const customerAppointments = await prisma.appointment.findMany({
        where: { customerId: customer.id },
        orderBy: { date: "desc" },
        take: 5
      })

      if (customerAppointments.length > 0) {
        const statusLabels = {
          PENDING: "في الانتظار",
          CONFIRMED: "مؤكد",
          CANCELLED: "ملغي",
          COMPLETED: "مكتمل"
        }

        const appointmentsLines = customerAppointments.map(app => {
          const date = new Date(app.date).toLocaleDateString("ar-MA")
          const status = statusLabels[app.status] || app.status
          return `- ${app.serviceName}: ${date} (${status})`
        })

        appointmentsHistory = appointmentsLines.join("\n")
        console.log(`📅 Found ${customerAppointments.length} appointments`)
      }
    } catch (err) {
      console.error("❌ Error fetching appointments:", err)
    }

    // 4.7 جلب طلبيات الزبون
    let ordersHistory = null
    try {
      const customerOrders = await prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          productName: true,
          quantity: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          trackingNumber: true,
        }
      })

      if (customerOrders.length > 0) {
        const statusLabels = {
          PENDING:   "في الانتظار ⏳",
          CONFIRMED: "مؤكد ✅",
          SHIPPED:   "في الطريق 🚚",
          DELIVERED: "تم التسليم 📦",
          CANCELLED: "ملغي ❌",
        }
        ordersHistory = customerOrders.map((o, i) => {
          const date = new Date(o.createdAt).toLocaleDateString("ar-MA")
          const status = statusLabels[o.status] || o.status
          const tracking = o.trackingNumber ? ` — رقم التتبع: ${o.trackingNumber}` : ""
          return `- طلب ${i + 1}: ${o.productName} × ${o.quantity} — ${o.totalAmount} درهم — ${status} (${date})${tracking}`
        }).join("\n")
        console.log(`📦 Found ${customerOrders.length} orders`)
      }
    } catch (err) {
      console.error("❌ Error fetching orders history:", err)
    }

    // 5. جلب المنتجات أو الخدمات
    let items = []
    let selectedItem = null
    
    if (isServiceMode) {
      items = await prisma.service.findMany({ where: { userId, isActive: true } })
      if (agent.selectedServiceId) {
        selectedItem = await prisma.service.findUnique({ where: { id: agent.selectedServiceId } })
      }
      if (!selectedItem) selectedItem = items.find(s => s.isActive) || null
    } else {
      items = await prisma.product.findMany({ where: { userId, isActive: true } })
      if (agent.selectedProductId) {
        selectedItem = await prisma.product.findUnique({ where: { id: agent.selectedProductId } })
      }
      if (!selectedItem) selectedItem = items.find(p => p.isActive) || null
    }

    // ✅ [NEW] Custom greeting message for first interaction
    // Check if this is the first message (no previous AGENT messages in conversation)
    const isFirstMessage = !conversation.messages?.some(m => m.role === "AGENT")
    const customGreeting = isServiceMode
      ? (agent.serviceWelcomeMessage?.trim() || agent.welcomeMessage?.trim())
      : agent.welcomeMessage?.trim()

    if (isFirstMessage && customGreeting) {
      // Use custom greeting template with placeholder replacement
      let greetingReply = customGreeting.replace(/\{name\}/g, customer.name || "عزيزي")
      
      console.log(`👋 Custom greeting used for first message`)

      // Save the greeting as AGENT message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "AGENT",
          content: greetingReply,
        }
      })

      // Update conversation stage
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          stage: "GREETING",
          updatedAt: new Date(),
        }
      })

      return {
        reply: greetingReply,
        stage: "GREETING",
        score: 10,
        orderConfirmed: false,
        imageUrls: [],
      }
    }

    // ✅ Re-order flow (Products): if customer wants to order again, reuse last confirmed details
    // This avoids re-asking name/city/address every time.
    if (!isServiceMode && detectReorderIntent(messageText)) {
      try {
        const lastOrder = await prisma.order.findFirst({
          where: {
            userId,
            customerId: customer.id,
            status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED", "PENDING"] },
          },
          orderBy: { createdAt: "desc" },
          select: {
            productId: true,
            productName: true,
            customerName: true,
            city: true,
            address: true,
            quantity: true,
          },
        })

        const wantsSame = detectSameProductIntent(messageText)
        const hasLast = Boolean(lastOrder?.productName)

        if (hasLast && wantsSame) {
          const lastCity = String(lastOrder.city || "").trim()
          const lastAddress = String(lastOrder.address || "").trim()
          const prodName = lastOrder.productName

          let askParts = []
          // Ask only what could change
          if (lastCity && lastAddress) {
            askParts.push(`واش نخلي نفس المدينة (${lastCity}) و العنوان (${lastAddress}) ولا تبدّل شي حاجة؟`)
          } else if (lastCity && !lastAddress) {
            askParts.push(`المدينة باقية (${lastCity}) ولا تبدّل؟ وشنو العنوان بالتفاصيل؟`)
          } else if (!lastCity && lastAddress) {
            askParts.push(`واش نخلي نفس العنوان (${lastAddress}) ولا تبدّل؟ وشنو المدينة؟`)
          } else {
            askParts.push(`شنو المدينة والعنوان بالتفاصيل؟`)
          }
          askParts.push(`وشحال بغيتي دابا من "${prodName}"؟ 1 ولا 2 ولا 3؟`)

          const replyText = `مزيان 👌 بغيتي نفس المنتج "${prodName}".\n\n${askParts.join("\n")}`

          // Save assistant message + update conversation stage so the UI/state stays consistent
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "AGENT",
              content: replyText,
            },
          })

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              stage: "DISCOVERY",
              updatedAt: new Date(),
              isRead: false,
              score: Math.max(conversation.score || 0, 55),
              context: {
                ...safeObj(conversation.context),
                reorder: {
                  startedAt: new Date().toISOString(),
                  base: {
                    productId: lastOrder.productId || null,
                    productName: lastOrder.productName || null,
                    customerName: lastOrder.customerName || null,
                    city: lastCity || null,
                    address: lastAddress || null,
                  },
                },
              },
            },
          })

          return {
            reply: replyText,
            stage: "DISCOVERY",
            score: Math.max(conversation.score || 0, 55),
            orderConfirmed: false,
            imageUrls: [],
          }
        }
      } catch (e) {
        console.error("❌ [processIncomingMessage] Reorder flow error:", e?.message || e)
        // If anything fails, fall back to normal AI flow
      }
    }

    // 6. توليد رد AI (for non-greeting messages or when no custom greeting)
    // لازم تكون let باش نقدر نعدّلها فـ final guard (city/address/qty)
    let { reply, stage, score, orderConfirmed, sendImages, cancelOrder, cancelAppointment } =
      await generateAIReply({
        agent,
        items,
        objectionReplies: agent.objectionReplies,
        conversationHistory: conversation.messages,
        userMessage: messageText,
        selectedItem,
        isService: isServiceMode,
        customerHistory,
        appointmentsHistory,
        ordersHistory,
        currentStage: conversation.stage,
        customerName: customer.name,
        customerTag: customer.tag,
      })

    console.log(`🤖 AI result: confirmed=${orderConfirmed}, stage=${stage}, cancelOrder=${cancelOrder}`)

    // 6.5 معالجة طلب الإلغاء من الزبون
    if (cancelOrder) {
      try {
        const recentOrder = await prisma.order.findFirst({
          where: { customerId: customer.id, status: { in: ["PENDING", "CONFIRMED"] } },
          orderBy: { createdAt: "desc" }
        })
        if (recentOrder) {
          await prisma.order.update({ where: { id: recentOrder.id }, data: { status: "CANCELLED" } })
          await prisma.notification.create({
            data: {
              userId,
              type: "SYSTEM",
              title: `fr:Commande annulée ❌||ar:طلبية ملغاة ❌`,
              message: `fr:${customer.name} a annulé sa commande||ar:${customer.name} ألغى طلبيته`,
            }
          })
          console.log(`✅ Order ${recentOrder.id.slice(0, 6)}... cancelled by customer request`)
        }
      } catch (err) { console.error(`❌ [processIncomingMessage] Error cancelling order:`, err.message) }
    }

    if (cancelAppointment) {
      try {
        const recentAppointment = await prisma.appointment.findFirst({
          where: { customerId: customer.id, status: { in: ["PENDING", "CONFIRMED"] } },
          orderBy: { date: "desc" }
        })
        if (recentAppointment) {
          await prisma.appointment.update({ where: { id: recentAppointment.id }, data: { status: "CANCELLED" } })
          await prisma.notification.create({
            data: {
              userId,
              type: "SYSTEM",
              title: `fr:Rendez-vous annulé ❌||ar:موعد ملغى ❌`,
              message: `fr:${customer.name} a annulé son rendez-vous||ar:${customer.name} ألغى موعده`,
            }
          })
          console.log(`✅ Appointment ${recentAppointment.id.slice(0, 6)}... cancelled by customer request`)
        }
      } catch (err) { console.error(`❌ [processIncomingMessage] Error cancelling appointment:`, err.message) }
    }

    // حساب قيمة الطلب
    const EXTRACTION_WINDOW = 10 // آخر 10 رسائل للاستخراج فقط
    let totalAmount = null
    let extractedCity = null
    let extractedAddress = null
    let extractedQty = 1
    if (orderConfirmed && selectedItem) {
      if (isServiceMode) {
        // ✅ Service mode: fixed price, no quantity/address extraction needed
        totalAmount = selectedItem.price
      } else {
        // ✅ [FIX] Product mode: reload messages from DB to avoid race condition with in-memory array
        const freshMessages = await prisma.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true },
        })

        // ✅ [FIX] استخدام آخر 10 رسائل USER فقط لتجنب التقاط بيانات قديمة أو رسائل AGENT
        const userMessages = freshMessages.filter(m => m.role === 'USER')
        const recentUserMsgs = userMessages.slice(-EXTRACTION_WINDOW)
        const recentMessagesText = recentUserMsgs.map(m => m.content).join('\n')

        console.log(`📍 [Extraction] Using ${recentUserMsgs.length} USER messages from ${userMessages.length} total`)

        // ✅ FINAL: خزن المدينة والعنوان منفصلين
        const extracted = extractCityAndAddressFromUserMessages(recentUserMsgs)
        extractedCity = extracted.city
        extractedAddress = extracted.address
        if (extractedAddress) {
          console.log(`📍 [Address] ✅ city="${extractedCity || '-'}" addr="${extractedAddress.slice(0, 60)}"`)
          } else {
          console.warn(`⚠️ [Address] ❌ No address found in last ${recentUserMsgs.length} user messages`)
        }

        // ✅ [FIX] استخرج الكمية من USER فقط كذلك
        extractedQty = extractQuantityFromMessages(recentMessagesText)
        totalAmount = selectedItem.price * extractedQty
        console.log(`🔢 [Quantity] ✅ Extracted: ${extractedQty} | Total: ${totalAmount} DH`)
      }
    }

    // ✅ FINAL GUARD: لا تسجّل Order ولا تغلق المحادثة إلا إذا توفرت المدينة + العنوان + الكمية
    // هذا يمنع أي نقص/خلط بسبب اختلاف طريقة كتابة الزبناء (عربي/فرنسي/لاتيني)
    if (!isServiceMode && orderConfirmed) {
      const missing = []
      if (!extractedCity) missing.push("city")
      if (!extractedAddress) missing.push("address")
      if (!extractedQty || extractedQty < 1) missing.push("quantity")

      if (missing.length > 0) {
        // ✅ Create a draft order so the user can review/fix from dashboard
        // Avoid duplicates: only one draft per conversation within 5 minutes
        try {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          const existingDraft = await prisma.order.findFirst({
            where: {
              userId,
              customerId: customer.id,
              conversationId: conversation.id,
              createdAt: { gte: fiveMinutesAgo },
              notes: { contains: "⚠️ DRAFT_ORDER" },
            },
            select: { id: true },
          })

          if (!existingDraft && selectedItem) {
            const safeQty = extractedQty && extractedQty >= 1 ? extractedQty : 1
            const draftTotal = selectedItem.price * safeQty
            await prisma.order.create({
              data: {
                userId,
                customerId: customer.id,
                conversationId: conversation.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                productId: selectedItem.id,
                productName: selectedItem.name,
                quantity: safeQty,
                totalAmount: draftTotal,
                city: extractedCity,
                address: extractedAddress,
                status: "PENDING",
                notes: `⚠️ DRAFT_ORDER — missing: ${missing.join(", ")} — المحادثة: ${conversation.id}`,
              }
            })
          }
        } catch (e) {
          // keep silent; we still ask user for missing info
        }

        const lang = agent?.language === "darija"
          ? "darija"
          : agent?.language === "french"
            ? "french"
            : "arabic"

        const ask = (() => {
          if (lang === "french") {
            if (missing.length === 1 && missing[0] === "city") return "Parfait. Tu es dans quelle ville ?"
            if (missing.length === 1 && missing[0] === "address") return "Top. Donne-moi l’adresse complète (quartier/rue + رقم الدار إذا كاين)."
            if (missing.length === 1 && missing[0] === "quantity") return "Combien de pièces tu veux exactement ?"
            return "Juste pour confirmer: c’est quoi la ville et l’adresse complète (et la quantité) ?"
          }
          if (lang === "darija") {
            if (missing.length === 1 && missing[0] === "city") return "مزيان 👌 شنو هي المدينة ديالك؟"
            if (missing.length === 1 && missing[0] === "address") return "مزيان 👌 عطيني العنوان الكامل ديالك (الحي/الزنقة/رقم الدار) باش نكمّلو الطلبية."
            if (missing.length === 1 && missing[0] === "quantity") return "شحال من وحدة بغيتي بالضبط؟"
            return "باش نكملو الطلبية: عطيني المدينة + العنوان الكامل + شحال من وحدة بغيتي."
          }
          // Arabic
          if (missing.length === 1 && missing[0] === "city") return "ممتاز 👌 ما هي مدينتك؟"
          if (missing.length === 1 && missing[0] === "address") return "ممتاز 👌 ما هو العنوان الكامل (الحي/الشارع/رقم المنزل)؟"
          if (missing.length === 1 && missing[0] === "quantity") return "كم الكمية المطلوبة بالضبط؟"
          return "لإكمال الطلب: ما هي المدينة والعنوان الكامل والكمية؟"
        })()

        reply = ask
        stage = "CLOSING"
        score = Math.max(score || 0, 80)
        orderConfirmed = false
      }
    }

    // إعداد الصور
    let imageUrls = []
    if (sendImages && selectedItem) {
      imageUrls = parseImages(selectedItem.images)
    }

    // 7. حفظ رد Agent
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "AGENT",
        content: reply,
      }
    })

    // 8. تحديث المحادثة
    // لا نحفظ CLOSED إلا مع orderConfirmed — وإلا الواجهة تعرض "طلب/حجز مؤكد" بلا طلبية فعلية
    let finalStage = stage || conversation.stage
    let finalScore = Math.max(conversation.score || 0, score || 0)
    if (!orderConfirmed && stage === "CLOSED" && conversation.stage !== "CLOSED") {
      finalStage = "CLOSING"
      finalScore = Math.min(finalScore, SCORE_MAP.CLOSING)
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        stage: finalStage,
        score: finalScore,
        isRead: false,
        updatedAt: new Date(),
        ...(orderConfirmed && {
          stage: "CLOSED",
          score: 100,
          totalAmount,
        }),
      },
    })

    // 9. تحديث الزبون + إنشاء الموعد
    if (orderConfirmed) {
      const newTotalSpent = customer.totalSpent + (totalAmount || 0)
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: newTotalSpent,
          tag: (customer.ordersCount + 1) >= 2 ? "VIP" : "REGULAR",
        }
      })

      if (!isServiceMode && selectedItem) {
        try {
          // ✅ [FIX] استخدم الكمية المستخرجة مسبقاً من USER messages فقط
          console.log(`📍 [Address] Saving to DB: city="${extractedCity || '—'}" addr="${extractedAddress || '⚠️ NULL'}"`)
          console.log(`📦 [Quantity] Using pre-extracted qty: ${extractedQty}`)
          
          const order = await prisma.order.create({
            data: {
              userId,
              customerId: customer.id,
              conversationId: conversation.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              productId: selectedItem.id,
              productName: selectedItem.name,
              quantity: extractedQty,
              totalAmount: selectedItem.price * extractedQty,
              city: extractedCity,
              address: extractedAddress,
              status: "PENDING",
              notes: extractedAddress
                ? `طلب تلقائي من واتساب — المحادثة: ${conversation.id}`
                : `⚠️ طلب بدون عنوان — يحتاج متابعة يدوية — المحادثة: ${conversation.id}`,
            }
          })
          console.log(`✅ Order created: ${order.id.slice(0, 6)}... | Addr: "${order.address?.slice(0, 30)}..." | Qty: ${order.quantity} | Total: ${order.totalAmount}`)

          // ✅ Persist “memory” for next turns (re-order / follow-up questions)
          try {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                context: {
                  ...safeObj(conversation.context),
                  lastConfirmed: {
                    at: new Date().toISOString(),
                    productId: selectedItem.id,
                    productName: selectedItem.name,
                    quantity: extractedQty,
                    city: extractedCity || null,
                    address: extractedAddress || null,
                    customerName: customer.name || null,
                    orderId: order.id,
                  },
                },
              },
            })
          } catch (e) {
            console.error("❌ [processIncomingMessage] context save error:", e?.message || e)
          }

          // ✅ نقص المخزون بعد تأكيد الطلب
          try {
            const currentProduct = await prisma.product.findUnique({ where: { id: selectedItem.id }, select: { stock: true } })
            if (currentProduct && currentProduct.stock !== null && currentProduct.stock !== undefined) {
              const newStock = Math.max(0, currentProduct.stock - order.quantity)
              await prisma.product.update({ where: { id: selectedItem.id }, data: { stock: newStock } })
              console.log(`📦 Stock updated: product=${selectedItem.id.slice(0, 6)}... ${currentProduct.stock} → ${newStock}`)
            }
          } catch (err) {
            console.error(`❌ [processIncomingMessage] Error updating stock:`, err.message)
          }
        } catch (err) {
          console.error(`❌ [processIncomingMessage] Error creating order:`, err.message)
        }
      }

      if (isServiceMode && selectedItem) {
        try {
          // ✅ إعادة تحميل الرسائل من قاعدة البيانات للحصول على الرسائل الأخيرة فقط
          const allConversationMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
            take: 50
          })

          // ✅ استخدام آخر 10 رسائل فقط للاستخراج لتجنب التقاط بيانات قديمة
          const recentMessagesForExtraction = allConversationMessages.slice(-EXTRACTION_WINDOW)
          const recentMessagesText = recentMessagesForExtraction
            .map(m => m.content)
            .join(" ")

          // 🔍 DEBUG: Log what we're extracting from (sanitized)
          console.log(`🔍 Reloaded ${allConversationMessages.length} messages, using last ${EXTRACTION_WINDOW} for extraction, total chars: ${recentMessagesText.length}`)

          console.log(`📅 Extracting date from recent messages...`)

          // ✅ استخراج التاريخ بالدالة الذكية من السياق الحديث
          let extractedDate = extractDateFromMessages(recentMessagesText)

          // Fallback أخير: غدا الساعة 10:00
          if (!extractedDate) {
            console.log(`📅 No date found — using tomorrow 10:00 as fallback`)
            extractedDate = new Date()
            extractedDate.setDate(extractedDate.getDate() + 1)
            extractedDate.setHours(10, 0, 0, 0)
          } else {
            // ✅ استخراج الوقت بالدالة الذكية من السياق الحديث
            const time = extractTimeFromMessages(recentMessagesText)
            if (time) {
              extractedDate.setHours(time.hours, time.minutes, 0, 0)
              console.log(`⏰ Time set: ${time.hours}:${time.minutes}`)
            } else {
              // وقت افتراضي 10:00 إذا ما لقيناش وقت
              extractedDate.setHours(10, 0, 0, 0)
              console.log(`⏰ No time found — defaulting to 10:00`)
            }
          }

          console.log(`📅 Final appointment date: ${extractedDate.toISOString()}`)

          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              customerId: customer.id,
              serviceId: selectedItem.id,
              createdAt: { gte: fiveMinutesAgo }
            }
          })

          if (existingAppointment) {
            console.log(`⚠️ Duplicate appointment skipped (${existingAppointment.id.slice(0, 6)}...)`)
          } else {
            const appointment = await prisma.appointment.create({
              data: {
                userId,
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                serviceId: selectedItem.id,
                serviceName: selectedItem.name,
                date: extractedDate,
                status: "CONFIRMED",
                notes: `حجز تلقائي من واتساب — المحادثة: ${conversation.id}`,
                reminderSent: false,
                confirmationSent: true,
              }
            })
            console.log(`✅ Appointment created: ${appointment.id.slice(0, 6)}... on ${extractedDate.toISOString()}`)

            // ✅ Persist “memory” for next turns (book again / ask about appointment)
            try {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  context: {
                    ...safeObj(conversation.context),
                    lastConfirmedService: {
                      at: new Date().toISOString(),
                      serviceId: selectedItem.id,
                      serviceName: selectedItem.name,
                      date: appointment.date,
                      status: appointment.status,
                      appointmentId: appointment.id,
                      customerName: customer.name || null,
                    },
                  },
                },
              })
            } catch (e) {
              console.error("❌ [processIncomingMessage] service context save error:", e?.message || e)
            }
          }
        } catch (err) {
          console.error(`❌ [processIncomingMessage] Error creating appointment:`, err.message)
        }
      }

      await prisma.notification.create({
        data: {
          userId,
          type: "NEW_ORDER",
          title: isServiceMode
            ? `fr:Nouvelle réservation! 🎉||ar:حجز جديد! 🎉`
            : `fr:Nouvelle commande! 🎉||ar:طلب جديد! 🎉`,
          message: isServiceMode
            ? `fr:${customerName} a confirmé une réservation de ${totalAmount || 0} DH||ar:${customerName} أكد حجز بقيمة ${totalAmount || 0} درهم`
            : `fr:${customerName} a confirmé une commande de ${totalAmount || 0} DH||ar:${customerName} أكد طلب بقيمة ${totalAmount || 0} درهم`,
        }
      })
    }

    // 10. إشعار اعتراض
    if (stage === "OBJECTION") {
      await prisma.notification.create({
        data: {
          userId,
          type: "OBJECTION_ALERT",
          title: `fr:Objection à suivre 🔔||ar:اعتراض يحتاج متابعة 🔔`,
          message: `fr:${customerName} — Score ${score}%||ar:${customerName} — Score ${score}%`,
        }
      })
    }

    return {
      reply,
      stage: orderConfirmed ? "CLOSED" : finalStage,
      score: orderConfirmed ? 100 : finalScore,
      orderConfirmed,
      imageUrls,
      conversationId: conversation.id,
    }
  } catch (error) {
    console.error("processIncomingMessage error:", error)
    return {
      reply: "عذراً، حدث خطأ. حاول مرة أخرى 😊",
      imageUrls: [],
      error: true,
      conversationId: conversation?.id || null,
    }
  }
}