import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/users
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
    if (admin?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const users = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        storeName: true,
        plan: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { invoices: true, conversations: true, orders: true },
        },
      },
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error("GET /api/admin/users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// DELETE /api/admin/users?id=xxx
export async function DELETE(request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
    if (admin?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    if (userId === decoded.userId) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
