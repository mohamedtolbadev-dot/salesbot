import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { sendWhatsAppMessage, uploadWhatsAppMedia } from "@/lib/whatsapp"
import { generateInvoicePDF } from "@/lib/pdfGenerator"

async function getSuperAdmin(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const admin = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true },
  })
  if (admin?.role !== "SUPER_ADMIN") return null
  return decoded
}

// POST /api/admin/invoices/[id]/send
export async function POST(request, { params }) {
  try {
    const decoded = await getSuperAdmin(request)
    if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true },
    })
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    const clientPhone = invoice.client?.phone
    if (!clientPhone)
      return NextResponse.json({ error: "Client has no phone number" }, { status: 400 })

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { agent: true },
    })

    if (!adminUser?.agent?.whatsappPhoneId || !adminUser?.agent?.whatsappToken) {
      return NextResponse.json(
        { error: "WhatsApp not configured for admin" },
        { status: 400 }
      )
    }

    const dueDate = new Date(invoice.dueDate).toLocaleDateString("ar-MA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const planLabels = { FREE: "مجاني", PRO: "احترافي", ENTERPRISE: "مؤسسي" }
    const planLabel = planLabels[invoice.plan] || invoice.plan

    // ── بناء رسالة النص ──
    let message = `مرحبا ${invoice.client.name}! 👋\n\n`
    message += `📄 *فاتورة رقم: ${invoice.invoiceNumber}*\n`
    message += `🏪 المتجر: ${invoice.client.storeName}\n`
    message += `📦 الخطة: ${planLabel}\n`
    message += `💰 المبلغ: *${invoice.amount} درهم*\n`
    message += `📅 تاريخ الاستحقاق: ${dueDate}\n`
    if (invoice.notes) message += `\n📝 ملاحظات: ${invoice.notes}\n`
    if (invoice.bankInfo) message += `\n🏦 *معلومات الدفع:*\n${invoice.bankInfo}\n`
    message += `\nشكراً لثقتكم! 🙏`

    // ── إرسال رسالة النص ──
    const textResult = await sendWhatsAppMessage({
      phoneId: adminUser.agent.whatsappPhoneId,
      token: adminUser.agent.whatsappToken,
      to: clientPhone,
      message,
    })

    if (!textResult.success) {
      return NextResponse.json(
        { error: "Failed to send WhatsApp message", detail: textResult.error },
        { status: 500 }
      )
    }

    // ── توليد PDF ورفعه وإرساله ──
    let pdfSent = false
    let pdfError = null

    try {
      console.log("📄 Generating PDF for invoice:", invoice.invoiceNumber)
      const pdfBuffer = await generateInvoicePDF(invoice)
      console.log("✅ PDF generated, size:", pdfBuffer.length, "bytes")

      // الخطوة 1: رفع PDF إلى WhatsApp Media
      console.log("📤 Uploading PDF to WhatsApp Media...")
      const uploadResult = await uploadWhatsAppMedia({
        phoneId: adminUser.agent.whatsappPhoneId,
        token: adminUser.agent.whatsappToken,
        fileBuffer: pdfBuffer,
        filename: `${invoice.invoiceNumber}.pdf`,
        mimeType: "application/pdf",
      })

      if (!uploadResult.success) {
        pdfError = uploadResult.error
        console.error("❌ Failed to upload PDF media:", uploadResult.error)
      } else {
        // الخطوة 2: إرسال PDF باستخدام mediaId المُرجَع
        console.log("📤 Sending PDF document with mediaId:", uploadResult.mediaId)
        const pdfResult = await sendWhatsAppMessage({
          phoneId: adminUser.agent.whatsappPhoneId,
          token: adminUser.agent.whatsappToken,
          to: clientPhone,
          message: `📎 فاتورة ${invoice.invoiceNumber}`,
          type: "document",
          document: {
            filename: `${invoice.invoiceNumber}.pdf`,
            id: uploadResult.mediaId, // ✅ mediaId لا link
          },
        })

        if (pdfResult.success) {
          pdfSent = true
          console.log("✅ PDF sent successfully")
        } else {
          pdfError = pdfResult.error
          console.error("❌ Failed to send PDF:", pdfResult.error)
        }
      }
    } catch (err) {
      pdfError = err.message
      console.error("❌ PDF generation/sending error:", err)
    }

    // ── تحديث حالة الإرسال في قاعدة البيانات ──
    await prisma.invoice.update({
      where: { id },
      data: { whatsappSent: true },
    })

    return NextResponse.json({
      success: true,
      message: "Invoice sent via WhatsApp",
      pdfSent,
      ...(pdfError && { pdfError }),
    })
  } catch (error) {
    console.error("POST /api/admin/invoices/[id]/send error:", error)
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 })
  }
}