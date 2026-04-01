"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  MessageCircle, Zap, BarChart3, Users, ArrowLeft, Sparkles,
  Clock, Shield, Bot, Brain, Target, TrendingUp, MessageSquare,
  Phone, Star, ChevronDown, Menu, X, Sun, Moon, ShoppingBag, Calendar,
} from "lucide-react"

/* ─── Hook: scroll reveal ───────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── Hook: animated counter ───────────────────────────── */
function useCounter(target, duration = 1800, visible) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!visible) return
    const end = parseFloat(target)
    const step = end / (duration / 16)
    let cur = 0
    const timer = setInterval(() => {
      cur = Math.min(cur + step, end)
      setCount(Math.floor(cur))
      if (cur >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target, duration])
  return count
}

/* ─── Logo ──────────────────────────────────────────────── */
function Logo({ theme }) {
  return (
    <Link href="/" dir="ltr" className="flex items-center">
      <Image
        src={theme === "dark" ? "/logo/logo-dark.svg" : "/logo/logo-light.svg"}
        alt="SalesBot.ma" width={168} height={38}
        className="h-7 w-auto sm:h-8 md:h-9"
      />
    </Link>
  )
}

/* ─── Section badge ─────────────────────────────────────── */
// IMPROVEMENT 6: px-4 py-2 → px-5 py-2.5, text-xs sm:text-sm → text-sm font-bold, icon size={14} → size={15}
function SectionBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 bg-secondary border border-border
                    rounded-full px-5 py-2.5 mb-6">
      <Icon size={15} className="text-brand-600 shrink-0" />
      <span className="text-sm font-bold text-brand-600">{label}</span>
    </div>
  )
}

/* ─── Stat card with animated counter ──────────────────── */
// IMPROVEMENT 4: p-5 sm:p-6 → p-6 sm:p-8, text-3xl sm:text-4xl → text-4xl sm:text-5xl, added mt-1
function StatCard({ value, suffix, label, visible, delay = 0 }) {
  const num = useCounter(value, 1600, visible)
  return (
    <div className={`text-center bg-card border border-border/60 rounded-3xl p-6 sm:p-8
                     hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/12
                     transition-all duration-500 hover:-translate-y-1.5 group
                     ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transition: `opacity .7s ${delay}ms, transform .7s ${delay}ms, box-shadow .3s, border-color .3s` }}>
      <div className="text-4xl sm:text-5xl font-extrabold text-brand-600 mb-1 tabular-nums
                      group-hover:scale-110 transition-transform duration-300 origin-center">
        {num.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  )
}

/* ─── Header ────────────────────────────────────────────── */
// IMPROVEMENT 5: nav links text-[15px], padding py-4 sm:py-5, CTA button text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState("light")
  const [scrolled, setScrolled] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = saved || (prefersDark ? "dark" : "light")
    setTheme(initial)
    if (initial === "dark") document.documentElement.classList.add("dark")

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  const navLinks = [
    { href: "#ai-agent",     label: t("land.nav_agent") },
    { href: "#features",     label: t("land.nav_features") },
    { href: "#testimonials", label: t("land.nav_testimonials") },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300
      ${scrolled
        ? "bg-card/90 backdrop-blur-xl border-b border-border shadow-sm shadow-black/5"
        : "bg-card border-b border-border"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">

        <Logo theme={theme} />

        {/* Desktop nav with underline animation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href}
              className="text-[15px] font-medium text-muted-foreground hover:text-brand-600
                         transition-colors relative group py-1">
              {label}
              <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-brand-600 rounded-full
                               group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={toggleTheme} aria-label="toggle theme"
            className="p-2 rounded-xl border border-border hover:bg-secondary
                       transition-all hover:scale-105 active:scale-95 text-foreground">
            {theme === "light"
              ? <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />
              : <Sun  size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>

          <button onClick={() => setLanguage(language === "ar" ? "fr" : "ar")}
            className="p-2 rounded-xl border border-border hover:bg-secondary
                       transition-all hover:scale-105 active:scale-95
                       text-xs font-bold text-brand-600 min-w-[36px]">
            {language === "ar" ? "FR" : "عر"}
          </button>

          <Link href="/login"
            className="hidden sm:inline-flex text-sm font-semibold text-muted-foreground
                       hover:text-foreground transition-colors px-3 sm:px-4 py-2">
            {t("land.login")}
          </Link>

          <Link href="/register"
            className="text-sm font-bold bg-brand-600 text-white
                       px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl hover:bg-brand-700
                       transition-all hover:shadow-lg hover:shadow-brand-600/30
                       hover:-translate-y-0.5 active:scale-95 whitespace-nowrap">
            {t("land.free_trial")}
          </Link>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="menu"
            className="md:hidden p-2 rounded-xl border border-border hover:bg-secondary
                       transition-all text-foreground">
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — animated height */}
      <div className={`md:hidden overflow-hidden transition-all duration-300
                       ${mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-border bg-card px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                         text-muted-foreground hover:text-brand-600 hover:bg-secondary
                         transition-colors">
              {label}
            </a>
          ))}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                       text-muted-foreground hover:text-brand-600 hover:bg-secondary
                       transition-colors">
            {t("land.login")}
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero ──────────────────────────────────────────────── */
// IMPROVEMENT 1: h1 text-5xl sm:text-6xl md:text-7xl, subtitle text-base sm:text-lg md:text-xl
// IMPROVEMENT 2: py-20 md:py-32, mb-12 on subtitle
// IMPROVEMENT 4: badge px-5 py-3, CTA px-10 py-4 text-base rounded-2xl
function HeroSection() {
  const { ref, visible } = useReveal(0.05)
  const { t } = useLanguage()

  return (
    <section ref={ref} className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2
                        w-[900px] h-[600px] rounded-full bg-brand-600/8 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        {/* Decorative rings */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full
                        border border-brand-600/10" />
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full
                        border border-brand-600/15" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full
                        border border-brand-600/8" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">

          {/* Animated badge */}
          <div className={`transition-all duration-700 delay-100
                           ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="inline-flex items-center gap-2.5 bg-secondary border border-border
                            rounded-full px-5 py-3 mb-8 font-bold
                            hover:border-brand-300 hover:shadow-md hover:shadow-brand-600/10
                            transition-all duration-300 cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full
                                 bg-brand-600 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
              </span>
              <Sparkles size={13} className="text-brand-600" />
              <span className="text-xs sm:text-sm font-bold text-brand-600">
                {t("land.hero_badge")}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className={`transition-all duration-700 delay-200
                           ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground
                           mb-6 leading-[1.15] tracking-tight">
              {t("land.hero_title1")}
              <br />
              <span className="text-brand-600 relative inline-block">
                {t("land.hero_title2")}
                {/* Wavy underline */}
                <svg className="absolute -bottom-1.5 right-0 w-full overflow-visible"
                  viewBox="0 0 300 8" preserveAspectRatio="none" fill="none">
                  <path d="M0 6 Q37.5 1 75 5 Q112.5 9 150 5 Q187.5 1 225 5 Q262.5 9 300 5"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" opacity="0.35" />
                </svg>
              </span>
            </h1>
          </div>

          {/* Sub */}
          <div className={`transition-all duration-700 delay-300
                           ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground
                          mb-12 leading-loose max-w-2xl mx-auto">
              {t("land.hero_sub")}
            </p>
          </div>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4
                           transition-all duration-700 delay-400
                           ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Link href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5
                         bg-brand-600 text-white px-10 py-4 rounded-2xl font-bold text-base
                         hover:bg-brand-700 transition-all hover:shadow-2xl
                         hover:shadow-brand-600/35 hover:-translate-y-1.5 active:scale-95 group">
              {t("land.cta_start")}
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
            </Link>
            <a href="#ai-agent"
              className="w-full sm:w-auto flex items-center justify-center gap-2
                         text-base font-semibold text-muted-foreground hover:text-brand-600
                         transition-all px-8 py-4 border border-border rounded-2xl
                         hover:border-brand-300 bg-card hover:shadow-md
                         hover:shadow-brand-600/5 group">
              {t("land.cta_how")}
              <ChevronDown size={15}
                className="group-hover:translate-y-1 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* Stats with stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6
                        mt-16 md:mt-20 max-w-2xl mx-auto">
          <StatCard value={10000} suffix="+" label={t("land.stat_msgs")}  visible={visible} delay={500} />
          <StatCard value={500}   suffix="+" label={t("land.stat_biz")}   visible={visible} delay={620} />
          <StatCard value={95}    suffix="%" label={t("land.stat_auto")}  visible={visible} delay={740} />
        </div>
      </div>
    </section>
  )
}

/* ─── AI Agent Section ──────────────────────────────────── */
// IMPROVEMENT 1: h2 text-3xl sm:text-4xl md:text-5xl, tracking-tight
// IMPROVEMENT 2: py-20 md:py-32, cards p-7 sm:p-9, gap-5 sm:gap-6, h2 mb-5
// IMPROVEMENT 3: rounded-3xl, border-border/60, hover:shadow-2xl hover:shadow-brand-600/12, journey circles w-12 h-12 rounded-2xl
function AgentSection() {
  const { ref, visible } = useReveal()
  const { t } = useLanguage()

  const cards = [
    { icon: Bot,        title: t("land.card1_title"), desc: t("land.card1_desc") },
    { icon: Target,     title: t("land.card2_title"), desc: t("land.card2_desc") },
    { icon: TrendingUp, title: t("land.card3_title"), desc: t("land.card3_desc") },
    { icon: Clock,      title: t("land.card4_title"), desc: t("land.card4_desc") },
  ]

  const steps = [
    { step: "1", title: t("land.step1_title"), desc: t("land.step1_desc") },
    { step: "2", title: t("land.step2_title"), desc: t("land.step2_desc") },
    { step: "3", title: t("land.step3_title"), desc: t("land.step3_desc") },
    { step: "4", title: t("land.step4_title"), desc: t("land.step4_desc") },
    { step: "5", title: t("land.step5_title"), desc: t("land.step5_desc") },
    { step: "6", title: t("land.step6_title"), desc: t("land.step6_desc") },
  ]

  return (
    <section id="ai-agent" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-secondary/40" />
      <div className="absolute -right-32 top-1/3 w-72 h-72 rounded-full
                      bg-brand-600/5 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={Brain} label={t("land.agent_badge")} />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground
                         mb-5 tracking-tight">
            {t("land.agent_title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-loose">
            {t("land.agent_sub")}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-12">
          {cards.map((card, i) => (
            <div key={i}
              className={`bg-card border border-border/60 rounded-3xl p-7 sm:p-9
                          hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/12
                          transition-all duration-500 hover:-translate-y-1.5 group
                          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: visible ? `${200 + i * 100}ms` : "0ms" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-secondary border border-border
                                flex items-center justify-center shrink-0
                                group-hover:bg-brand-600 group-hover:border-brand-600
                                transition duration-300">
                  <card.icon size={19}
                    className="text-brand-600 group-hover:text-white
                               group-hover:scale-110 transition duration-300" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-base sm:text-lg leading-snug
                                 group-hover:text-brand-600 transition duration-300">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-loose">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey */}
        <div className={`bg-card border border-border/60 rounded-3xl p-7 sm:p-10
                         transition-all duration-700
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: visible ? "600ms" : "0ms" }}>
          <h3 className="font-extrabold text-foreground mb-8 sm:mb-10
                         text-sm sm:text-base md:text-lg text-center tracking-tight">
            {t("land.journey_title")}
          </h3>

          <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
            {/* Connector — desktop */}
            <div className="hidden md:block absolute top-5 right-[12.5%] left-[12.5%] h-px
                            bg-linear-to-l from-transparent via-border to-transparent" />

            {steps.map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center
                                justify-center text-base font-extrabold mx-auto mb-3
                                shadow-lg shadow-brand-600/30
                                group-hover:scale-110 group-hover:shadow-xl
                                group-hover:shadow-brand-600/40
                                transition-all duration-300">
                  {item.step}
                </div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm mb-1.5
                               group-hover:text-brand-600 transition-colors duration-300">
                  {item.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features ──────────────────────────────────────────── */
// IMPROVEMENT 1: h2 text-3xl sm:text-4xl md:text-5xl, feature titles text-base sm:text-lg, body leading-loose
// IMPROVEMENT 2: py-20 md:py-32, cards p-7 sm:p-9, gap-5 sm:gap-6, h2 mb-5
// IMPROVEMENT 3: rounded-3xl, border-border/60, hover:shadow-2xl hover:shadow-brand-600/12, icon w-14 h-14 rounded-2xl
function FeaturesSection() {
  const { ref, visible } = useReveal()
  const { t } = useLanguage()

  const features = [
    { icon: ShoppingBag,   title: t("land.feat1_title"), desc: t("land.feat1_desc") },
    { icon: Calendar,      title: t("land.feat2_title"), desc: t("land.feat2_desc") },
    { icon: Users,         title: t("land.feat3_title"), desc: t("land.feat3_desc") },
    { icon: BarChart3,     title: t("land.feat4_title"), desc: t("land.feat4_desc") },
    { icon: MessageSquare, title: t("land.feat5_title"), desc: t("land.feat5_desc") },
    { icon: Phone,         title: t("land.feat6_title"), desc: t("land.feat6_desc") },
    { icon: Brain,         title: t("land.feat7_title"), desc: t("land.feat7_desc") },
  ]

  return (
    <section id="features" className="py-20 md:py-32">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={Zap} label={t("land.feat_badge")} />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground
                         mb-5 tracking-tight">
            {t("land.feat_title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-loose">
            {t("land.feat_sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, i) => (
            <div key={i}
              className={`bg-card border border-border/60 rounded-3xl p-7 sm:p-9
                          hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/12
                          transition-all duration-500 hover:-translate-y-1.5 group relative overflow-hidden
                          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: visible ? `${150 + i * 80}ms` : "0ms" }}>

              {/* Hover glow spot */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full
                              bg-brand-600/0 group-hover:bg-brand-600/6
                              transition-all duration-500 blur-xl" />

              <div className="w-14 h-14 rounded-2xl bg-secondary border border-border
                              flex items-center justify-center mb-5 relative
                              group-hover:border-brand-300 transition-all duration-300">
                <feature.icon size={22}
                  className="text-brand-600 group-hover:scale-110 transition-transform duration-300" />
              </div>

              <h3 className="font-bold text-foreground mb-2.5 text-base sm:text-lg
                             group-hover:text-brand-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-loose relative">
                {feature.desc}
              </p>

              {/* Bottom slide-in line */}
              <div className="mt-5 h-0.5 w-0 bg-brand-600/30 rounded-full
                              group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ──────────────────────────────────────── */
// IMPROVEMENT 7: quote text-6xl mb-4, stars size={15} gap-1, avatar w-11 h-11,
//                author text-[15px], store text-[13px], card text text-sm leading-loose
// IMPROVEMENT 2: py-20 md:py-32, cards p-7 sm:p-9, gap-5 sm:gap-6, h2 mb-5
// IMPROVEMENT 3: rounded-3xl, border-border/60, hover:shadow-2xl hover:shadow-brand-600/12
function TestimonialsSection() {
  const { ref, visible } = useReveal()
  const { t } = useLanguage()

  const testimonials = [
    { name: t("land.testi1_name"), store: t("land.testi1_store"), text: t("land.testi1_text") },
    { name: t("land.testi2_name"), store: t("land.testi2_store"), text: t("land.testi2_text") },
    { name: t("land.testi3_name"), store: t("land.testi3_store"), text: t("land.testi3_text") },
  ]

  return (
    <section id="testimonials" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-secondary/40" />
      <div className="absolute -left-24 bottom-1/4 w-64 h-64 rounded-full
                      bg-brand-600/5 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={Star} label={t("land.testi_badge")} />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground
                         mb-5 tracking-tight">
            {t("land.testi_title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-loose">
            {t("land.testi_sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((item, i) => (
            <div key={i}
              className={`bg-card border border-border/60 rounded-3xl p-7 sm:p-9
                          hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/12
                          transition-all duration-500 hover:-translate-y-1.5 group flex flex-col
                          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: visible ? `${200 + i * 120}ms` : "0ms" }}>

              {/* Large quote mark */}
              <div className="text-6xl font-serif leading-none text-brand-600/15 mb-4
                              group-hover:text-brand-600/25 transition-colors duration-300 select-none">
                "
              </div>

              {/* Stars with stagger hover */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={15} className="text-brand-600 fill-brand-600
                                                      group-hover:scale-110 transition-transform duration-200"
                    style={{ transitionDelay: `${j * 40}ms` }} />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-loose flex-1 mb-5">
                {item.text}
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-11 h-11 rounded-full bg-secondary border border-border
                                flex items-center justify-center font-bold text-brand-600 text-sm
                                shrink-0 group-hover:border-brand-300 group-hover:bg-brand-600/8
                                transition-all duration-300">
                  {item.name[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground text-[15px]">{item.name}</p>
                  <p className="text-[13px] text-muted-foreground">{item.store}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA ───────────────────────────────────────────────── */
// IMPROVEMENT 9: h2 text-3xl sm:text-4xl md:text-6xl, buttons px-10 py-4,
//                subtitle text-base sm:text-lg, mb-5 → mb-7
function CTASection() {
  const { ref, visible } = useReveal()
  const { t } = useLanguage()

  return (
    <section ref={ref} className="py-20 md:py-32 relative overflow-hidden bg-brand-600">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className={`transition-all duration-700
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20
                          rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
            <Zap size={13} className="text-white shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white">{t("land.cta_badge")}</span>
          </div>
        </div>

        <div className={`transition-all duration-700 delay-150
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white
                         mb-7 leading-tight tracking-tight">
            {t("land.cta_title1")}
            <br />
            {t("land.cta_title2")}
          </h2>
        </div>

        <div className={`transition-all duration-700 delay-300
                         ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
            {t("land.cta_sub")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5
                         bg-white text-brand-600 px-10 py-4 rounded-2xl font-extrabold text-base
                         hover:bg-white/90 transition-all hover:shadow-2xl
                         hover:-translate-y-1.5 active:scale-95 group">
              {t("land.cta_btn")}
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         text-sm font-semibold text-white/80 hover:text-white transition-colors
                         border border-white/25 hover:border-white/50 px-7 py-4 rounded-2xl
                         hover:bg-white/8 backdrop-blur-sm">
              {t("land.cta_login")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────── */
// IMPROVEMENT 8: py-10 sm:py-14, logo icon w-10 h-10, brand name text-xl, copyright text-sm, links text-sm
function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="py-10 sm:py-14 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center
                            shadow-md shadow-brand-600/30 group-hover:scale-105
                            group-hover:shadow-lg group-hover:shadow-brand-600/40
                            transition-all duration-300">
              <MessageCircle size={17} className="text-white" />
            </div>
            <span className="font-extrabold text-xl text-foreground">SalesBot.ma</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {t("land.footer_copy")}
          </p>

          <div className="flex items-center gap-5 sm:gap-6 text-sm font-medium">
            {[t("land.footer_terms"), t("land.footer_privacy"), t("land.footer_contact")].map((label) => (
              <span key={label}
                className="text-muted-foreground hover:text-brand-600 transition-colors
                           cursor-pointer relative group">
                {label}
                <span className="absolute -bottom-0.5 right-0 w-0 h-px bg-brand-600
                                 group-hover:w-full transition-all duration-300 rounded-full" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const { dir } = useLanguage()
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping { animation: ping 1.5s cubic-bezier(0,0,.2,1) infinite; }
      `}</style>
      <Header />
      <HeroSection />
      <AgentSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}