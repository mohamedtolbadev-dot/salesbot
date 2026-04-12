import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/appointments/[id] - Get single appointment
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
      include: {
        service: { select: { name: true, price: true, duration: true } },
        customer: { select: { name: true, phone: true } },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const formatted = {
      id: appointment.id,
      customerName: appointment.customer?.name || appointment.customerName,
      customerPhone: appointment.customer?.phone || appointment.customerPhone,
      date: appointment.date.toISOString(),
      status: appointment.status,
      service: appointment.service?.name || appointment.serviceName,
      notes: appointment.notes,
      reminderSent: appointment.reminderSent,
      confirmationSent: appointment.confirmationSent,
    }

    return NextResponse.json({ data: formatted })
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 })
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { customerName, customerPhone, serviceId, serviceName, date, notes } = body

    // Check if appointment exists and belongs to user
    const existing = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const updateData = {}
    if (customerName !== undefined) updateData.customerName = customerName
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone
    if (serviceId !== undefined) updateData.serviceId = serviceId

    // Resolve service name if provided - with ownership check
    if (serviceName !== undefined) {
      updateData.serviceName = serviceName
    } else if (serviceId !== undefined && !serviceName) {
      // Verify service exists and belongs to user
      const svc = await prisma.service.findFirst({
        where: { id: serviceId, userId: user.id },
        select: { name: true }
      })
      if (!svc) {
        return NextResponse.json({ error: "Service not found or access denied" }, { status: 403 })
      }
      updateData.serviceName = svc.name
    }

    if (date !== undefined) {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 })
      }
      updateData.date = parsedDate
    }
    if (notes !== undefined) updateData.notes = notes

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: appointment })
  } catch (error) {
    console.error("PUT /api/appointments/[id] error:", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if appointment exists and belongs to user
    const existing = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Appointment deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/appointments/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 })
  }
}
