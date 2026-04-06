"use client"
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, Search, Filter, Link as LinkIcon, Image as ImageIcon, Trash2, X, Play } from "lucide-react"
import { adminTranslations } from "@/lib/translations"
import VideoProfessional from "@/components/VideoProfessional"
import { saveAuction, deleteAuction, updateAuctionPrice, getAuctions, getAuctionBids } from "@/lib/auctions-api"
import { Auction, Bid, ProxyBid, Product } from "@/types"

const CountdownCell = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("")
  const t = adminTranslations.ku;

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft(t.finished)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`)
    }
    
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [endTime, t.finished])

  return <span className="font-mono text-xs">{timeLeft}</span>
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAuctionForBids, setSelectedAuctionForBids] = useState<Auction | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [proxyBids, setProxyBids] = useState<ProxyBid[]>([])
  const [isBidsLoading, setIsBidsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fetchBids = useCallback(async (auctionId: string) => {
    setIsBidsLoading(true)
    try {
      const result = await getAuctionBids(auctionId)
      if (result.success && result.data) {
        setBids(result.data.bids as Bid[] || [])
        setProxyBids(result.data.proxies as ProxyBid[] || [])
      } else {
        console.error("Fetch bids error:", result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Bids fetch execution error:", message)
    } finally {
      setIsBidsLoading(false)
    }
  }, [])

  // Form State
  const [amazonUrl, setAmazonUrl] = useState("")
  const [title, setTitle] = useState("")
  const [imageUrls, setImageUrls] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([
    { key: "Brand", value: "Apple" },
    { key: "Model", value: "Watch Series 11" }
  ])
  const [description, setDescription] = useState("")
  const [aboutItems, setAboutItems] = useState("")
  const [highlights, setHighlights] = useState<string[]>([])
  const [startPrice, setStartPrice] = useState("")
  const [minIncrement, setMinIncrement] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [cautionAmount, setCautionAmount] = useState("")

  const [editingAuctionId, setEditingAuctionId] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  const t = adminTranslations.ku;

  const fetchAuctions = useCallback(async () => {
    try {
      const result = await getAuctions()
      if (result.success) {
        setAuctions(result.data as Auction[] || [])
      } else {
        console.error("Fetch auctions error:", result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Auctions fetch execution error:", message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuctions()
    }, 0)

    const handleRefresh = () => fetchAuctions()
    window.addEventListener('refreshData', handleRefresh)

    const channel = supabase
      .channel('admin-auctions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => fetchAuctions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAuctions())
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(channel)
    }
  }, [fetchAuctions])

  const resetForm = () => {
    setTitle(""); setAmazonUrl(""); setImageUrls(""); setVideoUrl(""); 
    setSpecs([{ key: "Brand", value: "Apple" }, { key: "Model", value: "Watch Series 11" }]); 
    setDescription(""); setAboutItems(""); setHighlights([]); setStartPrice(""); 
    setMinIncrement(""); setStartTime(""); setEndTime(""); setCautionAmount("");
    setEditingAuctionId(null); setEditingProductId(null);
  }

  const handleEditAuction = (auction: Auction) => {
    const product = auction.products
    if (!product) return

    setTitle(product.title || "")
    setAmazonUrl(product.amazon_url || "")
    setImageUrls(product.image_urls?.join(", ") || "")
    setVideoUrl(product.video_url || "")
    
    const productSpecs = product.specs as Record<string, string> || {}
    setSpecs(Object.entries(productSpecs).map(([key, value]) => ({ key, value: String(value) })))
    
    setDescription(product.description || "")
    setAboutItems(product.about_items?.join("\n") || "")
    setHighlights(product.highlights || [])
    
    setStartPrice(String(auction.start_price))
    setMinIncrement(String(auction.min_bid_increment))
    
    const formatForInput = (dateStr: string) => {
      const d = new Date(dateStr)
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }
    setStartTime(formatForInput(auction.start_time))
    setEndTime(formatForInput(auction.end_time))
    setCautionAmount(String(auction.caution_amount || 0))
    
    setEditingAuctionId(auction.id)
    setEditingProductId(product.id)
    setShowCreateModal(true)
  }

  const handleDeleteAuction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this auction?")) return
    const result = await deleteAuction(id)
    if (!result.success) alert("Error deleting auction: " + result.error)
    else fetchAuctions()
  }

  const handleCreateAuction = async () => {
    if (!title || !startPrice || !startTime || !endTime || !minIncrement) return alert("Please fill all required fields")
    setIsSubmitting(true)

    const imagesArray = imageUrls.split(",").map(url => url.trim()).filter(url => url !== "")
    const productPayload: Partial<Product> = {
      title,
      amazon_url: amazonUrl,
      image_urls: imagesArray,
      video_url: videoUrl,
      specs: specs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
      description: description,
      about_items: aboutItems.split("\n").filter(i => i.trim() !== ""),
      highlights: highlights,
      estimated_delivery_days: 14
    }

    const auctionPayload: Partial<Auction> = {
      start_price: parseFloat(startPrice),
      current_price: editingAuctionId ? undefined : parseFloat(startPrice), 
      min_bid_increment: parseFloat(minIncrement),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      caution_amount: parseFloat(cautionAmount) || 0,
      status: (new Date(startTime) <= new Date() && new Date(endTime) > new Date()) ? 'live' : 'pending'
    }

    const result = await saveAuction(productPayload, auctionPayload, editingAuctionId, editingProductId)

    setIsSubmitting(false)

    if (!result.success) {
      alert("Error saving auction: " + result.error)
    } else {
      setShowCreateModal(false)
      fetchAuctions()
      resetForm()
    }
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `products/${fileName}`

    try {
      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (error) {
        alert("Error uploading: " + error.message)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)
      
      return publicUrl
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed"
      alert(message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i])
        if (url) {
            setImageUrls(prev => prev ? `${prev}, ${url}` : url)
        }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) setVideoUrl(url)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]"><span className="text-white">{t.auction_management}</span></h2>
        <div className="flex gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('refreshData'))}
            className="bg-white/5 text-slate-400 text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            <Play size={14} className="rotate-90" />
            {t.refresh}
          </button>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-[#FF7A00] text-black text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-[#FF7A00]/20 uppercase"
          >
            <Plus size={16} />
            {t.create_auction}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search_placeholder} 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[#FF7A00]"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest text-slate-400">
          <Filter size={16} />
          {t.filter_status}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="lg:hidden space-y-3 overflow-y-auto h-full pb-20">
          {auctions.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-400">No auctions found.</div>
          ) : auctions.filter(a => a.id.includes(search) || (a.products?.title || "").toLowerCase().includes(search.toLowerCase())).map((auction) => (
            <div key={auction.id} className="glass-panel p-3 space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0 bg-cover bg-center border border-white/5" style={{ backgroundImage: `url(${auction.products?.image_urls?.[0] || 'https://via.placeholder.com/64'})` }}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      auction.status === 'live' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      auction.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-white/5'
                    }`}>
                      {auction.status}
                    </span>
                    <CountdownCell endTime={auction.end_time} />
                  </div>
                  <h4 className="font-black text-white text-sm truncate mt-1">{auction.products?.title || 'Unknown Product'}</h4>
                  <p className="text-[#FF7A00] font-black text-xs mt-1">${auction.current_price}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-2">
                <button onClick={() => handleEditAuction(auction)} className="flex-1 py-2 bg-white/5 text-slate-300 text-[10px] font-black rounded-lg uppercase border border-white/10">{t.edit}</button>
                <button 
                  onClick={async () => {
                    const amount = prompt(`${t.override_price} (USD):`, (auction.current_price).toString())
                    if (amount && parseFloat(amount) !== auction.current_price) {
                        const result = await updateAuctionPrice(auction.id, parseFloat(amount))
                        if (!result.success) alert("Error: " + result.error)
                        else {
                          alert(t.price_updated)
                          fetchAuctions()
                        }
                    }
                  }}
                  className={`flex-1 py-2 ${auction.current_price > 1000 ? 'bg-red-500/20 text-red-500 animate-pulse border-red-500/30' : 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/10'} text-[10px] font-black rounded-lg uppercase border`}
                >
                  {auction.current_price > 1000 ? `⚠️ ${t.caution}` : t.override_price}
                </button>
                <button onClick={() => handleDeleteAuction(auction.id)} className="p-2 bg-red-500/10 text-red-500 rounded border border-red-500/10"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block glass-panel overflow-hidden h-full">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-right border-collapse">
              <thead className="sticky top-0 bg-[#0F1115] z-10 border-b border-white/10">
                <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-black text-right">
                  <th className="px-6 py-4">{t.product_title} / ID</th>
                  <th className="px-6 py-4">{t.status}</th>
                  <th className="px-6 py-4">{t.current_price}</th>
                  <th className="px-6 py-4">{t.remaining_time}</th>
                  <th className="px-6 py-4 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auctions.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No auctions found.</td>
                  </tr>
                ) : auctions.filter(a => a.id.includes(search) || (a.products?.title || "").toLowerCase().includes(search.toLowerCase())).map((auction) => (
                  <tr key={auction.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/10 flex-shrink-0 bg-cover bg-center border border-white/5" style={{ backgroundImage: `url(${auction.products?.image_urls?.[0] || 'https://via.placeholder.com/32'})` }}></div>
                        <div>
                          <p className="font-black text-white text-xs truncate max-w-[200px]">{auction.products?.title || 'Unknown Product'}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{auction.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        auction.status === 'live' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        auction.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-white/5'
                      }`}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-[#FF7A00] text-sm">${auction.current_price}</td>
                    <td className="px-6 py-4"><CountdownCell endTime={auction.end_time} /></td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-1.5">
                        {auction.current_price > 1000 && <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-1.5 py-1 rounded border border-red-500/20 animate-pulse self-center">⚠️ {t.caution}</span>}
                        <button 
                          onClick={async () => {
                            const amount = prompt(`${t.override_price} (USD):`, (auction.current_price).toString())
                            if (amount && parseFloat(amount) !== auction.current_price) {
                                const result = await updateAuctionPrice(auction.id, parseFloat(amount))
                                if (!result.success) alert("Error: " + result.error)
                                else {
                                  alert(t.price_updated)
                                  fetchAuctions()
                                }
                            }
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-amber-500 hover:bg-amber-500/10 transition-colors" 
                          title={t.override_price}
                        >
                          <Filter size={14}/>
                        </button>
                        <button onClick={() => { setSelectedAuctionForBids(auction); fetchBids(auction.id); }} className="p-1.5 hover:bg-white/10 rounded text-[#FF7A00] hover:bg-[#FF7A00]/10 transition-colors" title={t.bid_history}><Search size={14}/></button>
                        <button onClick={() => handleEditAuction(auction)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Plus size={14}/></button>
                        <button onClick={() => handleDeleteAuction(auction.id)} className="p-1.5 hover:bg-white/10 rounded text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold mb-6">{editingAuctionId ? t.edit : t.create_auction}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">{t.amazon_url}</label>
                <div className="flex gap-2 text-right">
                  <div className="relative flex-1 text-right">
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={amazonUrl}
                      onChange={(e) => setAmazonUrl(e.target.value)}
                      placeholder="https://amazon.com/dp/..." 
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pr-10 pl-4 focus:outline-none focus:border-[#FF7A00] text-right" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.product_title}</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.image_urls}</label>
                  <div className="space-y-2">
                    <textarea 
                      rows={2}
                      value={imageUrls}
                      onChange={(e) => setImageUrls(e.target.value)}
                      placeholder="Paste URLs or use upload button..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                    />
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer w-fit text-sm">
                      <ImageIcon size={16} />
                      {isUploading ? t.uploading : t.upload_images}
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.video_url}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://video.com/v.mp4"
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                    />
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-sm">
                      <ImageIcon size={16} />
                      {isUploading ? "..." : t.edit}
                      <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                  {videoUrl && (
                    <div className="mt-4 animate-in zoom-in duration-300">
                      <p className="text-[10px] font-black uppercase text-[#FF7A00] mb-2">Video Preview (پێشبینی ڤیدیۆ)</p>
                      <VideoProfessional url={videoUrl} className="w-full aspect-video border border-[#FF7A00]/20 shadow-[0_0_20px_rgba(255,122,0,0.1)]" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.description}</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.about_item}</label>
                  <textarea 
                    rows={4}
                    value={aboutItems}
                    onChange={(e) => setAboutItems(e.target.value)}
                    placeholder="..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.highlights}</label>
                  <div className="flex flex-wrap gap-2">
                    {["Top Brand", "Highly Rated", "Trending", "Low Returns", "100K+ Orders"].map((h) => (
                      <button 
                        key={h}
                        onClick={() => {
                          if (highlights.includes(h)) setHighlights(highlights.filter(i => i !== h))
                          else setHighlights([...highlights, h])
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          highlights.includes(h) ? "bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]" : "bg-white/5 text-slate-400 border-white/10"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-white/5 pt-4">
                  <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider text-xs">{t.specs}</label>
                  <div className="space-y-3">
                    {specs.map((spec, index) => (
                      <div key={`spec-${index}`} className="flex gap-3">
                        <input 
                          type="text"
                          placeholder="تایبەندمەندی"
                          value={spec.key}
                          onChange={(e) => {
                            const newSpecs = [...specs]
                            newSpecs[index].key = e.target.value
                            setSpecs(newSpecs)
                          }}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-[#FF7A00] text-sm"
                        />
                        <input 
                          type="text"
                          placeholder="بڕ / جۆر"
                          value={spec.value}
                          onChange={(e) => {
                            const newSpecs = [...specs]
                            newSpecs[index].value = e.target.value
                            setSpecs(newSpecs)
                          }}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-[#FF7A00] text-sm"
                        />
                        <button 
                          onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                      className="text-[#FF7A00] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> {t.add_spec}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.start_price} (USD)</label>
                  <input 
                    type="number" 
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.min_increment} (USD)</label>
                  <input 
                    type="number" 
                    value={minIncrement}
                    onChange={(e) => setMinIncrement(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.caution_amount} (USD)</label>
                  <input 
                    type="number" 
                    value={cautionAmount}
                    onChange={(e) => setCautionAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.start_time}</label>
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.end_time}</label>
                  <input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-[#FF7A00]" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="px-6 py-2.5 rounded-lg font-medium hover:bg-white/5 transition-colors text-slate-300"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleCreateAuction}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg font-bold bg-[#FF7A00] text-black hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : (editingAuctionId ? t.save_changes : t.launch_auction)}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedAuctionForBids && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-[#FF7A00]">{t.bid_history}</span>
              </h3>
              <button onClick={() => setSelectedAuctionForBids(null)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
            </div>

            {proxyBids.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF7A00] flex items-center gap-2">
                  <Play size={10} fill="currentColor" /> {t.active_auto_bidders}
                </h4>
                {proxyBids.map((proxy) => (
                   <div key={proxy.id} className="flex items-center justify-between p-2 bg-[#FF7A00]/5 border border-[#FF7A00]/20 rounded-lg">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#FF7A00] flex items-center justify-center text-black text-[10px] font-black">🤖</div>
                        <div>
                          <p className="text-[11px] font-bold text-white">{proxy.users?.full_name}</p>
                          <p className="text-[9px] text-slate-500">{proxy.users?.phone}</p>
                        </div>
                     </div>
                     <p className="text-[11px] font-black text-[#FF7A00]">{t.max_bid}: ${proxy.max_amount}</p>
                   </div>
                ))}
              </div>
            )}
            
            <div className="space-y-3">
              {isBidsLoading ? (
                <div className="py-12 text-center text-slate-500">Loading...</div>
              ) : bids.length === 0 ? (
                <div className="py-12 text-center text-slate-500">{t.no_bids}</div>
              ) : (
                bids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-[#FF7A00]/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00] font-black text-[10px] uppercase">
                        {bid.users?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{bid.users?.full_name || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{bid.users?.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#FF7A00] text-sm">${bid.amount}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{new Date(bid.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
