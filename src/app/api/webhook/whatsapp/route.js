// WhatsApp Webhook — استقبال الرسائل من كل الزبائن

import { prisma } from "@/lib/prisma"
import {
  parseAllIncomingMessages,
  sendWhatsAppMessage,
} from "@/lib/whatsapp"
import { processIncomingMessage } from "@/lib/aiAgent"
import { sanitizeInput } from "@/lib/helpers"
import crypto from "crypto"

/**
 * تحديث OutboundLead عند رد الزبون
 */
async function trackOutboundReply(userId, customerPhone, conversationId) {
  try {
    // البحث عن lead مرسل لنفس الرقم وفي انتظار الرد
    const lead = await prisma.outboundLead.findFirst({
      where: {
        userId,
        customerPhone,
        status: "SENT",
      },
      orderBy: { sentAt: "desc" },
    })

    if (!lead) return null

    // تحديث Lead بالرد
    const updated = await prisma.outboundLead.update({
      where: { id: lead.id },
      data: {
        status: "REPLIED",
        repliedAt: new Date(),
        conversationId,
      },
    })

    console.log(`✅ Outbound lead ${lead.id} marked as REPLIED`)
    return updated

  } catch (error) {
    console.error("❌ trackOutboundReply error:", error.message)
    return null
  }
}

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

        // نخزّن معرّف الميديا (صوت/صورة/مستند) لعرضها في الداشبورد
        const incomingMediaId = incoming.mediaId || incoming.audioId || null

        if (!agent.isActive) {
          console.log(`⏸️ [${incoming.from}] Agent متوقف — حفظ الرسالة بدون رد AI`)
          const cleanText = sanitizeInput(incoming.text)
          if (!cleanText) return
          try {
            const customer = await prisma.customer.findFirst({
              where: { userId: agent.userId, phone: incoming.from }
            })
            if (!customer) return
            const conversation = await prisma.conversation.findFirst({
              where: { userId: agent.userId, customerId: customer.id, stage: { notIn: ["ARCHIVED"] } },
              orderBy: { updatedAt: "desc" }
            })
            if (!conversation) return
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: "USER",
                content: cleanText,
                ...(incomingMediaId ? { whatsappMediaId: incomingMediaId } : {}),
              }
            })
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { isRead: false, updatedAt: new Date() }
            })
            console.log(`💾 [${incoming.from}] رسالة محفوظة (Agent متوقف)`)
          } catch (err) {
            console.error(`❌ [${incoming.from}] خطأ في حفظ الرسالة:`, err.message)
          }
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
          whatsappMediaId: incomingMediaId,
        })
        console.log(`🤖 [${incoming.from}] processIncomingMessage result:`, { skipped: result?.skipped, hasReply: !!result?.reply, replyLength: result?.reply?.length, conversationId: result?.conversationId })

        // ✅ تتبع رد Outbound Lead
        if (result?.conversationId) {
          await trackOutboundReply(agent.userId, incoming.from, result.conversationId)
        }

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
                title: "fr:🚨 Problème WhatsApp Token||ar:🚨 مشكلة في WhatsApp Token",
                message: "fr:Le token d'accès a expiré. Allez dans les paramètres et mettez à jour WhatsApp.||ar:انتهت صلاحية Token الوصول. يرجى الذهاب إلى الإعدادات وتحديث WhatsApp من جديد.",
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
          const validImageUrls = [...new Set(
            result.imageUrls
              .filter(url => typeof url === "string")
              .map(url => url.trim())
              .filter(url => /^https?:\/\//i.test(url))
          )]

          if (validImageUrls.length > 0) {
            console.log(`📤 إرسال ${validImageUrls.length} صورة لـ ${incoming.from}...`)
          }

          for (const [index, imageUrl] of validImageUrls.entries()) {
            let sentImage = false

            // Retry أقوى مع backoff لأن WhatsApp API غالباً يرفض الصور المتتالية بسرعة
            for (let attempt = 1; attempt <= 3; attempt++) {
              const imgResult = await sendWhatsAppMessage({
                phoneId: agent.whatsappPhoneId,
                token: agent.whatsappToken,
                to: incoming.from,
                message: imageUrl,
                type: "image",
              })

              if (imgResult.success) {
                sentImage = true
                console.log(`📸 صورة ${index + 1}/${validImageUrls.length} مرسلة لـ ${incoming.from} (attempt ${attempt})`)
                break
              }

              if (attempt < 3) {
                const retryDelayMs = 2000 * attempt
                await new Promise(resolve => setTimeout(resolve, retryDelayMs))
              }
            }

            if (!sentImage) {
              const masked = incoming.from?.length > 4 ? `******${incoming.from.slice(-4)}` : "****"
              console.error(`❌ فشل إرسال صورة ${index + 1}/${validImageUrls.length} للرقم ${masked} بعد 3 محاولات`)
            }

            // Pause أكبر بين الصور لتفادي rate-limit من Meta
            await new Promise(resolve => setTimeout(resolve, 2500))
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
