// API للتحقق من اشتغال الباكند
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/response"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1` 
    return successResponse({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return errorResponse("Database connection failed", 500)
  }
}
