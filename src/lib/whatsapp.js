// دوال التواصل مع WhatsApp Cloud API

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ||
  "https://graph.facebook.com/v19.0"

// إرسال رسالة نصية
export async function sendWhatsAppMessage({
  phoneId,
  token,
  to,
  message,
  type = "text",
  document = null
}) {
  // التحقق من المدخلات
  if (!phoneId || !token || !to) {
    console.error("❌ Missing required parameters:", { phoneId: !!phoneId, token: !!token, to: !!to })
    return { success: false, error: "Missing required parameters" }
  }

  try {
    let body
    if (type === "document" && document) {
      // إرسال مستند PDF
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "document",
        document: {
          filename: document.filename || "invoice.pdf",
          caption: message || "",
          id: document.id  // media ID from upload
        }
      }
    } else if (type === "image") {
      // إرسال صورة
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "image",
        image: { link: message }
      }
    } else {
      // إرسال نص
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: message }
      }
    }

    console.log(`📤 Sending ${type} message to ${to}...`)

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      // التحقق من أخطاء Token المنتهي
      const isTokenExpired = 
        response.status === 401 || 
        data?.error?.code === 190 ||
        data?.error?.message?.includes("token") ||
        data?.error?.message?.includes("expired") ||
        data?.error?.message?.includes("invalid")

      if (isTokenExpired) {
        console.error("❌ ⚠️ WhatsApp TOKEN EXPIRED - يجب تحديث Token من جديد!")
        console.error("Error details:", {
          status: response.status,
          code: data?.error?.code,
          message: data?.error?.message,
        })
      } else {
        console.error("❌ WhatsApp API error:", {
          status: response.status,
          error: data?.error?.message || data,
          details: data?.error?.error_data,
        })
      }
      return { success: false, error: data, isTokenExpired }
    }

    console.log(`✅ Message sent successfully (ID: ${data.messages?.[0]?.id || "unknown"})`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ sendWhatsAppMessage error:", error.message)
    return { success: false, error: error.message }
  }
}

// ✅ إرسال OTP عبر Template Message (يعمل مع أي رقم، حتى الجديدة)
export async function sendWhatsAppOTPTemplate({ phoneId, token, to, code }) {
  if (!phoneId || !token || !to || !code) {
    console.error("❌ sendWhatsAppOTPTemplate: Missing parameters")
    return { success: false, error: "Missing parameters" }
  }

  const templateName = process.env.SYSTEM_WA_OTP_TEMPLATE
  const templateLang = process.env.SYSTEM_WA_OTP_TEMPLATE_LANG || "fr"

  // ── إذا لم يُعيَّن Template → fallback لنص عادي (يعمل فقط مع أرقام نشطة) ──
  if (!templateName) {
    console.warn("⚠️ SYSTEM_WA_OTP_TEMPLATE not set — falling back to text message")
    return sendWhatsAppMessage({
      phoneId,
      token,
      to,
      message:
        `🔐 Code de vérification *wakil.ma*:\n\n` +
        `*${code}*\n\n` +
        `⏱ Valide 15 min\n` +
        `Ne partagez pas ce code / لا تشارك هذا الرمز`,
    })
  }

  try {
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }

    console.log(`📤 Sending OTP template "${templateName}" to ${to}...`)

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ OTP Template error:", { status: response.status, error: data?.error?.message, details: data })
      return { success: false, error: data }
    }

    console.log(`✅ OTP Template sent (ID: ${data.messages?.[0]?.id || "unknown"})`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ sendWhatsAppOTPTemplate error:", error.message)
    return { success: false, error: error.message }
  }
}

// إرسال رسالة مع أزرار (Quick Reply)
export async function sendWhatsAppButtons({
  phoneId,
  token,
  to,
  message,
  buttons
}) {
  if (!phoneId || !token || !to || !message || !Array.isArray(buttons) || buttons.length === 0) {
    console.error("❌ sendWhatsAppButtons: Missing required parameters")
    return { success: false, error: "Missing required parameters" }
  }
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: message },
            action: {
              buttons: buttons.map((btn, i) => ({
                type: "reply",
                reply: {
                  id: `btn_${i}`,
                  title: btn
                }
              }))
            }
          }
        }),
      }
    )

    const data = await response.json()
    return response.ok
      ? { success: true, data }
      : { success: false, error: data }
  } catch (error) {
    console.error("sendWhatsAppButtons error:", error)
    return { success: false, error: error.message }
  }
}

// ✅ تحليل كل الرسائل من كل الزبائن
export function parseAllIncomingMessages(body) {
  try {
    const results = []
    const entries = body?.entry || []

    for (const entry of entries) {
      const changes = entry?.changes || []

      for (const change of changes) {
        const value = change?.value

        if (!value?.messages?.length) continue

        const phoneId = value.metadata?.phone_number_id

        // لوف على كل الرسائل في هذا الـ change
        for (const message of value.messages) {
          // إيجاد contact المرتبط بهذه الرسالة
          const contact = value.contacts?.find(
            c => c.wa_id === message.from
          ) || value.contacts?.[0]

          // نص الرسالة حسب النوع
          let text = ""
          let audioId = null
          if (message.type === "text") {
            text = message.text?.body || ""
          } else if (message.type === "interactive") {
            text =
              message.interactive?.button_reply?.title ||
              message.interactive?.list_reply?.title ||
              ""
          } else if (message.type === "button") {
            text = message.button?.text || ""
          } else if (message.type === "image") {
            text = "[صورة]"
          } else if (message.type === "audio") {
            text = "[رسالة صوتية]"
            audioId = message.audio?.id || null
          }

          if (!text.trim() && message.type !== "image") {
            continue // تجاهل الرسائل الفارغة
          }

          results.push({
            messageId: message.id,
            from: message.from,
            phoneId,
            customerName: contact?.profile?.name || "زبون",
            text: text.trim(),
            timestamp: message.timestamp,
            type: message.type,
            audioId,
          })
        }
      }
    }

    return results
  } catch (error) {
    console.error("parseAllIncomingMessages error:", error)
    return []
  }
}

// 🎤 تحويل رسالة صوتية لنص عبر Whisper API
export async function transcribeWhatsAppAudio({ token, audioId }) {
  if (!token || !audioId) return null

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.warn("⚠️ OPENAI_API_KEY not set — voice messages cannot be transcribed")
    return null
  }

  try {
    // 1. جلب رابط الميديا من WhatsApp
    const mediaRes = await fetch(`${WHATSAPP_API_URL}/${audioId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })

    if (!mediaRes.ok) {
      console.error("❌ Failed to get WhatsApp media URL:", mediaRes.status)
      return null
    }

    const mediaData = await mediaRes.json()
    const mediaUrl = mediaData.url

    if (!mediaUrl) {
      console.error("❌ No media URL in WhatsApp response")
      return null
    }

    // 2. تحميل الملف الصوتي
    const audioRes = await fetch(mediaUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    })

    if (!audioRes.ok) {
      console.error("❌ Failed to download audio:", audioRes.status)
      return null
    }

    const audioBuffer = await audioRes.arrayBuffer()

    // 3. إرسال للـ Whisper API
    const formData = new FormData()
    formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg")
    formData.append("model", "whisper-1")

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}` },
      body: formData,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.json()
      console.error("❌ Whisper API error:", err?.error?.message || err)
      return null
    }

    const whisperData = await whisperRes.json()
    const transcription = whisperData.text?.trim()

    if (transcription) {
      console.log(`🎤 Whisper transcription: "${transcription.substring(0, 100)}"`)
    }

    return transcription || null
  } catch (error) {
    console.error("❌ transcribeWhatsAppAudio error:", error.message)
    return null
  }
}

export async function uploadWhatsAppMedia({
  phoneId,
  token,
  fileBuffer,
  filename,
  mimeType = "application/pdf"
}) {
  try {
    const formData = new FormData()
    formData.append("messaging_product", "whatsapp")
    formData.append("type", mimeType)
    formData.append(
      "file",
      new Blob([fileBuffer], { type: mimeType }),
      filename
    )

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/media`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Content-Type is set automatically by FormData (with boundary)
        },
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ WhatsApp Media Upload error:", JSON.stringify(data))
      return { success: false, error: data }
    }

    console.log(`✅ Media uploaded successfully (ID: ${data.id})`)
    return { success: true, mediaId: data.id }
  } catch (error) {
    console.error("❌ uploadWhatsAppMedia error:", error.message)
    return { success: false, error: error.message }
  }
}
