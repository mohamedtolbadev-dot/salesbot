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
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get("stage")
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(stage && stage !== "all" && { stage }),
      ...(search && {
        customer: {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        }
      }),
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              tag: true,
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ])

    return successResponse({
      conversations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("GET conversations error:", error)
    return errorResponse("خطأ في جلب المحادثات", 500)
  }
}
