import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { generateStatusUpdateMessage } from "@/lib/aiAgent"

// PATCH /api/appointments/[id]/status
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" }, { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { status, sendMessage = true } = body

    // التحقق من صحة الحالة
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED"
    ]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "حالة غير صالحة" },
        { status: 400 }
      )
    }

    // التحقق من وجود الموعد وجلب معلومات الزبون
    const existing = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
      include: {
        customer: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "الموعد غير موجود" },
        { status: 404 }
      )
    }

    // تحديث الحالة
    const updated = await prisma.appointment.update({
      where: { id, userId: user.id },
      data: {
        status,
        ...(status === "CONFIRMED" && { confirmationSent: true }),
        ...(status === "CANCELLED" && { cancellationSent: true }),
      },
    })

    let messageSent = false
    let sentMessage = null

    // ✅ إرسال رسالة تلقائية عند تغيير الحالة (إذا طُلب ذلك)
    if (sendMessage && existing.customerPhone) {
      try {
        // جلب إعدادات الـ Agent
        const agent = await prisma.agent.findUnique({
          where: { userId: user.id },
        })

        if (agent?.whatsappPhoneId && agent?.whatsappToken) {
          // ✅ generateStatusUpdateMessage handles templates first, then AI fallback
          const { message, usedTemplate } = await generateStatusUpdateMessage({
            agent,
            appointment: existing,
            newStatus: status,
            customerName: existing.customerName,
          })

          if (!message) {
            throw new Error("Failed to generate message")
          }

          sentMessage = message
          const source = usedTemplate ? "custom-template" : "ai-generated"
          console.log(`📋 [Status] Using ${source} for status ${status}`)

          // إرسال الرسالة عبر واتساب
          const result = await sendWhatsAppMessage({
            phoneId: agent.whatsappPhoneId,
            token: agent.whatsappToken,
            to: existing.customerPhone,
            message,
          })

          if (result.success) {
            messageSent = true
            // ✅ PII Safe: mask phone in logs
            const maskedPhone = existing.customerPhone ? "******" + existing.customerPhone.slice(-4) : "N/A"
            console.log(`✅ Status message sent to ${maskedPhone} (source: ${source})`)

            // حفظ الرسالة في المحادثة إذا وجدت
            const convIdFromNotes = existing.notes?.match(/المحادثة: ([a-z0-9-]+)$/i)?.[1]
            if (convIdFromNotes) {
              await prisma.message.create({
                data: {
                  conversationId: convIdFromNotes,
                  role: "AGENT",
                  content: message,
                },
              })
            }
          } else {
            console.error(`❌ Failed to send status message:`, result.error)
          }
        } else {
          console.log(`⚠️ WhatsApp not connected for user ${user.id}`)
        }
      } catch (msgError) {
        console.error(`❌ Error sending status message:`, msgError)
        // لا نفشل الطلب بأكمله إذا فشل إرسال الرسالة
      }
    }

    console.log(
      `✅ Appointment ${id} status → ${status}, messageSent: ${messageSent}`
    )

    return NextResponse.json({
      data: updated,
      messageSent,
      message: sentMessage || null,
    })
  } catch (error) {
    console.error(
      "PATCH /api/appointments/[id]/status error:",
      error
    )
    return NextResponse.json(
      { error: "فشل في تحديث الحالة" },
      { status: 500 }
    )
  }
}
