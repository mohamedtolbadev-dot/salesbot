import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

export async function GET(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { customer: { select: { name: true, phone: true, tag: true } } },
    })
    if (!order) return errorResponse("الطلبية غير موجودة", 404)
    return successResponse(order)
  } catch (error) {
    return errorResponse("خطأ في جلب الطلبية", 500)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { customerName, customerPhone, productName, quantity, totalAmount, city, address, notes, trackingNumber } = body

    const existing = await prisma.order.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse("الطلبية غير موجودة", 404)

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(productName !== undefined && { productName }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error)
    return errorResponse("خطأ في تعديل الطلبية", 500)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const existing = await prisma.order.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse("الطلبية غير موجودة", 404)

    await prisma.order.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error)
    return errorResponse("خطأ في حذف الطلبية", 500)
  }
}
