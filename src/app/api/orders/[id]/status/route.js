import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

function getOrderFallbackMessage(status, order, agentLanguage, trackingUrlTemplate) {
  const name     = order.customerName   || ""
  const product  = order.productName    || ""
  const amount   = order.totalAmount    || ""
  const tracking = order.trackingNumber || ""
  const trackingUrl = trackingUrlTemplate && tracking
    ? trackingUrlTemplate.replace(/{tracking}/g, tracking)
    : ""

  const messages = {
    french: {
      CONFIRMED: `Bonjour ${name} ! ✅\nVotre commande (${product}) a été confirmée.\nMontant : ${amount} DH\nMerci pour votre confiance ! �`,
      SHIPPED:   `Bonjour ${name} ! 🚚\nVotre commande (${product}) est en route.${tracking ? `\nN° de suivi : ${tracking}` : ""}${trackingUrl ? `\nLien de suivi : ${trackingUrl}` : ""}\nLivraison sous 24-48h.`,
      DELIVERED: `Bonjour ${name} ! 📦\nVotre commande (${product}) a été livrée.\nNous espérons que vous êtes satisfait(e). 😊`,
      CANCELLED: `Bonjour ${name},\nNous sommes désolés, votre commande (${product}) a été annulée. ❌\nContactez-nous pour plus d'informations.`,
    },
    arabic: {
      CONFIRMED: `مرحبا ${name}! ✅\nتم تأكيد طلبيتك (${product}) بنجاح.\nالمبلغ: ${amount} درهم\nشكراً لثقتك بنا! 😊`,
      SHIPPED:   `مرحبا ${name}! 🚚\nطلبيتك (${product}) في الطريق إليك.${tracking ? `\nرقم التتبع: ${tracking}` : ""}${trackingUrl ? `\nرابط التتبع: ${trackingUrl}` : ""}\nالتوصيل خلال 24-48 ساعة.`,
      DELIVERED: `مرحبا ${name}! 📦\nتم تسليم طلبيتك (${product}) بنجاح.\nنتمنى أن تكون راضياً! 😊`,
      CANCELLED: `مرحبا ${name},\nنأسف لإبلاغك بإلغاء طلبيتك (${product}). ❌\nتواصل معنا للاستفسار.`,
    },
    darija: {
      CONFIRMED: `مرحبا ${name}! ✅\nتأكدات طلبيتك (${product}).\nالثمن: ${amount} درهم\nشكراً على ثقتك! 😊`,
      SHIPPED:   `مرحبا ${name}! 🚚\nطلبيتك (${product}) فالطريق.${tracking ? `\nرقم التتبع: ${tracking}` : ""}${trackingUrl ? `\nرابط التتبع: ${trackingUrl}` : ""}\nغادي توصلك خلال 24-48 ساعة.`,
      DELIVERED: `مرحبا ${name}! 📦\nوصلات طلبيتك (${product}) بنجاح.\nنتمنى تكون مرتاح! 😊`,
      CANCELLED: `مرحبا ${name},\nعذراً، تلغات طلبيتك (${product}). ❌\nتواصل معانا للمعلومات.`,
    },
  }

  const lang = agentLanguage === "french" ? "french"
             : agentLanguage === "darija"  ? "darija"
             : "arabic"

  return messages[lang][status] || messages["french"][status]
}

export async function PATCH(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { status, sendMessage = true, trackingNumber } = body

    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 })
    }

    const existing = await prisma.order.findFirst({
      where: { id, userId: decoded.userId },
      include: { customer: true },
    })
    if (!existing) return NextResponse.json({ error: "الطلبية غير موجودة" }, { status: 404 })

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(status === "CONFIRMED" && { confirmSent: true }),
        ...(status === "SHIPPED" && { shipSent: true }),
        ...(status === "DELIVERED" && { deliverSent: true }),
      },
    })

    let messageSent = false
    let sentMessage = null

    if (sendMessage && existing.customerPhone) {
      try {
        const agent = await prisma.agent.findUnique({
          where: { userId: decoded.userId },
          select: {
            language: true,
            whatsappPhoneId: true,
            whatsappToken: true,
            orderConfirmMessage: true,
            orderShipMessage: true,
            orderDeliverMessage: true,
            orderCancelledMessage: true,
            trackingUrlTemplate: true,
          },
        })
        if (agent?.whatsappPhoneId && agent?.whatsappToken) {
          const orderWithTracking = { ...existing, trackingNumber: trackingNumber || existing.trackingNumber }

          const templateMap = {
            CONFIRMED: agent.orderConfirmMessage,
            SHIPPED:   agent.orderShipMessage,
            DELIVERED: agent.orderDeliverMessage,
            CANCELLED: agent.orderCancelledMessage,
          }

          let message = templateMap[status]
          if (message) {
            // إنشاء رابط التتبع إذا كان متوفراً
            const tracking = orderWithTracking.trackingNumber || ""
            const trackingUrl = agent.trackingUrlTemplate && tracking
              ? agent.trackingUrlTemplate.replace(/{tracking}/g, tracking)
              : ""
            
            console.log("[DEBUG] trackingNumber:", tracking)
            console.log("[DEBUG] trackingUrlTemplate:", agent.trackingUrlTemplate)
            console.log("[DEBUG] trackingUrl:", trackingUrl)
            console.log("[DEBUG] message before replace:", message)
            
            message = message
              .replace(/{name}/g,     orderWithTracking.customerName    || "")
              .replace(/{product}/g,  orderWithTracking.productName     || "")
              .replace(/{amount}/g,   String(orderWithTracking.totalAmount  || ""))
              .replace(/{tracking}/g, tracking)
              .replace(/{trackingUrl}/g, trackingUrl)
              
            console.log("[DEBUG] message after replace:", message)
          } else {
            message = getOrderFallbackMessage(status, orderWithTracking, agent.language || "french", agent.trackingUrlTemplate)
          }

          if (message) {
            const result = await sendWhatsAppMessage({
              phoneId: agent.whatsappPhoneId,
              token: agent.whatsappToken,
              to: existing.customerPhone,
              message,
            })
            if (result.success) {
              messageSent = true
              sentMessage = message
              const convIdMatch = existing.notes?.match(/المحادثة: ([a-z0-9]+)$/i)
              if (convIdMatch?.[1]) {
                await prisma.message.create({
                  data: { conversationId: convIdMatch[1], role: "AGENT", content: message },
                })
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Error sending order status message:", err)
      }
    }

    return NextResponse.json({ data: updated, messageSent, sentMessage })
  } catch (error) {
    console.error("PATCH /api/orders/[id]/status error:", error)
    return NextResponse.json({ error: "فشل في تحديث الحالة" }, { status: 500 })
  }
}
