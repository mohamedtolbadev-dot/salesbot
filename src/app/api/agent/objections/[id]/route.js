import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { trigger, reply } = await request.json()

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id }
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    const updated = await prisma.objectionReply.update({
      where: {
        id: params.id,
        agentId: agent.id
      },
      data: {
        ...(trigger && { trigger }),
        ...(reply && { reply }),
      }
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PUT objection error:", error)
    return errorResponse("خطأ في تعديل الرد", 500)
  }
}

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id }
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    await prisma.objectionReply.delete({
      where: {
        id: params.id,
        agentId: agent.id
      }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("DELETE objection error:", error)
    return errorResponse("خطأ في حذف الرد", 500)
  }
}
