"use client"

import Link from "next/link"
import { MessageCircle, ArrowLeft, Scale, FileText, AlertTriangle, CheckCircle } from "lucide-react"

export default function TermsPage() {
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
            <Scale size={32} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">شروط الاستخدام</h1>
          <p className="text-sm text-muted-foreground">آخر تحديث: 20 مارس 2025</p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">1. قبول الشروط</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              باستخدامك لـ SalesBot.ma، فإنك توافق على هذه الشروط والأحكام. 
              إذا كنت لا توافق، يرجى عدم استخدام الخدمة.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <CheckCircle size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">2. الخدمة</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              SalesBot.ma هي منصة تقدم:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>وكيل مبيعات ذكي (AI) على واتساب</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إدارة المحادثات والعملاء</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>تحليلات وإحصائيات المبيعات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إدارة المنتجات</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">3. قواعد الاستخدام</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              يُمنع استخدام الخدمة للأغراض التالية:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إرسال رسائل غير مرغوب فيها (Spam)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>الاحتيال أو الخداع</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>الأنشطة غير القانونية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إساءة استخدام API أو محاولة اختراق النظام</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Scale size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">4. المسؤولية</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>نحن غير مسؤولين عن محتوى المحادثات بينك وبين عملائك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>ردود AI هي توصيات، والمسؤولية النهائية على صاحب المتجر</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>يجب الالتزام بشروط Meta (WhatsApp Business)</span>
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">5. الاشتراكات والدفع</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>الخدمة تقدم باقات مجانية ومدفوعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>يمكن إلغاء الاشتراك في أي وقت</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>لا يوجد استرداد للمدفوعات السابقة</span>
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">6. إنهاء الخدمة</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نحتفظ بالحق في إنهاء حسابك في حال:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>انتهاك شروط الاستخدام</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>عدم الدفع (للباقات المدفوعة)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 mt-0.5">•</span>
                <span>إساءة استخدام النظام</span>
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Scale size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">7. التعديلات</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. 
              سيتم إعلامك بأي تغييرات جوهرية عبر البريد الإلكتروني.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-brand-600 text-white rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">للتواصل</h2>
            <p className="text-sm text-white/80 mb-4">
              إذا كان لديك أي استفسار حول الشروط:
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
