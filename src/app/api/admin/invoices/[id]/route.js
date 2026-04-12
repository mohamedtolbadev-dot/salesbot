import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

async function getSuperAdmin(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const admin = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
  if (admin?.role !== "SUPER_ADMIN") return null
  return decoded
}

// PATCH /api/admin/invoices/[id]
export async function PATCH(request, { params }) {
  try {
    const decoded = await getSuperAdmin(request)
    if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 })
    const body = await request.json()
    const { status, amount, dueDate, notes, bankInfo, plan } = body

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(status === "PAID" && !existing.paidAt && { paidAt: new Date() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(notes !== undefined && { notes }),
        ...(bankInfo !== undefined && { bankInfo }),
        ...(plan && { plan }),
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, storeName: true, plan: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("PATCH /api/admin/invoices/[id] error:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// DELETE /api/admin/invoices/[id]
export async function DELETE(request, { params }) {
  try {
    const decoded = await getSuperAdmin(request)
    if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams || {}
    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 })
    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/invoices/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
