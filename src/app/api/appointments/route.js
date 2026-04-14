import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { generateStatusUpdateMessage } from "@/lib/aiAgent"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

// GET /api/appointments - Get all appointments for the user
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where = { userId: user.id }
    if (status) where.status = status
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) {
        // Set to end of day to include all appointments on that day
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.date.lte = toDate
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        service: { select: { name: true, price: true, priceMax: true, duration: true, durationUnit: true, category: true, features: true } },
        customer: { select: { name: true, phone: true } },
      },
    })

    // Format response
    const formatted = appointments.map(a => ({
      id: a.id,
      customerName: a.customer?.name || a.customerName,
      customerPhone: a.customer?.phone || a.customerPhone,
      date: a.date.toISOString(),
      status: a.status,
      serviceName: a.service?.name || a.serviceName,
      servicePrice: a.service?.price || null,
      servicePriceMax: a.service?.priceMax || null,
      serviceDuration: a.service?.duration || null,
      serviceDurationUnit: a.service?.durationUnit || "minutes",
      serviceCategory: a.service?.category || null,
      serviceFeatures: a.service?.features || null,
      notes: a.notes,
      reminderSent: a.reminderSent,
      confirmationSent: a.confirmationSent,
      cancellationSent: a.cancellationSent,
      conversationId: a.notes?.match(/المحادثة: ([a-z0-9]+)$/i)?.[1] || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error("GET /api/appointments error:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, customerName, customerPhone, serviceId, serviceName, date, notes } = body

    // Validate required fields
    if (!customerName || !customerPhone || !date || (!serviceId && !serviceName)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate date
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 })
    }

    // Resolve service name
    let resolvedServiceName = serviceName
    if (!resolvedServiceName && serviceId) {
      const svc = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true }
      })
      resolvedServiceName = svc?.name || ""
    }

    if (!resolvedServiceName) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        customerId,
        customerName,
        customerPhone,
        serviceId,
        serviceName: resolvedServiceName,
        date: parsedDate,
        notes,
        status: "PENDING",
        reminderSent: false,
        confirmationSent: false,
      },
    })

    // إرسال رسالة واتساب عند إنشاء الموعد (PENDING)
    try {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id } })
      if (agent?.whatsappPhoneId && agent?.whatsappToken && customerPhone) {
        const { message } = await generateStatusUpdateMessage({
          agent,
          appointment: { ...appointment, serviceName: resolvedServiceName },
          newStatus: "PENDING",
          customerName,
        })
        await sendWhatsAppMessage({
          phoneId: agent.whatsappPhoneId,
          token: agent.whatsappToken,
          to: customerPhone,
          message,
        })
      }
    } catch (msgErr) {
      console.error("POST /api/appointments - failed to send WhatsApp:", msgErr)
    }

    return NextResponse.json({ data: appointment }, { status: 201 })
  } catch (error) {
    console.error("POST /api/appointments error:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
