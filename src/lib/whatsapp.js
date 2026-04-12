// دوال التواصل مع WhatsApp Cloud API

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ||
  "https://graph.facebook.com/v19.0"

// 🔧 FIX: Added imageId parameter for media upload support
// 📍 LOCATION: sendWhatsAppMessage signature
export async function sendWhatsAppMessage({
  phoneId,
  token,
  to,
  message,
  type = "text",
  document = null,
  audioId = null,
  imageId = null,
  videoId = null,
}) {
  // التحقق من المدخلات
  if (!phoneId || !token || !to) {
    console.error("❌ Missing required parameters:", { phoneId: !!phoneId, token: !!token, to: !!to })
    return { success: false, error: "Missing required parameters" }
  }

  // ✅ Input validation improvements
  if (type === "document" && document && !document.id) {
    console.error("❌ Document type requires document.id")
    return { success: false, error: "Document ID is required for document type" }
  }
  if (type === "image" && message && !message.match(/^https?:\/\//)) {
    console.error("❌ Image type requires a valid URL")
    return { success: false, error: "Valid image URL is required for image type" }
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
      // Support both URL and media ID for images, with optional caption
      const imageObj = imageId
        ? { id: imageId }
        : { link: message }
      if (message && imageId) imageObj.caption = message
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "image",
        image: imageObj,
      }
    } else if (type === "video" && videoId) {
      // إرسال فيديو
      const videoObj = { id: videoId }
      if (message) videoObj.caption = message
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "video",
        video: videoObj,
      }
    } else if (type === "audio" && audioId) {
      // إرسال رسالة صوتية
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "audio",
        audio: { id: audioId }
      }
      console.log(`🔍 DEBUG sendWhatsAppMessage audio body:`, JSON.stringify(body, null, 2))
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

    // ✅ Sanitized log: mask phone number
    const maskedTo = to.length > 4 ? "******" + to.slice(-4) : "****"
    console.log(`📤 Sending ${type} message to ${maskedTo}...`)

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

    // ✅ Safe response parsing
    const raw = await response.text()
    let data = null
    try {
      data = JSON.parse(raw)
    } catch (parseErr) {
      data = { raw: raw.substring(0, 200) }
    }

    if (!response.ok) {
      // ✅ Robust token-expired detection (case-insensitive)
      const msg = (data?.error?.message || "").toLowerCase()
      const isTokenExpired = 
        response.status === 401 || 
        data?.error?.code === 190 ||
        msg.includes("token") ||
        msg.includes("expired") ||
        msg.includes("invalid")

      if (isTokenExpired) {
        console.error("❌ ⚠️ WhatsApp TOKEN EXPIRED - يجب تحديث Token من جديد!")
        console.error("Error details:", {
          status: response.status,
          code: data?.error?.code,
          msg: "Token validation failed",
        })
      } else {
        console.error("❌ WhatsApp API error:", {
          status: response.status,
          error: "API request failed",
        })
      }
      return { success: false, error: data, isTokenExpired }
    }

    const msgId = data?.messages?.[0]?.id || "unknown"
    console.log(`✅ Message sent successfully (ID: ${msgId})`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ sendWhatsAppMessage error:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
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

    // ✅ Sanitized log: mask phone
    const maskedTo = to.length > 4 ? "******" + to.slice(-4) : "****"
    console.log(`📤 Sending OTP template "${templateName}" to ${maskedTo}...`)

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

    // ✅ Safe response parsing
    const raw = await response.text()
    let data = null
    try {
      data = JSON.parse(raw)
    } catch (parseErr) {
      data = { raw: raw.substring(0, 200) }
    }

    if (!response.ok) {
      console.error("❌ OTP Template error:", { status: response.status, error: "Template send failed" })
      return { success: false, error: data }
    }

    const msgId = data?.messages?.[0]?.id || "unknown"
    console.log(`✅ OTP Template sent (ID: ${msgId})`)
    return { success: true, data }
  } catch (error) {
    console.error("❌ sendWhatsAppOTPTemplate error:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
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

  // ✅ Buttons validation: max 3, title max 20 chars, trim empty
  const cleanButtons = buttons
    .map(btn => (typeof btn === "string" ? btn.trim() : ""))
    .filter(btn => btn.length > 0)
    .slice(0, 3)
    .map(btn => btn.substring(0, 20))

  if (cleanButtons.length === 0) {
    console.error("❌ sendWhatsAppButtons: No valid buttons after filtering")
    return { success: false, error: "No valid buttons (max 3, non-empty, max 20 chars each)" }
  }

  try {
    // ✅ Sanitized log
    const maskedTo = to.length > 4 ? "******" + to.slice(-4) : "****"
    console.log(`📤 Sending buttons message to ${maskedTo} (${cleanButtons.length} buttons)`)

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
              buttons: cleanButtons.map((btn, i) => ({
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

    // ✅ Safe response parsing
    const raw = await response.text()
    let data = null
    try {
      data = JSON.parse(raw)
    } catch (parseErr) {
      data = { raw: raw.substring(0, 200) }
    }

    return response.ok
      ? { success: true, data }
      : { success: false, error: data }
  } catch (error) {
    console.error("sendWhatsAppButtons error:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
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
          let mediaId = null
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
            const caption = message.image?.caption || ""
            text = caption ? `[صورة] ${caption}` : "[صورة]"
            mediaId = message.image?.id || null
          } else if (message.type === "document") {
            const docName = message.document?.filename || "document"
            const caption = message.document?.caption || ""
            text = caption ? `[مستند: ${docName}] ${caption}` : `[مستند: ${docName}]`
            mediaId = message.document?.id || null
          } else if (message.type === "audio") {
            text = "[رسالة صوتية]"
            mediaId = message.audio?.id || null
          }

          if (!text.trim() && !["image", "document"].includes(message.type)) {
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
            audioId: mediaId,
            mediaId,
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

/** تحميل بايتات ميديا من واتساب (بدون تكلفة إضافية — نفس API واتساب) */
export async function downloadWhatsAppMedia({ token, mediaId }) {
  if (!token || !mediaId) return null
  try {
    const mediaRes = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!mediaRes.ok) {
      console.error("❌ downloadWhatsAppMedia meta:", mediaRes.status)
      return null
    }
    const mediaData = await mediaRes.json()
    const mediaUrl = mediaData.url
    const mimeType = mediaData.mime_type || "application/octet-stream"
    if (!mediaUrl) {
      console.error("❌ No media URL in WhatsApp response")
      return null
    }
    const binRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!binRes.ok) {
      console.error("❌ downloadWhatsAppMedia binary:", binRes.status)
      return null
    }
    const buffer = await binRes.arrayBuffer()
    return { buffer, mimeType }
  } catch (e) {
    console.error("❌ downloadWhatsAppMedia:", e?.message || e)
    return null
  }
}

// 🎤 تحويل رسالة صوتية لنص عبر Whisper API (اختياري — مدفوع)
export async function transcribeWhatsAppAudio({ token, audioId }) {
  if (!token || !audioId) return null

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.warn("⚠️ OPENAI_API_KEY not set — voice messages cannot be transcribed")
    return null
  }

  try {
    const downloaded = await downloadWhatsAppMedia({ token, mediaId: audioId })
    if (!downloaded) return null
    const { buffer: audioBuffer, mimeType } = downloaded

    // إرسال للـ Whisper API — امتداد يطابق الـ MIME (واتساب غالباً ogg/opus أو aac)
    const ext =
      /mpeg|mp3/i.test(mimeType) ? "mp3"
      : /mp4|m4a/i.test(mimeType) ? "m4a"
      : /aac/i.test(mimeType) ? "aac"
      : /wav/i.test(mimeType) ? "wav"
      : "ogg"
    const formData = new FormData()
    formData.append("file", new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`)
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

    // ✅ Transcription privacy: log only metadata (length, success)
    if (transcription) {
      console.log(`🎤 Whisper transcription: success (length: ${transcription.length})`)
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
    if (!phoneId || !token || !fileBuffer) {
      console.error("❌ uploadWhatsAppMedia: Missing required parameters")
      return { success: false, error: "Missing parameters" }
    }

    const formData = new FormData()
    formData.append("messaging_product", "whatsapp")
    formData.append("type", mimeType)
    
    //  Convert Buffer to Uint8Array for proper Blob creation in Node.js
    const uint8Array = new Uint8Array(fileBuffer)
    const blob = new Blob([uint8Array], { type: mimeType })
    formData.append("file", blob, filename)

    console.log(`📤 Uploading ${mimeType} media (${fileBuffer.length} bytes) to WhatsApp...`)

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/media`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      }
    )

    const raw = await response.text()
    let data = null
    try {
      data = JSON.parse(raw)
    } catch (parseErr) {
      data = { raw: raw.substring(0, 200) }
    }

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error?.code || "Upload failed"
      console.error("❌ WhatsApp Media Upload failed:", {
        status: response.status,
        error: errMsg,
        errorCode: data?.error?.code,
        errorSubcode: data?.error?.error_subcode,
        errorType: data?.error?.type,
        fbTraceId: data?.error?.fbtrace_id,
        details: data?.error || data,
        rawResponse: raw.substring(0, 500)
      })

      // Check for token expiration
      if (response.status === 401 || data?.error?.code === 190) {
        console.error("❌ ⚠️ WhatsApp TOKEN EXPIRED or INVALID!")
      }

      return { success: false, error: data }
    }

    const mediaId = data?.id
    if (!mediaId) {
      console.error("❌ Media uploaded but no ID returned:", data)
      return { success: false, error: "No media ID in response" }
    }

    console.log(`✅ Media uploaded successfully (ID: ${mediaId})`)
    return { success: true, mediaId }
  } catch (error) {
    console.error("❌ uploadWhatsAppMedia error:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
  }
}
