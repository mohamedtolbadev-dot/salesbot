import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/response"
import { sendOTPEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rateLimit"
import { randomInt } from "crypto"

function generateOTP() {
  return randomInt(100000, 1000000).toString()
}

export async function POST(request) {
  try {
    const rateLimitResult = rateLimit(request, true)
    if (!rateLimitResult.success) {
      return errorResponse(`fr:Trop de tentatives. Réessayez dans ${Math.ceil(rateLimitResult.retryAfter / 60)} min||ar:حاول مرة أخرى بعد ${Math.ceil(rateLimitResult.retryAfter / 60)} دقيقة`, 429)
    }

    const { email } = await request.json()
    if (!email) return errorResponse("fr:E-mail requis||ar:البريد الإلكتروني مطلوب", 400)

    const existing = await prisma.verificationToken.findFirst({ where: { phone: email } })
    if (!existing) return errorResponse("fr:Aucune inscription trouvée. Recommencez l'inscription.||ar:لم يتم العثور على طلب تسجيل لهذا البريد. أعد التسجيل.", 404)

    const code      = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.verificationToken.update({
      where: { id: existing.id },
      data:  { code, expiresAt },
    })

    await sendOTPEmail({ to: email, code })

    const isDev = process.env.NODE_ENV !== "production" && !process.env.EMAIL_USER
    return successResponse({
      ...(isDev ? { devCode: code } : {}),
    })
  } catch (error) {
    console.error("resend-otp error:", error)
    return errorResponse("fr:Erreur lors du renvoi||ar:خطأ في إعادة الإرسال", 500)
  }
}
