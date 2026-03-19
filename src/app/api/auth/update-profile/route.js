import { getUserFromRequest } from "@/lib/auth"
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/response"
import { prisma } from "@/lib/prisma"

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { name, email, phone, storeName } = body

    // Validate required fields
    if (!name || !email || !storeName) {
      return errorResponse("الاسم والبريد واسم المتجر مطلوبة", 400)
    }

    // Check if email is already taken (if changed)
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        return errorResponse("البريد الإلكتروني مستخدم بالفعل", 400)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone: phone || null,
        storeName
      }
    })

    return successResponse({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      storeName: updatedUser.storeName,
      plan: updatedUser.plan
    })
  } catch (err) {
    console.error("Error updating profile:", err)
    return errorResponse("خطأ في تحديث البيانات", 500)
  }
}
