// lib/validation.js — Validation helpers for API routes

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = "ValidationError"
  }
}

export const validators = {
  required: (value, fieldName) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      throw new ValidationError(`${fieldName} مطلوب`)
    }
    return value
  },

  string: (value, fieldName, { maxLength = 255 } = {}) => {
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName} يجب أن يكون نصاً`)
    }
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} طويل جداً (الحد ${maxLength})`)
    }
    return value.trim()
  },

  number: (value, fieldName, { min = 0, max = 1000000 } = {}) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} يجب أن يكون رقماً`)
    }
    if (num < min) {
      throw new ValidationError(`${fieldName} يجب أن يكون على الأقل ${min}`)
    }
    if (num > max) {
      throw new ValidationError(`${fieldName} يتجاوز الحد المسموح`)
    }
    return num
  },

  phone: (value) => {
    const cleaned = value?.replace(/\D/g, "")
    if (!cleaned || cleaned.length < 9 || cleaned.length > 15) {
      throw new ValidationError("رقم الهاتف غير صالح")
    }
    return cleaned
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new ValidationError("البريد الإلكتروني غير صالح")
    }
    return value.toLowerCase().trim()
  },
}

// مثال الاستخدام في API:
// try {
//   const name = validators.required(body.name, "الاسم")
//   const price = validators.number(body.price, "السعر", { min: 1 })
// } catch (err) {
//   if (err instanceof ValidationError)
//     return errorResponse(err.message, 400)
// }
