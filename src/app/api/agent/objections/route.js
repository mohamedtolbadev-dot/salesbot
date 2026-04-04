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
      where: { userId: user.id }
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    const replies = await prisma.objectionReply.findMany({
      where: { agentId: agent.id },
      orderBy: { order: "asc" }
    })

    return successResponse(replies)
  } catch (error) {
    console.error("GET objections error:", error)
    return errorResponse("خطأ في جلب الردود", 500)
  }
}

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { trigger, reply } = await request.json()

    // ✅ Validation صارم
    const cleanTrigger = typeof trigger === 'string' ? trigger.trim() : ''
    const cleanReply = typeof reply === 'string' ? reply.trim() : ''
    
    if (!cleanTrigger || !cleanReply) {
      return errorResponse("trigger و reply يجب أن يكونا نصاً صالحاً", 400)
    }
    
    if (cleanTrigger.length > 100) {
      return errorResponse("trigger طويل جداً (الحد 100 حرف)", 400)
    }
    
    if (cleanReply.length > 500) {
      return errorResponse("reply طويل جداً (الحد 500 حرف)", 400)
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id }
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    const count = await prisma.objectionReply.count({
      where: { agentId: agent.id }
    })
    
    if (count >= 50) {
      return errorResponse("الحد الأقصى 50 رد — احذف بعض الردود القديمة", 400)
    }

    const newReply = await prisma.objectionReply.create({
      data: {
        agentId: agent.id,
        trigger: cleanTrigger,
        reply: cleanReply,
        order: count + 1,
      }
    })

    return successResponse(newReply, 201)
  } catch (error) {
    console.error("POST objection error:", error)
    return errorResponse("خطأ في إضافة الرد", 500)
  }
}

export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const objection = await prisma.objectionReply.findFirst({
      where: {
        id: params.id,
        agent: { userId: user.id }
      }
    })
    if (!objection) return errorResponse("الرد غير موجود", 404)

    const { trigger, reply } = await request.json()
    const cleanTrigger = typeof trigger === 'string' ? trigger.trim() : ''
    const cleanReply = typeof reply === 'string' ? reply.trim() : ''

    if (!cleanTrigger || !cleanReply) {
      return errorResponse("البيانات غير صالحة", 400)
    }

    const updated = await prisma.objectionReply.update({
      where: { id: params.id },
      data: { trigger: cleanTrigger, reply: cleanReply }
    })
    return successResponse(updated)
  } catch (error) {
    console.error("PUT objection error:", error)
    return errorResponse("خطأ في تحديث الرد", 500)
  }
}

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const objection = await prisma.objectionReply.findFirst({
      where: {
        id: params.id,
        agent: { userId: user.id }
      }
    })
    if (!objection) return errorResponse("الرد غير موجود", 404)

    await prisma.objectionReply.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error("DELETE objection error:", error)
    return errorResponse("خطأ في حذف الرد", 500)
  }
}
