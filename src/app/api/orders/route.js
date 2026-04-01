import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search") || ""

    const where = { userId: user.id }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { productName: { contains: search } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true, tag: true } },
      },
    })

    // Debug: log first order to verify address is returned
    if (orders.length > 0) {
      console.log("[DEBUG] First order fields:", Object.keys(orders[0]))
      console.log("[DEBUG] First order address:", orders[0].address)
    }

    return successResponse(orders)
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return errorResponse("خطأ في جلب الطلبيات", 500)
  }
}

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { customerName, customerPhone, productName, quantity, totalAmount, address, notes, productId, customerId } = body

    if (!customerName || !customerPhone || !productName || totalAmount === undefined) {
      return errorResponse("الحقول المطلوبة ناقصة", 400)
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerId: customerId || null,
        customerName,
        customerPhone,
        productId: productId || null,
        productName,
        quantity: quantity || 1,
        totalAmount: Number(totalAmount),
        address: address || null,
        notes: notes || null,
        status: "PENDING",
      },
    })

    return successResponse(order, 201)
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return errorResponse("خطأ في إنشاء الطلبية", 500)
  }
}
