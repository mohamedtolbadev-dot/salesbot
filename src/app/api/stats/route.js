import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      todayConversations,
      todayClosed,
      pitching,
      customers,
      weekConversations,
      objectionReasons,
    ] = await Promise.all([

      // محادثات اليوم
      prisma.conversation.count({
        where: {
          userId: user.id,
          createdAt: { gte: today }
        }
      }),

      // مبيعات اليوم (CLOSED)
      prisma.conversation.findMany({
        where: {
          userId: user.id,
          stage: "CLOSED",
          createdAt: { gte: today }
        },
        select: { totalAmount: true }
      }),

      // قيد الإقناع
      prisma.conversation.count({
        where: {
          userId: user.id,
          stage: "PITCHING"
        }
      }),

      // الزبائن
      prisma.customer.count({
        where: { userId: user.id }
      }),

      // محادثات الأسبوع الأخير
      prisma.conversation.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // أسباب الاعتراض (mock)
      Promise.resolve([
        { reason: "السعر غالي",    count: 65 },
        { reason: "نفكر فيها",     count: 42 },
        { reason: "مش المقاس",    count: 28 },
        { reason: "اللون مش كاين", count: 18 },
      ]),
    ])

    const todayRevenue = todayClosed.reduce(
      (sum, c) => sum + (c.totalAmount || 0), 0
    )
    const conversionRate = todayConversations > 0
      ? Math.round((todayClosed.length / todayConversations) * 100)
      : 0

    return successResponse({
      todayConversations,
      todaySales: todayClosed.length,
      conversionRate,
      todayRevenue: Math.round(todayRevenue),
      pitching,
      customers,
      weekConversations,
      weekRevenue: Math.round(todayRevenue * 7),
      avgOrderValue: todayClosed.length > 0
        ? Math.round(todayRevenue / todayClosed.length)
        : 0,
      avgResponseTime: "2.3 ث",
      satisfactionRate: 92,
      returnRate: 34,
      objectionReasons,
      stages: {
        greeting:  todayConversations,
        discovery: Math.round(todayConversations * 0.74),
        pitching,
        objection: Math.round(todayConversations * 0.26),
        closed:    todayClosed.length,
      },
      weeklyChart: [45, 62, 38, 75, 55, 90, todayConversations],
      weeklyDays: ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"],
    })
  } catch (error) {
    console.error("GET stats error:", error)
    return errorResponse("خطأ في جلب الإحصائيات", 500)
  }
}
