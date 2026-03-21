import { prisma } from "@/lib/prisma"
import { comparePassword, generateToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/response"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(request) {
  try {
    // Rate limiting - 10 attempts per 15 minutes
    const rateLimitResult = rateLimit(request, true)
    if (!rateLimitResult.success) {
      return errorResponse(`تم تجاوز الحد المسموح به. حاول مرة أخرى بعد ${Math.ceil(rateLimitResult.retryAfter / 60)} دقيقة`, 429)
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse("الإيميل وكلمة المرور مطلوبان")
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email },
      include: { agent: true }
    })

    if (!user) {
      return errorResponse("الإيميل أو كلمة المرور غير صحيحة")
    }

    // التحقق من كلمة المرور
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return errorResponse("الإيميل أو كلمة المرور غير صحيحة")
    }

    const token = generateToken(user.id)

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        plan: user.plan,
        agent: user.agent ? {
          id: user.agent.id,
          name: user.agent.name,
          isActive: user.agent.isActive,
        } : null,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return errorResponse("خطأ في تسجيل الدخول", 500)
  }
}
