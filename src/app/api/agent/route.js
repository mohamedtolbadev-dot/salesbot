import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        objectionReplies: {
          orderBy: { order: "asc" }
        }
      }
    })

    if (!agent) return errorResponse("Agent غير موجود", 404)

    return successResponse(agent)
  } catch (error) {
    console.error("GET agent error:", error)
    return errorResponse("خطأ في جلب Agent", 500)
  }
}

export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const {
      name, domain, style, language,
      isActive, instructions,
      whatsappPhoneId, whatsappToken,
      selectedProductId, selectedServiceId,
      mode,
      workHoursEnabled, workStart, workEnd, offlineMessage,
      welcomeMessage, postSaleMessage,
      appointmentConfirmMessage,
      appointmentReminderMessage,
      appointmentCancellationMessage,
      orderConfirmMessage,
      orderShipMessage,
      orderDeliverMessage,
      orderCancelledMessage,
      trackingUrlTemplate,
    } = body

    const agent = await prisma.agent.update({
      where: { userId: user.id },
      include: {
        objectionReplies: {
          orderBy: { order: "asc" }
        }
      },
      data: {
        ...(name !== undefined && { name }),
        ...(domain !== undefined && { domain }),
        ...(style !== undefined && { style }),
        ...(language !== undefined && { language }),
        ...(isActive !== undefined && { isActive }),
        ...(instructions !== undefined && { instructions }),
        ...(whatsappPhoneId !== undefined && { whatsappPhoneId }),
        ...(whatsappToken !== undefined && { whatsappToken }),
        // ✅ "" تتحول null — لا تحفظ string فارغة في DB
        // aiAgent.js يتحقق بـ if(agent.selectedProductId)
        // null = falsy مقبول، لكن "" = falsy أيضاً والفرق
        // أن null في Prisma يعني "غير محدد" بشكل صريح
        ...(selectedProductId !== undefined && {
          selectedProductId: selectedProductId || null
        }),
        ...(selectedServiceId !== undefined && {
          selectedServiceId: selectedServiceId || null
        }),
        ...(mode !== undefined && { mode }),
        ...(workHoursEnabled !== undefined && { workHoursEnabled }),
        ...(workStart !== undefined && { workStart }),
        ...(workEnd !== undefined && { workEnd }),
        ...(offlineMessage !== undefined && { offlineMessage }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(postSaleMessage !== undefined && { postSaleMessage }),
        // ✅ الجديد
        ...(appointmentConfirmMessage !== undefined && {
          appointmentConfirmMessage
        }),
        ...(appointmentReminderMessage !== undefined && {
          appointmentReminderMessage
        }),
        ...(appointmentCancellationMessage !== undefined && {
          appointmentCancellationMessage
        }),
        ...(orderConfirmMessage !== undefined && { orderConfirmMessage }),
        ...(orderShipMessage !== undefined && { orderShipMessage }),
        ...(orderDeliverMessage !== undefined && { orderDeliverMessage }),
        ...(orderCancelledMessage !== undefined && { orderCancelledMessage }),
        ...(trackingUrlTemplate !== undefined && { trackingUrlTemplate }),
      }
    })

    return successResponse(agent)
  } catch (error) {
    console.error("PUT agent error:", error)
    return errorResponse("خطأ في تحديث Agent", 500)
  }
}
