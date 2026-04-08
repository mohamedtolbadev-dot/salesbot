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

  const { id } = await params

  try {
    const customer = await prisma.customer.findFirst({
      where: { id, userId: user.id },
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

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  const { id } = await params

  try {
    const customer = await prisma.customer.findFirst({
      where: { id, userId: user.id }
    })
    if (!customer) return errorResponse("الزبون غير موجود", 404)

    console.log(`🗑️ [DELETE] Starting deletion for customer: ${id}`)

    const convIds = (await prisma.conversation.findMany({
      where: { customerId: id },
      select: { id: true }
    })).map(c => c.id)
    console.log(`🗑️ [DELETE] Found ${convIds.length} conversations`)

    if (convIds.length > 0) {
      const msgDel = await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } })
      console.log(`🗑️ [DELETE] Deleted ${msgDel.count} messages`)
    }

    const convDel = await prisma.conversation.deleteMany({ where: { customerId: id } })
    console.log(`🗑️ [DELETE] Deleted ${convDel.count} conversations`)

    const orderDel = await prisma.order.deleteMany({ where: { customerId: id } })
    console.log(`🗑️ [DELETE] Deleted ${orderDel.count} orders`)

    const appDel = await prisma.appointment.deleteMany({ where: { customerId: id } })
    console.log(`🗑️ [DELETE] Deleted ${appDel.count} appointments`)

    await prisma.customer.delete({ where: { id } })
    console.log(`✅ [DELETE] Customer ${id} deleted successfully`)

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("DELETE customer error full:", error)
    return errorResponse(`خطأ في حذف الزبون: ${error.message}`, 500)
  }
}

export async function PATCH(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  const { id } = await params

  try {
    const { tag } = await request.json()

    const customer = await prisma.customer.findFirst({
      where: { id, userId: user.id }
    })
    if (!customer) {
      return errorResponse("الزبون غير موجود", 404)
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { tag }
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PATCH customer error:", error)
    return errorResponse("خطأ في تحديث الزبون", 500)
  }
}
