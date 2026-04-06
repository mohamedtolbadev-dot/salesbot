import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        conversations: {
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            }
          }
        },
        orders: {
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          orderBy: { createdAt: "desc" },
        },
      }
    })

    if (!customer) {
      return errorResponse("الزبون غير موجود", 404)
    }

    return successResponse(customer)
  } catch (error) {
    console.error("GET customer error:", error)
    return errorResponse("خطأ في جلب الزبون", 500)
  }
}

export async function PATCH(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { tag } = await request.json()

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId: user.id }
    })
    if (!customer) {
      return errorResponse("الزبون غير موجود", 404)
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: { tag }
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PATCH customer error:", error)
    return errorResponse("خطأ في تحديث الزبون", 500)
  }
}
