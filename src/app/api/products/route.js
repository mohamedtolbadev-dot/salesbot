import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from "@/lib/response"

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const activeOnly = searchParams.get("active") === "true"

    const products = await prisma.product.findMany({
      where: {
        userId: user.id,
        ...(activeOnly && { isActive: true }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        }),
      },
      orderBy: { createdAt: "desc" }
    })

    return successResponse(products)
  } catch (error) {
    console.error("GET products error:", error)
    return errorResponse("خطأ في جلب المنتجات", 500)
  }
}

export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  try {
    const { name, price, description, images } = await request.json()

    if (!name || !price) {
      return errorResponse("الاسم والسعر مطلوبان")
    }

    if (isNaN(price) || price <= 0) {
      return errorResponse("السعر يجب أن يكون رقماً موجباً")
    }

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        name,
        price: Number(price),
        description: description || "",
        images: images ? JSON.stringify(images) : null,
      }
    })

    return successResponse(product, 201)
  } catch (error) {
    console.error("POST product error:", error)
    return errorResponse("خطأ في إضافة المنتج", 500)
  }
}
