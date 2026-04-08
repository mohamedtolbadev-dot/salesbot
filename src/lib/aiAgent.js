// منطق AI Agent — يحلل ويرد على الرسائل

import { prisma } from "@/lib/prisma"

// دالة تطبيع رقم الهاتف (منع التكرار)
function normalizePhone(phone) {
  if (!phone) return null
  
  let normalized = phone.replace(/\D/g, "")
  
  // ✅ [FIX] دعم الأرقام الدولية (فرنسا، أمريكا/كندا)
  if (normalized.startsWith("33") && normalized.length === 11) {
    // رقم فرنسي — خليه كما هو
    console.log(`✅ [FIX] normalizePhone: رقم فرنسي ${normalized}`)
    return normalized
  }
  if (normalized.startsWith("1") && normalized.length === 11) {
    // رقم أمريكي/كندي — خليه كما هو
    console.log(`✅ [FIX] normalizePhone: رقم أمريكي/كندي ${normalized}`)
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

// دالة توليد رسالة تحديث حالة الموعد
export async function generateStatusUpdateMessage({
  agent,
  appointment,
  newStatus,
  customerName,
}) {
  try {
    const statusLabels = {
      PENDING:   { label: "في الانتظار", emoji: "⏳" },
      CONFIRMED: { label: "مؤكد ✅", emoji: "✅" },
      CANCELLED: { label: "ملغي ❌", emoji: "❌" },
      COMPLETED: { label: "مكتمل 🎉", emoji: "🎉" },
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

    const data = await response.json()
    let message = data.choices?.[0]?.message?.content

    if (!message) {
      message = getAppointmentFallbackMessage(newStatus, {
        customerName, date, time, serviceName: appointment.serviceName,
      }, agent?.language)
    }

    return { message: message.trim() }
  } catch (error) {
    console.error("❌ generateStatusUpdateMessage error:", error)
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      agent: agent?.name,
      appointment: appointment?.id,
      newStatus,
      customerName,
    })
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

  // 🔍 DEBUG
  console.log(`🔍 [extractDateFromMessages] Input type: ${typeof text}, length: ${text?.length || 0}`)
  console.log(`🔍 [extractDateFromMessages] Input preview: "${text?.substring(0, 100)}..."`)

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
        console.log(`📅 [extractDate] Numeric pattern matched: ${match[1]} → ${normalized}`)
        return parsed
      } else if (!isNaN(parsed.getTime())) {
        console.log(`⚠️ [extractDate] Date is in the past: ${match[1]} → ${normalized}, will use fallback`)
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

  // 🔍 DEBUG: Log if no day matched
  console.log(`🔍 [extractDate] Checking day names in text: "${text?.substring(0, 50)}..."`)
  console.log(`🔍 [extractDate] Day names checked: ${dayMap.map(d => d.names.join('/')).join(', ')}`)

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
  const buyContext = /(?:بغيت|اريد|نبغي|خود|اعطيني|طلب)\s+(\S+)/i
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
    /(?:بغيت|اريد|نبغي|خود|اعطيني|طلب|نحتاج|ناخذ)\s*(?:حبة|حبات|قطعة|قطع|وحدة|وحدات|وحده|مع)?\s*(\d+)|(\d+)\s*(?:حبة|حبات|قطعة|قطع|وحدة|وحدات|pieces?)/i
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
  const buySegments = allMessages.match(/(?:بغيت|اريد|نبغي|خود|اعطيني|طلب)[^.،\n]{0,30}/gi) || []
  for (const seg of buySegments) {
    for (const [word, qty] of Object.entries(numberWords)) {
      if (seg.includes(word)) {
        console.log(`🔢 [extractQuantity] Segment word: "${word}" = ${qty}`)
        return qty
      }
    }
  }

  return 1
}

/* ════════════════════════════════════════════════
   📍 استخراج العنوان من رسائل المحادثة
   ════════════════════════════════════════════════ */
function extractAddressFromMessages(allMessages) {
  const text = allMessages.toLowerCase()
  
  // أنماط العنوان الشائعة في الدارجة والعربية
  const addressPatterns = [
    // "عنواني هو" / "العنوان هو" / "سكن في" / "عندي في"
    /(?:عنواني|العنوان|سكن|عندي|ساكن)\s*(?:هو|فى|في)?\s*[:\-]?\s*([^\n,.]+)/i,
    // "سكن في [عنوان]" 
    /(?:سكن|ساكن)\s+(?:فى|في)\s+([^\n,.]+)/i,
    // "[مدينة] [حي]" - مدن مغربية شائعة
    /(?:الدار البيضاء|كازا|الرباط|سلا|فاس|مكناس|مراكش|طنجة|أكادير|وجدة|تطوان|الخميسات|بني ملال|آسفي|الجديدة|القنيطرة|تازة|ورزازات|الحسيمة|الناظور|العيون|طانطان|السمارة|تزنيت|إنزكان|آيت ملول|تمارة|خريبكة|بوجدور|طرفاية)(?:\s+[^\n,.]+)?/i,
    // أحياء شائعة في المدن المغربية
    /(?:حي|شارع|زنقة|سيدي|تجزئة|دوار|الحي)\s+([^\n,.]+)/i,
    // "رقم " / "زنقة " / "شارع "
    /(?:رقم|زنقة|شارع|طريق|شارع|دوار)\s+(\d+[^\n,.]*)/i,
  ]
  
  for (const pattern of addressPatterns) {
    const match = allMessages.match(pattern)
    if (match && match[1]) {
      const address = match[1].trim()
      if (address.length > 5) {
        console.log(`📍 [extractAddress] Found: "${address}"`)
        return address
      }
    }
  }
  
  // البحث عن عنوان بعد كلمات محددة
  const addressKeywords = ['عنوان', 'سكن', 'فناش', 'فناس', 'ساكن', 'التوصيل', 'نوصلك']
  for (const keyword of addressKeywords) {
    const idx = text.indexOf(keyword)
    if (idx !== -1) {
      // أخذ النص بعد الكلمة بحد أقصى 100 حرف
      const after = allMessages.slice(idx + keyword.length, idx + keyword.length + 100)
      const clean = after.replace(/^[\s:،,-]+/, '').split(/[\n,.]/)[0].trim()
      if (clean.length > 5) {
        console.log(`📍 [extractAddress] Found after "${keyword}": "${clean}"`)
        return clean
      }
    }
  }
  return null
}

// ✅ FIX: Prompt جديد — شخصية حية بدل قواعد روبوتية
function buildSystemPrompt(agent, items, objectionReplies, selectedItem, isService = false, customerHistory = null, appointmentsHistory = null, ordersHistory = null, currentStage = null, customerName = null, customerTag = null) {
  const itemTypeLabel = isService ? "الخدمات" : "المنتجات"
  
  let itemsList
  let hasImages = false
  let stockWarning = ""
  
  if (selectedItem) {
    const images = parseImages(selectedItem.images)
    hasImages = images.length > 0
    const durationInfo = isService && selectedItem.duration 
      ? ` — ${selectedItem.duration} دقيقة` 
      : ""
    // ✅ FIX: إضافة معلومات المخزون للـ AI
    const stockInfo = !isService && selectedItem.stock !== undefined && selectedItem.stock !== null
      ? (selectedItem.stock > 0 ? ` (المخزون: ${selectedItem.stock})` : ` ⚠️ نفد من المخزون`)
      : ""
    stockWarning = !isService && selectedItem.stock !== undefined && selectedItem.stock <= 0
    itemsList = `- ${selectedItem.name}: ${selectedItem.price} درهم${durationInfo}${stockInfo}`
    if (hasImages) itemsList += `\n- ${images.length} صورة متوفرة`
  } else {
    const allImages = items.filter(p => p.isActive).flatMap(p => parseImages(p.images))
    hasImages = allImages.length > 0
    itemsList = items
      .filter(p => p.isActive)
      .map(p => {
        const durationInfo = isService && p.duration ? ` — ${p.duration} دقيقة` : ""
        const stockInfo = !isService && p.stock !== undefined && p.stock !== null
          ? (p.stock > 0 ? ` (المخزون: ${p.stock})` : ` ⚠️ نفد`)
          : ""
        return `- ${p.name}: ${p.price} درهم${durationInfo}${stockInfo}`
      })
      .join("\n")
  }

  const objectionsList = objectionReplies
    .map(o => `"${o.trigger}" → رد: "${o.reply}"`)
    .join("\n")

  const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"
  const lang = agent.language === "darija" ? "darija" : agent.language === "french" ? "french" : "arabic"

  // ✅ [FIX] تكامل التعليمات المخصصة — إذا كان المستخدم كتب تعليمات خاصة، نستعملها كأولوية
  const customInstructions = agent.instructions?.trim()
  
  const personalities = {
    darija: {
      intro: customInstructions ? `أنت ${agent.name} — خبير مبيعات ذكي على واتساب.
${customInstructions}

⚠️ إذا نفد المنتج (stock = 0): قول "واه معلبالي هاد المنتج sold out دابا 😅" — ما تبيعش حاجة ما عندكش!` : `أنت ${agent.name} — حرايفي وبائع مغربي ناضي في واتساب.
شخصيتك: ولد الشعب، مطور، كايعرف يبيع ويشري، وقريب من الكليان.
تهضر دارجة حرة ديال ولاد البلاد (بلا بروتوكول، بلا رسميات خاوية).
هدفك: تجمع المعلومات (السلعة + شحال + العنوان) وتدوز الـ Confirmation في أسرع وقت.
⚠️ إذا نفد المنتج (stock = 0): قول "واه معلبالي هاد المنتج sold out دابا 😅" — ما تبيعش حاجة ما عندكش!`,
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
      confirmProduct: `ناضي! الطلب ديالك داز 🚀
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `الحجز ديالك تأكد 🎉 مرحبا بيك!
${confirmTag}
[STAGE:CLOSED]`,
    },
    french: {
      intro: `Tu es ${agent.name} — vendeur expert sur WhatsApp.
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
      confirmProduct: `Commande reçue 🎉 On t'envoie ça vite!
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `C'est réservé 🎉 À bientôt!
${confirmTag}
[STAGE:CLOSED]`,
    },
    arabic: {
      intro: `أنت ${agent.name} — بائع خبير على واتساب.
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
      confirmProduct: `أبشر! رح يوصلك بأقرب 🎉
${confirmTag}
[STAGE:CLOSED]`,
      confirmService: `تم تأكيد الحجز 🎉
${confirmTag}
[STAGE:CLOSED]`,
    }
  }

  const p = personalities[lang]

  return `${p.intro}

${itemsList ? `المنتجات/الخدمات المتاحة:\n${itemsList}\n` : ""}
${objectionsList ? `\n═══ ردود الاعتراضات ═══\n${objectionsList}\n` : ""}
${customerHistory ? `\n═══ تاريخ الزبون ═══\n${customerHistory}\n` : ""}

═══ هويتك إذا سُئلت ═══
"من أنت؟" → ${p.whoAreYou}
"هل أنت روبوت/AI؟" → ${p.robotReply}

═══ هدفك ═══
${isService 
  ? "تأكيد الحجز بأقل رسائل ممكن: الخدمة + التاريخ + الوقت = ملخص → تأكيد"
  : "تأكيد الطلبية بأقل رسائل ممكن: المنتج + الكمية + العنوان = ملخص → تأكيد"}

═══ نموذج الملخص والتأكيد ═══
${isService ? p.summaryService : p.summaryProduct}

عند الموافقة (نعم/واخا/تمام/ok):
${isService ? p.confirmService : p.confirmProduct}

═══ قواعد تقنية فقط ═══
- 1-3 أسطر في كل رد — لا أكثر
- سؤال واحد فقط في كل رسالة  
- لا تأكيد بدون ملخص أولاً
- لا ملخص بدون عنوان (mode: product)
- كل رد ينتهي بـ [STAGE:xxx]
${hasImages ? "- أضف [SEND_IMAGES] إذا طلب صور\n" : ""}- ${confirmTag} فقط بعد موافقة الزبون على الملخص
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
        console.log(`📝 [generateAIReply] Instructions preview: "${agent.instructions.substring(0, 100)}..."`)
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

      const data = await response.json()

      let reply = data.choices?.[0]?.message?.content
      
      console.log(`🤖 [generateAIReply] RAW AI RESPONSE: "${reply?.substring(0, 100)}..."`)

      if (!reply) {
        if (attempts < maxAttempts) {
          console.warn(`⚠️ محاولة ${attempts} فشلت — لا رد من AI. إعادة المحاولة...`)
          continue
        }
        return {
          reply: "عذراً، حدث خطأ. حاول مرة أخرى 😊",
          stage: null,
          orderConfirmed: false,
          cancelOrder: false,
          cancelAppointment: false,
        }
      }

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
      console.error(`❌ generateAIReply error (محاولة ${attempts}/${maxAttempts}):`, error.message)
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

// معالجة رسالة واردة كاملة
export async function processIncomingMessage({
  userId,
  customerPhone,
  customerName,
  messageText,
}) {
  try {
    console.log(`🔍 [processIncomingMessage] userId=${userId}, customerPhone=${customerPhone}, customerName=${customerName}`)
    
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
      console.error(`❌ [processIncomingMessage] Invalid phone number: ${customerPhone}`)
      return { reply: null, skipped: true, imageUrls: [] }
    }
    console.log(`📞 [processIncomingMessage] Phone normalized: ${customerPhone} → ${normalizedPhone}`)

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
          },
          include: {
            messages: { orderBy: { createdAt: "asc" }, take: 50 }
          }
        })
        console.log(`🔄 [${normalizedPhone}] Reopened recent CLOSED conversation: ${conversation.id}`)
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
          },
          include: { messages: true }
        })
        console.log(`✅ Created new conversation: ${conversation.id}`)
      }
    }

    // 4. حفظ رسالة الزبون
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: messageText,
      }
    })

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
        console.log(`📅 [${normalizedPhone}] Found ${customerAppointments.length} appointments`)
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
        console.log(`📦 [${normalizedPhone}] Found ${customerOrders.length} orders`)
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

    // 6. توليد رد AI
    const { reply, stage, score, orderConfirmed, sendImages, cancelOrder, cancelAppointment } =
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

    console.log(`🤖 [${normalizedPhone}] AI result: orderConfirmed=${orderConfirmed}, stage=${stage}, cancelOrder=${cancelOrder}, cancelAppointment=${cancelAppointment}`)

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
          console.log(`✅ [${normalizedPhone}] Order ${recentOrder.id} cancelled by customer request`)
        }
      } catch (err) { console.error(`❌ [${normalizedPhone}] Error cancelling order:`, err.message) }
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
          console.log(`✅ [${normalizedPhone}] Appointment ${recentAppointment.id} cancelled by customer request`)
        }
      } catch (err) { console.error(`❌ [${normalizedPhone}] Error cancelling appointment:`, err.message) }
    }

    // حساب قيمة الطلب
    let totalAmount = null
    let extractedAddress = null
    if (orderConfirmed && selectedItem) {
      const allMsgs = (conversation.messages || []).map(m => m.content).join(" ")
      extractedAddress = extractAddressFromMessages(allMsgs)
      const qty = extractQuantityFromMessages(allMsgs)
      totalAmount = selectedItem.price * qty
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
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        stage: stage || conversation.stage,
        score: Math.max(conversation.score || 0, score || 0),
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
          // ✅ [DEBUG] Log all messages for quantity extraction debugging
          const allMsgsContent = (conversation.messages || []).map(m => ({ role: m.role, content: m.content.substring(0, 100) }))
          console.log(`🔍 [DEBUG] All messages for quantity extraction:`, JSON.stringify(allMsgsContent, null, 2))
          
          const msgsText = (conversation.messages || []).map(m => m.content).join(" ")
          const extractedQty = extractQuantityFromMessages(msgsText)
          console.log(`🔍 [DEBUG] Extracted quantity: ${extractedQty} from ${msgsText.length} chars`)
          
          const order = await prisma.order.create({
            data: {
              userId,
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              productId: selectedItem.id,
              productName: selectedItem.name,
              quantity: extractedQty,
              totalAmount: selectedItem.price * extractedQty,
              address: extractedAddress,
              status: "PENDING",
              notes: `طلب تلقائي من واتساب — المحادثة: ${conversation.id}`,
            }
          })
          console.log(`✅ [${normalizedPhone}] Order created: ${order.id} | Qty: ${order.quantity} | Total: ${order.totalAmount}${extractedAddress ? ' | Address: ' + extractedAddress : ''}`)

          // ✅ نقص المخزون بعد تأكيد الطلب
          try {
            const currentProduct = await prisma.product.findUnique({ where: { id: selectedItem.id }, select: { stock: true } })
            if (currentProduct && currentProduct.stock !== null && currentProduct.stock !== undefined) {
              const newStock = Math.max(0, currentProduct.stock - order.quantity)
              await prisma.product.update({ where: { id: selectedItem.id }, data: { stock: newStock } })
              console.log(`📦 [${normalizedPhone}] Stock updated: ${selectedItem.name} ${currentProduct.stock} → ${newStock}`)
            }
          } catch (err) {
            console.error(`❌ [${normalizedPhone}] Error updating stock:`, err.message)
          }
        } catch (err) {
          console.error(`❌ [${normalizedPhone}] Error creating order:`, err.message)
        }
      }

      if (isServiceMode && selectedItem) {
        try {
          // ✅ إعادة تحميل الرسائل من قاعدة البيانات للحصول على جميع الرسائل بما فيها الأخيرة
          const allConversationMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
            take: 50
          })

          // ✅ جمع كل رسائل المحادثة للبحث عن التاريخ والوقت
          const allMessages = allConversationMessages
            .map(m => m.content)
            .join(" ")

          // 🔍 DEBUG: Log what we're extracting from
          console.log(`🔍 [${normalizedPhone}] Reloaded ${allConversationMessages.length} messages from DB`)
          console.log(`🔍 [${normalizedPhone}] allMessages type: ${typeof allMessages}, length: ${allMessages.length}`)
          console.log(`🔍 [${normalizedPhone}] allMessages content: "${allMessages.substring(0, 300)}..."`)

          console.log(`📅 [${normalizedPhone}] Extracting date from messages...`)

          // ✅ استخراج التاريخ بالدالة الذكية
          let extractedDate = extractDateFromMessages(allMessages)

          // Fallback أخير: غدا الساعة 10:00
          if (!extractedDate) {
            console.log(`📅 [${normalizedPhone}] No date found — using tomorrow 10:00 as fallback`)
            extractedDate = new Date()
            extractedDate.setDate(extractedDate.getDate() + 1)
            extractedDate.setHours(10, 0, 0, 0)
          } else {
            // ✅ استخراج الوقت بالدالة الذكية
            const time = extractTimeFromMessages(allMessages)
            if (time) {
              extractedDate.setHours(time.hours, time.minutes, 0, 0)
              console.log(`⏰ [${normalizedPhone}] Time set: ${time.hours}:${time.minutes}`)
            } else {
              // وقت افتراضي 10:00 إذا ما لقيناش وقت
              extractedDate.setHours(10, 0, 0, 0)
              console.log(`⏰ [${normalizedPhone}] No time found — defaulting to 10:00`)
            }
          }

          console.log(`📅 [${normalizedPhone}] Final appointment date: ${extractedDate.toISOString()}`)

          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              customerId: customer.id,
              serviceId: selectedItem.id,
              createdAt: { gte: fiveMinutesAgo }
            }
          })

          if (existingAppointment) {
            console.log(`⚠️ [${normalizedPhone}] Duplicate appointment skipped (${existingAppointment.id})`)
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
            console.log(`✅ [${normalizedPhone}] Appointment created: ${appointment.id} on ${extractedDate.toISOString()}`)
          }
        } catch (err) {
          console.error(`❌ [${normalizedPhone}] Error creating appointment:`, err.message)
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
      stage,
      score,
      orderConfirmed,
      imageUrls,
    }
  } catch (error) {
    console.error("processIncomingMessage error:", error)
    return {
      reply: "عذراً، حدث خطأ. حاول مرة أخرى 😊",
      imageUrls: [],
      error: true
    }
  }
}