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
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `اكتب رسالة إشعار للزبون بحالة موعده الجديدة: ${statusInfo.label}` },
          ],
          max_tokens: 200,
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

  // رقمي: "بغيت 3" أو "3 حبات"
  const numericMatch = allMessages.match(
    /(?:بغيت|اريد|نبغي|عندي|خود|اعطيني)\s*(\d+)|(\d+)\s*(?:حبة|حبات|قطعة|قطع|وحدة|وحدات|pieces?)/i
  )
  if (numericMatch) {
    const qty = parseInt(numericMatch[1] || numericMatch[2], 10)
    if (qty >= 1 && qty <= 100) {
      console.log(`🔢 [extractQuantity] Numeric match: ${qty}`)
      return qty
    }
  }

  // كلمات: "جوج" / "تلاتة" ...
  for (const [word, qty] of Object.entries(numberWords)) {
    if (allMessages.includes(word)) {
      console.log(`🔢 [extractQuantity] Word match: "${word}" = ${qty}`)
      return qty
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
function buildSystemPrompt(agent, items, objectionReplies, selectedItem, isService = false, customerHistory = null, appointmentsHistory = null, ordersHistory = null) {
  const itemTypeLabel = isService ? "الخدمات" : "المنتجات"
  
  let itemsList
  let hasImages = false
  if (selectedItem) {
    const images = parseImages(selectedItem.images)
    hasImages = images.length > 0
    const durationInfo = isService && selectedItem.duration 
      ? ` — المدة: ${selectedItem.duration} دقيقة` 
      : ""
    itemsList = `- ${selectedItem.name}: ${selectedItem.price} درهم${durationInfo} — ${selectedItem.description || ""}`
    if (hasImages) {
      itemsList += `\n- الصور المتاحة: ${images.length} صورة`
    }
  } else {
    const allImages = items.filter(p => p.isActive).flatMap(p => parseImages(p.images))
    hasImages = allImages.length > 0
    itemsList = items
      .filter(p => p.isActive)
      .map(p => {
        const durationInfo = isService && p.duration ? ` — المدة: ${p.duration} دقيقة` : ""
        const imgs = parseImages(p.images)
        return `- ${p.name}: ${p.price} درهم${durationInfo} — ${p.description || ""}${imgs.length > 0 ? ` (${imgs.length} صورة)` : ""}`
      })
      .join("\n")
  }

  const objectionsList = objectionReplies
    .map(o => `- عند "${o.trigger}" قل: "${o.reply}"`)
    .join("\n")

  const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"

  return `أنت ${agent.name}، ${isService ? "مساعد ذكي لحجز الخدمات" : "بائع ذكي للمتجر"}.

${appointmentsHistory ? `
📅 مواعيد الزبون الحالية:
${appointmentsHistory}

قواعد مهمة بخصوص المواعيد:
- إذا سأل الزبون عن حالة حجزه، أجب بناءً على البيانات أعلاه
- إذا كان لديه موعد مؤكد، ذكر له التاريخ والوقت
- إذا كان موعده في انتظار التأكيد، اطلب منه التأكيد
- لا تطلب تفاصيل (تاريخ، وقت) إذا كانت موجودة بالفعل` : ""}

🔖 أوامر إجبارية للنظام (يجب اتباعها دائماً):

1️⃣ في نهاية كل ردك، ضع tag المرحلة المناسبة:
[STAGE:GREETING] → عند الترحيب الأول
[STAGE:DISCOVERY] → عند فهم حاجة الزبون
[STAGE:PITCHING] → عند تقديم الخدمة/المنتج
[STAGE:OBJECTION] → عند تردد الزبون أو اعتراضه
[STAGE:CLOSING] → عند جمع بيانات الحجز/الطلب
[STAGE:CLOSED] → بعد التأكيد النهائي

2️⃣ عندما يؤكد الزبون الحجز النهائي، أضف: ${confirmTag}

3️⃣ ${hasImages ? "إذا طلب الزبون صور، أضف في نهاية ردك: [SEND_IMAGES]" : "لا توجد صور متاحة للمنتجات حالياً — إذا طلب الزبون صور، أعتذر له بلطف وأخبره أن الصور ستكون متاحة قريباً. لا تضف [SEND_IMAGES]"}

⚠️ لا ترسل رداً بدون [STAGE:xxx]

---

تعليمات خاصة (اتبعها بشكل أساسي):
${agent.instructions || "كن ودوداً ومفيداً"}

---

معلومات إضافية للسياق:

مجال المتجر: ${agent.domain}
أسلوبك: ${
  agent.style === "friendly" ? "ودود وحنون" :
  agent.style === "formal"   ? "رسمي ومحترف" :
                               "مقنع وحازم"
}
لغة التواصل: ${
  agent.language === "darija" ? "الدارجة المغربية" :
  agent.language === "french" ? "الفرنسية" :
                                "العربية الفصحى"
}

${itemTypeLabel} المتاحة:
${itemsList || `لا ${itemTypeLabel} متاحة حالياً`}

ردود الاعتراض التلقائية (استخدمها فقط إذا طابق الاعتراض):
${objectionsList || "تعامل مع الاعتراضات بأسلوبك"}

قواعد عامة:
- سؤال واحد فقط في كل رسالة
- لا تذكر أنك AI
- إذا أعطى الزبون معلومة مطلوبة (تاريخ، وقت، اسم)، لا تعيد السؤال عنها
- إذا أراد الزبون شراء منتج، اسأله عن الكمية المطلوبة قبل التأكيد النهائي

مثال على رد صحيح:
"مرحباً! كيف نقدر نساعدك؟ 😊
[STAGE:GREETING]"

مثال على رد تأكيد:
"تمام 👍 تم تأكيد الحجز!
📅 التاريخ: [التاريخ]
⏰ الوقت: [الوقت]
${confirmTag}
[STAGE:CLOSED]”

${ordersHistory ? `
📦 طلبيات الزبون:
${ordersHistory}

إذا سأل الزبون عن طلبيته، أجبه بناءً على هذه البيانات.
إذا كانت الطلبية مشحونة، أخبره برقم التتبع إن وجد.` : ""}

${customerHistory ? `
تاريخ الزبون السابق:
${customerHistory}

قواعد إضافية بخصوص التاريخ:
- إذا اشترى سابقاً، رحب به كزبون قديم
- لا تعرض نفس المنتج بنفس الطريقة
- يمكنك اقتراح منتجات مكملة
- إذا سأل عن طلب سابق، أخبره أنك ستتحقق` : ""}`
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
}) {
  let attempts = 0
  const maxAttempts = 2
  
  while (attempts < maxAttempts) {
    attempts++
    
    try {
      const systemPrompt = buildSystemPrompt(
        agent, items, objectionReplies, selectedItem, isService, customerHistory, appointmentsHistory, ordersHistory
      )

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
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            max_tokens: 500,
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
            userLower.match(/\d{1,2}:\d{2}/) || userLower.match(/\d+/)) {
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
      
      // ✅ [FIX] المشكل 1: اكتشاف التأكيد الخاطئ - فقط في مرحلة CLOSING
      if (!orderConfirmed && stage === "CLOSING") {
        const userLower = userMessage.toLowerCase()
        const confirmWords = ["نعم", "أكد", "تمام", "واخا", "يلاه", "موافق", "بالصح", "صحيح", "آسفي", "حسن", "مزيان", "اوك", "ok"]
        if (confirmWords.some(w => userLower.includes(w))) {
          orderConfirmed = true
          reply = reply + "\n" + confirmTag + "\n[STAGE:CLOSED]"
          console.log(`✅ [FIX] اكتشاف التأكيد: تمام في مرحلة CLOSING - orderConfirmed=true`)
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

      const cleanReply = reply
        .replace(/\[STAGE:\w+\]/g, "")
        .replace(/\[ORDER_CONFIRMED\]/g, "")
        .replace(/\[BOOKING_CONFIRMED\]/g, "")
        .replace(/\[SEND[_ ]IMAGES?\]/gi, "")
        .trim()

      return {
        reply: cleanReply,
        stage: stage || "GREETING",
        score: SCORE_MAP[stage] || 10,
        orderConfirmed,
        sendImages,
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
    const { reply, stage, score, orderConfirmed, sendImages } =
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
      })
    
    console.log(`🤖 [${normalizedPhone}] AI result: orderConfirmed=${orderConfirmed}, stage=${stage}`)

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
          const order = await prisma.order.create({
            data: {
              userId,
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              productId: selectedItem.id,
              productName: selectedItem.name,
              quantity: (() => {
                const msgs = (conversation.messages || []).map(m => m.content).join(" ")
                return extractQuantityFromMessages(msgs)
              })(),
              totalAmount: (() => {
                const msgs = (conversation.messages || []).map(m => m.content).join(" ")
                const qty = extractQuantityFromMessages(msgs)
                return selectedItem.price * qty
              })(),
              address: extractedAddress,
              status: "PENDING",
              notes: `طلب تلقائي من واتساب — المحادثة: ${conversation.id}`,
            }
          })
          console.log(`✅ [${normalizedPhone}] Order created: ${order.id}${extractedAddress ? ' with address: ' + extractedAddress : ' (no address)'}`)
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