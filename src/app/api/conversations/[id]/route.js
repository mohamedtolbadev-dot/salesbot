import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

// Force dynamic to disable caching
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return errorResponse("معرف المحادثة غير صالح", 400)
    console.log(`[API] Fetching conversation: ${id} for user: ${user.id}`)
    
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" }
        },
      }
    })

    if (!conversation) {
      console.log(`[API] Conversation ${id} not found`)
      return errorResponse("المحادثة غير موجودة", 404)
    }

    console.log(`[API] Found conversation: ${conversation.id}, customer: ${conversation.customer?.name}, messages: ${conversation.messages?.length}`)
    return successResponse(conversation)
  } catch (error) {
    console.error("[API] GET conversation error:", error)
    return errorResponse("خطأ في جلب المحادثة", 500)
  }
}

export async function PATCH(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { isRead, stage, score } = body

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return errorResponse("معرف المحادثة غير صالح", 400)

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id }
    })
    if (!conversation) {
      return errorResponse("المحادثة غير موجودة", 404)
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(stage !== undefined && { stage }),
        ...(score !== undefined && { score }),
      }
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PATCH conversation error:", error)
    return errorResponse("خطأ في تحديث المحادثة", 500)
  }
}

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return errorResponse("معرف المحادثة غير صالح", 400)
    
    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!conversation) {
      return errorResponse("المحادثة غير موجودة", 404)
    }

    // Delete related messages first (cascade delete)
    await prisma.message.deleteMany({
      where: { conversationId: id }
    })

    // Delete the conversation
    await prisma.conversation.delete({
      where: { id }
    })
    return successResponse({ message: "تم حذف المحادثة بنجاح" })
  } catch (error) {
    console.error("[API] DELETE conversation error:", error)
    return errorResponse("خطأ في حذف المحادثة", 500)
  }
}
