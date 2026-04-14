// API Route: GET /api/outbound/leads
// جلب قائمة Outbound Leads مع pagination و filtering

import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

const PAGE_SIZE = 20

export async function GET(request) {
  try {
    // ✅ التحقق من التوكن
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse("Unauthorized")
    }

    const userId = user.id

    // ✅ قراءة query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10)
    const skip = (page - 1) * limit

    // ✅ بناء where clause
    const where = { userId }

    // فلترة بالحالة
    if (status && ["PENDING", "SENT", "REPLIED", "CONVERTED", "FAILED"].includes(status)) {
      where.status = status
    }

    // بحث
    if (search) {
      where.OR = [
        { customerPhone: { contains: search } },
        { customerName: { contains: search } },
        { itemName: { contains: search } },
      ]
    }

    // ✅ جلب الإحصائيات
    const statsPromise = prisma.outboundLead.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    })

    // ✅ جلب الـ leads
    const leadsPromise = prisma.outboundLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        customerPhone: true,
        customerName: true,
        itemId: true,
        itemName: true,
        itemType: true,
        itemPrice: true,
        status: true,
        sentAt: true,
        repliedAt: true,
        convertedAt: true,
        createdAt: true,
        notes: true,
      },
    })

    // ✅ جلب العدد الإجمالي
    const totalPromise = prisma.outboundLead.count({ where: { userId } })

    // ✅ جلب عدد اليوم
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCountPromise = prisma.outboundLead.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    })

    const [stats, leads, total, todayCount] = await Promise.all([
      statsPromise,
      leadsPromise,
      totalPromise,
      todayCountPromise,
    ])

    // ✅ تجميع الإحصائيات
    const statsMap = {
      total: 0,
      sent: 0,
      replied: 0,
      converted: 0,
      failed: 0,
    }

    for (const stat of stats) {
      const count = stat._count.status
      statsMap.total += count
      if (stat.status === "SENT") statsMap.sent = count
      if (stat.status === "REPLIED") statsMap.replied = count
      if (stat.status === "CONVERTED") statsMap.converted = count
      if (stat.status === "FAILED") statsMap.failed = count
    }

    // ✅ حساب معدل الرد
    const replyRate = statsMap.sent > 0
      ? Math.round((statsMap.replied / statsMap.total) * 100)
      : 0

    return successResponse({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        ...statsMap,
        replyRate,
        todayCount,
      },
    })

  } catch (error) {
    console.error("❌ Outbound leads fetch error:", error.message)
    return errorResponse("حدث خطأ أثناء جلب البيانات", 500)
  } finally {
    await prisma.$disconnect()
  }
}
