"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authAPI } from "@/lib/api"
import { Logo } from "@/components/shared/Logo"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!email || !password) {
      setError("الإيميل وكلمة المرور مطلوبان")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await authAPI.login(email, password)
      
      // Save token
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "فشل في تسجيل الدخول")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-center mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-brand-600 hover:text-brand-800 font-medium">
              سجل الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
