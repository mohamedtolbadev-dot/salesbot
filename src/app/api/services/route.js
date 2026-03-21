import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

// GET — جلب كل الخدمات
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const services = await prisma.service.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return successResponse(services)
  } catch (error) {
    console.error("GET services error:", error)
    return errorResponse("خطأ في جلب الخدمات", 500)
  }
}

// POST — إضافة خدمة جديدة
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    console.log("POST services body:", body)
    const { name, price, description, images, duration } = body

    if (!name?.trim() || price === undefined || price === null) {
      return errorResponse("الاسم والسعر مطلوبان", 400)
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return errorResponse("السعر غير صالح", 400)
    }

    const data = {
      userId: user.id,
      name: name.trim(),
      price: parsedPrice,
      description: description?.trim() || null,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      duration: duration ? (isNaN(parseInt(duration)) ? 60 : parseInt(duration)) : 60
    }
    console.log("Creating service with data:", data)

    const service = await prisma.service.create({ data })
    console.log("Service created:", service)

    return successResponse(service, 201)
  } catch (error) {
    console.error("POST service error:", error)
    return errorResponse("خطأ في إنشاء الخدمة", 500)
  }
}
