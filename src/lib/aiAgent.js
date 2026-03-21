// منطق AI Agent — يحلل ويرد على الرسائل

import { prisma } from "@/lib/prisma"

// دالة تطبيع رقم الهاتف (منع التكرار)
function normalizePhone(phone) {
  if (!phone) return null
  
  // إزالة كل شيء ما عدا الأرقام
  let normalized = phone.replace(/\D/g, "")
  
  // إذا كان يبدأ بـ 0، استبدله بـ 212 (المغرب)
  if (normalized.startsWith("0")) {
    normalized = "212" + normalized.substring(1)
  }
  
  // إذا لم يبدأ بـ 212، أضفها
  if (!normalized.startsWith("212") && normalized.length === 9) {
    normalized = "212" + normalized
  }
  
  return normalized
}

// دالة آمنة لجلب الصور
function parseImages(imagesField) {
  if (!imagesField) return []
  
  try {
    // إذا كانت بالفعل string (JSON)، parse
    if (typeof imagesField === 'string') {
      const parsed = JSON.parse(imagesField)
      return Array.isArray(parsed) ? parsed.filter(img => img && img.trim()) : []
    }
    // إذا كانت بالفعل array
    if (Array.isArray(imagesField)) {
      return imagesField.filter(img => img && (typeof img === 'string') && img.trim())
    }
  } catch (e) {
    console.error("❌ Error parsing images:", e)
  }
  return []
}

// System Prompt الأساسي للـ Agent
function buildSystemPrompt(agent, items, objectionReplies, selectedItem, isService = false) {
  const itemTypeLabel = isService ? "الخدمات" : "المنتجات"
  const itemActionLabel = isService ? "حجز" : "بيع"
  
  // إذا كان هناك منتج/خدمة محدد، نركز عليه
  let itemsList
  if (selectedItem) {
    const images = parseImages(selectedItem.images)
    const durationInfo = isService && selectedItem.duration 
      ? ` — المدة: ${selectedItem.duration} دقيقة` 
      : ""
    itemsList = `- ${selectedItem.name}: ${selectedItem.price} درهم${durationInfo} — ${selectedItem.description || ""}`
    if (images.length > 0) {
      itemsList += `\n- الصور المتاحة: ${images.length} صورة`
    }
  } else {
    itemsList = items
      .filter(p => p.isActive)
      .map(p => {
        const durationInfo = isService && p.duration ? ` — المدة: ${p.duration} دقيقة` : ""
        return `- ${p.name}: ${p.price} درهم${durationInfo} — ${p.description || ""}`
      })
      .join("\n")
  }

  const objectionsList = objectionReplies
    .map(o => `- عند "${o.trigger}" قل: "${o.reply}"`)
    .join("\n")

  const closingInstruction = isService 
    ? "5. CLOSING — خذ تفاصيل الحجز (اسم + تاريخ + وقت + مكان)"
    : "5. CLOSING — خذ تفاصيل الطلب (اسم + عنوان + رقم)"

  const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"

  return `أنت ${agent.name}، ${isService ? "مساعد ذكي لحجز الخدمات" : "بائع ذكي للمتجر"}.

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

تعليمات خاصة:
${agent.instructions || "كن ودوداً ومفيداً"}

ردود الاعتراض التلقائية:
${objectionsList || "تعامل مع الاعتراضات بأسلوبك"}

مراحل ${itemActionLabel} التي تتبعها:
1. GREETING — رحب واسأل كيف تساعد
2. DISCOVERY — افهم ما يريده الزبون
3. PITCHING — قدم ${isService ? "الخدمة" : "المنتج"} المناسب بشكل جذاب
4. OBJECTION — تعامل مع الاعتراضات بالردود المحددة
${closingInstruction}

قواعد مهمة:
- سؤال واحد فقط في كل رسالة
- لا تذكر أنك AI
- ابق في الموضوع — مش ${isService ? "تحجز" : "تبيع"} فقط
- إذا طلب الزبون صور (قال: صور، صورة، نشوف، show me، photo، image)، ضع [SEND_IMAGES] في ردك
- إذا أكد ${isService ? "الحجز" : "الطلب"} أضف في آخر ردك: ${confirmTag}
- حدد المرحلة في آخر كل رد: [STAGE:GREETING] أو
  [STAGE:DISCOVERY] أو [STAGE:PITCHING] أو
  [STAGE:OBJECTION] أو [STAGE:CLOSING] أو [STAGE:CLOSED]`
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
}) {
  try {
    const systemPrompt = buildSystemPrompt(
      agent, items, objectionReplies, selectedItem, isService
    )

    // تحضير المحادثة للـ API
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
          "HTTP-Referer": "https://salesbot.ma",
          "X-Title": "SalesBot.ma",
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
    const reply = data.choices?.[0]?.message?.content

    if (!reply) {
      return {
        reply: "عذراً، حدث خطأ. حاول مرة أخرى 😊",
        stage: null,
        orderConfirmed: false,
      }
    }

    // استخراج المرحلة
    const stageMatch = reply.match(/\[STAGE:(\w+)\]/)
    const stage = stageMatch ? stageMatch[1] : null

    // التحقق من تأكيد الحجز/الطلب
    const confirmTag = isService ? "[BOOKING_CONFIRMED]" : "[ORDER_CONFIRMED]"
    const orderConfirmed = reply.includes(confirmTag) || reply.includes("[ORDER_CONFIRMED]") || reply.includes("[BOOKING_CONFIRMED]")

    // التحقق من طلب إرسال صور
    const sendImages = reply.includes("[SEND_IMAGES]")

    // تنظيف الرد من العلامات الخاصة
    const cleanReply = reply
      .replace(/\[STAGE:\w+\]/g, "")
      .replace(/\[ORDER_CONFIRMED\]/g, "")
      .replace(/\[BOOKING_CONFIRMED\]/g, "")
      .replace(/\[SEND_IMAGES\]/g, "")
      .trim()

    // حساب الـ Score حسب المرحلة
    const scoreMap = {
      GREETING:  10,
      DISCOVERY: 30,
      PITCHING:  55,
      OBJECTION: 40,
      CLOSING:   80,
      CLOSED:    100,
    }

    return {
      reply: cleanReply,
      stage: stage || "GREETING",
      score: scoreMap[stage] || 10,
      orderConfirmed,
      sendImages,
    }
  } catch (error) {
    console.error("generateAIReply error:", error)
    return {
      reply: "عذراً، حدث خطأ تقني. حاول مرة أخرى 😊",
      stage: "GREETING",
      score: 10,
      orderConfirmed: false,
      sendImages: false,
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

    // تطبيع رقم الهاتف (منع التكرار)
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
    console.log(`🔍 [processIncomingMessage] Customer lookup: userId=${userId}, phone=${normalizedPhone}, found=${!!customer}`)

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          name: customerName,
          phone: normalizedPhone,
          tag: "NEW",
        }
      })
      console.log(`✅ [processIncomingMessage] Created new customer: ${customer.id}, name=${customer.name}, phone=${normalizedPhone}`)
    } else {
      console.log(`✅ [processIncomingMessage] Found existing customer: ${customer.id}, name=${customer.name}, phone=${normalizedPhone}`)
      // تحديث آخر ظهور
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeen: new Date() }
      })
    }

    // 3. إيجاد أو إنشاء محادثة نشطة
    console.log(`🔍 [processIncomingMessage] Looking for conversation: userId=${userId}, customerId=${customer.id}`)
    
    // البحث عن أي محادثة نشطة لهذا الزبون (بأي customerId مرتبط بنفس رقم الهاتف)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // أولاً: نبحث عن محادثات الزبون الحالي
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        customerId: customer.id,
        stage: { notIn: ["CLOSED", "ABANDONED"] },
        updatedAt: { gte: oneDayAgo }
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20
        }
      },
      orderBy: { updatedAt: "desc" }
    })
    
    // ثانياً: نبحث عن أي محادثة نشطة أخرى لنفس رقم الهاتف (للزبائن المكررين القدام)
    if (!conversation) {
      const duplicateCustomers = await prisma.customer.findMany({
        where: {
          userId,
          phone: normalizedPhone
        },
        select: { id: true }
      })
      
      const customerIds = duplicateCustomers.map(c => c.id)
      
      if (customerIds.length > 0) {
        conversation = await prisma.conversation.findFirst({
          where: {
            userId,
            customerId: { in: customerIds },
            stage: { notIn: ["CLOSED", "ABANDONED"] },
            updatedAt: { gte: oneDayAgo }
          },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 20
            }
          },
          orderBy: { updatedAt: "desc" }
        })
        
        // إذا وجدنا محادثة لزبون مكرر، ننقلها للزبون الرئيسي
        if (conversation && conversation.customerId !== customer.id) {
          console.log(`🔄 [processIncomingMessage] Reassigning conversation from duplicate customer to primary customer`)
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { customerId: customer.id }
          })
        }
      }
    }
    
    // ثالثاً: نبحث عن أي محادثة نشطة بدون قيد الوقت
    if (!conversation) {
      const duplicateCustomers = await prisma.customer.findMany({
        where: {
          userId,
          phone: normalizedPhone
        },
        select: { id: true }
      })
      
      const customerIds = duplicateCustomers.map(c => c.id)
      
      if (customerIds.length > 0) {
        conversation = await prisma.conversation.findFirst({
          where: {
            userId,
            customerId: { in: customerIds },
            stage: { notIn: ["CLOSED", "ABANDONED"] }
          },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 20
            }
          },
          orderBy: { updatedAt: "desc" }
        })
        
        // إعادة توجيه المحادثة للزبون الرئيسي
        if (conversation && conversation.customerId !== customer.id) {
          console.log(`🔄 [processIncomingMessage] Reassigning conversation from duplicate customer to primary customer`)
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { customerId: customer.id }
          })
        }
      }
    }
    
    console.log(`🔍 [processIncomingMessage] Found conversation: ${conversation?.id || 'NONE'}`)

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          customerId: customer.id,
          stage: "GREETING",
          score: 10,
        },
        include: { messages: true }
      })
      console.log(`✅ [processIncomingMessage] Created new conversation: ${conversation.id} for customer ${customer.id}`)
    } else {
      console.log(`✅ [processIncomingMessage] Using existing conversation: ${conversation.id} with ${conversation.messages?.length || 0} messages`)
    }

    // 4. حفظ رسالة الزبون
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: messageText,
      }
    })

    // 5. جلب المنتجات أو الخدمات حسب وضع Agent
    const isServiceMode = agent.mode === "service"
    let items = []
    let selectedItem = null
    
    if (isServiceMode) {
      // وضع الخدمات
      items = await prisma.service.findMany({
        where: { userId, isActive: true }
      })
      
      // جلب الخدمة المحددة إذا وجدت
      if (agent.selectedServiceId) {
        selectedItem = await prisma.service.findUnique({
          where: { id: agent.selectedServiceId }
        })
      }
      
      // Fallback: استخدم أول خدمة نشطة لها صور
      if (!selectedItem || !selectedItem.images) {
        selectedItem = items.find(s => s.images && s.images.trim().length > 0) || null
      }
    } else {
      // وضع المنتجات (الافتراضي)
      items = await prisma.product.findMany({
        where: { userId, isActive: true }
      })
      
      // جلب المنتج المحدد إذا وجد
      if (agent.selectedProductId) {
        selectedItem = await prisma.product.findUnique({
          where: { id: agent.selectedProductId }
        })
      }
      
      // Fallback: استخدم أول منتج نشط له صور
      if (!selectedItem || !selectedItem.images) {
        selectedItem = items.find(p => p.images && p.images.trim().length > 0) || null
      }
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
      })

    // حساب قيمة الطلب/الحجز إذا تم تأكيده
    let totalAmount = null
    if (orderConfirmed && selectedItem) {
      totalAmount = selectedItem.price
      console.log(`💰 [${normalizedPhone}] ${isServiceMode ? 'حجز' : 'طلب'} مؤكد: ${totalAmount} درهم`)
    }

    // إعداد قائمة الصور للإرسال
    let imageUrls = []
    console.log("🖼️ sendImages:", sendImages, "selectedItem:", selectedItem?.id, "images:", selectedItem?.images)
    if (sendImages && selectedItem) {
      imageUrls = parseImages(selectedItem.images)
      if (imageUrls.length > 0) {
        console.log("✅ Parsed imageUrls:", imageUrls)
      } else {
        console.warn("⚠️ No valid images found for item:", selectedItem.id)
      }
    } else if (sendImages && !selectedItem) {
      console.warn("⚠️ Customer requested images but no item available")
    }

    // 7. حفظ رد Agent
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "AGENT",
        content: reply,
      }
    })

    // 8. تحديث حالة المحادثة
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        stage: stage || conversation.stage,
        score,
        isRead: false,
        updatedAt: new Date(),
        ...(orderConfirmed && {
          stage: "CLOSED",
          score: 100,
          totalAmount,
        }),
      }
    })

    // 9. تحديث الزبون إذا تم البيع
    if (orderConfirmed) {
      const newTotalSpent = customer.totalSpent + (totalAmount || 0)
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: newTotalSpent,
          tag: customer.ordersCount >= 2 ? "VIP" : "REGULAR",
        }
      })

      // إشعار للمتجر
      await prisma.notification.create({
        data: {
          userId,
          type: "NEW_ORDER",
          title: "طلب جديد! 🎉",
          message: `${customerName} أكد طلبه بقيمة ${totalAmount || 0} درهم`,
        }
      })
    }

    // 10. إشعار عند اعتراض مهم
    if (stage === "OBJECTION" && score >= 60) {
      await prisma.notification.create({
        data: {
          userId,
          type: "OBJECTION_ALERT",
          title: "اعتراض يحتاج متابعة",
          message: `${customerName} — Score ${score}%`,
        }
      })
    }

    return { reply, stage, score, orderConfirmed, imageUrls }
  } catch (error) {
    console.error("processIncomingMessage error:", error)
    return {
      reply: "عذراً، حدث خطأ. حاول مرة أخرى 😊",
      imageUrls: [],
      error: true
    }
  }
}
