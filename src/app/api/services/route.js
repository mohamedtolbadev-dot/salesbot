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
    const { name, price, priceMax, description, images, duration, durationUnit, category, features } = body

    if (!name?.trim() || price === undefined || price === null) {
      return errorResponse("الاسم والسعر مطلوبان", 400)
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return errorResponse("السعر غير صالح", 400)
    }

    const parsedPriceMax = priceMax ? parseFloat(priceMax) : null

    const data = {
      userId: user.id,
      name: name.trim(),
      price: parsedPrice,
      priceMax: (parsedPriceMax && !isNaN(parsedPriceMax) && parsedPriceMax > parsedPrice) ? parsedPriceMax : null,
      duration: duration ? (isNaN(parseInt(duration)) ? 60 : parseInt(duration)) : 60,
      durationUnit: ["minutes", "hours", "days", "weeks", "months"].includes(durationUnit) ? durationUnit : "minutes",
      category: category?.trim() || null,
      description: description?.trim() || null,
      features: features && features.length > 0 ? JSON.stringify(features) : null,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
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
