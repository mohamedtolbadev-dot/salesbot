import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// GET /api/invoices - client sees their own invoices
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const invoices = await prisma.invoice.findMany({
      where: { clientId: decoded.userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: invoices })
  } catch (error) {
    console.error("GET /api/invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
