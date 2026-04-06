import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/response"

export async function POST(request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) return errorResponse("fr:Données manquantes||ar:بيانات ناقصة", 400)

    const record = await prisma.verificationToken.findFirst({
      where: { phone: email, code },
    })

    if (!record) return errorResponse("fr:Code incorrect, réessayez||ar:رمز التحقق غير صحيح", 400)

    if (new Date() > record.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: record.id } })
      return errorResponse("fr:Code expiré. Renvoyez un nouveau code.||ar:انتهت صلاحية الرمز. أعد الإرسال.", 410)
    }

    const { name, email: recordEmail, hashedPassword, mode, phone } = JSON.parse(record.data)
    const resolvedEmail = recordEmail || email

    const existing = await prisma.user.findUnique({ where: { email: resolvedEmail } })
    if (existing) {
      await prisma.verificationToken.delete({ where: { id: record.id } })
      return errorResponse("fr:Cet e-mail est déjà enregistré||ar:الإيميل مسجل مسبقاً", 400)
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: resolvedEmail,
        password: hashedPassword,
        phone: phone || null,
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
                { trigger: "غالي شوية", reply: "نفهمك 😊 لكن الجودة تستحق + التوصيل مجاني اليوم 🎁", order: 1 },
                { trigger: "نفكر فيها", reply: "خدي وقتك 😊 لكن الكمية محدودة ⏰", order: 2 },
              ],
            },
          },
        },
      },
      include: { agent: true },
    })

    await prisma.verificationToken.delete({ where: { id: record.id } })

    const token = generateToken(user.id)

    return successResponse({
      token,
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        storeName: user.storeName,
        plan:      user.plan,
      },
    }, 201)
  } catch (error) {
    console.error("verify-otp error:", error)
    return errorResponse("fr:Erreur lors de la vérification||ar:خطأ في التحقق", 500)
  }
}
