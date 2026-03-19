// WhatsApp Webhook — استقبال الرسائل من كل الزبائن

import { prisma } from "@/lib/prisma"
import {
  parseAllIncomingMessages,
  sendWhatsAppMessage
} from "@/lib/whatsapp"
import { processIncomingMessage } from "@/lib/aiAgent"

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ||
  "salesbot_verify_token_2026"

// GET — التحقق من Webhook (Meta يطلب هذا مرة واحدة)
export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook verified!")
    return new Response(challenge, { status: 200 })
  }

  return new Response("Verification failed", { status: 403 })
}

// POST — معالجة كل الرسائل الواردة من كل الزبائن
export async function POST(request) {
  // ✅ دائماً ارجع 200 لـ Meta أولاً
  // نعالج الرسائل بعدين

  let body
  try {
    body = await request.json()
  } catch {
    return new Response("OK", { status: 200 })
  }

  // ✅ معالجة كل الرسائل من كل الزبائن
  const incomingMessages = parseAllIncomingMessages(body)

  if (!incomingMessages.length) {
    return new Response("OK", { status: 200 })
  }

  console.log(`📩 ${incomingMessages.length} رسالة واردة`)
  console.log(`📋 أرقام الزبائن:`, incomingMessages.map(m => m.from))

  // ✅ معالجة كل رسالة بشكل مستقل
  // Promise.allSettled تكمل حتى لو فشلت رسالة واحدة
  await Promise.allSettled(
    incomingMessages.map(async (incoming) => {
      try {
        console.log(`💬 [${incoming.from}] معالجة رسالة من: ${incoming.customerName}`)

        // إيجاد Agent حسب Phone ID
        const agent = await prisma.agent.findFirst({
          where: { whatsappPhoneId: incoming.phoneId },
          include: { user: true }
        })

        if (!agent) {
          console.log(`⚠️ [${incoming.from}] لا Agent لـ ${incoming.phoneId}`)
          return
        }

        console.log(`✅ [${incoming.from}] Agent found: ${agent.id}, userId: ${agent.userId}`)

        if (!agent.isActive) {
          console.log(`⏸️ [${incoming.from}] Agent متوقف`)
          return
        }

        // ✅ معالجة الرسالة + توليد رد AI
        console.log(`🤖 [${incoming.from}] Calling processIncomingMessage...`)
        const result = await processIncomingMessage({
          userId: agent.userId,
          customerPhone: incoming.from,
          customerName: incoming.customerName,
          messageText: incoming.text,
        })
        console.log(`🤖 [${incoming.from}] processIncomingMessage result:`, { skipped: result?.skipped, hasReply: !!result?.reply, replyLength: result?.reply?.length })

        if (!result || result.skipped || !result.reply) {
          console.log(`ℹ️ [${incoming.from}] تم تخطي الرسالة`)
          return
        }

        // ✅ إرسال الرد لهذا الزبون تحديداً
        console.log(`📤 [${incoming.from}] إرسال الرد: ${result.reply.substring(0, 50)}...`)
        const sent = await sendWhatsAppMessage({
          phoneId: agent.whatsappPhoneId,
          token: agent.whatsappToken,
          to: incoming.from,
          message: result.reply,
        })

        if (sent.success) {
          console.log(`✅ [${incoming.from}] تم إرسال الرد بنجاح`)
        } else {
          console.error(`❌ [${incoming.from}] فشل إرسال الرد:`, sent.error)
        }

        if (sent.success) {
          console.log(`✅ رد لـ ${incoming.from}: ${result.reply.substring(0, 40)}...`)
        } else {
          if (sent.isTokenExpired) {
            console.error(`🚨 WhatsApp Token انتهت صلاحيتها للـ Agent ${agent.id}`)
            
            // إنشاء notification للمستخدم
            try {
              await prisma.notification.create({
                data: {
                  userId: agent.userId,
                  type: "SYSTEM",
                  title: "🚨 مشكلة في WhatsApp Token",
                  message: "انتهت صلاحية Token الوصول. يرجى الذهاب إلى الإعدادات وتحديث WhatsApp من جديد.",
                  isRead: false,
                }
              })
            } catch (notifError) {
              console.error("Failed to create notification:", notifError)
            }
          } else {
            console.error(`❌ فشل إرسال لـ ${incoming.from}:`, sent.error)
          }
        }

        // ✅ إرسال الصور إذا طلبها العميل
        if (result.imageUrls && result.imageUrls.length > 0) {
          console.log(`📤 إرسال ${result.imageUrls.length} صورة لـ ${incoming.from}...`)
          for (const imageUrl of result.imageUrls) {
            if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim().startsWith('http')) {
              console.warn("⚠️ صورة غير صحيحة:", imageUrl)
              continue
            }
            
            const imgResult = await sendWhatsAppMessage({
              phoneId: agent.whatsappPhoneId,
              token: agent.whatsappToken,
              to: incoming.from,
              message: imageUrl.trim(),
              type: "image",
            })
            
            if (imgResult.success) {
              console.log(`📸 صورة مرسلة لـ ${incoming.from}`)
            } else {
              console.error(`❌ فشل إرسال صورة لـ ${incoming.from}`)
            }
            
            // تأخير صغير بين الصور
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

      } catch (error) {
        console.error(`❌ خطأ في معالجة رسالة ${incoming.from}:`, error.message)
      }
    })
  )

  // ✅ دائماً 200 لـ Meta
  return new Response("OK", { status: 200 })
}
