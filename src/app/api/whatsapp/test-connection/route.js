// API لاختبار الاتصال بـ WhatsApp Business API
// يتحقق من صحة Phone ID و Token بدون إرسال رسالة

import { getUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse,
         unauthorizedResponse } from "@/lib/response"

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { phoneId, token } = await request.json()

    if (!phoneId || !token) {
      return errorResponse("Phone ID و Token مطلوبان", 400)
    }

    // اختبار الاتصال بـ Meta API - جلب معلومات الهاتف
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}?access_token=${token}`,
      { method: 'GET' }
    )

    if (response.status === 401) {
      return errorResponse("❌ Token غير صالح أو منتهي الصلاحية", 401)
    }

    if (response.status === 404) {
      return errorResponse("❌ Phone ID غير موجود", 404)
    }

    if (!response.ok) {
      const errorData = await response.json()
      return errorResponse(
        errorData.error?.message || "فشل في الاتصال بـ WhatsApp API",
        response.status
      )
    }

    const data = await response.json()

    // حفظ البيانات في قاعدة البيانات
    await prisma.agent.update({
      where: { userId: user.id },
      data: {
        whatsappPhoneId: phoneId,
        whatsappToken: token,
      }
    })

    return successResponse({
      success: true,
      phoneNumber: data.display_phone_number,
      qualityRating: data.quality_rating,
      verifiedName: data.verified_name,
      message: "✅ الاتصال بـ WhatsApp Business API ناجح!"
    })
  } catch (error) {
    console.error("WhatsApp connection test error:", error)
    return errorResponse("❌ خطأ في الاتصال بالخادم", 500)
  }
}
