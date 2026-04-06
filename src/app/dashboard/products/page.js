"use client"

import { useState, useEffect, useRef } from "react"
import { productsAPI } from "@/lib/api"
import { formatAmount } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  Plus, Search, Trash2, ShoppingBag, Eye, EyeOff,
  Package, Tag, Loader2, ImageIcon, X, Pencil,
  Maximize2, AlertCircle, AlertTriangle, RefreshCw, ChevronDown,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

/* ─────────────── Skeleton ─────────────── */
function ProductsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="sk w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="sk h-4 w-[80px]" />
            <div className="sk h-[11px] w-[100px]" />
          </div>
        </div>
        <div className="sk-brand h-8 w-[90px]" />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { badge: 36, val: 48,  label: 110 },
          { badge: 32, val: 40,  label: 96  },
          { badge: 40, val: 36,  label: 104 },
          { badge: 36, val: 52,  label: 88  },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2.5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex justify-between items-start">
              <div className="sk w-8 h-8 rounded-lg" />
              <div className="sk h-5 rounded-md" style={{ width: s.badge }} />
            </div>
            <div className="sk h-[26px] rounded-md" style={{ width: s.val }} />
            <div className="sk h-[11px]" style={{ width: s.label }} />
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative bg-card border border-border rounded-lg px-3 py-2.5.5 flex items-center">
        <div className="sk absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded" />
        <div className="sk h-3 w-[140px] mr-5" />
      </div>

      {/* ── Products Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { name: "90%",  desc1: "100%", desc2: "75%",  price: 56, tag: 52, delay: 0   },
          { name: "80%",  desc1: "95%",  desc2: "60%",  price: 64, tag: 48, delay: 50  },
          { name: "85%",  desc1: "100%", desc2: "70%",  price: 48, tag: 56, delay: 100 },
          { name: "88%",  desc1: "92%",  desc2: "55%",  price: 60, tag: 44, delay: 150 },
          { name: "76%",  desc1: "98%",  desc2: "65%",  price: 52, tag: 50, delay: 200 },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl overflow-hidden"
            style={{ animationDelay: `${c.delay}ms` }}
          >
            {/* Image zone */}
            <div className="sk h-36 sm:h-44 w-full rounded-none" />

            {/* Body */}
            <div className="p-4 flex flex-col gap-2">
              {/* Name */}
              <div className="sk h-[13px]" style={{ width: c.name }} />
              {/* Price */}
              <div className="sk h-[15px] rounded" style={{ width: c.price }} />
              {/* Description — hidden on mobile like original */}
              <div className="hidden sm:flex flex-col gap-1.5">
                <div className="sk h-[11px]" style={{ width: c.desc1 }} />
                <div className="sk h-[11px]" style={{ width: c.desc2 }} />
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
                <div className="sk h-[10px]" style={{ width: c.tag }} />
                <div className="flex items-center gap-0.5">
                  {[0,1,2,3].map(j => (
                    <div key={j} className="sk w-[26px] h-[26px] rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add tile */}
        <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2.5 p-4 min-h-[170px] sm:min-h-[200px]">
          <div className="sk w-10 h-10 rounded-xl" />
          <div className="sk h-[11px] w-[90px]" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Animated Number ─────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = typeof value === "number" ? value : 0
    const duration = 800
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.floor(eased * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{display}</>
}

/* ─────────────── Stat Card ─────────────── */
function StatCard({ label, value, icon: Icon, badge, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      className="group bg-card border border-border rounded-xl p-5 cursor-default transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={16} className="text-brand-600" />
        </div>
        {badge && (
          <span className="text-[12px] font-semibold text-brand-600 bg-secondary border border-brand-200 px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[13px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Image Upload Zone ─────────────── */
function ImageUploadZone({ images, onUpload, onRemove, uploading }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
        <ImageIcon size={14} className="text-brand-600" /> {t('products.images')}
      </label>
      <label className="cursor-pointer">
        <input type="file" accept="image/*" multiple onChange={onUpload} disabled={uploading} className="hidden" />
        <div className="px-4 py-3 bg-secondary border border-dashed border-border rounded-lg text-[13px] text-center hover:border-brand-300 hover:bg-secondary/70 transition-all duration-200">
          {uploading
            ? <span className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 size={14} className="animate-spin" />{t('products.uploading')}</span>
            : <span className="flex items-center justify-center gap-2 text-muted-foreground"><Plus size={14} />{t('products.choose_images')}</span>}
        </div>
      </label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2 py-1.5 group/img">
              <img src={url} alt="" className="w-6 h-6 rounded object-cover" />
              <span className="text-[12px] text-muted-foreground truncate max-w-[70px]">{t('products.image')} {idx + 1}</span>
              <button onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────── Form Fields ─────────────── */
function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "px-3 py-2.5 bg-card border border-border rounded-lg text-[14px] outline-none focus:border-brand-400 transition-colors duration-200"

/* ─────────────── Low Stock Banner ─────────────── */
const LOW_STOCK_THRESHOLD = 5

function LowStockBanner({ products, onRestock }) {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  const lowStockProducts = products.filter(p => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)

  if (dismissed || lowStockProducts.length === 0) return null

  return (
    <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-amber-700 dark:text-amber-400">{t('products.low_stock_banner_title')}</p>
            <p className="text-[12px] text-amber-600/80 dark:text-amber-500/80">{t('products.low_stock_banner_desc')}</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 transition-colors p-0.5">
          <X size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {lowStockProducts.map(p => (
          <button
            key={p.id}
            onClick={() => onRestock(p)}
            className="flex items-center gap-1.5 bg-card border border-amber-500/20 rounded-lg px-2.5 py-1.5 hover:border-amber-500/50 hover:shadow-sm transition-all duration-200 group"
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              p.stock === 0 ? "bg-red-500 animate-pulse" : "bg-amber-500"
            )} />
            <span className="text-[13px] font-medium text-foreground truncate max-w-[120px]">{p.name}</span>
            <span className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded-md border",
              p.stock === 0
                ? "text-red-500 bg-red-500/10 border-red-500/20"
                : "text-amber-600 bg-amber-500/10 border-amber-500/20"
            )}>
              {p.stock === 0 ? t('products.out_of_stock') : `${p.stock} ${t('products.units_left')}`}
            </span>
            <Package size={11} className="text-amber-500 group-hover:text-amber-600 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── Product Card ─────────────── */
function ProductCard({ product, onDetails, onEdit, onToggle, onDelete, delay = 0 }) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const images = (() => {
    try { return product.images ? JSON.parse(product.images) : [] }
    catch { return [] }
  })()

  const mainImage = images[0] || null

  return (
    <div
      className={cn(
        "group bg-card border rounded-xl overflow-hidden transition-all duration-300",
        product.isActive
          ? "border-border hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/8 hover:-translate-y-0.5"
          : "border-border opacity-60 grayscale"
      )}
      style={{
        opacity: visible ? (product.isActive ? 1 : 0.6) : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div className="h-28 sm:h-36 bg-secondary flex items-center justify-center relative overflow-hidden">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
            <ShoppingBag size={20} className="text-muted-foreground/40" />
          </div>
        )}
        <span className={cn(
          "absolute top-2 right-2 text-[11px] font-bold px-1.5 py-0.5 rounded-md border",
          product.isActive ? "bg-card text-brand-600 border-brand-200" : "bg-card text-muted-foreground border-border"
        )}>
          {product.isActive ? t('products.active') : t('products.inactive')}
        </span>
        {images.length > 1 && (
          <span className="absolute top-2 left-2 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-black/50 text-white border border-white/10">
            {images.length}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[14px] font-bold text-foreground truncate mb-0.5">{product.name}</p>
        <p className="text-[15px] font-bold text-brand-600 tabular-nums">{formatAmount(product.price)}</p>
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md border mb-2",
          product.stock === 0
            ? "text-red-500 bg-red-500/10 border-red-500/20"
            : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
        )}>
          <Package size={10} />
          {product.stock === 0 ? t('products.out_of_stock') : `${product.stock} ${t('products.stock')}`}
        </span>
        {product.description && (
          <p className="hidden sm:block text-[13px] text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Tag size={12} className="text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground tabular-nums">{product.questions} {t('products.questions')}</span>
          </div>
          <div className="flex items-center">
            {[
              { icon: Maximize2, onClick: () => onDetails(product), title: t('common.details'),         hoverCls: "hover:text-brand-600" },
              { icon: Pencil,    onClick: () => onEdit(product),    title: t('common.edit'),             hoverCls: "hover:text-foreground" },
              { icon: product.isActive ? EyeOff : Eye, onClick: () => onToggle(product.id), title: t('products.toggle_active'), hoverCls: "hover:text-foreground" },
              { icon: Trash2,    onClick: () => onDelete(product.id), title: t('common.delete'),         hoverCls: "hover:text-red-500" },
            ].map(({ icon: Ico, onClick, title, hoverCls }) => (
              <button key={title} onClick={onClick} title={title}
                className={cn("p-1.5 rounded-md text-muted-foreground transition-all duration-150 hover:bg-secondary", hoverCls)}>
                <Ico size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Details Content ─────────────── */
function DetailsContent({ product, onClose, onEdit, onLightbox }) {
  const { t } = useLanguage()
  const images = (() => {
    try { return product.images ? JSON.parse(product.images) : [] }
    catch { return [] }
  })()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{product.name}</h2>
        <p className="text-3xl font-bold text-brand-600 tabular-nums">{formatAmount(product.price)}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "text-[12px] font-semibold px-2 py-1 rounded-md border",
          product.isActive ? "text-brand-600 bg-secondary border-brand-200" : "text-muted-foreground bg-secondary border-border"
        )}>
          {product.isActive ? t('products.active') : t('products.inactive')}
        </span>
        <span className={cn(
          "text-[12px] font-semibold px-2 py-1 rounded-md border inline-flex items-center gap-1",
          product.stock === 0
            ? "text-red-500 bg-red-500/10 border-red-500/20"
            : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
        )}>
          <Package size={11} />
          {product.stock === 0 ? t('products.out_of_stock') : `${product.stock}`}
        </span>
        <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <Tag size={11} />
          <span>{product.questions} {t('products.questions')}</span>
        </div>
      </div>
      {product.description && (
        <div className="pb-4 border-b border-border">
          <p className="text-[13px] font-semibold text-muted-foreground mb-1.5">{t('common.description')}</p>
          <p className="text-[14px] text-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
        </div>
      )}
      {images.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <ImageIcon size={14} /> {t('products.images')} ({images.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((url, idx) => (
              <div key={idx} onClick={() => onLightbox(url)}
                className="rounded-xl overflow-hidden bg-secondary cursor-zoom-in relative group/img hover:shadow-lg transition-shadow duration-300">
                <img src={url} alt={`${product.name} ${idx + 1}`}
                  className="w-full h-32 sm:h-44 object-cover group-hover/img:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 size={18} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-2 border-t border-border">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-[14px] font-medium hover:bg-secondary transition-colors duration-200">
          {t('common.close')}
        </button>
        <button onClick={() => { onEdit(product); onClose() }}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[14px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm">
          <Pencil size={14} /> {t('products.edit')}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
export default function ProductsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", images: [], stock: 0 })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", price: "", description: "", images: [], stock: 0 })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editUploading, setEditUploading] = useState(false)
  const [detailsProduct, setDetailsProduct] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" })

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      setLoading(true); setError(null)
      const res = await productsAPI.getAll()
      setProducts(res.data || [])
    } catch {
      setError("products.loading_error")
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(
    (p) => p.name.includes(search) || p.description?.includes(search)
  )

  const handleToggle = async (id) => {
    const p = products.find((x) => x.id === id)
    if (!p) return
    try {
      await productsAPI.update(id, { isActive: !p.isActive })
      setProducts(products.map((x) => x.id === id ? { ...x, isActive: !x.isActive } : x))
    } catch {}
  }

  const confirmDelete = async () => {
    const { id } = deleteModal
    if (!id) return
    try {
      await productsAPI.delete(id)
      setProducts(prev => prev.filter((x) => x.id !== id))
      setDeleteModal({ open: false, id: null, name: "" })
    } catch {}
  }

  const cancelDelete = () => {
    setDeleteModal({ open: false, id: null, name: "" })
  }

  const handleDelete = (id) => {
    const product = products.find(p => p.id === id)
    setDeleteModal({ open: true, id, name: product?.name || "" })
  }

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.price) return
    try {
      setAddingProduct(true)
      const res = await productsAPI.create({
        name: newProduct.name, price: Number(newProduct.price),
        description: newProduct.description, images: newProduct.images,
        stock: Number(newProduct.stock) || 0,
      })
      setProducts([...products, res.data])
      setNewProduct({ name: "", price: "", description: "", images: [], stock: 0 })
      setShowAddForm(false)
    } catch {} finally { setAddingProduct(false) }
  }

  async function uploadFiles(files, setUploading, onDone) {
    if (!files?.length) return
    setUploading(true)
    const urls = []
    const token = localStorage.getItem("token")
    for (const file of files) {
      try {
        const fd = new FormData(); fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })
        const r = await res.json()
        if (r.success) urls.push(r.url)
        else console.error("Upload failed:", r.detail || r.error)
      } catch (err) { console.error("Upload exception:", err) }
    }
    onDone(urls)
    setUploading(false)
  }

  const startEdit = (product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name, price: product.price.toString(),
      description: product.description || "",
      images: product.images ? JSON.parse(product.images) : [],
      stock: product.stock ?? 0,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingProduct || !editForm.name || !editForm.price) return
    try {
      setSavingEdit(true)
      await productsAPI.update(editingProduct.id, {
        name: editForm.name, price: Number(editForm.price),
        description: editForm.description, images: editForm.images,
        stock: Number(editForm.stock) || 0,
      })
      setProducts(products.map((p) => p.id === editingProduct.id
        ? { ...p, name: editForm.name, price: Number(editForm.price), description: editForm.description, images: JSON.stringify(editForm.images), stock: Number(editForm.stock) || 0 }
        : p
      ))
      setEditingProduct(null)
    } catch {} finally { setSavingEdit(false) }
  }

  /* ── Loading → Skeleton ── */
  if (loading) return <ProductsSkeleton />

  /* ── Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{t('common.load_error')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t(error)}</p>
      </div>
      <button onClick={fetchProducts} className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <RefreshCw size={15} /> {t('common.retry')}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Package size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('products.title')}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {products.filter(p => p.isActive).length} {t('products.active')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm"
        >
          <Plus size={15} /> {t('products.new')}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('products.stats_total')}     value={products.length}                                         icon={Package}  badge={t('common.all')}            delay={0}   />
        <StatCard label={t('products.stats_active')}     value={products.filter(p => p.isActive).length}                icon={Eye}      badge={t('products.active')}      delay={80}  />
        <StatCard label={t('products.stat_out_of_stock')} value={products.filter(p => p.stock === 0).length}             icon={AlertCircle} badge={t('products.out_of_stock')} delay={160} />
        <StatCard label={t('products.stat_low_stock')}   value={products.filter(p => p.isActive && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length} icon={AlertTriangle} badge={t('products.low_stock')}          delay={240} />
      </div>

      {/* ── Low Stock Banner ── */}
      <LowStockBanner products={products} onRestock={startEdit} />

      {/* ── Add Form ── */
}
      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Plus size={15} className="text-brand-600" />
              </div>
              <p className="text-[15px] font-semibold">{t('products.add_title')}</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X size={17} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <FormField label={t('products.name')}>
              <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder={t('products.name')} className={inputCls} />
            </FormField>
            <FormField label={t('products.price')}>
              <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="320" className={inputCls} />
            </FormField>
            <FormField label={`${t('products.stock')} (${t('common.quantity')})`}>
              <input type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className={inputCls} />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label={t('products.description')}>
              <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder={t('products.description')} rows={2} className={cn(inputCls, "resize-none")} />
            </FormField>
          </div>
          <div className="mb-4">
            <ImageUploadZone
              images={newProduct.images} uploading={uploadingImages}
              onUpload={e => uploadFiles(e.target.files, setUploadingImages, urls => setNewProduct(p => ({ ...p, images: [...p.images, ...urls] })))}
              onRemove={idx => setNewProduct(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-border rounded-lg text-[14px] font-medium hover:bg-secondary transition-colors duration-200">{t('common.cancel')}</button>
            <button onClick={handleAdd} disabled={addingProduct} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[14px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm disabled:opacity-50">
              {addingProduct ? <><Loader2 size={15} className="animate-spin" />{t('products.adding')}</> : <><Plus size={15} />{t('products.add')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Form ── */}
      {editingProduct && (
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Pencil size={15} className="text-brand-600" />
              </div>
              <p className="text-[15px] font-semibold">{t('products.edit_title')}</p>
            </div>
            <button onClick={() => setEditingProduct(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X size={17} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <FormField label={t('products.name')}>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder={t('products.name')} className={inputCls} />
            </FormField>
            <FormField label={t('products.price')}>
              <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="320" className={inputCls} />
            </FormField>
            <FormField label={`${t('products.stock')} (${t('common.quantity')})`}>
              <input type="number" min="0" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} placeholder="0" className={inputCls} />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label={t('products.description')}>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder={t('products.description')} rows={2} className={cn(inputCls, "resize-none")} />
            </FormField>
          </div>
          <div className="mb-4">
            <ImageUploadZone
              images={editForm.images} uploading={editUploading}
              onUpload={e => uploadFiles(e.target.files, setEditUploading, urls => setEditForm(f => ({ ...f, images: [...f.images, ...urls] })))}
              onRemove={idx => setEditForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditingProduct(null)} className="px-4 py-2 border border-border rounded-lg text-[14px] font-medium hover:bg-secondary transition-colors duration-200">{t('common.cancel')}</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[14px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm disabled:opacity-50">
              {savingEdit ? <><Loader2 size={15} className="animate-spin" />{t('products.saving')}</> : <><Pencil size={15} />{t('products.save_changes')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Details Modal ── */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={() => setDetailsProduct(null)} />
          <div
            className={cn(
              "relative w-full border border-border shadow-2xl overflow-y-auto z-10",
              "animate-in fade-in duration-300",
              "rounded-t-2xl max-h-[85vh] slide-in-from-bottom-4",
              "sm:rounded-2xl sm:max-w-xl sm:max-h-[90vh] sm:mx-4"
            )}
            style={{ backgroundColor: "var(--modal-surface, var(--card))" }}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-8 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border sm:hidden">
              <p className="text-[15px] font-bold text-foreground truncate">{detailsProduct.name}</p>
              <button onClick={() => setDetailsProduct(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <ChevronDown size={20} />
              </button>
            </div>
            <button onClick={() => setDetailsProduct(null)} className="hidden sm:flex absolute top-4 left-4 p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
            <div className="p-4 sm:p-5">
              <DetailsContent product={detailsProduct} onClose={() => setDetailsProduct(null)} onEdit={startEdit} onLightbox={setLightboxImage} />
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-in fade-in duration-200 px-4" onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-secondary text-brand-600 hover:bg-secondary/80 transition-colors">
            <X size={20} />
          </button>
          <img src={lightboxImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('products.search')}
          className="w-full pr-9 pl-3 py-2 bg-card border border-border rounded-lg text-[14px] outline-none focus:border-brand-400 transition-colors duration-200"
        />
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Package size={20} className="text-brand-600" />
          </div>
          <p className="text-[14px] text-muted-foreground">{t('products.no_products')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((product, idx) => (
            <ProductCard
              key={product.id} product={product} delay={idx * 50}
              onDetails={setDetailsProduct} onEdit={startEdit}
              onToggle={handleToggle} onDelete={handleDelete}
            />
          ))}
          <div
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2.5 p-4 cursor-pointer hover:border-brand-400 hover:bg-secondary/30 transition-all duration-300 min-h-[170px] sm:min-h-[200px] group"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus size={20} className="text-brand-600" />
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground group-hover:text-brand-600 transition-colors text-center">
              {t('products.add_new')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}