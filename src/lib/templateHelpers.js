// Helper functions for rendering message templates with variable substitution

/**
 * Renders a template string by replacing variables with values
 * Variables format: {{variableName}}
 *
 * @param {string} template - The template string with {{variables}}
 * @param {Object} vars - Object containing variable values
 * @returns {string} - Rendered string with variables replaced
 *
 * @example
 * renderTemplate("Hello {{name}}! Your appointment is at {{time}}", { name: "Ali", time: "14:00" })
 * // Returns: "Hello Ali! Your appointment is at 14:00"
 */
export function renderTemplate(template, vars) {
  if (!template || typeof template !== "string") {
    return null
  }

  let result = template

  for (const [key, value] of Object.entries(vars)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
    result = result.replace(placeholder, value ?? "")
  }

  return result
}

/**
 * Fallback messages for appointments when no template is configured
 */
export const APPOINTMENT_FALLBACKS = {
  REMINDER: {
    darija: `مرحبا {{customerName}}! ⏰
غداً عندك موعد الساعة {{time}}
⌛ {{serviceName}}
واش مازلت موافق؟ رد بـ "نعم" للتأكيد 😊`,
    french: `Bonjour {{customerName}}! ⏰
Vous avez un rendez-vous demain à {{time}}
⌛ {{serviceName}}
Êtes-vous toujours disponible ? Répondez "oui" pour confirmer 😊`,
    arabic: `مرحبا {{customerName}}! ⏰
لديك موعد غداً الساعة {{time}}
⌛ {{serviceName}}
هل ما زلت متوفراً؟ رد "نعم" للتأكيد 😊`,
  },
  CONFIRMED: {
    darija: `مرحبا {{customerName}}! ✅
تأكد الموعد ديالك
📅 {{date}}
⏰ {{time}}
⌛ {{serviceName}}
كنتسناوك! 😊`,
    french: `Bonjour {{customerName}}! ✅
Votre rendez-vous est confirmé.
📅 {{date}}
⏰ {{time}}
⌛ {{serviceName}}
À bientôt ! 😊`,
    arabic: `مرحبا {{customerName}}! ✅
تم تأكيد موعدك
📅 {{date}}
⏰ {{time}}
⌛ {{serviceName}}
ننتظرك! 😊`,
  },
  CANCELLED: {
    darija: `مرحبا {{customerName}},
عذراً، تلغى الموعد ديالك ❌
📅 {{date}} - {{serviceName}}
تواصل معانا للمعلومات. 🙏`,
    french: `Bonjour {{customerName}},
Nous sommes désolés, votre rendez-vous a été annulé. ❌
📅 {{date}} - {{serviceName}}
Contactez-nous pour plus d'informations. 🙏`,
    arabic: `مرحبا {{customerName}}،
نأسف لإبلاغك بإلغاء الموعد ❌
📅 {{date}} - {{serviceName}}
للاستفسار تواصل معنا. 🙏`,
  },
}

/**
 * Gets the appropriate fallback message based on type and language
 *
 * @param {string} type - "REMINDER" | "CONFIRMED" | "CANCELLED"
 * @param {string} language - "darija" | "french" | "arabic" | "fusha"
 * @returns {string} - Fallback template string
 */
export function getFallbackTemplate(type, language) {
  const lang = language === "french" ? "french" : language === "darija" ? "darija" : "arabic"
  return APPOINTMENT_FALLBACKS[type]?.[lang] || APPOINTMENT_FALLBACKS[type]?.["arabic"]
}

/**
 * Builds appointment message variables object from appointment data
 *
 * @param {Object} appointment - Appointment object
 * @param {Object} options - Additional options
 * @returns {Object} - Variables object for template rendering
 */
export function buildAppointmentVars(appointment, options = {}) {
  const { customerName, date, time, serviceName } = options

  const appointmentDate = appointment.date ? new Date(appointment.date) : null

  return {
    customerName: customerName || appointment.customerName || "عزيزي العميل",
    serviceName: serviceName || appointment.serviceName || appointment.service?.name || "خدمة",
    date:
      date ||
      (appointmentDate
        ? appointmentDate.toLocaleDateString("ar-MA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
        : ""),
    time:
      time ||
      (appointmentDate
        ? appointmentDate.toLocaleTimeString("ar-MA", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : ""),
    // For reminders (tomorrow date)
    tomorrowDate: appointmentDate
      ? new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString("ar-MA", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "",
  }
}
