"use client"

import { useState, useEffect } from "react"
import { useAgentStore } from "@/store/agentStore"
import { productsAPI, servicesAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Loader2, Package, Clock, Store, Eye, EyeOff, Sparkles, Zap, Heart, Crown, Flame, Wrench } from "lucide-react"
import {
  Bot, Save, Plus, Trash2, MessageCircle,
  Settings, Shield, Bell, Phone,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// ANIMATED REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Field({ label, hint, icon: Icon, children, delay = 0 }) {
  return (
    <div 
      className="flex flex-col gap-1.5 animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
          {Icon && (
            <span className="p-0.5 rounded bg-brand-600/10">
              <Icon size={11} className="text-brand-600" />
            </span>
          )}
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed flex items-center gap-1">
          <Sparkles size={8} className="text-brand-600/40" />
          {hint}
        </p>
      )}
    </div>
  )
}

function Section({ title, children, className = "", delay = 0 }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className={cn(
        "group relative bg-card border border-border rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-brand-600/10 hover:border-brand-600/30",
        "animate-slideUp",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <div className="relative px-5 py-4 border-b border-border/50 bg-secondary/50">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-600" />
            <p className="text-xs font-bold text-foreground/80 tracking-wide">{title}</p>
          </div>
        </div>
      )}
      <div className="relative p-5">{children}</div>
    </div>
  )
}

function Toggle({ on, onToggle, label, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 group">
      {(label || sub) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-xs font-semibold text-foreground">{label}</p>}
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
        </div>
      )}
      <button
        onClick={onToggle}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full transition-all duration-300 ease-spring",
          on 
            ? "bg-brand-600 shadow-lg shadow-brand-600/30" 
            : "bg-border hover:bg-border/80"
        )}
      >
        <span className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ease-spring",
          on ? "right-1 translate-x-0" : "right-6 translate-x-0"
        )}>
          {on && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Zap size={8} className="text-brand-600 fill-brand-600" />
            </span>
          )}
        </span>
      </button>
    </div>
  )
}

function AnimatedButton({ children, onClick, disabled, variant = "primary", className = "" }) {
  const [isPressed, setIsPressed] = useState(false)
  
  const variants = {
    primary: "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40",
    secondary: "bg-secondary border border-border hover:border-brand-600/30 hover:bg-secondary/80",
    danger: "bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20",
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-semibold",
        "transition-all duration-200 ease-out",
        "active:scale-[0.98]",
        isPressed && "scale-[0.98]",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}

const inputCls = `
  w-full px-4 py-3 bg-secondary/50 border border-border/60 rounded-xl text-xs
  outline-none transition-all duration-300
  focus:border-brand-600/50 focus:bg-secondary focus:ring-4 focus:ring-brand-600/5
  hover:border-border/80
  placeholder:text-muted-foreground/40
`

const textareaCls = inputCls + " resize-none leading-relaxed min-h-[80px]"

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function isValidDomain(domain) {
  if (!domain) return false
  // Check if domain contains only valid characters (ASCII, no spaces, no Arabic)
  const validDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  return validDomainPattern.test(domain)
}

// ── Main Page ───────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("agent")
  const [previewMsg, setPreviewMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [newObjection, setNewObjection] = useState(null)
  const [editingReplies, setEditingReplies] = useState({})
  const [localAgent, setLocalAgent] = useState({})
  const [user, setUser] = useState(null)
  const [editingAccount, setEditingAccount] = useState(false)
  const [accountForm, setAccountForm] = useState({})
  const [accountLoading, setAccountLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    newOrder: true, dailyReport: true, highValueObjection: true,
    weeklyReport: false, agentDown: true,
  })
  const [workHoursEnabled, setWorkHoursEnabled] = useState(false)
  const [workStart, setWorkStart] = useState("09:00")
  const [workEnd, setWorkEnd] = useState("18:00")
  const [offlineMessage, setOfflineMessage] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [postSaleMessage, setPostSaleMessage] = useState("")
  const [whatsappForm, setWhatsappForm] = useState({ whatsappPhoneId: "", whatsappToken: "" })
  const [showToken, setShowToken] = useState(false)
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  const { agent, loading, fetchAgent, updateAgent, toggleActive,
    addObjectionReply, removeObjectionReply, updateObjectionReply } = useAgentStore()

  useEffect(() => { fetchAgent(); fetchProducts(); fetchServices(); fetchUser() }, [fetchAgent])

  async function fetchUser() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }, credentials: 'same-origin'
      })
      const data = await response.json()
      if (data.data) {
        setUser(data.data)
        setAccountForm({ storeName: data.data.storeName || "", name: data.data.name || "", email: data.data.email || "", phone: data.data.phone || "" })
      }
    } catch (err) { console.error(err) }
  }

  async function handleSaveAccount() {
    try {
      setAccountLoading(true)
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(accountForm)
      })
      const data = await response.json()
      if (data.data) { setUser(data.data); setEditingAccount(false) }
    } catch (err) { alert("خطأ في تحديث البيانات") } finally { setAccountLoading(false) }
  }

  useEffect(() => {
    if (agent) {
      setLocalAgent({
        name: agent.name || "",
        domain: agent.domain || "",
        style: agent.style || "friendly",
        language: agent.language || "darija",
        instructions: agent.instructions || "",
        selectedProductId: agent.selectedProductId || "",
        selectedServiceId: agent.selectedServiceId || "",
        mode: agent.mode || "product"
      })
      setWorkHoursEnabled(agent.workHoursEnabled || false)
      setWorkStart(agent.workStart || "09:00")
      setWorkEnd(agent.workEnd || "18:00")
      setOfflineMessage(agent.offlineMessage || "")
      setWelcomeMessage(agent.welcomeMessage || "")
      setPostSaleMessage(agent.postSaleMessage || "")
      setWhatsappForm({ whatsappPhoneId: agent.whatsappPhoneId || "", whatsappToken: agent.whatsappToken || "" })
    }
  }, [agent])

  async function handleSaveAgent() {
    try {
      setSaving(true)
      await updateAgent({ ...localAgent, workHoursEnabled, workStart, workEnd, offlineMessage, welcomeMessage, postSaleMessage })
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function fetchProducts() {
    try { const r = await productsAPI.getAll(); setProducts(r.data || []) } catch (err) { console.error(err) }
  }

  async function fetchServices() {
    try { const r = await servicesAPI.getAll(); setServices(r.data || []) } catch (err) { console.error(err) }
  }

  async function handleAddObjection() {
    if (!newObjection?.trigger?.trim() || !newObjection?.reply?.trim()) { alert("يرجى ملء الحقلين"); return }
    const success = await addObjectionReply({ trigger: newObjection.trigger.trim(), reply: newObjection.reply.trim() })
    if (success) setNewObjection(null)
  }

  const name = localAgent.name || ""
  const domain = localAgent.domain || ""
  const style = localAgent.style || "friendly"
  const language = localAgent.language || "darija"
  const mode = localAgent.mode || "product"
  const isActive = agent?.isActive || false
  const instructions = localAgent.instructions || ""
  const objectionReplies = agent?.objectionReplies || []

  if (loading) return (
    <div className="flex flex-col gap-5">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-secondary/60 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="w-24 h-5 bg-secondary/60 rounded animate-pulse" />
            <div className="w-32 h-3 bg-secondary/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-32 h-9 bg-secondary/60 rounded-2xl animate-pulse" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-1 p-1 bg-secondary/30 border border-border/30 rounded-2xl">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex-1 h-9 bg-secondary/60 rounded-xl animate-pulse" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <div className="bg-secondary/60 rounded-2xl h-80 animate-pulse" />
          <div className="bg-secondary/60 rounded-2xl h-48 animate-pulse" />
        </div>
        <div className="bg-secondary/60 rounded-2xl h-96 animate-pulse" />
      </div>
    </div>
  )

  const tabs = [
    { key: "agent",         label: "شخصية Agent",    icon: Bot },
    { key: "workhours",     label: "ساعات العمل",     icon: Clock },
    { key: "objections",    label: "ردود الاعتراض",   icon: MessageCircle },
    { key: "whatsapp",      label: "واتساب",           icon: Phone },
    { key: "notifications", label: "الإشعارات",        icon: Bell },
    { key: "account",       label: "الحساب",           icon: Settings },
  ]

  const styleOptions = [
    { key: "friendly", label: "ودود", icon: Heart },
    { key: "formal", label: "رسمي", icon: Crown },
    { key: "persuasive", label: "مقنع", icon: Flame },
  ]
  const langOptions = [
    { key: "darija",  label: "دارجة" },
    { key: "arabic",  label: "عربية" },
    { key: "french",  label: "فرنسية" },
  ]

  const isWAConnected = !!(whatsappForm.whatsappPhoneId && whatsappForm.whatsappToken)

  return (
    <div className="flex flex-col gap-3 sm:gap-5 pb-8">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-600/10 border border-brand-600/15 flex items-center justify-center shrink-0">
            <Settings size={16} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">الإعدادات</h1>
            <p className="text-[11px] text-muted-foreground">تخصيص Agent وإدارة الحساب</p>
          </div>
        </div>

        {/* Agent status pill */}
        <div className="flex items-center gap-2.5 bg-secondary/60 border border-border rounded-2xl px-3 py-2 shrink-0">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all",
            isActive ? "bg-green-500 shadow-sm shadow-green-500/60 animate-pulse" : "bg-border"
          )} />
          <span className="text-xs text-muted-foreground hidden sm:inline">Agent</span>
          <span className={cn("text-xs font-semibold", isActive ? "text-green-600" : "text-muted-foreground")}>
            {isActive ? "نشط" : "متوقف"}
          </span>
          <button
            onClick={toggleActive}
            className={cn(
              "relative w-9 h-5 rounded-full transition-all duration-300 mr-0.5",
              isActive ? "bg-brand-600 shadow-md shadow-brand-600/30" : "bg-border"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
              isActive ? "right-0.5" : "right-5"
            )} />
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-secondary/50 border border-border/60 rounded-2xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 whitespace-nowrap shrink-0 font-medium",
                active
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              <Icon size={12} className={active ? "text-brand-600" : ""} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden text-[11px]">{tab.label.split(" ")[0]}</span>
            </button>
          )
        })}
      </div>

      {/* ════ Tab: شخصية Agent ════════════════════════ */}
      {activeTab === "agent" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="flex flex-col gap-3">
            <Section title="معلومات Agent">
              <div className="flex flex-col gap-4">
                <Field label="اسم Agent">
                  <input type="text" value={name}
                    onChange={(e) => setLocalAgent({ ...localAgent, name: e.target.value })}
                    placeholder="مثال: ليلى" className={inputCls} />
                </Field>

                <Field label="مجال النشاط">
                  <select value={domain}
                    onChange={(e) => setLocalAgent({ ...localAgent, domain: e.target.value })}
                    className={inputCls}>
                    {["ملابس وأزياء","إلكترونيات","عطور ومستحضرات","مواد غذائية","مجوهرات وإكسسوار","أثاث ومنزل","آخر"].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field label="أسلوب الحديث" delay={200}>
                  <div className="grid grid-cols-3 gap-2">
                    {styleOptions.map((s, idx) => {
                      const StyleIcon = s.icon
                      return (
                        <button key={s.key}
                          onClick={() => setLocalAgent({ ...localAgent, style: s.key })}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                            "hover:scale-[1.02] hover:-translate-y-0.5",
                            style === s.key
                              ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25"
                              : "border-border bg-secondary/30 hover:border-brand-300/60 hover:shadow-md"
                          )}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <StyleIcon size={18} className={style === s.key ? "text-white" : "text-brand-600"} />
                          <span className="text-[11px] font-semibold">{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <Field label="لغة التواصل">
                  <div className="grid grid-cols-3 gap-2">
                    {langOptions.map((l) => (
                      <button key={l.key}
                        onClick={() => setLocalAgent({ ...localAgent, language: l.key })}
                        className={cn(
                          "py-2.5 rounded-xl text-xs border transition-all duration-200 font-medium",
                          language === l.key
                            ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25"
                            : "border-border text-muted-foreground hover:bg-secondary hover:border-brand-300/60"
                        )}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="وضع العمل" icon={Package}
                  hint="اختر ما إذا كان Agent يبيع منتجات أو يحجز خدمات">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLocalAgent({ ...localAgent, mode: "product" })}
                      className={cn(
                        "py-2.5 rounded-xl text-xs border transition-all duration-200 font-medium",
                        mode !== "service"
                          ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25"
                          : "border-border text-muted-foreground hover:bg-secondary hover:border-brand-300/60"
                      )}>
                      🛍️ منتجات
                    </button>
                    <button
                      onClick={() => setLocalAgent({ ...localAgent, mode: "service" })}
                      className={cn(
                        "py-2.5 rounded-xl text-xs border transition-all duration-200 font-medium",
                        mode === "service"
                          ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25"
                          : "border-border text-muted-foreground hover:bg-secondary hover:border-brand-300/60"
                      )}>
                      🔧 خدمات
                    </button>
                  </div>
                </Field>

                {mode === "service" ? (
                  <Field label="الخدمة التي يعمل عليها Agent" icon={Wrench}
                    hint="Agent غادي يركز على حجز هذه الخدمة ويرسل صورها للعملاء">
                    <select value={agent?.selectedServiceId || ""}
                      onChange={(e) => setLocalAgent({ ...localAgent, selectedServiceId: e.target.value || null })}
                      className={inputCls}>
                      <option value="">جميع الخدمات (تلقائي)</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} - {s.price} درهم ({s.duration}د)</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="المنتج الذي يعمل عليه Agent" icon={Package}
                    hint="Agent غادي يركز على بيع هذا المنتج ويرسل صوره للعملاء">
                    <select value={agent?.selectedProductId || ""}
                      onChange={(e) => setLocalAgent({ ...localAgent, selectedProductId: e.target.value || null })}
                      className={inputCls}>
                      <option value="">جميع المنتجات (تلقائي)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} - {p.price} درهم</option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field label="تعليمات خاصة">
                  <textarea value={instructions} rows={3}
                    onChange={(e) => setLocalAgent({ ...localAgent, instructions: e.target.value })}
                    placeholder="مثال: دائماً اذكر التوصيل المجاني..."
                    className={textareaCls} />
                </Field>
              </div>
            </Section>

            <Section title="الرسائل التلقائية">
              <div className="flex flex-col gap-4">
                <Field label="رسالة الترحيب الأولى" icon={MessageCircle}
                  hint="تُرسل تلقائياً عند أول تواصل من العميل">
                  <textarea value={welcomeMessage} rows={3}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="مرحباً بيك!  أنا ليلى، مساعدةك الشخصية..."
                    className={textareaCls} />
                </Field>

                <Field label="رسالة ما بعد البيع" icon={Store}
                  hint="تُرسل تلقائياً بعد تأكيد الطلب">
                  <textarea value={postSaleMessage} rows={3}
                    onChange={(e) => setPostSaleMessage(e.target.value)}
                    placeholder="شكراً على ثقتك!  الطلب ديالك في الطريق..."
                    className={textareaCls} />
                </Field>
              </div>
            </Section>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-3">
            <Section title="معاينة Agent">
              {/* بطاقة Agent */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-4 mb-4">
                <div className="relative flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center shrink-0">
                    <Bot size={21} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{name || "اسم Agent"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {domain || "المجال"} · {styleOptions.find(s => s.key === style)?.label} · {language === "darija" ? "دارجة" : language === "french" ? "فرنسية" : "عربية"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-600 font-semibold">نشط</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground font-medium">جرب كيف يرد Agent:</p>
                <input type="text" value={previewMsg}
                  onChange={(e) => setPreviewMsg(e.target.value)}
                  placeholder="اكتب سؤال زبون..." className={inputCls} />

                {previewMsg && (
                  <div className="rounded-2xl border border-border bg-secondary/20 p-3 flex flex-col gap-3">
                    {/* رسالة الزبون */}
                    <div className="flex flex-row-reverse gap-2 items-end">
                      <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] text-muted-foreground shrink-0">ز</div>
                      <div className="bg-border/50 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-foreground max-w-[80%]">
                        {previewMsg}
                      </div>
                    </div>
                    {/* رد Agent */}
                    <div className="flex gap-2 items-end">
                      <div className="w-6 h-6 rounded-full bg-brand-600/12 flex items-center justify-center text-[10px] text-brand-600 font-bold shrink-0">
                        {name?.charAt(0) || "A"}
                      </div>
                      <div className="bg-card border border-border rounded-2xl rounded-br-sm px-3 py-2 text-xs text-foreground leading-relaxed max-w-[80%] shadow-sm">
                        {language === "darija"
                          ? `السلام عليكم! أنا ${name || "Agent"} 🌸 واش عندنا ${previewMsg.includes("سعر") ? "أسعار مناسبة جداً" : "كل ما تحتاجه"}. كيف يمكنني مساعدتك؟`
                          : language === "french"
                          ? `Bonjour! Je suis ${name || "Agent"} 🌸 Comment puis-je vous aider?`
                          : `مرحباً! أنا ${name || "Agent"} 🌸 كيف يمكنني مساعدتك؟`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <button onClick={handleSaveAgent} disabled={saving}
              className="flex items-center gap-2 justify-center bg-brand-600 text-white px-5 py-3 rounded-xl text-xs font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-600/25">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      )}

      {/* ════ Tab: ساعات العمل ════════════════════════ */}
      {activeTab === "workhours" && (
        <div className="flex flex-col gap-3 max-w-lg">
          <Section title="ساعات العمل">
            <div className="flex flex-col gap-5">
              <Toggle on={workHoursEnabled} onToggle={() => setWorkHoursEnabled(!workHoursEnabled)}
                label="تفعيل ساعات العمل"
                sub="تعطيل الرد التلقائي خارج هذه الساعات" />

              {workHoursEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
                  <Field label="من">
                    <input type="time" value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="إلى">
                    <input type="time" value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}

              <Field label="رسالة خارج أوقات العمل" icon={MessageCircle}
                hint="تُرسل تلقائياً عندما يتواصل العميل خارج ساعات العمل">
                <textarea value={offlineMessage} rows={3}
                  onChange={(e) => setOfflineMessage(e.target.value)}
                  placeholder="مرحباً! نعمل من 9 صباحاً حتى 6 مساءً 😊"
                  className={textareaCls} />
              </Field>

              <button onClick={handleSaveAgent} disabled={saving}
                className="w-full flex items-center gap-2 justify-center bg-brand-600 text-white py-3 rounded-xl text-xs font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-brand-600/25">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </button>
            </div>
          </Section>
        </div>
      )}

      {/* ════ Tab: ردود الاعتراض ══════════════════════ */}
      {activeTab === "objections" && (
        <div className="flex flex-col gap-3">
          <Section title="ردود الاعتراض التلقائية">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Agent يستخدم هذه الردود تلقائياً عند اعتراض الزبون</p>
                <button onClick={() => setNewObjection({ trigger: "", reply: "" })} disabled={newObjection !== null}
                  className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:text-brand-700 disabled:opacity-40 transition-colors bg-brand-600/8 hover:bg-brand-600/15 px-3 py-1.5 rounded-xl">
                  <Plus size={12} /> إضافة رد
                </button>
              </div>

              {newObjection && (
                <div className="bg-brand-600/5 border border-brand-600/20 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-brand-600">رد جديد</span>
                    <button onClick={() => setNewObjection(null)}
                      className="w-6 h-6 rounded-lg bg-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Field label="عندما يقول الزبون:">
                      <input type="text" value={newObjection.trigger}
                        onChange={(e) => setNewObjection({ ...newObjection, trigger: e.target.value })}
                        placeholder='مثال: "غالي شوية"' className={inputCls} />
                    </Field>
                    <Field label="Agent يرد:">
                      <textarea value={newObjection.reply} rows={2}
                        onChange={(e) => setNewObjection({ ...newObjection, reply: e.target.value })}
                        placeholder="رد Agent التلقائي..." className={textareaCls} />
                    </Field>
                    <button onClick={handleAddObjection}
                      className="flex items-center gap-1.5 justify-center bg-brand-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-sm shadow-brand-600/20">
                      <Save size={12} /> حفظ الرد
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {objectionReplies.length === 0 && !newObjection && (
                  <div className="py-10 text-center border border-dashed border-border rounded-2xl">
                    <MessageCircle size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">لا توجد ردود بعد — أضف أول رد</p>
                  </div>
                )}
                {objectionReplies.map((item, index) => (
                  <div key={item.id} className="bg-secondary/40 border border-border rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-brand-600/10 flex items-center justify-center text-[10px] font-bold text-brand-600">{index + 1}</span>
                        <span className="text-xs font-medium text-foreground">رد تلقائي</span>
                      </div>
                      <button onClick={() => removeObjectionReply(item.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Field label="عند الزبون يقول:">
                        <input type="text" data-objection-id={item.id} data-field="trigger"
                          defaultValue={item.trigger} className={inputCls} />
                      </Field>
                      <Field label="Agent يرد:">
                        <textarea data-objection-id={item.id} data-field="reply"
                          defaultValue={item.reply} rows={2} className={textareaCls} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              {objectionReplies.length > 0 && (
                <button onClick={async () => {
                  const saves = objectionReplies.map((item) => {
                    const t = document.querySelector(`input[data-objection-id="${item.id}"][data-field="trigger"]`)
                    const r = document.querySelector(`textarea[data-objection-id="${item.id}"][data-field="reply"]`)
                    if (t && r) return updateObjectionReply(item.id, { trigger: t.value, reply: r.value })
                    return Promise.resolve()
                  })
                  await Promise.all(saves)
                  alert("✅ تم حفظ ردود الاعتراض!")
                }} className="w-full flex items-center gap-2 justify-center bg-brand-600 text-white py-3 rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-md shadow-brand-600/25">
                  <Save size={14} /> حفظ الردود
                </button>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ════ Tab: واتساب ════════════════════════════ */}
      {activeTab === "whatsapp" && (
        <div className="flex flex-col gap-3 max-w-lg">
          <Section title="ربط WhatsApp Business">
            <div className="flex flex-col gap-4">

              {/* حالة الاتصال */}
              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border transition-all",
                isWAConnected ? "bg-green-500/8 border-green-500/20" : "bg-secondary/50 border-border"
              )}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isWAConnected ? "bg-green-500/12 border border-green-500/20" : "bg-secondary border border-border")}>
                  <Phone size={14} className={isWAConnected ? "text-green-600" : "text-muted-foreground"} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">
                    {isWAConnected ? "متصل بـ WhatsApp ✓" : "غير متصل"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isWAConnected ? "Agent يستقبل الرسائل بنجاح" : "أدخل بيانات الربط أدناه"}
                  </p>
                </div>
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  isWAConnected ? "bg-green-500 animate-pulse shadow-sm shadow-green-500/60" : "bg-border")} />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                أدخل Phone ID و Access Token من Meta Developers لربط Agent بواتساب
              </p>

              {/* ════ دليل الإعدادات ════════════════════════ */}
              <div className="p-3.5 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                <p className="text-[11px] font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> من أين تحصل على الإعدادات؟
                </p>
                <div className="flex flex-col gap-2">
                  <a href="https://developers.facebook.com/apps/1869784147010749/whatsapp-business-api/setup" 
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>📱 الحصول على Phone ID من Meta</span>
                    <span className="text-[9px] opacity-60">(يفتح في نافذة جديدة)</span>
                  </a>
                  <a href="https://business.facebook.com/settings/system-users" 
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>🔑 إنشاء Access Token طويل الأمد</span>
                    <span className="text-[9px] opacity-60">(System User)</span>
                  </a>
                  <a href="https://developers.facebook.com/apps/1869784147010749/whatsapp-business-api/webhooks" 
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>⚙️ إعداد Webhook في Meta</span>
                    <span className="text-[9px] opacity-60">(الخطوة الأخيرة)</span>
                  </a>
                </div>
              </div>

              <Field label="معرف هاتف واتساب (Phone ID)">
                <input type="text" value={whatsappForm.whatsappPhoneId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappPhoneId: e.target.value })}
                  placeholder="مثال: 819683327841970" className={inputCls} />
              </Field>

              <Field label="رمز الوصول (Access Token)">
                <div className="relative">
                  <input type={showToken ? "text" : "password"}
                    value={whatsappForm.whatsappToken}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappToken: e.target.value })}
                    placeholder="EAASY1Mu..."
                    className={cn(inputCls, "pr-3 pl-10")} />
                  <button type="button" onClick={() => setShowToken(!showToken)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </Field>

              <Field label="رابط Webhook" hint="انسخه إلى لوحة Meta Developers">
                <div className="flex gap-2">
                  <input readOnly value={`https://${isValidDomain(agent?.domain) ? agent?.domain : 'salesbot-rho.vercel.app'}/api/webhook/whatsapp`}
                    className={cn(inputCls, "flex-1 text-[10px] text-muted-foreground font-mono cursor-text")} />
                  <button onClick={() => {
                    navigator.clipboard.writeText(`https://${isValidDomain(agent?.domain) ? agent?.domain : 'salesbot-rho.vercel.app'}/api/webhook/whatsapp`)
                    alert("✅ تم النسخ!")
                  }} className="shrink-0 px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium hover:bg-secondary/80 hover:border-brand-300/60 transition-all">
                    نسخ
                  </button>
                </div>
              </Field>

              {!isValidDomain(agent?.domain) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-[11px] text-amber-700">
                    ⚠️ الدومين الحالي غير صالح. استخدم: salesbot-rho.vercel.app
                  </p>
                  <p className="text-[10px] text-amber-600/80 mt-1">
                    غيّر الدومين في إعدادات Agent (بدون أحرف عربية أو مسافات)
                  </p>
                </div>
              )}

              <Field label="رمز التحقق (Verify Token)" hint="رمز فريد خاص بك - انسخه إلى لوحة Meta Developers">
                <div className="flex gap-2">
                  <input readOnly value={agent?.verifyToken || "جاري التحميل..."}
                    className={cn(inputCls, "flex-1 text-[10px] text-muted-foreground font-mono cursor-text")} />
                  <button onClick={() => {
                    navigator.clipboard.writeText(agent?.verifyToken)
                    alert("✅ تم النسخ!")
                  }} disabled={!agent?.verifyToken}
                  className="shrink-0 px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-medium hover:bg-secondary/80 hover:border-brand-300/60 transition-all disabled:opacity-50">
                    نسخ
                  </button>
                </div>
              </Field>

              <button onClick={async () => {
                const success = await updateAgent({ whatsappPhoneId: whatsappForm.whatsappPhoneId, whatsappToken: whatsappForm.whatsappToken })
                if (success) alert("✅ تم حفظ بيانات WhatsApp!")
              }} className="w-full flex items-center gap-2 justify-center bg-brand-600 text-white py-3 rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-md shadow-brand-600/25">
                <Save size={13} /> حفظ بيانات WhatsApp
              </button>
            </div>
          </Section>
        </div>
      )}

      {/* ════ Tab: الإشعارات ══════════════════════════ */}
      {activeTab === "notifications" && (
        <div className="max-w-lg">
          <Section title="إعدادات الإشعارات">
            <div className="flex flex-col divide-y divide-border/50">
              {[
                { key: "newOrder",           title: "إشعار كل طلب جديد",  sub: "تصلك رسالة واتساب عند كل طلب مؤكد" },
                { key: "dailyReport",        title: "تقرير يومي",           sub: "ملخص يومي للمحادثات والمبيعات صباحاً" },
                { key: "highValueObjection", title: "تنبيه اعتراض مهم",    sub: "عند اعتراض زبون عالي الإمكانية" },
                { key: "weeklyReport",       title: "تقرير أسبوعي",         sub: "تحليل أسبوعي شامل كل الأحد" },
                { key: "agentDown",          title: "تنبيه انقطاع Agent",   sub: "إذا توقف Agent عن العمل" },
              ].map((item) => (
                <div key={item.key} className="py-4 first:pt-0 last:pb-0">
                  <Toggle
                    on={notificationSettings[item.key]}
                    onToggle={() => setNotificationSettings(p => ({ ...p, [item.key]: !p[item.key] }))}
                    label={item.title}
                    sub={item.sub}
                  />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ════ Tab: الحساب ════════════════════════════ */}
      {activeTab === "account" && (
        <div className="flex flex-col gap-3 max-w-lg">

          {editingAccount ? (
            <Section title="تعديل معلومات الحساب">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "اسم المتجر", key: "storeName", type: "text" },
                    { label: "الاسم الكامل", key: "name", type: "text" },
                    { label: "البريد الإلكتروني", key: "email", type: "email" },
                    { label: "رقم الواتساب", key: "phone", type: "tel" },
                  ].map(({ label, key, type }) => (
                    <Field key={key} label={label}>
                      <input type={type} value={accountForm[key] || ""}
                        onChange={(e) => setAccountForm({ ...accountForm, [key]: e.target.value })}
                        className={inputCls} />
                    </Field>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/60">
                  <button onClick={() => setEditingAccount(false)}
                    className="w-full sm:w-auto sm:mr-auto px-4 py-2.5 border border-border rounded-xl text-xs font-medium hover:bg-secondary transition-all">
                    إلغاء
                  </button>
                  <button onClick={handleSaveAccount} disabled={accountLoading}
                    className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20">
                    {accountLoading && <Loader2 size={12} className="animate-spin" />}
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </Section>
          ) : (
            <Section title="معلومات الحساب">
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border/60">
                <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-600/15 flex items-center justify-center text-xl font-bold text-brand-600 shrink-0">
                  {user?.storeName ? user.storeName.charAt(0).toUpperCase() : "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.storeName || "-"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "-"}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{user?.phone || "-"}</p>
                </div>
                <button onClick={() => setEditingAccount(true)}
                  className="shrink-0 text-xs border border-border px-3 py-1.5 rounded-xl hover:bg-secondary hover:border-brand-300/60 transition-all font-medium">
                  تعديل
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "اسم المتجر",       value: user?.storeName || "-" },
                  { label: "الاسم الكامل",      value: user?.name || "-" },
                  { label: "البريد الإلكتروني", value: user?.email || "-" },
                  { label: "تاريخ التسجيل",     value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-MA') : "-" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1 p-3 bg-secondary/40 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs font-semibold text-foreground break-all">{item.value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Danger Zone */}
          <div className="bg-card border border-red-500/15 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-red-500/10 bg-red-500/4">
              <p className="text-[11px] font-semibold text-red-500/70 tracking-widest uppercase flex items-center gap-1.5">
                <Shield size={11} /> منطقة الخطر
              </p>
            </div>
            <div className="p-4 flex justify-between items-center gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">حذف الحساب</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">سيتم حذف كل البيانات نهائياً ولا يمكن التراجع</p>
              </div>
              <button className="shrink-0 text-xs border border-red-500/20 text-red-500/70 px-3 py-1.5 rounded-xl hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 transition-all font-medium">
                حذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .ease-spring {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}