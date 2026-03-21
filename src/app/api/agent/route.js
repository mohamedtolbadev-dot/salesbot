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
      welcomeMessage, postSaleMessage
    } = body

    const agent = await prisma.agent.update({
      where: { userId: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(domain !== undefined && { domain }),
        ...(style !== undefined && { style }),
        ...(language !== undefined && { language }),
        ...(isActive !== undefined && { isActive }),
        ...(instructions !== undefined && { instructions }),
        ...(whatsappPhoneId !== undefined && { whatsappPhoneId }),
        ...(whatsappToken !== undefined && { whatsappToken }),
        ...(selectedProductId !== undefined && { selectedProductId }),
        ...(selectedServiceId !== undefined && { selectedServiceId }),
        ...(mode !== undefined && { mode }),
        ...(workHoursEnabled !== undefined && { workHoursEnabled }),
        ...(workStart !== undefined && { workStart }),
        ...(workEnd !== undefined && { workEnd }),
        ...(offlineMessage !== undefined && { offlineMessage }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(postSaleMessage !== undefined && { postSaleMessage }),
      }
    })

    return successResponse(agent)
  } catch (error) {
    console.error("PUT agent error:", error)
    return errorResponse("خطأ في تحديث Agent", 500)
  }
}
