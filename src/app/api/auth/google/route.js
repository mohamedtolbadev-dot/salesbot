import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/response"

// Verify Google ID Token
async function verifyGoogleToken(token) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    )
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Google token verification error:", error)
    return null
  }
}

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return errorResponse("Token مطلوب")
    }

    // التحقق من Google Token
    const googleData = await verifyGoogleToken(token)
    if (!googleData) {
      return errorResponse("Token غير صالح")
    }

    const { sub: googleId, email, name, picture } = googleData

    if (!email) {
      return errorResponse("الإيميل مطلوب من Google")
    }

    // البحث عن المستخدم الحالي أو إنشاء مستخدم جديد
    let user = await prisma.user.findUnique({
      where: { email },
      include: { agent: true }
    })

    if (user) {
      // تحديث googleId إذا لم يكن موجوداً
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: { agent: true }
        })
      }
    } else {
      // إنشاء مستخدم جديد
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          storeName: name || "متجري",
        },
        include: { agent: true }
      })

      // إنشاء Agent افتراضي للمستخدم الجديد
      await prisma.agent.create({
        data: {
          userId: user.id,
          name: "Agent",
          domain: "تجارة عامة",
        }
      })

      // إعادة جلب المستخدم مع العلاقات
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { agent: true }
      })
    }

    const jwtToken = generateToken(user.id)

    return successResponse({
      token: jwtToken,
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
    console.error("Google auth error:", error)
    return errorResponse("خطأ في تسجيل الدخول بواسطة Google", 500)
  }
}
