// API لاختبار إرسال رسالة تجريبية

import { getUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { successResponse, errorResponse,
         unauthorizedResponse } from "@/lib/response"

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { testPhone } = await request.json()

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id }
    })

    if (!agent?.whatsappPhoneId || !agent?.whatsappToken) {
      return errorResponse("WhatsApp غير مربوط")
    }

    const result = await sendWhatsAppMessage({
      phoneId: agent.whatsappPhoneId,
      token: agent.whatsappToken,
      to: testPhone || agent.whatsappPhoneId,
      message: `مرحباً! 👋 أنا ${agent.name} من SalesBot.ma\n\nهذه رسالة تجريبية للتأكد من اشتغال Agent ✅`,
    })

    if (result.isTokenExpired) {
      return errorResponse("❌ انتهت صلاحية WhatsApp Token! يجب تحديث Token من جديد.", 401)
    }

    return successResponse({
      sent: result.success,
      message: result.success
        ? "تم إرسال الرسالة التجريبية"
        : "فشل في الإرسال"
    })
  } catch (error) {
    console.error("WhatsApp test error:", error)
    return errorResponse("خطأ في الاختبار", 500)
  }
}
