"use client"

import Link from "next/link"
import { MessageCircle, ArrowLeft, Shield, Lock, Eye, Trash2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const translations = {
  ar: {
    back: "العودة",
    title: "سياسة الخصوصية",
    lastUpdate: "آخر تحديث: 20 مارس 2025",
    section1: {
      title: "1. البيانات التي نجمعها",
      desc: "نجمع البيانات التالية لتحسين خدمتنا:",
      items: [
        "<strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف",
        "<strong>محادثات العملاء:</strong> رسائل واتساب الواردة والصادرة",
        "<strong>إحصائيات المبيعات:</strong> عدد الطلبات، الأرباح",
        "<strong>معلومات المتجر:</strong> اسم المتجر، المنتجات"
      ]
    },
    section2: {
      title: "2. كيف نستخدم البيانات",
      items: [
        "تشغيل وكيل المبيعات الذكي (AI Agent)",
        "تحليل أداء المبيعات وإحصائيات المتجر",
        "إرسال إشعارات للمستخدم (طلبات جديدة، تنبيهات)",
        "تحسين خدمة العملاء"
      ]
    },
    section3: {
      title: "3. حماية البيانات",
      desc: "نحن نأخذ أمان بياناتك على محمل الجد:",
      items: [
        "جميع البيانات مشفرة أثناء النقل (HTTPS/TLS)",
        "نستخدم خوادم آمنة مع حماية DDoS",
        "لا نشارك بياناتك مع أطراف ثالثة",
        "Token واتساب مخزن بشكل آمن ومشفر"
      ]
    },
    section4: {
      title: "4. حذف البيانات",
      desc: "يمكنك حذف جميع بياناتك في أي وقت:",
      items: [
        "من الإعدادات: Dashboard → Settings → Delete Account",
        "أو عبر البريد: contact@wakil.ma",
        "تُحذف البيانات خلال 30 يوماً كحد أقصى"
      ]
    },
    contact: {
      title: "للتواصل بخصوص الخصوصية",
      desc: "إذا كان لديك أي استفسار حول سياسة الخصوصية:",
      email: "contact@wakil.ma"
    },
    footer: "جميع الحقوق محفوظة"
  },
  fr: {
    back: "Retour",
    title: "Politique de Confidentialité",
    lastUpdate: "Dernière mise à jour: 20 Mars 2025",
    section1: {
      title: "1. Données collectées",
      desc: "Nous collectons les données suivantes pour améliorer notre service:",
      items: [
        "<strong>Informations du compte:</strong> Nom, Email, Numéro de téléphone",
        "<strong>Conversations clients:</strong> Messages WhatsApp entrants et sortants",
        "<strong>Statistiques de ventes:</strong> Nombre de commandes, Revenus",
        "<strong>Informations du magasin:</strong> Nom du magasin, Produits"
      ]
    },
    section2: {
      title: "2. Utilisation des données",
      items: [
        "Fonctionnement de l'agent de vente intelligent (AI Agent)",
        "Analyse des performances de ventes et statistiques",
        "Envoi de notifications (nouvelles commandes, alertes)",
        "Amélioration du service client"
      ]
    },
    section3: {
      title: "3. Protection des données",
      desc: "Nous prenons la sécurité de vos données très au sérieux:",
      items: [
        "Toutes les données sont chiffrées pendant le transfert (HTTPS/TLS)",
        "Nous utilisons des serveurs sécurisés avec protection DDoS",
        "Nous ne partageons pas vos données avec des tiers",
        "Token WhatsApp stocké de manière sécurisée et chiffrée"
      ]
    },
    section4: {
      title: "4. Suppression des données",
      desc: "Vous pouvez supprimer toutes vos données à tout moment:",
      items: [
        "Depuis les paramètres: Dashboard → Settings → Delete Account",
        "Ou par email: contact@wakil.ma",
        "Les données sont supprimées dans un délai maximum de 30 jours"
      ]
    },
    contact: {
      title: "Contact concernant la confidentialité",
      desc: "Si vous avez des questions sur notre politique de confidentialité:",
      email: "contact@wakil.ma"
    },
    footer: "Tous droits réservés"
  }
}

export default function PrivacyPage() {
  const { language } = useLanguage()
  const t = translations[language] || translations.ar
  const isRTL = language === "ar"
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="font-bold text-foreground">Wakil.ma</span>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={16} />
            {t.back}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.lastUpdate}</p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Lock size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t.section1.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.section1.desc}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {t.section1.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-600 mt-0.5">•</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Eye size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t.section2.title}</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.section2.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-600 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Lock size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t.section3.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t.section3.desc}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {t.section3.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-600 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Trash2 size={20} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t.section4.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.section4.desc}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {t.section4.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-600 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-brand-600 text-white rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">{t.contact.title}</h2>
            <p className="text-sm text-white/80 mb-4">
              {t.contact.desc}
            </p>
            <a 
              href={`mailto:${t.contact.email}`}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {t.contact.email}
            </a>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 wakil.ma - {t.footer}
          </p>
        </footer>
      </main>
    </div>
  )
}
