import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

// ═══════════════════════════════════════════════════════════════
// استبدال المتغيرات في قالب الرسالة
// ═══════════════════════════════════════════════════════════════
function replaceMessageVariables(template, appointment) {
  if (!template) return template
  
  const date = new Date(appointment.date)
  const dateStr = date.toLocaleDateString("ar-MA", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = date.toLocaleTimeString("ar-MA", {
    hour: "2-digit",
    minute: "2-digit"
  })
  
  return template
    .replace(/\{\{serviceName\}\}/g, appointment.serviceName || "")
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{time\}\}/g, timeStr)
    .replace(/\{\{name\}\}/g, appointment.customerName || "")
}

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { appointmentId, type } = body

    if (!appointmentId || !type) {
      return errorResponse("معرف الموعد والنوع مطلوبان", 400)
    }

    // التحقق من النوع
    if (!["confirm", "reminder", "cancel"].includes(type)) {
      return errorResponse("النوع يجب أن يكون confirm أو reminder أو cancel", 400)
    }

    // جلب الموعد والعميل
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        user: {
          include: {
            agent: true
          }
        }
      }
    })

    if (!appointment) {
      return errorResponse("الموعد غير موجود", 404)
    }

    // التحقق من أن الموعد يتبع للمستخدم
    if (appointment.userId !== user.id) {
      return errorResponse("غير مصرح", 403)
    }

    const agent = appointment.user?.agent
    if (!agent) {
      return errorResponse("Agent غير موجود", 404)
    }

    // اختيار الرسالة المناسبة واستبدال المتغيرات
    let message = ""
    if (type === "confirm") {
      const template = agent.appointmentConfirmMessage || `تم تأكيد موعدك بنجاح {{name}}! 📅
الخدمة: {{serviceName}}
التاريخ: {{date}}
الوقت: {{time}}

ننتظرك! 😊`
      message = replaceMessageVariables(template, appointment)
    } else if (type === "cancel") {
      const template = agent.appointmentCancellationMessage || `نعتذر {{name}}! ❌
تم إلغاء موعد {{serviceName}}
التاريخ: {{date}}
الوقت: {{time}}

يمكنك حجز موعد جديد في أي وقت. 😊`
      message = replaceMessageVariables(template, appointment)
    } else {
      const template = agent.appointmentReminderMessage || `تذكير {{name}}: موعدك قريب! ⏰
الخدمة: {{serviceName}}
التاريخ: {{date}}
الوقت: {{time}}

لا تنسى موعدك! 😊`
      message = replaceMessageVariables(template, appointment)
    }

    // إرسال الرسالة عبر واتساب
    if (!agent.whatsappPhoneId || !agent.whatsappToken) {
      return errorResponse("واتساب غير مربط في الإعدادات", 400)
    }

    const customerPhone = appointment.customerPhone || appointment.customer?.phone
    if (!customerPhone) {
      return errorResponse("رقم هاتف العميل غير موجود", 400)
    }

    const result = await sendWhatsAppMessage({
      phoneId: agent.whatsappPhoneId,
      token: agent.whatsappToken,
      to: customerPhone,
      message: message
    })

    if (!result.success) {
      console.error("❌ فشل إرسال رسالة الواتساب:", result.error)
      return errorResponse("فشل إرسال الرسالة: " + (result.error?.message || "خطأ غير معروف"), 500)
    }

    // تحديث حالة الموعد
    let updateData = {}
    let messageType = ""
    if (type === "confirm") {
      updateData = { confirmationSent: true, status: "CONFIRMED" }
      messageType = "تأكيد موعد"
    } else if (type === "cancel") {
      updateData = { cancellationSent: true, status: "CANCELLED" }
      messageType = "إلغاء موعد"
    } else {
      updateData = { reminderSent: true }
      messageType = "تذكير بالموعد"
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData
    })

    // إضافة الرسالة إلى المحادثة إذا وجدت
    if (appointment.customerId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          userId: user.id,
          customerId: appointment.customerId,
          stage: { notIn: ["CLOSED", "ABANDONED", "ARCHIVED"] }
        },
        orderBy: { updatedAt: "desc" }
      })

      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "AGENT",
            content: `📨 رسالة ${messageType}:\n${message}`,
          }
        })

        // تحديث المحادثة
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        })
      }
    }

    console.log(`✅ تم إرسال رسالة ${type} للعميل ${appointment.customerPhone}`)

    const responseMessages = {
      confirm: "تم إرسال رسالة التأكيد",
      cancel: "تم إرسال رسالة الإلغاء",
      reminder: "تم إرسال رسالة التذكير"
    }

    return successResponse({
      message: responseMessages[type],
      whatsappMessageId: result.data?.messages?.[0]?.id
    })

  } catch (error) {
    console.error("❌ خطأ في إرسال رسالة الموعد:", error)
    console.error("Error details:", error.message, error.stack)
    return errorResponse("خطأ في معالجة الطلب: " + error.message, 500)
  }
}
