"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  MessageCircle, Zap, BarChart3, Users, ArrowLeft, Sparkles,
  Clock, Shield, Bot, Brain, Target, TrendingUp, MessageSquare,
  Phone, Star, ChevronDown, Menu, X, Sun, Moon, ShoppingBag, Calendar,
  ChevronLeft, ChevronRight, LogOut, UserPlus, Upload, Link2, Settings, Rocket,
  Mail, Smartphone,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════
// 1. CONTENT DATA
// ═══════════════════════════════════════════════════════════

const CONTENT = {
  nav: {
    links: [
      { href: "#ai-agent", key: "nav_agent" },
      { href: "#features", key: "nav_features" },
      { href: "#faq", key: "nav_faq" },
    ],
  },
  hero: {
    stats: [
      { value: "10K+", key: "stat_msgs" },
      { value: "500+", key: "stat_biz" },
      { value: "95%", key: "stat_auto" },
    ],
    whatsappImages: [
      { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.10.jpeg", alt: "WhatsApp Chat 1" },
      { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.10 (1).jpeg", alt: "WhatsApp Chat 2" },
      { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.11.jpeg", alt: "WhatsApp Chat 3" },
    ],
  },
  agent: {
    cards: [
      { icon: Bot, titleKey: "card1_title", descKey: "card1_desc" },
      { icon: Target, titleKey: "card2_title", descKey: "card2_desc" },
      { icon: TrendingUp, titleKey: "card3_title", descKey: "card3_desc" },
      { icon: Clock, titleKey: "card4_title", descKey: "card4_desc" },
    ],
    steps: [
      { step: "1", titleKey: "step1_title", descKey: "step1_desc", icon: MessageCircle },
      { step: "2", titleKey: "step2_title", descKey: "step2_desc", icon: UserPlus },
      { step: "3", titleKey: "step3_title", descKey: "step3_desc", icon: Upload },
      { step: "4", titleKey: "step4_title", descKey: "step4_desc", icon: Link2 },
      { step: "5", titleKey: "step5_title", descKey: "step5_desc", icon: Settings },
      { step: "6", titleKey: "step6_title", descKey: "step6_desc", icon: Rocket },
    ],
  },
  features: {
    items: [
      { icon: ShoppingBag, titleKey: "feat1_title", descKey: "feat1_desc" },
      { icon: Calendar, titleKey: "feat2_title", descKey: "feat2_desc" },
      { icon: Users, titleKey: "feat3_title", descKey: "feat3_desc" },
      { icon: BarChart3, titleKey: "feat4_title", descKey: "feat4_desc" },
      { icon: MessageSquare, titleKey: "feat5_title", descKey: "feat5_desc" },
      { icon: Phone, titleKey: "feat6_title", descKey: "feat6_desc" },
      { icon: Brain, titleKey: "feat7_title", descKey: "feat7_desc" },
    ],
  },
  testimonials: {
    items: [
      { nameKey: "testi1_name", storeKey: "testi1_store", textKey: "testi1_text" },
      { nameKey: "testi2_name", storeKey: "testi2_store", textKey: "testi2_text" },
      { nameKey: "testi3_name", storeKey: "testi3_store", textKey: "testi3_text" },
    ],
  },
  footer: {
    links: ["footer_terms", "footer_privacy", "footer_contact"],
  },
}

// ═══════════════════════════════════════════════════════════
// 2. CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

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

function useLightboxKeyboard({ isOpen, onClose, onPrev, onNext, length }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onNext()
      if (e.key === "ArrowRight") onPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose, onPrev, onNext, length])
}

function useTheme() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = saved || (prefersDark ? "dark" : "light")
    setTheme(initial)
    if (initial === "dark") document.documentElement.classList.add("dark")
  }, [])

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  return { theme, toggleTheme: toggle }
}

function useAuth() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      setIsLoggedIn(!!token)
      if (token) {
        const stored = localStorage.getItem("user")
        if (stored) setUser(JSON.parse(stored))
      }
    }
    checkAuth()
    window.addEventListener("storage", checkAuth)
    return () => window.removeEventListener("storage", checkAuth)
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    setUser(null)
    router.push("/login")
  }

  const getInitials = (u) => {
    if (!u?.name) return "؟"
    const parts = u.name.trim().split(" ")
    return parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2)
  }

  return { isLoggedIn, user, logout, getInitials }
}

function useScrollDetection() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return scrolled
}

// ═══════════════════════════════════════════════════════════
// 3. UI COMPONENTS
// ═══════════════════════════════════════════════════════════

function Logo({ theme }) {
  return (
    <Link href="/" dir="ltr" className="flex items-center">
      <Image
        src={theme === "dark" ? "/logo/wakil-logo-dark.svg" : "/logo/wakil-logo-light.svg"}
        alt="wakil.ma"
        width={168}
        height={38}
        className="h-7 w-auto sm:h-8 md:h-9"
      />
    </Link>
  )
}

function SectionBadge({ icon: Icon, label, isDark = false }) {
  return (
    <div className={`inline-flex items-center gap-2 backdrop-blur-md rounded-full px-5 py-2.5 mb-6 shadow-sm
      ${isDark
        ? 'bg-white/10 border border-white/20'
        : 'bg-brand-200/70 border border-brand-200/50'}`}>
      <Icon size={15} className={isDark ? 'text-brand-300 shrink-0' : 'text-brand-600 shrink-0'} />
      <span className={`text-sm font-bold ${isDark ? 'text-white/90' : 'text-brand-700'}`}>{label}</span>
    </div>
  )
}

function AnimatedBadge({ text, visible, isDark = false }) {
  return (
    <div className={`transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className={`inline-flex items-center gap-2 backdrop-blur-md rounded-full px-4 py-2 mb-4 sm:mb-6 font-bold shadow-sm
        transition-all duration-300 cursor-default ${isDark
          ? 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30'
          : 'bg-brand-200/70 border border-brand-200/50 hover:bg-brand-200/80 hover:border-brand-200/60'}`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isDark ? 'bg-brand-400' : 'bg-brand-500'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isDark ? 'bg-brand-300' : 'bg-brand-600'}`} />
        </span>
        <Sparkles size={12} className={isDark ? 'text-brand-300' : 'text-brand-600'} />
        <span className={`text-xs font-bold ${isDark ? 'text-white/90' : 'text-brand-700'}`}>{text}</span>
      </div>
    </div>
  )
}

// ✅ Lightbox Component — كامل مع keyboard navigation
function Lightbox({ images, currentIndex, onClose, onPrev, onNext, onGoTo }) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useLightboxKeyboard({
    isOpen: currentIndex !== null,
    onClose,
    onPrev,
    onNext,
    length: images.length,
  })

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <div className="relative w-full max-w-[200px]" onClick={(e) => e.stopPropagation()}>
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 w-10 h-10 rounded-full bg-white text-gray-800
            font-bold text-base flex items-center justify-center shadow-xl
            hover:scale-110 active:scale-95 transition-transform duration-200"
          aria-label="close"
        >
          <X size={16} />
        </button>

        {/* الصورة */}
        <div className="rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl transition-all duration-300">
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            width={200}
            height={350}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        {/* أزرار التنقل */}
        <div className="flex items-center justify-center gap-5 mt-5">
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15
              hover:bg-white/30 text-white transition-all duration-200 hover:scale-110
              active:scale-95 border border-white/20"
            aria-label="previous"
          >
            <ChevronRight size={18} />
          </button>

          {/* نقاط التنقل */}
          <div className="flex items-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                className={`rounded-full transition-all duration-300
                  ${i === currentIndex ? "w-6 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"}`}
                aria-label={`image ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15
              hover:bg-white/30 text-white transition-all duration-200 hover:scale-110
              active:scale-95 border border-white/20"
            aria-label="next"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* عداد الصور */}
        <p className="text-center text-white/50 text-xs mt-3 font-medium tracking-widest">
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  )
}

function UserAvatar({ user, getInitials }) {
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center
      text-[11px] font-bold text-white shadow-sm shrink-0">
      {getInitials(user)}
    </div>
  )
}

function NavLink({ href, label, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-[15px] font-medium text-muted-foreground hover:text-brand-600
        transition-colors relative group py-1"
    >
      {label}
      <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-brand-600 rounded-full
        group-hover:w-full transition-all duration-300" />
    </a>
  )
}

function IconButton({ onClick, icon: Icon, label, className = "" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 rounded-lg border border-border hover:bg-secondary
        transition-all hover:scale-105 active:scale-95 text-foreground ${className}`}
    >
      <Icon size={14} className="sm:w-4 sm:h-4" />
    </button>
  )
}

function LanguageToggle({ language, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-all
        hover:scale-105 active:scale-95 text-xs font-bold text-brand-600 min-w-[32px]"
    >
      {language === "ar" ? "FR" : "عر"}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// 4. SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function Header({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrolled = useScrollDetection()
  const { isLoggedIn, user, logout, getInitials } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const navLinks = CONTENT.nav.links.map((link) => ({
    href: link.href,
    label: t(`land.${link.key}`),
  }))

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300
      ${scrolled
        ? "bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm shadow-black/5"
        : "bg-card/60 backdrop-blur-md border-b border-border/30"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <Logo theme={theme} />

        <nav className="hidden md:flex items-center gap-5 lg:gap-6">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <IconButton onClick={toggleTheme} icon={theme === "light" ? Moon : Sun} label="toggle theme" />
          <LanguageToggle language={language} onToggle={() => setLanguage(language === "ar" ? "fr" : "ar")} />

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 ml-1">
                <UserAvatar user={user} getInitials={getInitials} />
                <span className="hidden md:block text-[12px] font-medium text-muted-foreground truncate max-w-[70px]">
                  {user?.name || "User"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title={language === "ar" ? "تسجيل الخروج" : "Déconnexion"}
                className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent
                  hover:border-red-500/20 text-muted-foreground hover:text-red-500 transition-all duration-200"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-muted-foreground
                hover:text-foreground transition-colors px-2 sm:px-3 py-1.5">
                {t("land.login")}
              </Link>
              <Link href="/register" className="text-sm font-bold bg-brand-600 text-white px-3 sm:px-4
                py-1.5 sm:py-2 rounded-xl hover:bg-brand-700 transition-all hover:shadow-md
                hover:shadow-brand-600/30 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap">
                {t("land.free_trial")}
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="menu"
            className="md:hidden p-1.5 rounded-lg border border-border hover:bg-secondary transition-all text-foreground"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300
        ${mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-border bg-card/90 backdrop-blur-xl px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                text-muted-foreground hover:text-brand-600 hover:bg-secondary transition-colors"
            >
              {label}
            </a>
          ))}
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                  text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-600/10 transition-colors gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center
                  text-[10px] font-bold text-white shrink-0">
                  {getInitials(user)}
                </div>
                {language === "ar" ? "لوحة التحكم" : "Dashboard"}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium
                  text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors gap-2"
              >
                <LogOut size={16} />
                {language === "ar" ? "تسجيل الخروج" : "Déconnexion"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                  text-muted-foreground hover:text-brand-600 hover:bg-secondary transition-colors"
              >
                {t("land.login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium
                  text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-600/10 transition-colors"
              >
                {t("land.free_trial")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function HeroSection({ theme }) {
  const { ref, visible } = useReveal(0.05)
  const { t, language } = useLanguage()
  const isRTL = language === "ar"
  const isDark = theme === "dark"

  return (
    <section ref={ref} className="relative overflow-hidden">

      {/* ── Mobile layout ─────────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-[100svh] sm:hidden px-5 py-20 text-center">
        <AnimatedBadge text={t("land.hero_badge")} visible={visible} isDark={isDark} />

        <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className={`text-[1.75rem] leading-[1.2] font-extrabold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.hero_title1")}
            <br />
            <span className={`relative inline-block ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
              {t("land.hero_title2")}
              <svg className="absolute -bottom-1 right-0 w-full overflow-visible" viewBox="0 0 300 8" preserveAspectRatio="none" fill="none">
                <path d="M0 6 Q37.5 1 75 5 Q112.5 9 150 5 Q187.5 1 225 5 Q262.5 9 300 5"
                  stroke={isDark ? "#AFA9EC" : "#534AB7"} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>
        </div>

        <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className={`text-sm mb-5 leading-relaxed max-w-[280px] mx-auto ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
            {t("land.hero_sub")}
          </p>
        </div>

        <div className={`flex flex-col w-full gap-2.5 max-w-[280px] mx-auto
          transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link href="/register"
            className="flex items-center justify-center gap-2 bg-brand-600 text-white
              px-5 py-3 rounded-xl font-bold text-sm active:scale-95 group w-full">
            {t("land.cta_start")}
            <ArrowLeft size={14} />
          </Link>
          <a href="#ai-agent"
            className={`flex items-center justify-center gap-2 text-sm font-semibold
              px-5 py-3 rounded-xl border backdrop-blur-sm w-full
              ${isDark ? 'text-white/90 border-white/30 bg-white/10' : 'text-brand-700 border-brand-200/60 bg-white/60'}`}>
            {t("land.cta_how")}
            <ChevronDown size={14} />
          </a>
        </div>

        <div className={`flex items-center justify-center gap-5 mt-7
          transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {CONTENT.hero.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-xl font-extrabold ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{stat.value}</div>
              <div className={`text-[10px] font-medium leading-tight mt-0.5 ${isDark ? 'text-white/65' : 'text-slate-500'}`}>
                {t(`land.${stat.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop / tablet layout ───────────────── */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-6 flex-col items-center justify-center min-h-[600px] py-16 md:py-24 text-center">
        <AnimatedBadge text={t("land.hero_badge")} visible={visible} isDark={isDark} />

        <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className={`text-4xl md:text-5xl font-extrabold mb-5 leading-[1.1] md:leading-[1.15] tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.hero_title1")}
            <br />
            <span className={`relative inline-block ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
              {t("land.hero_title2")}
              <svg className="absolute -bottom-1 right-0 w-full overflow-visible" viewBox="0 0 300 8" preserveAspectRatio="none" fill="none">
                <path d="M0 6 Q37.5 1 75 5 Q112.5 9 150 5 Q187.5 1 225 5 Q262.5 9 300 5"
                  stroke={isDark ? "#AFA9EC" : "#534AB7"} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>
        </div>

        <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className={`text-lg mb-6 leading-relaxed max-w-md mx-auto ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            {t("land.hero_sub")}
          </p>
        </div>

        <div className={`flex sm:flex-row items-center justify-center gap-4
          transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Link href="/register" className="flex items-center justify-center gap-2
            bg-brand-600 text-white px-7 py-3 rounded-xl font-bold text-sm
            hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-600/30
            hover:-translate-y-0.5 active:scale-95 group">
            {t("land.cta_start")}
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
          </Link>
          <a href="#ai-agent" className={`flex items-center justify-center gap-2
            text-sm font-semibold transition-all px-7 py-3 rounded-xl border backdrop-blur-sm hover:shadow-md group
            ${isDark
              ? 'text-white/90 hover:text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20'
              : 'text-brand-700 hover:text-brand-800 border-brand-200/50 hover:border-brand-300 bg-white/60 hover:bg-white/80'}`}>
            {t("land.cta_how")}
            <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform duration-300" />
          </a>
        </div>

        <div className={`flex items-center justify-center gap-8 mt-7
          transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {CONTENT.hero.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-3xl font-extrabold ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{stat.value}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-slate-500'}`}>{t(`land.${stat.key}`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AgentSection({ theme }) {
  const { ref, visible } = useReveal()
  const { t, language } = useLanguage()
  const isRTL = language === "ar"
  const isDark = theme === "dark"

  const cards = [
    { icon: Bot, title: t("land.card1_title"), desc: t("land.card1_desc") },
    { icon: Target, title: t("land.card2_title"), desc: t("land.card2_desc") },
    { icon: TrendingUp, title: t("land.card3_title"), desc: t("land.card3_desc") },
    { icon: Clock, title: t("land.card4_title"), desc: t("land.card4_desc") },
  ]

  const steps = [
    { step: "1", title: t("land.step1_title"), desc: t("land.step1_desc"), icon: MessageCircle },
    { step: "2", title: t("land.step2_title"), desc: t("land.step2_desc"), icon: UserPlus },
    { step: "3", title: t("land.step3_title"), desc: t("land.step3_desc"), icon: Upload },
    { step: "4", title: t("land.step4_title"), desc: t("land.step4_desc"), icon: Link2 },
    { step: "5", title: t("land.step5_title"), desc: t("land.step5_desc"), icon: Settings },
    { step: "6", title: t("land.step6_title"), desc: t("land.step6_desc"), icon: Rocket },
  ]

  return (
    <section id="ai-agent" ref={ref} className="py-10 sm:py-16 md:py-28 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header + Cards */}
        <div className="flex flex-col gap-6 sm:gap-10 lg:gap-12 mb-8 sm:mb-14 md:mb-20" dir={isRTL ? "rtl" : "ltr"}>

          {/* Title & Description */}
          <div className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <SectionBadge icon={Brain} label={t("land.agent_badge")} isDark={isDark} />
            <h2 className={`text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-5 tracking-tight leading-tight max-w-2xl mx-auto ${isDark ? 'text-white' : 'text-brand-900'}`}>
              {t("land.agent_title")}
            </h2>
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
              {t("land.agent_sub")}
            </p>
            <div className="hidden lg:flex items-center justify-center gap-3 mt-8">
              <div className={`w-12 h-1 rounded-full ${isDark ? 'bg-brand-500' : 'bg-brand-600'}`} />
              <div className={`w-6 h-1 rounded-full ${isDark ? 'bg-brand-400' : 'bg-brand-400'}`} />
              <div className={`w-3 h-1 rounded-full ${isDark ? 'bg-brand-300' : 'bg-brand-300'}`} />
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`backdrop-blur-md rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-500 hover:-translate-y-1 group flex flex-col
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                  ${isDark
                    ? 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:shadow-white/10'
                    : 'bg-white/70 border border-brand-200/50 hover:bg-white/80 hover:border-brand-300/50 hover:shadow-xl hover:shadow-brand-600/10'}`}
                style={{ transitionDelay: visible ? `${200 + i * 100}ms` : "0ms" }}
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0 sm:block">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0
                    sm:mb-4 transition duration-300
                    ${isDark
                      ? 'bg-white/10 border border-white/20 group-hover:bg-white/15 group-hover:border-white/30'
                      : 'bg-brand-100/70 border border-brand-200/50 group-hover:bg-brand-100 group-hover:border-brand-300/50'}`}>
                    <card.icon size={20} className={isDark ? 'text-brand-300' : 'text-brand-600'} />
                  </div>
                  <h3 className={`sm:hidden font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-brand-800'}`}>
                    {card.title}
                  </h3>
                </div>
                <h3 className={`hidden sm:block font-bold mb-2 sm:mb-3 text-base md:text-lg leading-snug ${isDark ? 'text-white' : 'text-brand-800'}`}>
                  {card.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Timeline */}
        <div
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: visible ? "600ms" : "0ms" }}
        >
          <h3 className={`font-extrabold mb-5 sm:mb-8 text-base sm:text-xl text-center tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.journey_title")}
          </h3>

          {/* Desktop: Horizontal timeline */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-6 gap-4 relative items-start">
              {steps.map((item, i) => (
                <div key={i} className="text-center group relative">
                  <div className={`w-14 h-14 rounded-full backdrop-blur-md border-2 mx-auto mb-3 flex items-center justify-center transition-all duration-300 relative z-10
                    ${isDark
                      ? 'bg-brand-600/20 border-brand-500/50 shadow-lg shadow-brand-600/20 group-hover:bg-brand-600/30 group-hover:border-brand-500/70'
                      : 'bg-brand-100/70 border-brand-300/50 shadow-lg shadow-brand-600/10 group-hover:bg-brand-100 group-hover:border-brand-400/50'}`}>
                    <span className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-brand-600'}`}>
                      {item.step}
                    </span>
                  </div>
                  <h4 className={`font-bold text-sm mb-1 transition-colors ${isDark ? 'text-white group-hover:text-brand-300' : 'text-brand-800 group-hover:text-brand-600'}`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs leading-relaxed px-1 ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
                    {item.desc}
                  </p>
                  {i < steps.length - 1 && (
                    <div className={`absolute top-7 ${isRTL ? 'right-full left-auto -translate-x-1/2' : 'left-full -translate-x-1/2'} w-full flex items-center justify-center`}>
                      <svg className="w-10 h-6 text-brand-600/30" viewBox="0 0 40 24" fill="none">
                        <defs>
                          <linearGradient id={`arrowGrad${i}`} x1={isRTL ? "100%" : "0%"} y1="0%" x2={isRTL ? "0%" : "100%"} y2="0%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        <path
                          d={isRTL
                            ? "M32 12c-4 4-8 6-12 6s-8-2-12-6c4-4 8-6 12-6s8 2 12 6z M12 18L8 14 M12 18l-4 4"
                            : "M8 12c4-4 8-6 12-6s8 2 12 6c-4 4-8 6-12 6s-8-2-12-6z M28 18l4-4 M28 18l4 4"}
                          stroke={`url(#arrowGrad${i})`}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="3 2"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="md:hidden space-y-2">
            {steps.map((item, i) => (
              <div key={i}>
                <div className={`flex items-start gap-3 backdrop-blur-md rounded-xl p-3.5 sm:p-4 transition-all shadow-sm
                  ${isDark
                    ? 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30'
                    : 'bg-white/70 border border-brand-200/50 hover:bg-white/80 hover:border-brand-300/50'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${isDark
                      ? 'bg-brand-600/20 border border-brand-500/40 shadow-brand-600/20'
                      : 'bg-brand-100/70 border border-brand-300/50 shadow-brand-600/10'}`}>
                    <span className={`text-base font-extrabold ${isDark ? 'text-brand-300' : 'text-brand-600'}`}>
                      {item.step}
                    </span>
                  </div>
                  <div className={`flex-1 pt-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h4 className={`font-bold text-sm leading-snug mb-0.5 ${isDark ? 'text-white' : 'text-brand-800'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className={`w-0.5 h-4 rounded-full ${isDark ? 'bg-brand-500/30' : 'bg-brand-300/40'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ theme }) {
  const { ref, visible } = useReveal()
  const { t, language } = useLanguage()
  const isDark = theme === "dark"

  const features = CONTENT.features.items.map((feature) => ({
    ...feature,
    title: t(`land.${feature.titleKey}`),
    desc: t(`land.${feature.descKey}`),
  }))

  return (
    <section id="features" className="py-10 sm:py-16 md:py-28 relative overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-8 sm:mb-14 transition-all duration-700
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={Zap} label={t("land.feat_badge")} isDark={isDark} />
          <h2 className={`text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-5 tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.feat_title")}
          </h2>
          <p className={`text-sm sm:text-base leading-loose ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            {t("land.feat_sub")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7 transition-all duration-500 hover:-translate-y-1.5 group relative overflow-hidden
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                ${isDark
                  ? 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:shadow-2xl hover:shadow-white/10'
                  : 'bg-white/70 border border-brand-200/50 hover:bg-white/80 hover:border-brand-300/50 hover:shadow-2xl hover:shadow-brand-600/10'}`}
              style={{ transitionDelay: visible ? `${150 + i * 80}ms` : "0ms" }}
            >
              <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full transition-all duration-500 blur-xl
                ${isDark ? 'bg-white/0 group-hover:bg-white/10' : 'bg-brand-100/0 group-hover:bg-brand-100/50'}`} />

              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 relative transition-all duration-300
                ${isDark
                  ? 'bg-white/10 border border-white/20 group-hover:border-white/30'
                  : 'bg-brand-100/70 border border-brand-200/50 group-hover:border-brand-300/50'}`}>
                <feature.icon
                  size={20}
                  className={`group-hover:scale-110 transition-transform duration-300 ${isDark ? 'text-brand-300' : 'text-brand-600'}`}
                />
              </div>

              <h3 className={`font-bold mb-1 sm:mb-2 text-xs sm:text-base lg:text-lg transition-colors duration-300
                ${isDark ? 'text-white group-hover:text-brand-300' : 'text-brand-800 group-hover:text-brand-600'}`}>
                {feature.title}
              </h3>
              <p className={`text-[11px] sm:text-sm leading-relaxed relative ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {feature.desc}
              </p>

              <div className={`mt-5 h-0.5 w-0 rounded-full group-hover:w-full transition-all duration-500
                ${isDark ? 'bg-white/30' : 'bg-brand-300/50'}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════
// ✅ Screenshots Section — مع Lightbox كامل
// ═══════════════════════════════════════════════════════════
function ScreenshotsSection({ theme }) {
  const { ref, visible } = useReveal()
  const { t, language } = useLanguage()
  const isRTL = language === "ar"
  const isDark = theme === "dark"

  // ✅ State للـ Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const screenshots = [
    { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.10.jpeg", alt: "AI conversation 1" },
    { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.10 (1).jpeg", alt: "AI conversation 2" },
    { src: "/imgs/WhatsApp Image 2026-04-01 at 12.09.11.jpeg", alt: "AI conversation 3" },
  ]

  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % screenshots.length)

  return (
    <section id="screenshots" className="py-10 sm:py-16 md:py-28 relative overflow-hidden">

      {/* ✅ Lightbox Modal */}
      {lightboxIndex !== null && (
        <Lightbox
          images={screenshots}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          onGoTo={(i) => setLightboxIndex(i)}
        />
      )}

      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-8 sm:mb-14 transition-all duration-700
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={Smartphone} label={language === "ar" ? "حوارات حقيقية" : "Conversations réelles"} isDark={isDark} />
          <h2 className={`text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-5 tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {language === "ar" ? "شوف كيفاش الوكيل كيتعامل مع الزبناء" : "Voir comment l'agent interagit avec les clients"}
          </h2>
          <p className={`text-sm sm:text-base leading-loose max-w-2xl mx-auto ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            {language === "ar"
              ? "حوارات واتساب حقيقية — الوكيل الذكي كيجاوب، كيعرض المنتجات، وكيسد المبيعات تلقائياً"
              : "Vraies conversations WhatsApp — l'agent IA répond, présente les produits et conclut les ventes automatiquement"}
          </p>
        </div>

        {/* Rose/Fan layout */}
        <div className="relative h-[400px] sm:h-[450px] flex items-end justify-center">
          {screenshots.map((img, i) => {
            const rotation = (i - 1) * 15
            const translateY = Math.abs(i - 1) * -20
            const translateX = (i - 1) * 60
            const zIndex = i === 1 ? 30 : 20 - Math.abs(i - 1) * 5

            return (
              <div
                key={i}
                className={`absolute bottom-0 transition-all duration-700 ease-out group
                  ${visible ? "opacity-100" : "opacity-0"}`}
                style={{
                  transitionDelay: visible ? `${200 + i * 200}ms` : "0ms",
                  transform: visible
                    ? `rotate(${rotation}deg) translateX(${translateX}px) translateY(${translateY}px)`
                    : `rotate(0deg) translateX(${(i - 1) * 20}px) translateY(50px)`,
                  zIndex,
                }}
              >
                {/* ✅ Phone frame — قابل للضغط لفتح Lightbox */}
                <div
                  onClick={() => setLightboxIndex(i)}
                  className={`relative p-2 sm:p-3 cursor-pointer select-none
                    ${isDark ? 'bg-black/60' : 'bg-slate-100/90'}
                    rounded-2xl sm:rounded-3xl shadow-2xl
                    transition-all duration-300
                    group-hover:scale-110 group-hover:-translate-y-4`}
                >
                  <div className={`rounded-xl sm:rounded-2xl overflow-hidden border-2 w-[180px] sm:w-[220px]
                    ${isDark ? 'border-white/20' : 'border-slate-300'}`}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={220}
                      height={440}
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* WhatsApp badge */}
                  <div className={`absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold shadow-lg
                    ${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}>
                    <MessageCircle size={10} />
                    WhatsApp
                  </div>

                  {/* ✅ Zoom overlay يظهر عند hover */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${isDark ? 'bg-black/30' : 'bg-black/20'}`}>
                    <div className="bg-white/90 rounded-full p-2.5 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </div>

                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full blur-sm
                    ${isDark ? 'bg-white/30' : 'bg-black/20'}`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust indicators */}
        <div className={`mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 transition-all duration-700 delay-500
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { icon: Bot, text: language === "ar" ? "رد فوري 24/7" : "Réponse instantanée 24/7" },
            { icon: MessageCircle, text: language === "ar" ? "دارija طبيعية" : "Darija naturelle" },
            { icon: Sparkles, text: language === "ar" ? "ذكاء اصطناعي متقدم" : "IA avancée" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm font-medium
              ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
              <item.icon size={18} className={isDark ? 'text-brand-300' : 'text-brand-600'} />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection({ theme }) {
  const { ref, visible } = useReveal()
  const { t, language } = useLanguage()
  const isRTL = language === "ar"
  const isDark = theme === "dark"
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    { q: t("land.faq1_q"), a: t("land.faq1_a") },
    { q: t("land.faq2_q"), a: t("land.faq2_a") },
    { q: t("land.faq3_q"), a: t("land.faq3_a") },
    { q: t("land.faq4_q"), a: t("land.faq4_a") },
    { q: t("land.faq5_q"), a: t("land.faq5_a") },
  ]

  return (
    <section id="faq" className="py-10 sm:py-16 md:py-28 relative overflow-hidden">
      <div ref={ref} className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-8 sm:mb-14 transition-all duration-700
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionBadge icon={MessageCircle} label={t("land.faq_badge")} isDark={isDark} />
          <h2 className={`text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-5 tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.faq_title")}
          </h2>
          <p className={`text-sm sm:text-base leading-loose ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            {t("land.faq_sub")}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-500
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                ${isDark
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/70 border border-brand-200/50'}`}
              style={{ transitionDelay: visible ? `${200 + i * 100}ms` : "0ms" }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6 transition-colors
                  ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}
                  ${isDark ? 'hover:bg-white/15' : 'hover:bg-white/80'}`}
              >
                <span className={`font-bold text-sm sm:text-base lg:text-lg leading-relaxed ${isDark ? 'text-white' : 'text-brand-800'}`}>
                  {faq.q}
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300
                  ${openIndex === i ? "rotate-180" : ""}
                  ${isDark ? 'bg-white/10' : 'bg-brand-100/70'}`}>
                  <ChevronDown size={14} className={`sm:w-4 sm:h-4 ${isDark ? 'text-brand-300' : 'text-brand-600'}`} />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-[500px]" : "max-h-0"}`}>
                <div className={`px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 text-sm sm:text-base leading-relaxed border-t pt-3 sm:pt-4
                  ${isDark ? 'text-white/80 border-white/20' : 'text-slate-600 border-brand-200/30'}`}>
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection({ theme }) {
  const { ref, visible } = useReveal()
  const { t } = useLanguage()
  const isDark = theme === "dark"

  return (
    <section ref={ref} className="py-10 sm:py-16 md:py-28 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className={`inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm
            ${isDark
              ? 'bg-white/10 border border-white/20'
              : 'bg-brand-200/70 border border-brand-200/50'}`}>
            <Zap size={13} className={isDark ? 'text-brand-300 shrink-0' : 'text-brand-600 shrink-0'} />
            <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white/90' : 'text-brand-700'}`}>{t("land.cta_badge")}</span>
          </div>
        </div>

        <div className={`transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className={`text-2xl sm:text-4xl md:text-6xl font-extrabold mb-4 sm:mb-7 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-brand-900'}`}>
            {t("land.cta_title1")}
            <br />
            {t("land.cta_title2")}
          </h2>
        </div>

        <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className={`text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed ${isDark ? 'text-white/80' : 'text-slate-600'}`}>
            {t("land.cta_sub")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5
                bg-brand-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold text-sm sm:text-base
                hover:bg-brand-700 transition-all hover:shadow-2xl hover:shadow-brand-600/30
                hover:-translate-y-1.5 active:scale-95 group"
            >
              {t("land.cta_btn")}
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl backdrop-blur-sm
                ${isDark
                  ? 'text-white/80 hover:text-white border border-white/25 hover:border-white/50 hover:bg-white/10'
                  : 'text-brand-700 hover:text-brand-800 border border-brand-200/50 hover:border-brand-300 hover:bg-white/80 bg-white/60'}`}
            >
              {t("land.cta_login")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer({ theme }) {
  const { t, language } = useLanguage()
  const isDark = theme === "dark"
  const isRTL = language === "ar"

  const logoSrc = isDark
    ? "/logo/wakil-logo-dark.svg"
    : "/logo/wakil-logo-light.svg"

  const footerLinks = {
    product: [
      { key: "nav_features", href: "#features" },
      { key: "nav_agent", href: "#ai-agent" },
      { key: "nav_faq", href: "#faq" },
    ],
    support: [
      { key: "footer_terms", href: "/terms" },
      { key: "footer_privacy", href: "/privacy" },
      { key: "footer_contact", href: "mailto:contact@wakil.ma" },
    ],
  }

  const socialLinks = [
    { icon: MessageCircle, href: "https://wa.me/212600000000", label: "WhatsApp" },
    { icon: Mail, href: "mailto:contact@wakil.ma", label: "Email" },
  ]

  return (
    <footer className={`border-t backdrop-blur-md transition-colors duration-300
      ${isDark
        ? 'border-white/10 bg-black/40'
        : 'border-brand-200/50 bg-white/50'}`}>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 ${isRTL ? 'text-right' : 'text-left'}`}>

          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Link href="/" dir="ltr" className="flex items-center">
                <Image
                  src={logoSrc}
                  alt="wakil.ma"
                  width={168}
                  height={38}
                  className="h-7 w-auto sm:h-8 md:h-9"
                />
              </Link>
            </div>
            <p className={`text-sm leading-relaxed mb-6 max-w-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
              {language === "ar"
                ? "وكيل المبيعات الذكي على واتساب — أتمتة المحادثات، زيادة المبيعات، وتجربة عملاء متميزة للمتاجر المغربية."
                : "Agent de vente intelligent sur WhatsApp — automatisez vos conversations, augmentez vos ventes et offrez une expérience client exceptionnelle."
              }
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${isDark
                      ? 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30'
                      : 'bg-brand-100/70 border border-brand-200/50 text-brand-600 hover:text-brand-700 hover:border-brand-300/50 hover:bg-brand-100'}`}
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className={`font-bold mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-white/80' : 'text-brand-800'}`}>
              {language === "ar" ? "المنتج" : "Produit"}
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className={`text-sm transition-colors duration-200
                      ${isDark ? 'text-white/50 hover:text-brand-300' : 'text-slate-600 hover:text-brand-600'}`}
                  >
                    {t(`land.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`font-bold mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-white/80' : 'text-brand-800'}`}>
              {language === "ar" ? "الدعم" : "Support"}
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className={`text-sm transition-colors duration-200
                      ${isDark ? 'text-white/50 hover:text-brand-300' : 'text-slate-600 hover:text-brand-600'}`}
                  >
                    {t(`land.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-brand-200/30 bg-brand-50/50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className={`text-xs text-center sm:text-left ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              2025 wakil.ma — {t("land.footer_copy")}
            </p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                ${isDark ? 'bg-white/10 border border-white/20' : 'bg-brand-100/70 border border-brand-200/50'}`}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-brand-700'}`}>
                  {language === "ar" ? "النظام يعمل" : "Système opérationnel"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════
// 5. PAGE
// ═══════════════════════════════════════════════════════════

export default function LandingPage() {
  const { dir } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="min-h-screen relative" dir={dir}>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping { animation: ping 1.5s cubic-bezier(0,0,.2,1) infinite; }
      `}</style>

      {/* خلفية الصفحة */}
      <div
        className="fixed inset-0 -z-20 transition-all duration-700"
        style={{
          backgroundImage: isDark
            ? "url('/img_hero_bg/img_home_page_darck_bg.jpg')"
            : "url('/img_hero_bg/img_hero_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className={`fixed inset-0 -z-10 transition-all duration-700
        ${isDark ? 'bg-black/50' : 'bg-white/45'}`}
      />

      <Header theme={theme} toggleTheme={toggleTheme} />
      <HeroSection theme={theme} />
      <ScreenshotsSection theme={theme} />
      <AgentSection theme={theme} />
      <FeaturesSection theme={theme} />
      <FAQSection theme={theme} />
      <CTASection theme={theme} />
      <Footer theme={theme} />
    </div>
  )
}