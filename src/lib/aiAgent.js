// منطق AI Agent — يحلل ويرد على الرسائل

import { prisma } from "@/lib/prisma"

// دالة آمنة لجلب الصور من المنتج
function parseProductImages(imagesField) {
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
function buildSystemPrompt(agent, products, objectionReplies, selectedProduct) {
  // إذا كان هناك منتج محدد، نركز عليه
  let productsList
  if (selectedProduct) {
    const images = parseProductImages(selectedProduct.images)
    productsList = `- ${selectedProduct.name}: ${selectedProduct.price} درهم — ${selectedProduct.description || ""}`
    if (images.length > 0) {
      productsList += `\n- الصور المتاحة: ${images.length} صورة`
    }
  } else {
    productsList = products
      .filter(p => p.isActive)
      .map(p => `- ${p.name}: ${p.price} درهم — ${p.description || ""}`)
      .join("\n")
  }

  const objectionsList = objectionReplies
    .map(o => `- عند "${o.trigger}" قل: "${o.reply}"`)
    .join("\n")

  return `أنت ${agent.name}، بائع ذكي للمتجر.

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

المنتجات المتاحة:
${productsList || "لا منتجات متاحة حالياً"}

تعليمات خاصة:
${agent.instructions || "كن ودوداً ومفيداً"}

ردود الاعتراض التلقائية:
${objectionsList || "تعامل مع الاعتراضات بأسلوبك"}

مراحل البيع التي تتبعها:
1. GREETING — رحب واسأل كيف تساعد
2. DISCOVERY — افهم ما يريده الزبون
3. PITCHING — قدم المنتج المناسب بشكل جذاب
4. OBJECTION — تعامل مع الاعتراضات بالردود المحددة
5. CLOSING — خذ تفاصيل الطلب (اسم + عنوان + رقم)

قواعد مهمة:
- سؤال واحد فقط في كل رسالة
- لا تذكر أنك AI
- ابق في الموضوع — مش تبيع فقط
- إذا طلب الزبون صور المنتج (قال: صور، صورة، نشوف، show me، photo، image)، ضع [SEND_IMAGES] في ردك
- إذا أكد الطلب أضف في آخر ردك: [ORDER_CONFIRMED]
- حدد المرحلة في آخر كل رد: [STAGE:GREETING] أو
  [STAGE:DISCOVERY] أو [STAGE:PITCHING] أو
  [STAGE:OBJECTION] أو [STAGE:CLOSING] أو [STAGE:CLOSED]`
}

// توليد رد AI عبر OpenRouter
export async function generateAIReply({
  agent,
  products,
  objectionReplies,
  conversationHistory,
  userMessage,
  selectedProduct,
}) {
  try {
    const systemPrompt = buildSystemPrompt(
      agent, products, objectionReplies, selectedProduct
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

    // التحقق من تأكيد الطلب
    const orderConfirmed = reply.includes("[ORDER_CONFIRMED]")

    // التحقق من طلب إرسال صور
    const sendImages = reply.includes("[SEND_IMAGES]")

    // تنظيف الرد من العلامات الخاصة
    const cleanReply = reply
      .replace(/\[STAGE:\w+\]/g, "")
      .replace(/\[ORDER_CONFIRMED\]/g, "")
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

    // 2. إيجاد أو إنشاء الزبون
    let customer = await prisma.customer.findFirst({
      where: { userId, phone: customerPhone }
    })
    console.log(`🔍 [processIncomingMessage] Customer lookup: userId=${userId}, phone=${customerPhone}, found=${!!customer}`)

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          name: customerName,
          phone: customerPhone,
          tag: "NEW",
        }
      })
      console.log(`✅ [processIncomingMessage] Created new customer: ${customer.id}, name=${customer.name}, phone=${customer.phone}`)
    } else {
      console.log(`✅ [processIncomingMessage] Found existing customer: ${customer.id}, name=${customer.name}, phone=${customer.phone}`)
      // تحديث آخر ظهور
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeen: new Date() }
      })
    }

    // 3. إيجاد أو إنشاء محادثة نشطة
    console.log(`🔍 [processIncomingMessage] Looking for conversation: userId=${userId}, customerId=${customer.id}`)
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        customerId: customer.id,
        stage: { notIn: ["CLOSED", "ABANDONED"] }
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20
        }
      }
    })
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

    // 5. جلب المنتجات النشطة والمنتج المحدد
    const products = await prisma.product.findMany({
      where: { userId, isActive: true }
    })

    // جلب المنتج المحدد إذا وجد
    let selectedProduct = null
    if (agent.selectedProductId) {
      selectedProduct = await prisma.product.findUnique({
        where: { id: agent.selectedProductId }
      })
    }

    // Fallback: إذا لم يكن هناك منتج محدد أو لم توجد صور، استخدم أول منتج نشط له صور
    if (!selectedProduct || !selectedProduct.images) {
      selectedProduct = products.find(p => p.images && p.images.trim().length > 0) || null
    }

    // 6. توليد رد AI
    const { reply, stage, score, orderConfirmed, sendImages } =
      await generateAIReply({
        agent,
        products,
        objectionReplies: agent.objectionReplies,
        conversationHistory: conversation.messages,
        userMessage: messageText,
        selectedProduct,
      })

    // إعداد قائمة الصور للإرسال
    let imageUrls = []
    console.log("🖼️ sendImages:", sendImages, "selectedProduct:", selectedProduct?.id, "images:", selectedProduct?.images)
    if (sendImages && selectedProduct) {
      imageUrls = parseProductImages(selectedProduct.images)
      if (imageUrls.length > 0) {
        console.log("✅ Parsed imageUrls:", imageUrls)
      } else {
        console.warn("⚠️ No valid images found for product:", selectedProduct.id)
      }
    } else if (sendImages && !selectedProduct) {
      console.warn("⚠️ Customer requested images but no product available")
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
        }),
      }
    })

    // 9. تحديث الزبون إذا تم البيع
    if (orderConfirmed) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          tag: customer.ordersCount >= 2 ? "VIP" : "REGULAR",
        }
      })

      // إشعار للمتجر
      await prisma.notification.create({
        data: {
          userId,
          type: "NEW_ORDER",
          title: "طلب جديد! 🎉",
          message: `${customerName} أكد طلبه`,
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
