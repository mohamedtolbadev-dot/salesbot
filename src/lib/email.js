import nodemailer from "nodemailer"

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export async function sendOTPEmail({ to, code, appName = "wakil.ma" }) {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS

  if (!emailUser || !emailPass) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not configured")
    return { success: false, error: "Email credentials not configured" }
  }

  try {
    const transporter = createTransporter()

    await transporter.sendMail({
      from: `"${appName}" <${emailUser}>`,
      to,
      subject: `${code} — Code de vérification ${appName} / رمز التحقق`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
          <div style="background:#ffffff;border-radius:10px;padding:32px;border:1px solid #e5e7eb;">
            <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">🔐 ${appName}</h2>
            <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Code de vérification / رمز التحقق</p>
            <div style="background:#f1f5f9;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#1e293b;">${code}</span>
            </div>
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">⏱ Valide 15 minutes / صالح 15 دقيقة</p>
            <p style="color:#94a3b8;font-size:12px;margin:0;">Ne partagez pas ce code / لا تشارك هذا الرمز مع أحد</p>
          </div>
        </div>
      `,
    })

    console.log(`✅ OTP email sent to ${to}`)
    return { success: true }
  } catch (error) {
    console.error("❌ sendOTPEmail error:", error.message)
    return { success: false, error: error.message }
  }
}
