// دوال المصادقة
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

// تشفير كلمة المرور
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

// مقارنة كلمة المرور
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// توليد JWT Token
export function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "24h" }  // تقليل من 30 يوم إلى 24 ساعة لأمان أفضل
  )
}

// التحقق من JWT Token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// استخراج User من Request
export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader) {
      return null
    }

    if (!authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.slice(7) // Remove "Bearer " prefix
    const decoded = verifyToken(token)
    
    if (!decoded?.userId) {
      return null
    }

    const { prisma } = await import("@/lib/prisma")
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { agent: true }
    })

    return user
  } catch (error) {
    console.error("getUserFromRequest error:", error)
    return null
  }
}
