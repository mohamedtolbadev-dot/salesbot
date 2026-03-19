import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    
    // التحقق من أن الإشعار ينتمي للمستخدم الحالي
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!notification) {
      return errorResponse("الإشعار غير موجود", 404)
    }
    
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    return successResponse({ updated: true })
  } catch (error) {
    console.error("PUT notification read error:", error)
    return errorResponse("خطأ في تحديث الإشعار", 500)
  }
}
