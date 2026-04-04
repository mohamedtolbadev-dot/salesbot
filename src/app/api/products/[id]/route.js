import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const product = await prisma.product.findFirst({
      where: { id, userId: user.id }
    })

    if (!product) return errorResponse("المنتج غير موجود", 404)

    return successResponse(product)
  } catch (error) {
    return errorResponse("خطأ في جلب المنتج", 500)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { name, price, description, isActive, images, stock } = body

    const product = await prisma.product.findFirst({
      where: { id, userId: user.id }
    })
    if (!product) return errorResponse("المنتج غير موجود", 404)

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && {
          price: (() => {
            const parsed = parseFloat(price)
            if (isNaN(parsed) || parsed < 0 || parsed > 1000000) return product.price
            return parsed
          })()
        }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        ...(stock !== undefined && {
          stock: (() => {
            const parsed = parseFloat(stock)
            if (isNaN(parsed) || parsed < 0) return product.stock
            return parsed
          })()
        }),
      }
    })

    return successResponse(updated)
  } catch (error) {
    console.error("PUT product error:", error)
    return errorResponse("خطأ في تعديل المنتج", 500)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const product = await prisma.product.findFirst({
      where: { id, userId: user.id }
    })
    if (!product) return errorResponse("المنتج غير موجود", 404)

    await prisma.product.delete({ where: { id } })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("DELETE product error:", error)
    return errorResponse("خطأ في حذف المنتج", 500)
  }
}
