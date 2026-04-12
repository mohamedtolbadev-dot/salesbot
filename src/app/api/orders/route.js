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

    const normalizedOrders = orders.map((order) => {
      if (order.conversationId) return order
      const fallbackConversationId =
        order.notes?.match(/(?:المحادثة|conversation)\s*:\s*([a-z0-9-]+)/i)?.[1] || null
      return {
        ...order,
        conversationId: fallbackConversationId,
      }
    })

    // Debug: log first order to verify address is returned
    if (normalizedOrders.length > 0) {
      console.log("[DEBUG] First order fields:", Object.keys(normalizedOrders[0]))
      console.log("[DEBUG] First order address:", normalizedOrders[0].address)
    }

    return successResponse(normalizedOrders)
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
    const { customerName, customerPhone, productName, quantity, totalAmount, city, address, notes, productId, customerId } = body

    if (!customerName || !customerPhone || (!productName && !productId) || totalAmount === undefined) {
      return errorResponse("الحقول المطلوبة ناقصة", 400)
    }

    // ✅ إذا جا productId (من المنصة) كنجيب الاسم/الثمن من صفحة المنتجات (DB) ونأمن ownership
    let finalProductId = productId || null
    let finalProductName = productName
    let finalTotalAmount = Number(totalAmount)
    const finalQty = quantity ? Number(quantity) : 1

    if (finalProductId) {
      const product = await prisma.product.findFirst({
        where: { id: finalProductId, userId: user.id }
      })
      if (!product) return errorResponse("المنتج غير موجود", 404)

      finalProductName = product.name
      // إذا totalAmount ما واضحش أو =0، نحسبه من ثمن المنتج × الكمية
      if (!finalTotalAmount || Number.isNaN(finalTotalAmount)) {
        finalTotalAmount = Number(product.price) * (finalQty || 1)
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerId: customerId || null,
        customerName,
        customerPhone,
        productId: finalProductId,
        productName: finalProductName,
        quantity: finalQty || 1,
        totalAmount: finalTotalAmount,
        city: city || null,
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
