import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { renderTemplate } from "@/lib/aiAgent"

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

      const serviceName = appointment.serviceName || appointment.service?.name || "خدمة"
      const customerName = appointment.customer?.name || appointment.customerName || ""

      const time = new Date(appointment.date).toLocaleTimeString("ar-MA", {
        hour: "2-digit",
        minute: "2-digit",
      })

      // Template variables
      const vars = {
        name: customerName,
        customerName,
        service: serviceName,
        serviceName,
        time,
        date: new Date(appointment.date).toLocaleDateString("ar-MA", {
          weekday: "long", day: "numeric", month: "long",
        }),
      }

      // ✅ Use custom template from agent settings, or fallback to hardcoded
      let message
      const customTemplate = agent?.appointmentReminderMessage
      if (customTemplate) {
        message = renderTemplate(customTemplate, vars)
      }

      // If no custom template or render failed, use fallback
      if (!message || message.length < 5) {
        const nameDisplay = customerName ? ` ${customerName}` : ""
        message = `مرحبا${nameDisplay}! ⏰\nتذكير: عندك موعد غداً\n⌛ ${serviceName}\n🕐 ${time}\nواش مازال موافق؟`
      } else {
        console.log(`📋 [Reminders] Using custom reminder template for appointment ${appointment.id}`)
      }

      // ✅ PII Safe: mask phone number in logs
      const maskedPhone = customerPhone ? "******" + customerPhone.slice(-4) : "N/A"
      console.log(`📤 [Reminders] Sending reminder to ${maskedPhone} for appointment ${appointment.id.slice(0, 6)}...`)

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
