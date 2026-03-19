// دوال التواصل مع WhatsApp Cloud API

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ||
  "https://graph.facebook.com/v19.0"

// إرسال رسالة نصية
export async function sendWhatsAppMessage({
  phoneId,
  token,
  to,
  message,
  type = "text"
}) {
  // التحقق من المدخلات
  if (!phoneId || !token || !to || !message) {
    console.error("❌ Missing required parameters:", { phoneId: !!phoneId, token: !!token, to: !!to, message: !!message })
    return { success: false, error: "Missing required parameters" }
  }

  try {
    let body
    if (type === "image") {
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
export function parseIncomingMessage(body) {
  const messages = parseAllIncomingMessages(body)
  return messages[0] || null
}
