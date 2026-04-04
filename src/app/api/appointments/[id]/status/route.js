import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { generateStatusUpdateMessage } from "@/lib/aiAgent"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

// PATCH /api/appointments/[id]/status
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" }, { status: 401 }
      )
    }

    const { id } = await params
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
    let aiMessage = null

    // ✅ إرسال رسالة AI تلقائية عند تغيير الحالة (إذا طُلب ذلك)
    if (sendMessage && existing.customerPhone) {
      try {
        // جلب إعدادات الـ Agent
        const agent = await prisma.agent.findUnique({
          where: { userId: user.id },
        })

        if (agent?.whatsappPhoneId && agent?.whatsappToken) {
          // توليد رسالة AI
          const { message } = await generateStatusUpdateMessage({
            agent,
            appointment: existing,
            newStatus: status,
            customerName: existing.customerName,
          })

          aiMessage = message

          // إرسال الرسالة عبر واتساب
          const result = await sendWhatsAppMessage({
            phoneId: agent.whatsappPhoneId,
            token: agent.whatsappToken,
            to: existing.customerPhone,
            message,
          })

          if (result.success) {
            messageSent = true
            console.log(`✅ AI status message sent to ${existing.customerPhone}`)

            // حفظ الرسالة في المحادثة إذا وجدت
            const convIdFromNotes = existing.notes?.match(/المحادثة: ([a-z0-9]+)$/i)?.[1]
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
            console.error(`❌ Failed to send AI message:`, result.error)
          }
        } else {
          console.log(`⚠️ WhatsApp not connected for user ${user.id}`)
        }
      } catch (msgError) {
        console.error(`❌ Error sending AI message:`, msgError)
        // لا نفشل الطلب بأكمله إذا فشل إرسال الرسالة
      }
    }

    console.log(
      `✅ Appointment ${id} status → ${status}, messageSent: ${messageSent}`
    )

    return NextResponse.json({
      data: updated,
      messageSent,
      aiMessage: aiMessage || null,
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
