"use client"

import { useState, useEffect, useRef } from "react"
import { servicesAPI } from "@/lib/api"
import { formatAmount } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import {
  Plus, Search, Trash2, Wrench, Eye, EyeOff,
  Clock, Tag, Loader2, ImageIcon, X, Pencil,
  Maximize2, AlertCircle, RefreshCw, ChevronDown,
} from "lucide-react"

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
      className="group bg-card border border-border rounded-xl p-4 cursor-default transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon size={14} className="text-brand-600" />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold text-brand-600 bg-secondary border border-brand-200 px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground group-hover:text-brand-600 transition-colors duration-300 tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      <div className="mt-3 h-[2px] w-0 bg-brand-600 rounded-full group-hover:w-full transition-all duration-500 ease-out" />
    </div>
  )
}

/* ─────────────── Image Upload Zone ─────────────── */
function ImageUploadZone({ images, onUpload, onRemove, uploading }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <ImageIcon size={12} className="text-brand-600" /> صور الخدمة
      </label>
      <label className="cursor-pointer">
        <input type="file" accept="image/*" multiple onChange={onUpload} disabled={uploading} className="hidden" />
        <div className="px-4 py-3 bg-secondary border border-dashed border-border rounded-lg text-[11px] text-center hover:border-brand-300 hover:bg-secondary/70 transition-all duration-200">
          {uploading
            ? <span className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 size={12} className="animate-spin" />جاري رفع الصور...</span>
            : <span className="flex items-center justify-center gap-2 text-muted-foreground"><Plus size={12} />اضغط لاختيار صور</span>}
        </div>
      </label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2 py-1.5 group/img">
              <img src={url} alt="" className="w-6 h-6 rounded object-cover" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">صورة {idx + 1}</span>
              <button onClick={() => onRemove(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <X size={10} />
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
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "px-3 py-2 bg-card border border-border rounded-lg text-[12px] outline-none focus:border-brand-400 transition-colors duration-200"

/* ─────────────── Service Card ─────────────── */
function ServiceCard({ service, onDetails, onEdit, onToggle, onDelete, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const images = (() => {
    try { return service.images ? JSON.parse(service.images) : [] }
    catch { return [] }
  })()
  const mainImage = images[0] || null

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}د`
  }

  return (
    <div
      className={cn(
        "group bg-card border rounded-xl overflow-hidden transition-all duration-300",
        service.isActive
          ? "border-border hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/8 hover:-translate-y-0.5"
          : "border-border opacity-60 grayscale"
      )}
      style={{
        opacity: visible ? (service.isActive ? 1 : 0.6) : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Image */}
      <div className="h-28 sm:h-36 bg-secondary flex items-center justify-center relative overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-border/50 flex items-center justify-center">
            <Wrench size={18} className="text-muted-foreground/40" />
          </div>
        )}

        {/* Status badge */}
        <span className={cn(
          "absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md border",
          service.isActive
            ? "bg-card text-brand-600 border-brand-200"
            : "bg-card text-muted-foreground border-border"
        )}>
          {service.isActive ? "نشط" : "معطل"}
        </span>

        {/* Image count badge */}
        {images.length > 1 && (
          <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/50 text-white border border-white/10">
            {images.length}
          </span>
        )}

        {/* Duration badge */}
        <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-600 text-white">
          <Clock size={9} className="inline ml-0.5" /> {formatDuration(service.duration)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[12px] font-bold text-foreground truncate mb-0.5">{service.name}</p>
        <p className="text-[13px] font-bold text-brand-600 mb-2 tabular-nums">{formatAmount(service.price)}</p>

        {/* Description — desktop only */}
        {service.description && (
          <p className="hidden sm:block text-[11px] text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Tag size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground tabular-nums">{service.questions} سؤال</span>
          </div>
          <div className="flex items-center">
            {[
              { icon: Maximize2, onClick: () => onDetails(service), title: "التفاصيل",   hoverCls: "hover:text-brand-600" },
              { icon: Pencil,    onClick: () => onEdit(service),    title: "تعديل",       hoverCls: "hover:text-foreground" },
              { icon: service.isActive ? EyeOff : Eye,
                                 onClick: () => onToggle(service.id), title: "تفعيل/تعطيل", hoverCls: "hover:text-foreground" },
              { icon: Trash2,    onClick: () => onDelete(service.id), title: "حذف",        hoverCls: "hover:text-red-500" },
            ].map(({ icon: Ico, onClick, title, hoverCls }) => (
              <button
                key={title}
                onClick={onClick}
                title={title}
                className={cn("p-1.5 rounded-md text-muted-foreground transition-all duration-150 hover:bg-secondary", hoverCls)}
              >
                <Ico size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Details Content ─────────────── */
function DetailsContent({ service, onClose, onEdit, onLightbox }) {
  const images = (() => {
    try { return service.images ? JSON.parse(service.images) : [] }
    catch { return [] }
  })()

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours} ساعة ${mins} دقيقة` : `${hours} ساعة`
    }
    return `${minutes} دقيقة`
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">{service.name}</h2>
        <p className="text-2xl font-bold text-brand-600 tabular-nums">{formatAmount(service.price)}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[10px] font-semibold px-2 py-1 rounded-md border",
          service.isActive ? "text-brand-600 bg-secondary border-brand-200" : "text-muted-foreground bg-secondary border-border"
        )}>
          {service.isActive ? "نشط" : "معطل"}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-brand-600 bg-brand-50 border border-brand-200 px-2 py-1 rounded-md">
          <Clock size={11} />
          <span>{formatDuration(service.duration)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Tag size={11} />
          <span>{service.questions} سؤال</span>
        </div>
      </div>

      {service.description && (
        <div className="pb-4 border-b border-border">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">الوصف</p>
          <p className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">{service.description}</p>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <ImageIcon size={12} /> الصور ({images.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((url, idx) => (
              <div
                key={idx}
                onClick={() => onLightbox(url)}
                className="rounded-xl overflow-hidden bg-secondary cursor-zoom-in relative group/img hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={url}
                  alt={`${service.name} ${idx + 1}`}
                  className="w-full h-32 sm:h-44 object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 size={16} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-[12px] font-medium hover:bg-secondary transition-colors duration-200">
          إغلاق
        </button>
        <button
          onClick={() => { onEdit(service); onClose() }}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[12px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm"
        >
          <Pencil size={12} /> تعديل الخدمة
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newService, setNewService] = useState({ name: "", price: "", description: "", duration: "60", images: [] })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [addingService, setAddingService] = useState(false)

  // Edit form
  const [editingService, setEditingService] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", price: "", description: "", duration: "60", images: [] })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editUploading, setEditUploading] = useState(false)

  // Details modal
  const [detailsService, setDetailsService] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    try {
      setLoading(true); setError(null)
      const res = await servicesAPI.getAll()
      setServices(res.data || [])
    } catch {
      setError("فشل في تحميل الخدمات")
    } finally {
      setLoading(false)
    }
  }

  const filtered = services.filter(
    (s) => s.name.includes(search) || s.description?.includes(search)
  )

  const handleToggle = async (id) => {
    const s = services.find((x) => x.id === id)
    if (!s) return
    try {
      await servicesAPI.update(id, { isActive: !s.isActive })
      setServices(services.map((x) => x.id === id ? { ...x, isActive: !x.isActive } : x))
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await servicesAPI.delete(id)
      setServices(services.filter((x) => x.id !== id))
    } catch {}
  }

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return
    try {
      setAddingService(true)
      const res = await servicesAPI.create({
        name: newService.name,
        price: Number(newService.price),
        description: newService.description,
        duration: Number(newService.duration) || 60,
        images: newService.images,
      })
      setServices([...services, res.data])
      setNewService({ name: "", price: "", description: "", duration: "60", images: [] })
      setShowAddForm(false)
    } catch {} finally { setAddingService(false) }
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
      } catch {}
    }
    onDone(urls)
    setUploading(false)
  }

  const startEdit = (service) => {
    setEditingService(service)
    setEditForm({
      name: service.name,
      price: service.price.toString(),
      description: service.description || "",
      duration: service.duration?.toString() || "60",
      images: service.images ? JSON.parse(service.images) : [],
    })
  }

  const handleSaveEdit = async () => {
    if (!editingService || !editForm.name || !editForm.price) return
    try {
      setSavingEdit(true)
      await servicesAPI.update(editingService.id, {
        name: editForm.name, price: Number(editForm.price),
        description: editForm.description, duration: Number(editForm.duration) || 60,
        images: editForm.images,
      })
      setServices(services.map((s) => s.id === editingService.id
        ? { ...s, name: editForm.name, price: Number(editForm.price), description: editForm.description, duration: Number(editForm.duration) || 60, images: JSON.stringify(editForm.images) }
        : s
      ))
      setEditingService(null)
    } catch {} finally { setSavingEdit(false) }
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-secondary/60 rounded-xl animate-pulse h-44 sm:h-52" />
      ))}
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full border border-red-200 bg-red-50 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">فشل في تحميل البيانات</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
      <button onClick={fetchServices} className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <RefreshCw size={13} /> إعادة المحاولة
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 pb-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Wrench size={15} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">الخدمات</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {services.filter(s => s.isActive).length} خدمة نشطة
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm"
        >
          <Plus size={13} /> خدمة جديدة
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="إجمالي الخدمات"  value={services.length}                               icon={Wrench}      badge="الكل"   delay={0}   />
        <StatCard label="خدمات نشطة"       value={services.filter(s => s.isActive).length}       icon={Eye}          badge="نشط"    delay={80}  />
        <StatCard label="خدمات معطلة"      value={services.filter(s => !s.isActive).length}      icon={EyeOff}       badge="معطل"   delay={160} />
        <StatCard label="إجمالي الأسئلة"    value={services.reduce((a, s) => a + (s.questions || 0), 0)} icon={Tag}   badge="سؤال"   delay={240} />
      </div>

      {/* ── Add Form ── */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <Plus size={13} className="text-brand-600" />
              </div>
              <p className="text-[13px] font-semibold">إضافة خدمة جديدة</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <FormField label="اسم الخدمة">
              <input type="text" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="مثال: جلسة تدليك" className={inputCls} />
            </FormField>
            <FormField label="السعر (درهم)">
              <input type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="300" className={inputCls} />
            </FormField>
            <FormField label="المدة (دقيقة)">
              <input type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} placeholder="60" className={inputCls} />
            </FormField>
          </div>

          <div className="mb-3">
            <FormField label="الوصف">
              <textarea value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} placeholder="تفاصيل الخدمة، ما يشمله العرض..." rows={2} className={cn(inputCls, "resize-none")} />
            </FormField>
          </div>

          <div className="mb-4">
            <ImageUploadZone
              images={newService.images}
              uploading={uploadingImages}
              onUpload={e => uploadFiles(e.target.files, setUploadingImages, urls =>
                setNewService(s => ({ ...s, images: [...s.images, ...urls] }))
              )}
              onRemove={idx => setNewService(s => ({ ...s, images: s.images.filter((_, i) => i !== idx) }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-border rounded-lg text-[12px] font-medium hover:bg-secondary transition-colors duration-200">
              إلغاء
            </button>
            <button onClick={handleAdd} disabled={addingService} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[12px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm disabled:opacity-50">
              {addingService ? <><Loader2 size={13} className="animate-spin" />جاري الإضافة...</> : <><Plus size={13} />إضافة الخدمة</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Form ── */}
      {editingService && (
        <div className="bg-card border border-border rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <Pencil size={13} className="text-brand-600" />
              </div>
              <p className="text-[13px] font-semibold">تعديل الخدمة</p>
            </div>
            <button onClick={() => setEditingService(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <FormField label="اسم الخدمة">
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="اسم الخدمة" className={inputCls} />
            </FormField>
            <FormField label="السعر (درهم)">
              <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} placeholder="300" className={inputCls} />
            </FormField>
            <FormField label="المدة (دقيقة)">
              <input type="number" value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} placeholder="60" className={inputCls} />
            </FormField>
          </div>

          <div className="mb-3">
            <FormField label="الوصف">
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="تفاصيل الخدمة..." rows={2} className={cn(inputCls, "resize-none")} />
            </FormField>
          </div>

          <div className="mb-4">
            <ImageUploadZone
              images={editForm.images}
              uploading={editUploading}
              onUpload={e => uploadFiles(e.target.files, setEditUploading, urls =>
                setEditForm(f => ({ ...f, images: [...f.images, ...urls] }))
              )}
              onRemove={idx => setEditForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditingService(null)} className="px-4 py-2 border border-border rounded-lg text-[12px] font-medium hover:bg-secondary transition-colors duration-200">
              إلغاء
            </button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-[12px] font-semibold hover:bg-brand-800 transition-colors duration-200 shadow-sm disabled:opacity-50">
              {savingEdit ? <><Loader2 size={13} className="animate-spin" />جاري الحفظ...</> : <><Pencil size={13} />حفظ التعديلات</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Details Modal ── */}
      {detailsService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={() => setDetailsService(null)} />
          <div
            className={cn(
              "relative w-full border border-border shadow-2xl overflow-y-auto z-10",
              "animate-in fade-in duration-300",
              "rounded-t-2xl max-h-[85vh] slide-in-from-bottom-4",
              "sm:rounded-2xl sm:max-w-xl sm:max-h-[90vh] sm:mx-4"
            )}
            style={{ backgroundColor: "var(--modal-surface, var(--card))" }}
          >
            {/* Handle — mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-8 h-1 rounded-full bg-border" />
            </div>

            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border sm:hidden">
              <p className="text-[13px] font-bold text-foreground truncate">{detailsService.name}</p>
              <button onClick={() => setDetailsService(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Desktop close */}
            <button onClick={() => setDetailsService(null)} className="hidden sm:flex absolute top-4 left-4 p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>

            <div className="p-4 sm:p-5">
              <DetailsContent
                service={detailsService}
                onClose={() => setDetailsService(null)}
                onEdit={startEdit}
                onLightbox={setLightboxImage}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 animate-in fade-in duration-200 px-4"
          onClick={() => setLightboxImage(null)}
        >
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-secondary text-brand-600 hover:bg-secondary/80 transition-colors">
            <X size={20} />
          </button>
          <img
            src={lightboxImage} alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن خدمة..."
          className="w-full pr-9 pl-3 py-2 bg-card border border-border rounded-lg text-[12px] outline-none focus:border-brand-400 transition-colors duration-200"
        />
      </div>

      {/* ── Services Grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Wrench size={20} className="text-brand-600" />
          </div>
          <p className="text-[12px] text-muted-foreground">لا توجد خدمات</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((service, idx) => (
            <ServiceCard
              key={service.id}
              service={service}
              delay={idx * 50}
              onDetails={setDetailsService}
              onEdit={startEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}

          {/* Add tile */}
          <div
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2.5 p-4 cursor-pointer hover:border-brand-400 hover:bg-secondary/30 transition-all duration-300 min-h-[170px] sm:min-h-[200px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus size={18} className="text-brand-600" />
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground group-hover:text-brand-600 transition-colors text-center">
              إضافة خدمة جديدة
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
