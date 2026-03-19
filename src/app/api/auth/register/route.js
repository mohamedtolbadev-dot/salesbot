import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/response"

export async function POST(request) {
  try {
    const { name, email, password, phone, storeName } =
      await request.json()

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password || !storeName) {
      return errorResponse("كل الحقول مطلوبة")
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
        storeName,
        agent: {
          create: {
            name: "Agent",
            domain: "تجارة عامة",
            style: "friendly",
            language: "darija",
            isActive: true,
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
