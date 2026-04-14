// API Route: /api/outbound/leads/[id]
// DELETE: حذف lead معين
// PATCH: تحديث status أو notes

import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response"

/**
 * DELETE — حذف OutboundLead
 */
export async function DELETE(request, { params }) {
  try {
    // ✅ التحقق من التوكن
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse("Unauthorized")
    }

    const userId = user.id
    const { id } = await params

    if (!id) {
      return errorResponse("معرف Lead مطلوب", 400)
    }

    // ✅ التحقق من الوجود والملكية
    const lead = await prisma.outboundLead.findFirst({
      where: { id, userId },
    })

    if (!lead) {
      return errorResponse("Lead غير موجود", 404)
    }

    // ✅ الحذف
    await prisma.outboundLead.delete({
      where: { id },
    })

    console.log(`✅ Deleted outbound lead: ${id}`)

    return successResponse({ message: "تم الحذف بنجاح" })

  } catch (error) {
    console.error("❌ Outbound lead delete error:", error.message)
    return errorResponse("حدث خطأ أثناء الحذف", 500)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PATCH — تحديث OutboundLead (status, notes)
 */
export async function PATCH(request, { params }) {
  try {
    // ✅ التحقق من التوكن
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse("Unauthorized")
    }

    const userId = user.id
    const { id } = await params

    if (!id) {
      return errorResponse("معرف Lead مطلوب", 400)
    }

    // ✅ التحقق من الوجود والملكية
    const lead = await prisma.outboundLead.findFirst({
      where: { id, userId },
    })

    if (!lead) {
      return errorResponse("Lead غير موجود", 404)
    }

    // ✅ قراءة البيانات
    const body = await request.json()
    const { status, notes } = body

    // ✅ التحقق من الحالة
    const validStatuses = ["PENDING", "SENT", "REPLIED", "CONVERTED", "FAILED"]
    if (status && !validStatuses.includes(status)) {
      return errorResponse("حالة غير صالحة", 400)
    }

    // ✅ بناء update data
    const updateData = {}

    if (status) {
      updateData.status = status

      // تحديث التواريخ حسب الحالة
      if (status === "SENT" && !lead.sentAt) {
        updateData.sentAt = new Date()
      }
      if (status === "REPLIED" && !lead.repliedAt) {
        updateData.repliedAt = new Date()
      }
      if (status === "CONVERTED" && !lead.convertedAt) {
        updateData.convertedAt = new Date()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // ✅ التحديث
    const updated = await prisma.outboundLead.update({
      where: { id },
      data: updateData,
    })

    console.log(`✅ Updated outbound lead: ${id} → ${status || "notes"}`)

    return successResponse({
      lead: updated,
      message: "تم التحديث بنجاح",
    })

  } catch (error) {
    console.error("❌ Outbound lead update error:", error.message)
    return errorResponse("حدث خطأ أثناء التحديث", 500)
  } finally {
    await prisma.$disconnect()
  }
}
