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

// احتفظ بالدالة القديمة للتوافق
export async function uploadWhatsAppMedia({
  phoneId,
  token,
  fileBuffer,
  filename,
  mimeType = "application/pdf"
}) {
  try {
    // Create boundary for multipart
    const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36).substring(2)}`
    
    // Build multipart body manually for Node.js compatibility
    const parts = []
    
    // messaging_product field
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n`)
    
    // type field
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\n${mimeType}\r\n`)
    
    // file field with buffer
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    
    const footer = `\r\n--${boundary}--\r\n`
    
    // Combine all parts
    const bodyBuffer = Buffer.concat([
      Buffer.from(parts.join(''), 'utf-8'),
      Buffer.from(header, 'utf-8'),
      fileBuffer,
      Buffer.from(footer, 'utf-8')
    ])

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneId}/media`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: bodyBuffer,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ WhatsApp Media Upload error:", data)
      return { success: false, error: data }
    }

    console.log(`✅ Media uploaded successfully (ID: ${data.id})`)
    return { success: true, mediaId: data.id }
  } catch (error) {
    console.error("❌ uploadWhatsAppMedia error:", error.message)
    return { success: false, error: error.message }
  }
}
