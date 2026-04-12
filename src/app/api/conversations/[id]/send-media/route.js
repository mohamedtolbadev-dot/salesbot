import { prisma } from "@/lib/prisma"
import { uploadWhatsAppMedia, sendWhatsAppMessage } from "@/lib/whatsapp"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null
  let normalized = phone.replace(/\D/g, "")
  if (normalized.startsWith("0")) normalized = "212" + normalized.substring(1)
  if (!normalized.startsWith("212") && normalized.length === 9) normalized = "212" + normalized
  if (normalized.startsWith("33") && normalized.length === 11) return normalized
  if (normalized.startsWith("1") && normalized.length === 11) return normalized
  return normalized
}

// WhatsApp supported MIME types
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/3gpp"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024    // 5MB
const MAX_VIDEO_SIZE = 16 * 1024 * 1024   // 16MB
const MAX_DOC_SIZE = 100 * 1024 * 1024    // 100MB

export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return errorResponse("معرف المحادثة غير صالح", 400)

    const formData = await request.formData()
    const file = formData.get("file")
    const mediaType = formData.get("type") // "image" | "document"
    const caption = formData.get("caption") || ""

    if (!file) return errorResponse("الملف مطلوب", 400)
    if (!mediaType || !["image", "video", "document"].includes(mediaType)) {
      return errorResponse("نوع الملف غير صالح (image, video أو document)", 400)
    }

    const fileType = file.type || "application/octet-stream"
    const fileName = file.name || "file"

    // Validate file type and size
    if (mediaType === "image") {
      if (!IMAGE_TYPES.includes(fileType)) {
        return errorResponse("صيغة الصورة غير مدعومة (JPG, PNG, WebP فقط)", 400)
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return errorResponse("حجم الصورة يتجاوز 5MB", 400)
      }
    } else if (mediaType === "video") {
      if (!VIDEO_TYPES.includes(fileType)) {
        return errorResponse("صيغة الفيديو غير مدعومة (MP4, 3GPP فقط)", 400)
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return errorResponse("حجم الفيديو يتجاوز 16MB", 400)
      }
    } else {
      if (file.size > MAX_DOC_SIZE) {
        return errorResponse("حجم المستند يتجاوز 100MB", 400)
      }
    }

    // Read file buffer first (must be before any other async ops on Vercel)
    const buffer = Buffer.from(await file.arrayBuffer())

    // Fetch conversation + agent in parallel
    const [conversation, agent] = await Promise.all([
      prisma.conversation.findFirst({
        where: { id, userId: user.id },
        include: { customer: true },
      }),
      prisma.agent.findUnique({ where: { userId: user.id } }),
    ])
    if (!conversation) return errorResponse("المحادثة غير موجودة", 404)
    if (!agent) return errorResponse("Agent غير موجود", 404)
    if (!agent.whatsappPhoneId || !agent.whatsappToken) {
      return errorResponse("إعدادات واتساب غير مكتملة", 400)
    }
    if (!conversation.customer?.phone) {
      return errorResponse("رقم هاتف العميل غير متوفر", 400)
    }

    const normalizedPhone = normalizePhoneForWhatsApp(conversation.customer.phone)
    if (!normalizedPhone) return errorResponse("رقم هاتف العميل غير صالح", 400)

    // Upload file to WhatsApp Media
    if (!buffer || buffer.length < 100) {
      return errorResponse("الملف فارغ أو غير صالح", 400)
    }

    console.log(`📤 Uploading ${mediaType}: "${fileName}" (${fileType}, ${(buffer.length / 1024).toFixed(0)} KB)`)

    const uploadResult = await uploadWhatsAppMedia({
      phoneId: agent.whatsappPhoneId,
      token: agent.whatsappToken,
      fileBuffer: buffer,
      filename: fileName,
      mimeType: fileType,
    })

    if (!uploadResult.success || !uploadResult.mediaId) {
      const errMsg = uploadResult.error?.error?.message || "فشل رفع الملف"
      console.error("❌ Media upload failed:", errMsg)
      return errorResponse(errMsg, 500)
    }

    const { mediaId } = uploadResult
    console.log(`✅ Media uploaded (ID: ${mediaId})`)

    // Send via WhatsApp
    let sentResult
    if (mediaType === "image") {
      sentResult = await sendWhatsAppMessage({
        phoneId: agent.whatsappPhoneId,
        token: agent.whatsappToken,
        to: normalizedPhone,
        type: "image",
        imageId: mediaId,
        message: caption || undefined,
      })
    } else if (mediaType === "video") {
      sentResult = await sendWhatsAppMessage({
        phoneId: agent.whatsappPhoneId,
        token: agent.whatsappToken,
        to: normalizedPhone,
        type: "video",
        videoId: mediaId,
        message: caption || undefined,
      })
    } else {
      sentResult = await sendWhatsAppMessage({
        phoneId: agent.whatsappPhoneId,
        token: agent.whatsappToken,
        to: normalizedPhone,
        type: "document",
        document: { id: mediaId, filename: fileName },
        message: caption || undefined,
      })
    }

    if (!sentResult.success) {
      const errMsg = sentResult.error?.error?.message || "فشل إرسال الملف"
      console.error("❌ WhatsApp send failed:", errMsg)
      return errorResponse(errMsg, 500)
    }

    console.log(`✅ ${mediaType} sent to WhatsApp`)

    // Save to DB
    const content = mediaType === "image"
      ? `[صورة]${caption ? ` ${caption}` : ""}`
      : mediaType === "video"
      ? `[فيديو]${caption ? ` ${caption}` : ""}`
      : `[مستند: ${fileName}]${caption ? ` ${caption}` : ""}`

    // Save message + update conversation in parallel
    const [saved] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId: id,
          role: "AGENT",
          content,
          whatsappMediaId: mediaId,
        }
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ])

    return successResponse(saved, 201)
  } catch (error) {
    console.error("❌ send-media error:", error?.message)
    return errorResponse("خطأ في إرسال الملف", 500)
  }
}
