// WhatsApp Webhook — استقبال الرسائل من كل الزبائن

import { prisma } from "@/lib/prisma"
import {
  parseAllIncomingMessages,
  sendWhatsAppMessage
} from "@/lib/whatsapp"
import { processIncomingMessage } from "@/lib/aiAgent"
import { sanitizeInput } from "@/lib/helpers"
import crypto from "crypto"

// Verify Meta webhook signature
function verifySignature(body, signature, appSecret) {
  if (!signature || !appSecret) return false
  
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(body, "utf8")
    .digest("hex")
  
  // Extract signature from header (format: sha256=xxx)
  const sig = signature.replace("sha256=", "")
  
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSignature, "hex")
    )
  } catch {
    return false
  }
}

// GET — التحقق من Webhook (Meta يطلب هذا مرة واحدة لكل مستخدم)
export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // ✅ البحث عن Agent حسب رمز التحقق المقدم
  const agent = await prisma.agent.findFirst({
    where: { verifyToken: token }
  })

  if (mode === "subscribe" && agent) {
    console.log(`✅ WhatsApp Webhook verified for agent: ${agent.id}`)
    return new Response(challenge, { status: 200 })
  }

  return new Response("Verification failed", { status: 403 })
}

// POST — معالجة كل الرسائل الواردة من كل الزبائن
export async function POST(request) {
  console.log("🚨 WEBHOOK POST RECEIVED - Starting processing...")
  
  // ✅ التحقق من توقيع Meta (HMAC)
  const signature = request.headers.get("x-hub-signature-256")
  const appSecret = process.env.WHATSAPP_APP_SECRET
  
  let parsedBody

  if (appSecret) {
    const body = await request.text()
    
    if (!verifySignature(body, signature, appSecret)) {
      console.error("❌ Invalid webhook signature")
      return new Response("Invalid signature", { status: 403 })
    }
    
    try {
      parsedBody = JSON.parse(body)
    } catch {
      return new Response("OK", { status: 200 })
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      console.error("🚨 WHATSAPP_APP_SECRET not set in production — all webhook requests accepted! Set this env var immediately.")
    } else {
      console.warn("⚠️ WHATSAPP_APP_SECRET not configured - skipping signature verification (dev mode)")
    }
    try {
      parsedBody = await request.json()
    } catch {
      return new Response("OK", { status: 200 })
    }
  }

  // ✅ معالجة كل الرسائل من كل الزبائن
  const incomingMessages = parseAllIncomingMessages(parsedBody)

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

        // ✅ التحقق من ساعات العمل
        if (agent.workHoursEnabled) {
          const now = new Date()
          // استخدام timezone المغرب Africa/Casablanca (يدعم التوقيت الصيفي تلقائياً)
          const moroccoTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Casablanca',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
          }).formatToParts(now)
          
          const currentHour = parseInt(moroccoTime.find(p => p.type === 'hour').value)
          const currentMinute = parseInt(moroccoTime.find(p => p.type === 'minute').value)
          const currentTime = currentHour * 60 + currentMinute // وقت بالدقائق
          
          // تحويل workStart و workEnd لدقائق
          const [startHour, startMinute] = agent.workStart.split(':').map(Number)
          const [endHour, endMinute] = agent.workEnd.split(':').map(Number)
          const workStartMinutes = startHour * 60 + startMinute
          const workEndMinutes = endHour * 60 + endMinute
          
          let isWithinWorkHours
          if (workStartMinutes <= workEndMinutes) {
            // نفس اليوم (مثال: 9:00 - 18:00)
            isWithinWorkHours = currentTime >= workStartMinutes && currentTime <= workEndMinutes
          } else {
            // عبر منتصف الليل (مثال: 22:00 - 2:00)
            isWithinWorkHours = currentTime >= workStartMinutes || currentTime <= workEndMinutes
          }
          
          console.log(`🕐 [${incoming.from}] الوقت الحالي: ${currentHour}:${currentMinute} | ساعات العمل: ${agent.workStart}-${agent.workEnd} | داخل العمل: ${isWithinWorkHours}`)
          
          if (!isWithinWorkHours) {
            console.log(`🕐 [${incoming.from}] خارج ساعات العمل`)
            
            // إرسال رسالة خارج أوقات العمل إذا كانت موجودة
            if (agent.offlineMessage) {
              await sendWhatsAppMessage({
                phoneId: agent.whatsappPhoneId,
                token: agent.whatsappToken,
                to: incoming.from,
                message: agent.offlineMessage,
              })
              console.log(`📤 [${incoming.from}] تم إرسال رسالة خارج أوقات العمل`)
            }
            return // Stop further processing (don't call AI)
          }
        }

        // ✅ معالجة الرسالة + توليد رد AI
        console.log(`🤖 [${incoming.from}] Calling processIncomingMessage...`)
        
        // ✅ تنظيف الرسالة — منع Prompt Injection
        const sanitizedText = sanitizeInput(incoming.text)
        if (!sanitizedText) {
          console.log(`⏭️ [${incoming.from}] رسالة فارغة بعد التنظيف`)
          return
        }
        
        const result = await processIncomingMessage({
          userId: agent.userId,
          customerPhone: incoming.from,
          customerName: incoming.customerName,
          messageText: sanitizedText,
        })
        console.log(`🤖 [${incoming.from}] processIncomingMessage result:`, { skipped: result?.skipped, hasReply: !!result?.reply, replyLength: result?.reply?.length })

        if (!result || result.skipped || !result.reply) {
          console.log(`ℹ️ [${incoming.from}] تم تخطي الرسالة`)
          return
        }

        // ✅ إرسال الرد لهذا الزبون تحديداً
        const safeReply = result.reply
          .replace(/\[STAGE:\w+\]/g, "")
          .replace(/\[ORDER_CONFIRMED\]/g, "")
          .replace(/\[BOOKING_CONFIRMED\]/g, "")
          .replace(/\[SEND[_ ]IMAGES?\]/gi, "")
          .trim()
        console.log(`📤 [${incoming.from}] إرسال الرد: ${safeReply.substring(0, 50)}...`)
        const sent = await sendWhatsAppMessage({
          phoneId: agent.whatsappPhoneId,
          token: agent.whatsappToken,
          to: incoming.from,
          message: safeReply,
        })

        if (sent.success) {
          console.log(`✅ [${incoming.from}] تم إرسال الرد بنجاح: ${result.reply.substring(0, 40)}...`)
        } else if (sent.isTokenExpired) {
          console.error(`🚨 WhatsApp Token انتهت صلاحيتها للـ Agent ${agent.id}`)
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
          console.error(`❌ [${incoming.from}] فشل إرسال الرد:`, sent.error)
        }

        // ✅ إرسال الصور إذا طلبها العميل
        if (result.imageUrls && result.imageUrls.length > 0) {
          console.log(`📤 إرسال ${result.imageUrls.length} صورة لـ ${incoming.from}...`)
          for (const imageUrl of result.imageUrls) {
            if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim().startsWith('https://')) {
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
