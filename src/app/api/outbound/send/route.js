// API Route: POST /api/outbound/send
// إرسال رسالة outbound sales لزبون محتمل

import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { normalizePhone } from "@/lib/aiAgent"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

/**
 * بناء رسالة outbound حسب اللغة والقالب
 */
function buildOutboundMessage({ agent, item, customerName, customMessage }) {
  // إذا في رسالة مخصصة ولا في قالب → استخدم الرسالة المخصصة
  if (customMessage && !agent.outboundTemplate) {
    return customMessage
      .replace(/{name}/g, customerName || "")
      .replace(/{product}/g, item?.name || "")
      .replace(/{service}/g, item?.name || "")
      .replace(/{price}/g, item?.price || "")
  }

  // إذا في قالب → استخدمه
  if (agent.outboundTemplate) {
    return agent.outboundTemplate
      .replace(/{name}/g, customerName || "")
      .replace(/{product}/g, item?.name || "")
      .replace(/{service}/g, item?.name || "")
      .replace(/{price}/g, item?.price || "")
  }

  // Fallback حسب اللغة
  const name = customerName || ""
  const itemName = item?.name || ""
  const price = item?.price || ""
  const lang = agent.language || "darija"

  if (lang === "french") {
    return `Bonjour ${name} ! 👋\n${agent.name} ici.\nNous avons ${itemName} disponible${price ? ` à ${price} DH` : ""}.\nÇa vous intéresse ? Répondez-moi 😊`
  }

  if (lang === "darija") {
    return `مرحبا ${name}! 👋\nأنا ${agent.name}.\nعندنا ${itemName}${price ? ` بـ ${price} درهم` : ""} 🔥\nواش تحب تعرف أكثر؟ 😊`
  }

  // Arabic default
  return `مرحباً ${name}! 👋\nأنا ${agent.name}.\nلدينا ${itemName}${price ? ` بسعر ${price} درهم` : ""}.\nهل يهمك الأمر؟ 😊`
}

/**
 * التحقق من rate limit (50 lead/يوم)
 */
async function checkRateLimit(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await prisma.outboundLead.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  })

  return count < 50
}

/**
 * التحقق من عدم التكرار (نفس الرقم + نفس اليوم)
 */
async function checkDuplicate(userId, phone) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.outboundLead.findFirst({
    where: {
      userId,
      customerPhone: phone,
      createdAt: { gte: today },
      status: { not: "FAILED" },
    },
  })

  return !!existing
}

export async function POST(request) {
  try {
    // ✅ التحقق من التوكن
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse("Unauthorized")
    }

    const userId = user.id

    // ✅ قراءة البيانات
    const body = await request.json()
    const {
      customerPhone,
      customerName,
      itemId,
      itemType,
      customMessage,
    } = body

    // ✅ التحقق من المدخلات الأساسية
    if (!customerPhone || typeof customerPhone !== "string") {
      return errorResponse("رقم الهاتف مطلوب", 400)
    }

    if (!itemType || !["product", "service"].includes(itemType)) {
      return errorResponse("نوع العنصر يجب أن يكون product أو service", 400)
    }

    // ✅ جلب الـ Agent مع التحقق
    const agent = await prisma.agent.findUnique({
      where: { userId },
    })

    if (!agent) {
      return errorResponse("Agent غير موجود", 404)
    }

    if (!agent.isActive) {
      return errorResponse("الـ Agent متوقف. يرجى تفعيله من الإعدادات", 403)
    }

    if (!agent.outboundEnabled) {
      return errorResponse("ميزة Outbound Sales غير مفعّلة. فعّلها من الإعدادات", 403)
    }

    if (!agent.whatsappPhoneId || !agent.whatsappToken) {
      return errorResponse("WhatsApp غير مضبوط. يرجى ربط WhatsApp من الإعدادات", 403)
    }

    // ✅ تطبيع الرقم
    const normalizedPhone = normalizePhone(customerPhone)
    if (!normalizedPhone) {
      return errorResponse("رقم الهاتف غير صالح", 400)
    }

    // ✅ Rate limit check
    const withinLimit = await checkRateLimit(userId)
    if (!withinLimit) {
      return errorResponse("لقد تجاوزت الحد الأقصى (50 رسالة/يوم). جرّب غداً.", 429)
    }

    // ✅ Duplicate check
    const isDuplicate = await checkDuplicate(userId, normalizedPhone)
    if (isDuplicate) {
      return errorResponse(
        "تم إرسال رسالة لهذا الرقم اليوم. لا يمكن التكرار خلال 24 ساعة.",
        409
      )
    }

    // ✅ جلب المنتج/الخدمة إذا وُفّر
    let item = null
    if (itemId) {
      if (itemType === "product") {
        item = await prisma.product.findFirst({
          where: { id: itemId, userId },
        })
      } else {
        item = await prisma.service.findFirst({
          where: { id: itemId, userId },
        })
      }
    }

    // ✅ بناء الرسالة
    const messageText = buildOutboundMessage({
      agent,
      item,
      customerName,
      customMessage,
    })

    // ✅ إنشاء أو تحديث Customer
    let customer = await prisma.customer.findFirst({
      where: { userId, phone: normalizedPhone },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId,
          phone: normalizedPhone,
          name: customerName || "زبون محتمل",
          tag: "PROSPECT",
        },
      })
      console.log(`✅ Created new customer: ${customer.id}`)
    } else if (customerName && customer.name !== customerName) {
      // تحديث الاسم إذا تغيّر
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: customerName },
      })
    }

    // ✅ إنشاء OutboundLead بـ status: PENDING
    const lead = await prisma.outboundLead.create({
      data: {
        userId,
        customerPhone: normalizedPhone,
        customerName: customerName || customer.name,
        itemId: item?.id || null,
        itemName: item?.name || null,
        itemType,
        itemPrice: item?.price || null,
        status: "PENDING",
        templateBody: messageText,
      },
    })

    // ✅ إرسال الرسالة عبر WhatsApp
    const maskedPhone = normalizedPhone.length > 4
      ? "******" + normalizedPhone.slice(-4)
      : "****"
    console.log(`📤 Sending outbound message to ${maskedPhone}...`)

    const sendResult = await sendWhatsAppMessage({
      phoneId: agent.whatsappPhoneId,
      token: agent.whatsappToken,
      to: normalizedPhone,
      message: messageText,
      type: "text",
    })

    if (!sendResult.success) {
      // تحديث Lead بـ FAILED
      await prisma.outboundLead.update({
        where: { id: lead.id },
        data: {
          status: "FAILED",
          notes: sendResult.error?.message || "Failed to send WhatsApp message",
        },
      })

      // إذا المشكلة في التوكن
      if (sendResult.isTokenExpired) {
        await prisma.notification.create({
          data: {
            userId,
            type: "SYSTEM",
            title: "🚨 WhatsApp Token Expired",
            message: "انتهت صلاحية توكن WhatsApp. يرجى تحديثه من الإعدادات.",
            isRead: false,
          },
        })
      }

      return errorResponse(
        "فشل إرسال رسالة WhatsApp. تأكد من أن الرقم صحيح وأن التوكن صالح.",
        500
      )
    }

    // ✅ تحديث Lead بـ SENT
    const whatsappMsgId = sendResult.data?.messages?.[0]?.id || null

    await prisma.outboundLead.update({
      where: { id: lead.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        whatsappMsgId,
      },
    })

    console.log(`✅ Outbound lead sent successfully: ${lead.id}`)

    return successResponse({
      leadId: lead.id,
      message: "تم إرسال الرسالة بنجاح",
      customerId: customer.id,
    })

  } catch (error) {
    console.error("❌ Outbound send error:", error.message)
    return errorResponse("حدث خطأ أثناء إرسال الرسالة", 500)
  } finally {
    await prisma.$disconnect()
  }
}
