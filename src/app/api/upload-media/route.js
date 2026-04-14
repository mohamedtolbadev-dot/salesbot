import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { errorResponse, unauthorizedResponse } from "@/lib/response"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder") || "salesbot/media"

    if (!file) {
      return errorResponse("الملف مطلوب", 400)
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder,
          resource_type: "auto",
          quality: "auto:good",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
    })
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error)
    return errorResponse(error.message || "فشل رفع الملف", 500)
  }
}
