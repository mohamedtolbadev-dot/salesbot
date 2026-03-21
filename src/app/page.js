"use client"

import Link from "next/link"
import { 
  MessageCircle, 
  Zap, 
  BarChart3, 
  Users, 
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Clock,
  Shield,
  Bot,
  Brain,
  Target,
  TrendingUp,
  MessageSquare,
  Phone
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="font-bold text-foreground">SalesBot.ma</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#ai-agent" className="text-muted-foreground hover:text-foreground transition-colors">وكيل الذكاء</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">الأسعار</a>
          </nav>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              دخول
            </Link>
            <Link 
              href="/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              تجربة مجانية
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5 mb-6">
              <Sparkles size={14} className="text-brand-600" />
              <span className="text-xs font-medium">وكيل مبيعات ذكي 24/7</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              وكيل المبيعات الذكي
              <span className="text-brand-600"> يعمل نيابة عنك</span>
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed">
              وكيل AI متخصص يتحدث مع عملائك، يفهم احتياجاتهم، يعرض منتجاتك، 
              ويُقنعهم بالشراء - كل ذلك تلقائياً على واتساب
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                href="/register"
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                ابدأ مجاناً
                <ArrowLeft size={16} />
              </Link>
              <a 
                href="#ai-agent"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-6 py-2.5"
              >
                تعرف على الوكيل الذكي
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 max-w-xl mx-auto">
            {[
              { value: "10K+", label: "رسالة يومياً" },
              { value: "500+", label: "متجر نشط" },
              { value: "95%", label: "رضا العملاء" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-brand-600">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agent Section */}
      <section id="ai-agent" className="py-16 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 bg-brand-100 border border-brand-200 rounded-full px-3 py-1.5 mb-4">
              <Brain size={14} className="text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">وكيل ذكاء اصطناعي متقدم</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              كيف يعمل وكيل المبيعات الذكي؟
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              وكيل AI مدرب خصيصاً لمتجرك، يفهم منتجاتك ويتحدث بلهجة عملائك
            </p>
          </div>

          {/* AI Agent Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-brand-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">شخصية مخصصة لمتجرك</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يمكنك تخصيص اسم الوكيل، شخصيته، وطريقة تحدثه مع العملاء. 
                    اجعله ودوداً أو رسمياً حسب طبيعة نشاطك التجاري
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-brand-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Target size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">فهم احتياجات العميل</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يطرح أسئلة ذكية لاكتشاف ما يبحث عنه العميل، 
                    ثم يقترح المنتجات المناسبة له بدقة
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-brand-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">تقنية الإقناع المتقدمة</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يتعامل مع اعتراضات العملاء (السعر، المقاس، التوفر) بذكاء، 
                    ويحول التردد إلى قرار شراء
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-brand-300 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">رد فوري 24/7</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    لا يغيب عن العمل أبداً. يستقبل الرسائل ويرد عليها في نفس اللحظة، 
                    حتى في منتصف الليل
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Flow */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-foreground mb-6 text-sm text-center">رحلة العميل مع الوكيل الذكي</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "الترحيب", desc: "تحية شخصية وعرض المساعدة" },
                { step: "2", title: "الاستكشاف", desc: "فهم احتياجات العميل" },
                { step: "3", title: "العرض", desc: "تقديم المنتجات المناسبة" },
                { step: "4", title: "الإغلاق", desc: "تأكيد الطلب وإتمام البيع" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground text-xs mb-1">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">كل شيء تحتاجه</h2>
            <p className="text-sm text-muted-foreground">مميزات قوية لتبسيط مبيعاتك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, title: "ردود ذكية", desc: "رد آلي مبني على GPT يفهم سياق المحادثة" },
              { icon: Users, title: "إدارة العملاء", desc: "CRM بسيط لمتابعة جميع عملائك" },
              { icon: BarChart3, title: "تحليلات فورية", desc: "إحصائيات مباشرة لمعدلات التحويل" },
              { icon: MessageSquare, title: "محادثات متعددة", desc: "إدارة آلاف المحادثات في وقت واحد" },
              { icon: Phone, title: "ربط واتساب", desc: "تكامل سهل مع واتساب بيزنس" },
              { icon: Shield, title: "آمن ومضمون", desc: "بياناتك مشفرة ومحمية بالكامل" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-card border border-border rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <feature.icon size={18} className="text-brand-600" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5 text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">أسعار بسيطة</h2>
            <p className="text-sm text-muted-foreground">ابدأ مجاناً ووسّع حسب نموك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                name: "مجاني",
                price: "0",
                desc: "للبدء والتجربة",
                features: ["100 رسالة/شهر", "وكيل أساسي", "دعم واحد"]
              },
              {
                name: "أساسي",
                price: "99",
                desc: "للمتاجر الصغيرة",
                features: ["1000 رسالة/شهر", "وكيل GPT ذكي", "تحليلات أساسية", "2 دعم"],
                popular: true
              },
              {
                name: "احترافي",
                price: "299",
                desc: "للنمو السريع",
                features: ["رسائل غير محدودة", "وكيل GPT-4 متقدم", "تحليلات متقدمة", "دعم غير محدود"]
              }
            ].map((plan) => (
              <div 
                key={plan.name}
                className={`bg-card border rounded-xl p-5 relative ${
                  plan.popular ? "border-brand-400 shadow-md" : "border-border hover:border-brand-300"
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      الأكثر شيوعاً
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="font-bold text-foreground text-sm mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-brand-600">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">درهم/شهر</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle size={14} className="text-brand-600 shrink-0" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/register"
                  className={`block text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-secondary text-foreground hover:bg-border"
                  }`}
                >
                  ابدأ الآن
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            جاهز لتأتمتة مبيعاتك؟
          </h2>
          <p className="text-sm text-white/80 mb-6">
            انضم لـ 500+ متجر يستخدم SalesBot.ma لتطوير أعمالهم
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-all"
          >
            ابدأ مجاناً
            <ArrowLeft size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <MessageCircle size={14} className="text-white" />
              </div>
              <span className="font-bold text-sm">SalesBot.ma</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              © 2025 SalesBot.ma - وكيل المبيعات الذكي
            </p>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">الشروط</span>
              <span className="text-muted-foreground">الخصوصية</span>
              <span className="text-muted-foreground">تواصل</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


