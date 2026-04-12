import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      console.warn("❌ GET /notifications: User not authenticated")
      return unauthorizedResponse()
    }

    console.log(`📍 GET /notifications for user: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")

    const where = {
      userId: user.id,
      ...(unreadOnly && { isRead: false }),
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false }
      }),
      prisma.notification.count({
        where: { userId: user.id }
      })
    ])

    console.log(`✅ GET /notifications: Found ${unreadCount} unread, ${totalCount} total`)
    return successResponse({ 
      notifications, 
      unreadCount,
      totalCount,
      limit
    })
  } catch (error) {
    console.error("❌ GET notifications error:", error?.message || error)
    return errorResponse("خطأ في جلب الإشعارات", 500)
  }
}
