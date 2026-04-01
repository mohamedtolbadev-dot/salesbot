import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

// GET /api/appointments/reminders/send - Called by Vercel cron job (schedule: "0 9 * * *")
export async function GET(request) {
  return handleReminders(request)
}

// POST /api/appointments/reminders/send - Send reminders for appointments in next 24 hours
export async function POST(request) {
  return handleReminders(request)
}

async function handleReminders(request) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get("x-cron-secret")
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(tomorrow.getHours() + 24)

    console.log(`🔔 [Reminders] Checking for appointments between ${now.toISOString()} and ${tomorrow.toISOString()}`)

    // Find all appointments in the next 24 hours that haven't had a reminder sent
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow,
        },
        reminderSent: false,
        status: {
          in: ["PENDING", "CONFIRMED"], // Only send reminders for pending or confirmed appointments
        },
      },
      include: {
        customer: true,
        service: true,
        user: {
          include: {
            agent: true,
          },
        },
      },
    })

    console.log(`🔔 [Reminders] Found ${appointments.length} appointments needing reminders`)

    const results = []

    for (const appointment of appointments) {
      const agent = appointment.user?.agent
      if (!agent?.whatsappPhoneId || !agent?.whatsappToken) {
        console.log(`⚠️ [Reminders] No WhatsApp config for appointment ${appointment.id}`)
        continue
      }

      const customerPhone = appointment.customerPhone || appointment.customer?.phone
      if (!customerPhone) {
        console.log(`⚠️ [Reminders] No phone number for appointment ${appointment.id}`)
        continue
      }

      const time = new Date(appointment.date).toLocaleTimeString("ar-MA", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const serviceName = appointment.serviceName || appointment.service?.name || "خدمة"

      const message = `غداً عندك موعد الساعة ${time}\nالخدمة: ${serviceName}\nواش مازلت موافق؟`

      console.log(`📤 [Reminders] Sending reminder to ${customerPhone} for appointment ${appointment.id}`)

      const result = await sendWhatsAppMessage({
        phoneId: agent.whatsappPhoneId,
        token: agent.whatsappToken,
        to: customerPhone,
        message: message,
      })

      if (result.success) {
        // Mark reminder as sent
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        })
        console.log(`✅ [Reminders] Reminder sent successfully for appointment ${appointment.id}`)
        results.push({ id: appointment.id, status: "sent" })
      } else {
        console.error(`❌ [Reminders] Failed to send reminder for appointment ${appointment.id}:`, result.error)
        results.push({ id: appointment.id, status: "failed", error: result.error })
      }
    }

    return NextResponse.json({
      success: true,
      processed: appointments.length,
      results,
    })
  } catch (error) {
    console.error("POST /api/appointments/reminders/send error:", error)
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    )
  }
}
