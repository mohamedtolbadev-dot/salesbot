import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/response"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(request) {
  try {
    // Rate limiting - 10 attempts per 15 minutes
    const rateLimitResult = rateLimit(request, true)
    if (!rateLimitResult.success) {
      return errorResponse(`تم تجاوز الحد المسموح به. حاول مرة أخرى بعد ${Math.ceil(rateLimitResult.retryAfter / 60)} دقيقة`, 429)
    }

    const raw = await request.json()
    const name  = raw.name?.trim()
    const email = raw.email?.trim().toLowerCase()
    const password = raw.password
    const phone = raw.phone?.trim() || undefined
    const mode  = raw.mode || "product"

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password) {
      return errorResponse("كل الحقول مطلوبة", 400)
    }

    // التحقق من صحة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse("صيغة الإيميل غير صحيحة", 400)
    }

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
      return errorResponse("كلمة المرور يجب أن تكون 8 أحرف على الأقل", 400)
    }

    // التحقق من عدم وجود الإيميل
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    if (existing) {
      return errorResponse("الإيميل مسجل مسبقاً")
    }

    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(password)

    // إنشاء المستخدم مع Agent افتراضي
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        storeName: name.trim(),
        agent: {
          create: {
            name: "Agent",
            domain: "تجارة عامة",
            style: "friendly",
            language: "darija",
            isActive: true,
            mode,
            instructions: "كن ودوداً ومقنعاً دائماً",
            objectionReplies: {
              create: [
                {
                  trigger: "غالي شوية",
                  reply: "نفهمك 😊 لكن الجودة تستحق + التوصيل مجاني اليوم 🎁",
                  order: 1,
                },
                {
                  trigger: "نفكر فيها",
                  reply: "خدي وقتك 😊 لكن الكمية محدودة ⏰",
                  order: 2,
                },
              ],
            },
          },
        },
      },
      include: { agent: true },
    })

    const token = generateToken(user.id)

    return successResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        plan: user.plan,
      },
    }, 201)
  } catch (error) {
    console.error("Register error:", error)
    return errorResponse("خطأ في التسجيل", 500)
  }
}
