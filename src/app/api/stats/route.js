import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

// تحليل أسباب الاعتراض من نص الرسالة
function analyzeObjectionReason(content) {
  const text = content.toLowerCase()
  if (text.includes("غالي") || text.includes("كثير") || text.includes("فلوس") || text.includes("ثمن")) {
    return "السعر غالي"
  }
  if (text.includes("نفكر") || text.includes("نستشير") || text.includes("وقت")) {
    return "نفكر فيها"
  }
  if (text.includes("مقاس") || text.includes("حجم") || text.includes("size")) {
    return "مش المقاس"
  }
  if (text.includes("لون") || text.includes("لونها") || text.includes("color")) {
    return "اللون مش كاين"
  }
  if (text.includes("موجود") || text.includes("ستوك") || text.includes("متاح")) {
    return "غير متوفر"
  }
  return null
}

// حساب متوسط وقت الرد بالثواني
function calculateAvgResponseTime(conversations) {
  let totalResponseTime = 0
  let responseCount = 0

  for (const conv of conversations) {
    const messages = conv.messages
    for (let i = 1; i < messages.length; i++) {
      if (messages[i - 1].role === "USER" && messages[i].role === "AGENT") {
        const userTime = new Date(messages[i - 1].createdAt).getTime()
        const agentTime = new Date(messages[i].createdAt).getTime()
        const diffSeconds = (agentTime - userTime) / 1000
        if (diffSeconds > 0 && diffSeconds < 300) {
          totalResponseTime += diffSeconds
          responseCount++
        }
      }
    }
  }

  if (responseCount === 0) return 0
  return Math.round(totalResponseTime / responseCount)
}

// الحصول على بيانات 7 أيام
async function getWeeklyChartData(userId) {
  const days = []
  const counts = []
  const dayNames = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const count = await prisma.conversation.count({
      where: {
        userId,
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    })

    days.push(dayNames[date.getDay()])
    counts.push(count)
  }

  return { days, counts }
}

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // البيانات الأساسية
    const todayConversations = await prisma.conversation.count({
      where: {
        userId: user.id,
        createdAt: { gte: today }
      }
    })

    const todayClosed = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        stage: "CLOSED",
        createdAt: { gte: today }
      },
      select: { totalAmount: true }
    })

    const pitching = await prisma.conversation.count({
      where: {
        userId: user.id,
        stage: "PITCHING"
      }
    })

    const customers = await prisma.customer.count({
      where: { userId: user.id }
    })

    const weekConversations = await prisma.conversation.count({
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo }
      }
    })

    // بيانات إيرادات الأسبوع الكامل (حقيقية 100%)
    const weekClosed = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        stage: "CLOSED",
        createdAt: { gte: sevenDaysAgo }
      },
      select: { totalAmount: true }
    })
    const weekRevenue = weekClosed.reduce((sum, c) => sum + (c.totalAmount || 0), 0)

    // بيانات الرسم البياني
    const weeklyData = await getWeeklyChartData(user.id)

    // أسباب الاعتراض - جلب الرسائل ثم تحليلها
    const userConversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    const conversationIds = userConversations.map(c => c.id)
    
    let allObjections = []
    if (conversationIds.length > 0) {
      allObjections = await prisma.message.findMany({
        where: {
          role: "USER",
          conversationId: { in: conversationIds },
          OR: [
            { content: { contains: "غالي" } },
            { content: { contains: "كثير" } },
            { content: { contains: "نفكر" } },
            { content: { contains: "مقاس" } },
            { content: { contains: "لون" } },
            { content: { contains: "موجود" } },
            { content: { contains: "مش" } }
          ]
        },
        select: { content: true },
        take: 100
      })
    }

    // عدد المحادثات في كل مرحلة - استخدام findMany بدلاً من groupBy
    const allConversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      select: { stage: true }
    })
    const stageMap = {}
    for (const conv of allConversations) {
      stageMap[conv.stage] = (stageMap[conv.stage] || 0) + 1
    }

    // رضا الزبائن - متوسط score المحادثات المغلقة
    const closedConversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        stage: "CLOSED"
      },
      select: { score: true }
    })
    const totalScore = closedConversations.reduce((sum, c) => sum + (c.score || 0), 0)
    const satisfactionRate = closedConversations.length > 0
      ? Math.round(totalScore / closedConversations.length)
      : 0

    // زبائن الأسبوع الأخير لحساب نسبة العودة
    const recentCustomers = await prisma.customer.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { ordersCount: true }
    })
    const returningCustomers = recentCustomers.filter(c => c.ordersCount > 1).length
    const returnRate = recentCustomers.length > 0
      ? Math.round((returningCustomers / recentCustomers.length) * 100)
      : 0

    // محادثات لحساب وقت الرد
    const conversationsWithMessages = await prisma.conversation.findMany({
      where: { userId: user.id },
      select: {
        messages: {
          select: { role: true, createdAt: true },
          orderBy: { createdAt: "asc" }
        }
      },
      take: 30,
      orderBy: { createdAt: "desc" }
    })
    const avgResponseTime = calculateAvgResponseTime(conversationsWithMessages)

    // تحليل أسباب الاعتراض
    const objectionReasonsMap = new Map()
    for (const msg of allObjections) {
      const reason = analyzeObjectionReason(msg.content)
      if (reason) {
        objectionReasonsMap.set(reason, (objectionReasonsMap.get(reason) || 0) + 1)
      }
    }
    const objectionReasons = Array.from(objectionReasonsMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // الحسابات النهائية
    const todayRevenue = todayClosed.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
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
      weekRevenue: Math.round(weekRevenue),
      avgOrderValue: todayClosed.length > 0
        ? Math.round(todayRevenue / todayClosed.length)
        : 0,
      avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime} ث` : "-",
      satisfactionRate,
      returnRate,
      objectionReasons: objectionReasons.length > 0 ? objectionReasons : [],
      stages: {
        greeting:  stageMap["GREETING"] || 0,
        discovery: stageMap["DISCOVERY"] || 0,
        pitching:  stageMap["PITCHING"] || 0,
        objection: stageMap["OBJECTION"] || 0,
        closed:    stageMap["CLOSED"] || 0,
      },
      weeklyChart: weeklyData.counts,
      weeklyDays: weeklyData.days,
    })
  } catch (error) {
    console.error("GET stats error:", error)
    console.error("Error stack:", error.stack)
    return errorResponse(`خطأ في جلب الإحصائيات: ${error.message}`, 500)
  }
}
