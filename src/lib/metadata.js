// Metadata helpers for Wakil.ma
// Helper functions to generate consistent metadata across pages

export const siteConfig = {
  name: "Wakil",
  domain: "wakil.ma",
  description: {
    fr: "Wakil.ma — Votre agent de vente intelligent sur WhatsApp. Automatisez vos ventes, gérez vos rendez-vous et suivez vos commandes 24h/24.",
    ar: "وكيل.ما — وكيل مبيعاتك الذكي على واتساب. أتمت مبيعاتك، أدر مواعيدك، وتتبع طلباتك على مدار الساعة.",
  },
  keywords: {
    fr: [
      "agent whatsapp",
      "vente automatique",
      "e-commerce maroc",
      "chatbot commerce",
      "gestion rendez-vous",
      "automatisation ventes",
    ],
    ar: [
      "وكيل واتساب",
      "مبيعات تلقائية",
      "تجارة إلكترونية المغرب",
      "شات بوت",
      "إدارة المواعيد",
      "أتمتة المبيعات",
    ],
  },
  twitter: "@wakilma",
  ogImage: "/og-image.jpg",
}

/**
 * Generate metadata for a page
 * @param {Object} options
 * @param {string} options.title - Page title (without site name)
 * @param {string} options.description - Page description
 * @param {string} options.lang - 'fr' | 'ar'
 * @param {string} options.path - Page path for canonical URL
 * @param {boolean} options.noIndex - Whether to prevent indexing
 */
export function generateMetadata({
  title,
  description,
  lang = "fr",
  path = "",
  noIndex = false,
}) {
  const siteName = siteConfig.name
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName}.ma`
  const fullDescription = description || siteConfig.description[lang]
  const keywords = siteConfig.keywords[lang]
  const url = path ? `https://${siteConfig.domain}${path}` : `https://${siteConfig.domain}`

  return {
    title: fullTitle,
    description: fullDescription,
    keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    metadataBase: new URL(`https://${siteConfig.domain}`),
    alternates: {
      canonical: url,
      languages: {
        "fr-MA": `/fr${path}`,
        "ar-MA": `/ar${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: lang === "ar" ? "ar_MA" : "fr_MA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitter,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    verification: {
      google: "Vkp6avL1wZROXOvuakVPo_INQznais58cP0k-2gcOIg",
    },
  }
}

// Predefined metadata for common pages
export const pageMetadata = {
  // Auth pages
  login: {
    fr: { title: "Connexion", description: "Connectez-vous à votre compte Wakil.ma" },
    ar: { title: "تسجيل الدخول", description: "سجل الدخول إلى حسابك في وكيل.ما" },
    path: "/login",
  },
  register: {
    fr: { title: "Créer un compte", description: "Rejoignez Wakil.ma et commencez à vendre sur WhatsApp" },
    ar: { title: "إنشاء حساب", description: "انضم إلى وكيل.ما وابدأ البيع على واتساب" },
    path: "/register",
  },
  verify: {
    fr: { title: "Vérification", description: "Vérifiez votre email pour sécuriser votre compte" },
    ar: { title: "التحقق", description: "تحقق من بريدك الإلكتروني لتأمين حسابك" },
    path: "/verify",
  },
  phoneSetup: {
    fr: { title: "Configuration WhatsApp", description: "Connectez votre numéro WhatsApp à Wakil" },
    ar: { title: "إعداد واتساب", description: "اربط رقم واتسابك بوكيل" },
    path: "/phone-setup",
  },

  // Dashboard pages
  dashboard: {
    fr: { title: "Tableau de bord", description: "Gérez vos ventes, rendez-vous et conversations" },
    ar: { title: "لوحة التحكم", description: "أدر مبيعاتك ومواعيدك ومحادثاتك" },
    path: "/dashboard",
  },
  conversations: {
    fr: { title: "Conversations", description: "Discutez avec vos clients sur WhatsApp" },
    ar: { title: "المحادثات", description: "تحدث مع عملائك على واتساب" },
    path: "/dashboard/conversations",
  },
  appointments: {
    fr: { title: "Rendez-vous", description: "Gérez vos rendez-vous et réservations" },
    ar: { title: "المواعيد", description: "أدر مواعيدك وحجوزاتك" },
    path: "/dashboard/appointments",
  },
  orders: {
    fr: { title: "Commandes", description: "Suivez et gérez vos commandes" },
    ar: { title: "الطلبيات", description: "تتبع وأدر طلبياتك" },
    path: "/dashboard/orders",
  },
  products: {
    fr: { title: "Produits", description: "Gérez votre catalogue de produits" },
    ar: { title: "المنتجات", description: "أدر كتالوج منتجاتك" },
    path: "/dashboard/products",
  },
  services: {
    fr: { title: "Services", description: "Gérez vos services et disponibilités" },
    ar: { title: "الخدمات", description: "أدر خدماتك وتوفرك" },
    path: "/dashboard/services",
  },
  customers: {
    fr: { title: "Clients", description: "Votre base de clients et leurs historiques" },
    ar: { title: "العملاء", description: "قاعدة عملائك وتواريخهم" },
    path: "/dashboard/customers",
  },
  analytics: {
    fr: { title: "Analytiques", description: "Statistiques et performances de votre boutique" },
    ar: { title: "التحليلات", description: "إحصائيات وأداء متجرك" },
    path: "/dashboard/analytics",
  },
  settings: {
    fr: { title: "Paramètres", description: "Configurez votre agent IA et WhatsApp" },
    ar: { title: "الإعدادات", description: "اضبط وكيلك الذكي وواتساب" },
    path: "/dashboard/settings",
  },

  // Static pages
  privacy: {
    fr: { title: "Politique de confidentialité", description: "Comment nous protégeons vos données" },
    ar: { title: "سياسة الخصوصية", description: "كيف نحمي بياناتك" },
    path: "/privacy",
  },
  terms: {
    fr: { title: "Conditions d'utilisation", description: "Règles d'utilisation de Wakil.ma" },
    ar: { title: "شروط الاستخدام", description: "قواعد استخدام وكيل.ما" },
    path: "/terms",
  },
  deleteData: {
    fr: { title: "Suppression de données", description: "Demander la suppression de vos données" },
    ar: { title: "حذف البيانات", description: "اطلب حذف بياناتك" },
    path: "/delete-data",
  },
}

// Helper to get metadata for a specific page
export function getPageMetadata(pageKey, lang = "fr") {
  const page = pageMetadata[pageKey]
  if (!page) return generateMetadata({ lang })

  return generateMetadata({
    title: page[lang].title,
    description: page[lang].description,
    lang,
    path: page.path,
  })
}
