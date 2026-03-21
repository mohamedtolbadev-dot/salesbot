import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

// PUT — تحديث خدمة
export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, description, images, duration, isActive } = body

    // التحقق من ملكية الخدمة
    const existing = await prisma.service.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return errorResponse("الخدمة غير موجودة", 404)
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(price !== undefined && { price: isNaN(parseFloat(price)) ? 0 : parseFloat(price) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(images !== undefined && { images: images && images.length > 0 ? JSON.stringify(images) : null }),
        ...(duration !== undefined && { duration: isNaN(parseInt(duration)) ? 0 : parseInt(duration) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return successResponse(service)
  } catch (error) {
    console.error("PUT service error:", error)
    return errorResponse("خطأ في تحديث الخدمة", 500)
  }
}

// DELETE — حذف خدمة
export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // التحقق من ملكية الخدمة
    const existing = await prisma.service.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return errorResponse("الخدمة غير موجودة", 404)
    }

    await prisma.service.delete({ where: { id } })

    return successResponse({ message: "تم حذف الخدمة" })
  } catch (error) {
    console.error("DELETE service error:", error)
    return errorResponse("خطأ في حذف الخدمة", 500)
  }
}
