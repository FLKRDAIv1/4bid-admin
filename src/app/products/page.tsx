"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { Package, Plus, Trash2, ExternalLink, ShieldCheck, Video, X } from "lucide-react"
import { adminTranslations } from "@/lib/translations"
import { getProducts, saveProduct, deleteProduct } from "@/lib/products-api"
import VideoProfessional from "@/components/VideoProfessional"
import { Product } from "@/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const t = adminTranslations.ku;
  
  const [formData, setFormData] = useState({
    title: "",
    sku: "",
    amazon_url: "",
    description: "",
    is_amazon_verified: false,
    estimated_delivery_days: 12,
    video_url: "",
    image_urls: [""] as string[],
    specs: {
      Material: "",
      Weight: "",
      Technology: "",
      Manufacturer: "",
      Warranty: ""
    } as Record<string, string>
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchProductsData = useCallback(async () => {
    try {
      const result = await getProducts()
      if (result.success && result.data) {
        setProducts(result.data)
      } else {
        console.error("Products fetch error:", result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Products fetch execution error:", message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsData()
    }, 0)

    const handleRefresh = () => fetchProductsData()
    window.addEventListener('refreshData', handleRefresh)

    // Realtime
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProductsData())
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(channel)
    }
  }, [fetchProductsData])

  const handleEdit = (product: Product) => {
    setFormData({
      title: product.title || "",
      sku: product.sku || "",
      amazon_url: product.amazon_url || "",
      description: product.description || "",
      is_amazon_verified: product.is_amazon_verified || false,
      estimated_delivery_days: product.estimated_delivery_days || 12,
      video_url: product.video_url || "",
      image_urls: product.image_urls && product.image_urls.length > 0 ? product.image_urls : [""],
      specs: {
        Material: product.specs?.Material || "",
        Weight: product.specs?.Weight || "",
        Technology: product.specs?.Technology || "",
        Manufacturer: product.specs?.Manufacturer || "",
        Warranty: product.specs?.Warranty || ""
      }
    })
    setEditingId(product.id)
    setShowModal(true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t.confirm_delete)) return
    setIsLoading(true)
    const result = await deleteProduct(id)
    setIsLoading(false)
    if (!result.success) alert("Error: " + result.error)
    else fetchProductsData()
  }

  const handleAddField = (field: 'image_urls') => {
    setFormData({ ...formData, [field]: [...formData[field], ""] })
  }

  const handleRemoveField = (field: 'image_urls', index: number) => {
    const updated = [...formData[field]]
    updated.splice(index, 1)
    setFormData({ ...formData, [field]: updated })
  }

  const handleUpdateField = (field: 'image_urls', index: number, value: string) => {
    const updated = [...formData[field]]
    updated[index] = value
    setFormData({ ...formData, [field]: updated })
  }

  const handleUpdateSpec = (key: string, value: string) => {
    setFormData({ ...formData, specs: { ...formData.specs, [key]: value } })
  }

  const resetForm = () => {
    setFormData({
      title: "", sku: "", amazon_url: "", description: "", is_amazon_verified: false, estimated_delivery_days: 12, video_url: "", image_urls: [""],
      specs: { Material: "", Weight: "", Technology: "", Manufacturer: "", Warranty: "" }
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const payload = { ...formData, image_urls: formData.image_urls.filter(url => url.trim() !== "") }
    const result = await saveProduct(payload as unknown as Product, editingId)
    setIsLoading(false)
    if (!result.success) alert("Error: " + result.error)
    else { setShowModal(false); fetchProductsData(); resetForm(); }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-right">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]"><span className="text-white">{t.products}</span></h2>
          <p className="text-slate-500 mt-1 text-[10px] uppercase font-bold tracking-widest hidden sm:block">بەڕێوەبردنی کاڵاکان و تایبەتمەندییەکانیان</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#FF7A00] text-black px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-[#FF7A00]/20 uppercase"
        >
          <Plus size={16} /> زیادکردنی کاڵا
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {products.map((product) => (
          <div key={product.id} className="glass-panel group overflow-hidden flex flex-col border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden bg-black/50">
              <Image 
                src={product.image_urls?.[0] || "https://via.placeholder.com/400x300"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={product.title || "Product"} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {product.is_amazon_verified && <div className="absolute top-2 left-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10"><ShieldCheck size={14} /></div>}
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col text-right">
              <h3 className="font-black text-sm text-white truncate">{product.title}</h3>
              <p className="text-[10px] text-[#FF7A00] font-black font-mono">SKU: {product.sku || 'N/A'}</p>
              <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed flex-1">{product.description}</p>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{product.estimated_delivery_days} {t.remaining} ڕۆژ گەیاندن</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(product)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ExternalLink size={16}/></button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 hover:bg-white/10 rounded text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-4xl max-h-[90dvh] overflow-y-auto p-8 border border-white/10 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 left-6 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
            <h3 className="text-2xl font-black mb-8 text-white">{editingId ? t.edit : t.save} - {t.products}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-8 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.product_title}</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] transition-colors text-right" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">SKU</label>
                      <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">ماوەی گەیاندن</label>
                      <input type="number" value={formData.estimated_delivery_days} onChange={e => setFormData({...formData, estimated_delivery_days: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <label className="text-sm font-bold text-slate-300">پەسەندکراوی ئەمازۆن</label>
                    <input type="checkbox" checked={formData.is_amazon_verified} onChange={e => setFormData({...formData, is_amazon_verified: e.target.checked})} className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#FF7A00] focus:ring-[#FF7A00]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.amazon_url}</label>
                    <input type="url" value={formData.amazon_url} onChange={e => setFormData({...formData, amazon_url: e.target.value})} placeholder="https://..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.description}</label>
                    <textarea rows={4} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="font-black text-sm flex items-center justify-end gap-2 text-[#FF7A00] uppercase tracking-widest">{t.specs} <Package size={18}/></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(formData.specs).map((key) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">{key}</label>
                      <input type="text" value={formData.specs[key]} onChange={e => handleUpdateSpec(key, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#FF7A00] text-right" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <h4 className="font-black text-sm flex items-center justify-end gap-2 text-[#FF7A00] uppercase tracking-widest">میدیا (Media) <Video size={18}/></h4>
                
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.image_urls}</label>
                  {formData.image_urls.map((url, idx) => (
                    <div key={idx} className="flex gap-3">
                      <button type="button" onClick={() => handleRemoveField('image_urls', idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5"><Trash2 size={18} /></button>
                      <input type="url" value={url} onChange={e => handleUpdateField('image_urls', idx, e.target.value)} placeholder="https://..." className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-[#FF7A00] text-right font-mono" />
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddField('image_urls')} className="text-xs font-black text-[#FF7A00] hover:bg-[#FF7A00]/10 px-4 py-2 rounded-lg border border-[#FF7A00]/20 transition-all">+ زیادکردنی وێنە</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div>
                      <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.video_url}</label>
                      <input type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} placeholder="Direct mp4, HLS, TikTok, or YouTube Link..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right font-mono" />
                   </div>
                   {formData.video_url && (
                     <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
                        <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">پێشبینی ڤیدیۆ (Preview)</label>
                        <VideoProfessional url={formData.video_url} className="w-full rounded-xl border border-[#FF7A00]/20" />
                     </div>
                   )}
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="submit" disabled={isLoading} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-transform active:scale-95 disabled:opacity-50">
                  {isLoading ? '...' : (editingId ? t.save_changes : 'بڵاوکردنەوە')}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-8 bg-white/5 border border-white/10 rounded-xl font-black text-slate-400 hover:text-white transition-colors uppercase text-sm">{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
