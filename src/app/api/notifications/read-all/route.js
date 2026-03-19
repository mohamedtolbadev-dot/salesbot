import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    })

    return successResponse({ 
      updated: true,
      count: result.count 
    })
  } catch (error) {
    console.error("PUT read-all error:", error)
    return errorResponse("خطأ في تحديث الإشعارات", 500)
  }
}
