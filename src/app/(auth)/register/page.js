"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authAPI } from "@/lib/api"
import { Logo } from "@/components/shared/Logo"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    storeName: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.storeName) {
      setError("جميع الحقول مطلوبة")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await authAPI.register(formData)
      
      // Save token
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "فشل في إنشاء الحساب")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-2">إنشاء حساب</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            ابدأ رحلتك مع SalesBot.ma
          </p>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: أحمد محمد"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">اسم المتجر</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="مثال: بوتيك الأناقة"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0661234567"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء حساب"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-800 font-medium">
              سجل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
