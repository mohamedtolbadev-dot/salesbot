import PDFDocument from "pdfkit"

export function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 })
      const chunks = []

      doc.on("data", chunk => chunks.push(chunk))
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(pdfBuffer)
      })
      doc.on("error", reject)

      const planLabels = { FREE: "مجاني", PRO: "احترافي", ENTERPRISE: "مؤسسي" }
      const planLabel = planLabels[invoice.plan] || invoice.plan
      const dueDate = new Date(invoice.dueDate).toLocaleDateString("ar-MA", {
        day: "numeric", month: "long", year: "numeric"
      })
      const createdDate = new Date(invoice.createdAt).toLocaleDateString("ar-MA", {
        day: "numeric", month: "long", year: "numeric"
      })

      // Header
      doc.fontSize(24).fillColor("#2563eb").text("فاتورة", { align: "center" })
      doc.moveDown(0.5)
      doc.fontSize(12).fillColor("#666").text(`رقم الفاتورة: ${invoice.invoiceNumber}`, { align: "center" })
      doc.moveDown(1)

      // Divider
      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(1)

      // Client Info
      doc.fontSize(14).fillColor("#111827").text("معلومات العميل", { align: "right" })
      doc.moveDown(0.5)
      doc.fontSize(11).fillColor("#374151")
      doc.text(`الاسم: ${invoice.client.name}`, { align: "right" })
      doc.text(`المتجر: ${invoice.client.storeName || "-"}`, { align: "right" })
      if (invoice.client.email) {
        doc.text(`البريد: ${invoice.client.email}`, { align: "right" })
      }
      if (invoice.client.phone) {
        doc.text(`الهاتف: ${invoice.client.phone}`, { align: "right" })
      }
      doc.moveDown(1)

      // Divider
      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(1)

      // Invoice Details
      doc.fontSize(14).fillColor("#111827").text("تفاصيل الفاتورة", { align: "right" })
      doc.moveDown(0.5)

      const tableY = doc.y
      doc.fontSize(11).fillColor("#374151")

      // Table Header
      doc.fillColor("#f3f4f6").rect(50, tableY, 500, 30).fill()
      doc.fillColor("#111827").fontSize(10)
      doc.text("البيان", 400, tableY + 8, { align: "right", width: 100 })
      doc.text("القيمة", 60, tableY + 8, { align: "left", width: 100 })

      // Table Row
      doc.fillColor("#fff").rect(50, tableY + 30, 500, 30).fill()
      doc.fillColor("#374151").fontSize(11)
      doc.text(`خطة ${planLabel}`, 400, tableY + 38, { align: "right", width: 100 })
      doc.text(`${invoice.amount} درهم`, 60, tableY + 38, { align: "left", width: 100 })

      doc.y = tableY + 70
      doc.moveDown(1)

      // Dates
      doc.fontSize(11).fillColor("#374151")
      doc.text(`تاريخ الإصدار: ${createdDate}`, { align: "right" })
      doc.text(`تاريخ الاستحقاق: ${dueDate}`, { align: "right" })
      doc.moveDown(1)

      // Bank Info
      if (invoice.bankInfo) {
        doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
        doc.moveDown(1)
        doc.fontSize(14).fillColor("#111827").text("معلومات الدفع", { align: "right" })
        doc.moveDown(0.5)
        doc.fontSize(11).fillColor("#374151")
        doc.text(invoice.bankInfo, { align: "right" })
        doc.moveDown(1)
      }

      // Notes
      if (invoice.notes) {
        doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
        doc.moveDown(1)
        doc.fontSize(14).fillColor("#111827").text("ملاحظات", { align: "right" })
        doc.moveDown(0.5)
        doc.fontSize(11).fillColor("#374151")
        doc.text(invoice.notes, { align: "right" })
        doc.moveDown(1)
      }

      // Total
      doc.strokeColor("#2563eb").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)
      doc.fontSize(16).fillColor("#2563eb").text(`الإجمالي: ${invoice.amount} درهم`, { align: "center" })
      doc.moveDown(1)

      // Footer
      doc.fontSize(10).fillColor("#9ca3af").text("شكراً لثقتكم!", { align: "center" })
      doc.text("wakil.ma - وكيل المبيعات الذكي", { align: "center" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
