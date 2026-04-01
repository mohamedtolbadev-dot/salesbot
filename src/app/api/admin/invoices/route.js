import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

async function requireSuperAdmin(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const admin = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
  if (admin?.role !== "SUPER_ADMIN") return null
  return decoded
}

function generateInvoiceNumber() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV-${y}${m}-${rand}`
}

// GET /api/admin/invoices
export async function GET(request) {
  try {
    const decoded = await requireSuperAdmin(request)
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")

    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, storeName: true, plan: true } },
      },
    })

    return NextResponse.json({ data: invoices })
  } catch (error) {
    console.error("GET /api/admin/invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST /api/admin/invoices
export async function POST(request) {
  try {
    const decoded = await requireSuperAdmin(request)
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { clientId, amount, plan, dueDate, notes, bankInfo } = body

    if (!clientId || !amount || !dueDate) {
      return NextResponse.json({ error: "clientId, amount, dueDate are required" }, { status: 400 })
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    let invoiceNumber = generateInvoiceNumber()
    // ensure uniqueness
    let exists = await prisma.invoice.findUnique({ where: { invoiceNumber } })
    let attempts = 0
    while (exists && attempts < 10) {
      invoiceNumber = generateInvoiceNumber()
      exists = await prisma.invoice.findUnique({ where: { invoiceNumber } })
      attempts++
    }
    if (exists) return NextResponse.json({ error: "Failed to generate unique invoice number" }, { status: 500 })

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber,
        amount: Number(amount),
        plan: plan || client.plan,
        dueDate: new Date(dueDate),
        notes,
        bankInfo,
        status: "PENDING",
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, storeName: true, plan: true } },
      },
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/invoices error:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
