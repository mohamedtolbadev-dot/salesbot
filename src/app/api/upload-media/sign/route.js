import { cloudinary } from "@/lib/cloudinary"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/response"

export const dynamic = "force-dynamic"

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const timestamp = Math.round(Date.now() / 1000)
    const folder = "wakil/media"

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    )

    return successResponse({
      timestamp,
      signature,
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    })
  } catch (error) {
    console.error("❌ Cloudinary sign error:", error?.message)
    return errorResponse("فشل إنشاء توقيع الرفع", 500)
  }
}
