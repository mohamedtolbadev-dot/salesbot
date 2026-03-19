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
    const tag = searchParams.get("tag")
    const search = searchParams.get("search") || ""

    const customers = await prisma.customer.findMany({
      where: {
        userId: user.id,
        ...(tag && tag !== "all" && { tag }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        }),
      },
      orderBy: [
        { totalSpent: "desc" },
        { createdAt: "desc" },
      ]
    })

    return successResponse(customers)
  } catch (error) {
    console.error("GET customers error:", error)
    return errorResponse("خطأ في جلب الزبائن", 500)
  }
}
