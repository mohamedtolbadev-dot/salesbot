import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/response"

export async function POST(request) {
  try {
    // 1. جلب كل Agent مع mode ديالهم
    const agents = await prisma.agent.findMany({
      select: { userId: true, mode: true }
    })

    let fixedCount = 0

    // 2. لكل Agent — حدث محادثاته حسب mode
    for (const agent of agents) {
      const isService = agent.mode === "service"

      // حدث المحادثات التي ما عندهاش type صح
      const result = await prisma.conversation.updateMany({
        where: {
          userId: agent.userId,
          // فقط المحادثات التي type ديالها خاطئ
          type: isService ? "product" : { not: "product" }
        },
        data: {
          type: isService ? "service" : "product"
        }
      })

      fixedCount += result.count
      console.log(`✅ Fixed ${result.count} conversations for userId=${agent.userId} → type=${isService ? 'service' : 'product'}`)
    }

    return successResponse({
      fixed: fixedCount,
      message: `تم إصلاح ${fixedCount} محادثة`
    })
  } catch (error) {
    console.error("Fix conversation types error:", error)
    return errorResponse("فشل في الإصلاح", 500)
  }
}

// ── كيفاش تستخدمه ──
// POST /api/admin/fix-conversation-types
// مرة واحدة فقط من Postman أو Thunder Client
// بعدها احذف هذا الملف
