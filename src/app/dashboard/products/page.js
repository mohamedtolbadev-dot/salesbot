"use client"

import { useState, useEffect } from "react"
import { productsAPI } from "@/lib/api"
import { formatAmount } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { Plus, Search, Trash2, ShoppingBag, Eye, EyeOff, Package, Tag, Loader2, ImageIcon, X, Pencil, Maximize2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", images: [] })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", price: "", description: "", images: [] })
  const [savingEdit, setSavingEdit] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      setError(null)
      const response = await productsAPI.getAll()
      setProducts(response.data || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("فشل في تحميل المنتجات")
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(
    (p) => p.name.includes(search) || p.description?.includes(search)
  )

  const handleToggle = async (id) => {
    const product = products.find((p) => p.id === id)
    if (!product) return
    try {
      await productsAPI.update(id, { isActive: !product.isActive })
      setProducts(products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)))
    } catch (err) {
      console.error("Error toggling product:", err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id)
      setProducts(products.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Error deleting product:", err)
    }
  }

  const handleAdd = async () => {
    if (newProduct.name && newProduct.price) {
      try {
        setAddingProduct(true)
        const response = await productsAPI.create({
          name: newProduct.name,
          price: Number(newProduct.price),
          description: newProduct.description,
          images: newProduct.images,
        })
        setProducts([...products, response.data])
        setNewProduct({ name: "", price: "", description: "", images: [] })
        setShowAddForm(false)
      } catch (err) {
        console.error("Error adding product:", err)
      } finally {
        setAddingProduct(false)
      }
    }
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImages(true)
    const uploadedUrls = []
    const token = localStorage.getItem("token")
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const result = await response.json()
        if (result.success) uploadedUrls.push(result.url)
      } catch (err) {
        console.error("Error uploading image:", err)
      }
    }
    if (uploadedUrls.length > 0)
      setNewProduct({ ...newProduct, images: [...newProduct.images, ...uploadedUrls] })
    setUploadingImages(false)
  }

  const removeImage = (index) => {
    setNewProduct({ ...newProduct, images: newProduct.images.filter((_, i) => i !== index) })
  }

  const startEdit = (product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      images: product.images ? JSON.parse(product.images) : [],
    })
  }

  const handleEditFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImages(true)
    const uploadedUrls = []
    const token = localStorage.getItem("token")
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const result = await response.json()
        if (result.success) uploadedUrls.push(result.url)
      } catch (err) {
        console.error("Error uploading image:", err)
      }
    }
    if (uploadedUrls.length > 0)
      setEditForm({ ...editForm, images: [...editForm.images, ...uploadedUrls] })
    setUploadingImages(false)
  }

  const removeEditImage = (index) => {
    setEditForm({ ...editForm, images: editForm.images.filter((_, i) => i !== index) })
  }

  const handleSaveEdit = async () => {
    if (!editingProduct || !editForm.name || !editForm.price) return
    try {
      setSavingEdit(true)
      await productsAPI.update(editingProduct.id, {
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description,
        images: editForm.images,
      })
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name: editForm.name, price: Number(editForm.price), description: editForm.description, images: JSON.stringify(editForm.images) }
            : p
        )
      )
      setEditingProduct(null)
    } catch (err) {
      console.error("Error updating product:", err)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleShowDetails = (product) => {
    setSelectedProductForDetails(product)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => setShowDetailsModal(false)

  // ── Shared details content ──
  const DetailsContent = ({ product, onClose, onEdit }) => {
    const images = (() => {
      try { return product.images ? JSON.parse(product.images) : [] }
      catch { return [] }
    })()

    return (
      <div className="flex flex-col gap-4">
        {/* Name & Price */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{product.name}</h2>
          <p className="text-2xl sm:text-3xl font-bold text-brand-600">{formatAmount(product.price)}</p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs px-3 py-1 rounded-full border font-medium",
            product.isActive ? "bg-secondary text-brand-600 border-border" : "bg-secondary text-muted-foreground border-border"
          )}>
            {product.isActive ? "نشط" : "معطل"}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag size={13} />
            <span>{product.questions} سؤال</span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="pb-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">الوصف</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ImageIcon size={15} />
              الصور ({images.length})
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {images.map((imageUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(imageUrl)}
                  className="rounded-xl overflow-hidden bg-secondary hover:shadow-lg transition-all duration-300 cursor-zoom-in relative group"
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} - صورة ${idx + 1}`}
                    className="w-full h-32 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <Maximize2 size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all duration-200"
          >
            إغلاق
          </button>
          <button
            onClick={() => { onEdit(product); onClose() }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-all duration-200 shadow-lg shadow-brand-600/20"
          >
            <Pencil size={14} />
            تعديل المنتج
          </button>
        </div>
      </div>
    )
  }

  // ── Early returns ──
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-3 sm:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-2xl h-40 sm:h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">فشل في تحميل البيانات</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-0 pb-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Package size={17} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">المنتجات</h1>
            <p className="text-[11px] text-muted-foreground">
              {products.filter((p) => p.isActive).length} منتج نشط
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-800 transition-all duration-200 shadow-md shadow-brand-600/20 shrink-0"
        >
          <Plus size={13} />
          منتج جديد
        </button>
      </div>

      {/* ── Add Form ── */}
      {showAddForm && (
        <div className="bg-secondary/50 border border-border rounded-xl p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <Plus size={13} className="text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">إضافة منتج جديد</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">اسم المنتج</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="مثال: جلباب زيتوني"
                className="px-3 py-2.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-brand-400 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">السعر (درهم)</label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="320"
                className="px-3 py-2.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-brand-400 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-2.5">
            <label className="text-xs text-muted-foreground">الوصف</label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="وصف المنتج — مواصفات، ألوان، مقاسات..."
              rows={2}
              className="px-3 py-2.5 bg-background border border-border rounded-lg text-xs outline-none resize-none focus:border-brand-400 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={13} />صور المنتج
            </label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={uploadingImages} className="hidden" />
              <div className="px-4 py-2.5 bg-secondary border border-border border-dashed rounded-xl text-xs text-center hover:bg-border transition-all duration-200">
                {uploadingImages
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={13} className="animate-spin" />جاري رفع الصور...</span>
                  : <span className="flex items-center justify-center gap-2"><Plus size={13} />اضغط لاختيار صور</span>}
              </div>
            </label>
            {newProduct.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newProduct.images.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2.5 py-1.5">
                    <img src={url} alt="" className="w-7 h-7 rounded object-cover" />
                    <span className="text-[11px] text-brand-700 truncate max-w-[90px]">صورة {idx + 1}</span>
                    <button onClick={() => removeImage(idx)} className="text-brand-400 hover:text-brand-600"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button onClick={() => setShowAddForm(false)} className="flex-1 sm:flex-none px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all duration-200">
              إلغاء
            </button>
            <button onClick={handleAdd} disabled={addingProduct} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-all duration-200 shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {addingProduct ? <><Loader2 size={15} className="animate-spin" />جاري الإضافة...</> : <><Plus size={15} />إضافة المنتج</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Form ── */}
      {editingProduct && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl shadow-brand-600/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Pencil size={16} className="text-brand-600" />تعديل المنتج
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">اسم المنتج</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="مثال: ساعة ذكية" className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all duration-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">السعر (درهم)</label>
              <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="320" className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:border-brand-400 transition-all duration-200" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-2.5">
            <label className="text-xs sm:text-sm text-muted-foreground">الوصف</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="وصف المنتج — مواصفات، ألوان، مقاسات..." rows={2} className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm outline-none resize-none focus:border-brand-400 transition-all duration-200" />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5"><ImageIcon size={13} />صور المنتج</label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple onChange={handleEditFileUpload} disabled={uploadingImages} className="hidden" />
              <div className="px-4 py-2.5 bg-secondary border border-border border-dashed rounded-xl text-xs text-center hover:bg-border transition-all duration-200">
                {uploadingImages
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={13} className="animate-spin" />جاري رفع الصور...</span>
                  : <span className="flex items-center justify-center gap-2"><Plus size={13} />اضغط لإضافة صور</span>}
              </div>
            </label>
            {editForm.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editForm.images.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2.5 py-1.5">
                    <img src={url} alt="" className="w-7 h-7 rounded object-cover" />
                    <span className="text-[11px] text-brand-700 truncate max-w-[90px]">صورة {idx + 1}</span>
                    <button onClick={() => removeEditImage(idx)} className="text-brand-400 hover:text-brand-600"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button onClick={() => setEditingProduct(null)} className="flex-1 sm:flex-none px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all duration-200">إلغاء</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-all duration-200 shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {savingEdit ? <><Loader2 size={15} className="animate-spin" />جاري الحفظ...</> : <><Pencil size={15} />حفظ التعديلات</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Details Modal: Bottom Sheet on mobile / Centered on desktop ── */}
      {showDetailsModal && selectedProductForDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-300"
            onClick={closeDetailsModal}
          />

          {/* Panel */}
          <div
            className={cn(
              "relative w-full border border-border shadow-2xl overflow-y-auto z-10",
              "animate-in fade-in duration-300",
              // Mobile → bottom sheet
              "rounded-t-2xl max-h-[85vh] slide-in-from-bottom-4",
              // Desktop → centered card
              "sm:rounded-2xl sm:max-w-2xl sm:max-h-[90vh] sm:mx-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"
            )}
            style={{ backgroundColor: "var(--modal-surface)" }}
          >
            {/* Handle bar — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Mobile top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border sm:hidden">
              <p className="text-sm font-semibold text-foreground truncate flex-1 ml-2">
                {selectedProductForDetails.name}
              </p>
              <button onClick={closeDetailsModal} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Desktop close button */}
            <button
              onClick={closeDetailsModal}
              className="hidden sm:flex absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-4 sm:p-6 sm:pr-14">
              <DetailsContent
                product={selectedProductForDetails}
                onClose={closeDetailsModal}
                onEdit={startEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-in fade-in duration-200 px-4"
          onClick={() => setLightboxImage(null)}
        >
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 text-brand-600 transition-all duration-200">
            <X size={22} />
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full pr-9 pl-3 py-2.5 bg-card border border-border rounded-lg text-xs outline-none focus:border-brand-400 transition-all duration-200"
        />
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <Package size={22} className="text-brand-600" />
          </div>
          <p className="text-xs text-muted-foreground">لا توجد منتجات</p>
        </div>
      ) : (
        /* 2 columns on mobile, 2 on sm, 3 on lg */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={cn(
                "group relative bg-card border rounded-xl overflow-hidden transition-all duration-500",
                product.isActive
                  ? "border-border hover:border-brand-300 hover:shadow-xl hover:shadow-brand-600/10 hover:-translate-y-1"
                  : "border-border opacity-60 grayscale"
              )}
            >
              {/* Image */}
              <div className="h-28 sm:h-32 bg-secondary flex items-center justify-center relative overflow-hidden">
                {(() => {
                  try {
                    const images = product.images ? JSON.parse(product.images) : []
                    const mainImage = images.length > 0 ? images[0] : null
                    return mainImage ? (
                      <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center">
                        <ShoppingBag size={20} className="text-muted-foreground/40" />
                      </div>
                    )
                  } catch {
                    return <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center"><ShoppingBag size={20} className="text-muted-foreground/40" /></div>
                  }
                })()}
                <span className={cn(
                  "absolute top-1.5 right-1.5 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border font-medium",
                  product.isActive ? "bg-secondary text-brand-600 border-border" : "bg-secondary text-muted-foreground border-border"
                )}>
                  {product.isActive ? "نشط" : "معطل"}
                </span>
              </div>

              {/* Info */}
              <div className="p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 truncate">{product.name}</p>
                <p className="text-sm sm:text-base font-bold text-brand-600 mb-1">{formatAmount(product.price)}</p>
                {/* Description hidden on mobile to save space */}
                <p className="hidden sm:block text-[11px] text-muted-foreground mb-2 line-clamp-2">{product.description}</p>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Tag size={10} className="text-muted-foreground" />
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">{product.questions} سؤال</span>
                  </div>
                  <div className="flex gap-0">
                    <button onClick={() => handleShowDetails(product)} className="p-1 sm:p-1.5 rounded-md hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-brand-600" title="عرض التفاصيل">
                      <Maximize2 size={13} />
                    </button>
                    <button onClick={() => startEdit(product)} className="p-1 sm:p-1.5 rounded-md hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-foreground">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleToggle(product.id)} className="p-1 sm:p-1.5 rounded-md hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-foreground">
                      {product.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1 sm:p-1.5 rounded-md hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:border-brand-400 hover:bg-secondary/30 transition-all duration-300 min-h-[170px] sm:min-h-[200px] group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-all duration-300">
              <Plus size={20} className="text-brand-600" />
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-brand-600 transition-colors text-center">
              إضافة منتج جديد
            </p>
          </div>
        </div>
      )}
    </div>
  )
}