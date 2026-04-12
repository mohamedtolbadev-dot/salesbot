import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// GET /api/admin/users/[userId]
export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
    if (admin?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const resolvedParams = await Promise.resolve(params)
    const { userId } = resolvedParams || {}
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    const [user, orders, appointments, conversations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, phone: true,
          storeName: true, plan: true, isActive: true, createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, customerName: true, customerPhone: true,
          productName: true, quantity: true, totalAmount: true,
          status: true, createdAt: true, address: true, trackingNumber: true,
        },
      }),
      prisma.appointment.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true, customerName: true, customerPhone: true,
          serviceName: true, date: true, status: true, notes: true, createdAt: true,
        },
      }),
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true, stage: true,
          isRead: true, updatedAt: true, createdAt: true,
          customer: { select: { name: true, phone: true } },
          _count: { select: { messages: true } },
        },
      }),
    ])

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ data: { user, orders, appointments, conversations } })
  } catch (error) {
    console.error("GET /api/admin/users/[userId] error:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
