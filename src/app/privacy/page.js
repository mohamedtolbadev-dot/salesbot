"use client"

import Link from "next/link"
import { MessageCircle, ArrowLeft, Shield, Lock, Eye, Trash2 } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="font-bold text-foreground">SalesBot.ma</span>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={16} />
            العودة
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">سياسة الخصوصية</h1>
          <p className="text-sm text-muted-foreground">آخر تحديث: 20 مارس 2025</p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Lock size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">1. البيانات التي نجمعها</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نجمع البيانات التالية لتحسين خدمتنا:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span><strong>محادثات العملاء:</strong> رسائل واتساب الواردة والصادرة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span><strong>إحصائيات المبيعات:</strong> عدد الطلبات، الأرباح</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span><strong>معلومات المتجر:</strong> اسم المتجر، المنتجات</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Eye size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">2. كيف نستخدم البيانات</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>تشغيل وكيل المبيعات الذكي (AI Agent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>تحليل أداء المبيعات وإحصائيات المتجر</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إرسال إشعارات للمستخدم (طلبات جديدة، تنبيهات)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>تحسين خدمة العملاء</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Lock size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">3. حماية البيانات</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              نحن نأخذ أمان بياناتك على محمل الجد:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>جميع البيانات مشفرة أثناء النقل (HTTPS/TLS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>نستخدم خوادم آمنة مع حماية DDoS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>لا نشارك بياناتك مع أطراف ثالثة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>Token واتساب مخزن بشكل آمن ومشفر</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Trash2 size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">4. حذف البيانات</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              يمكنك حذف جميع بياناتك في أي وقت:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>من الإعدادات: Dashboard → Settings → Delete Account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>أو عبر البريد: coprino7@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>تُحذف البيانات خلال 30 يوماً كحد أقصى</span>
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-brand-600 text-white rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">للتواصل بخصوص الخصوصية</h2>
            <p className="text-sm text-white/80 mb-4">
              إذا كان لديك أي استفسار حول سياسة الخصوصية:
            </p>
            <a 
              href="mailto:coprino7@gmail.com"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              coprino7@gmail.com
            </a>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 SalesBot.ma - جميع الحقوق محفوظة
          </p>
        </footer>
      </main>
    </div>
  )
}
