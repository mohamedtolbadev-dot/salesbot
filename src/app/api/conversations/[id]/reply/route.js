import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { sanitizeInput } from "@/lib/helpers"

export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const { message } = await request.json()

    const cleanMessage = sanitizeInput(message)
    if (!cleanMessage) return errorResponse("الرسالة فارغة", 400)
    if (cleanMessage.length > 1000) return errorResponse("الرسالة طويلة جداً", 400)

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      include: { customer: true },
    })
    if (!conversation) return errorResponse("المحادثة غير موجودة", 404)

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    if (agent.isActive) {
      return errorResponse("أوقف AI Agent أولاً قبل الرد اليدوي", 403)
    }

    const sent = await sendWhatsAppMessage({
      phoneId: agent.whatsappPhoneId,
      token: agent.whatsappToken,
      to: conversation.customer.phone,
      message: cleanMessage,
    })

    if (!sent.success) {
      return errorResponse("فشل إرسال الرسالة عبر واتساب", 500)
    }

    const savedMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: "AGENT",
        content: cleanMessage,
      },
    })

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return successResponse(savedMessage, 201)
  } catch (error) {
    console.error("POST reply error:", error)
    return errorResponse("خطأ في إرسال الرسالة", 500)
  }
}
