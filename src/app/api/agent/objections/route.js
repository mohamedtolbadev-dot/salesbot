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

    if (!trigger || !reply) {
      return errorResponse("trigger و reply مطلوبان")
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id }
    })
    if (!agent) return errorResponse("Agent غير موجود", 404)

    const count = await prisma.objectionReply.count({
      where: { agentId: agent.id }
    })

    const newReply = await prisma.objectionReply.create({
      data: {
        agentId: agent.id,
        trigger,
        reply,
        order: count + 1,
      }
    })

    return successResponse(newReply, 201)
  } catch (error) {
    console.error("POST objection error:", error)
    return errorResponse("خطأ في إضافة الرد", 500)
  }
}
