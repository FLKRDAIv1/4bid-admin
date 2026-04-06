"use client"
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { MapPin, Search, Truck } from "lucide-react"
import { adminTranslations } from "@/lib/translations"
import { updateOrderStatus, getOrders } from "@/lib/orders-api"
import { Order } from "@/types"
import { motion } from "framer-motion"

const HUB_ORIGIN = { lat: 36.1912, lng: 44.0091 } // Erbil Central Hub
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const t = adminTranslations.ku

  const fetchOrders = useCallback(async () => {
    try {
      const result = await getOrders()
      if (result.success && result.data) {
        setOrders(result.data)
      } else {
        console.error("Fetch orders error:", result.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Orders fetch execution error:", message);
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 0)

    const handleRefresh = () => fetchOrders()
    window.addEventListener('refreshData', handleRefresh)

    const channel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!newStatus) return
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      
      if (!result.success) {
        alert("Error: " + result.error);
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Order Update Error:", message)
      alert("Error: " + message)
    }
  }

  return (
    <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]"><span className="text-white">{t.order_management}</span></h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('refreshData'))}
            className="bg-white/5 text-slate-400 text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            <Truck size={14} />
            {t.refresh}
          </button>
          <div className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Orders List */}
        <div className="lg:col-span-2 glass-panel flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search_placeholder} 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none focus:border-[#FF7A00] text-right"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 lg:p-0">
            {/* Desktop View: Table */}
            <table className="hidden lg:table w-full text-right border-collapse">
              <thead className="sticky top-0 bg-[#0F1115] z-10 border-b border-white/10">
                <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">{t.order_id}</th>
                  <th className="px-6 py-4">{t.customer}</th>
                  <th className="px-6 py-4">{t.status}</th>
                  <th className="px-6 py-4 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {orders.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-slate-400">{t.no_orders}</td>
                  </tr>
                ) : orders.filter(o => 
                    o.id.includes(search) || 
                    (o.users?.phone || "").includes(search) || 
                    (o.users?.full_name || "").toLowerCase().includes(search.toLowerCase())
                  ).map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-black text-[#FF7A00] truncate w-32 uppercase">{order.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5">${order.final_price}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white uppercase">{order.users?.full_name || 'No Name'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500 font-medium">{order.users?.phone || 'No Phone'}</p>
                        {order.live_lat && order.live_lng && (
                          <span className="flex items-center gap-1 text-[9px] text-green-500 font-black uppercase tracking-tighter">
                            <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
                            Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex items-center gap-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-white/5 text-white/40 border-white/5'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="bg-[#1a1c23] border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-[#FF7A00] text-white"
                        >
                          <option value="pending">{t.pending}</option>
                          <option value="processing">{t.processing}</option>
                          <option value="shipped">{t.shipped}</option>
                          <option value="delivered">{t.delivered}</option>
                          <option value="cancelled">{t.cancelled}</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View: Card List */}
            <div className="lg:hidden space-y-3">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">{t.no_orders}</div>
              ) : orders.filter(o => 
                    o.id.includes(search) || 
                    (o.users?.phone || "").includes(search) || 
                    (o.users?.full_name || "").toLowerCase().includes(search.toLowerCase())
                  ).map((order) => (
                <div key={order.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3 text-right">
                  <div className="flex justify-between items-center bg-black/20 -m-4 p-4 mb-2 rounded-t-xl">
                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-white/5 text-white/40 border-white/5'
                      }`}>
                        {order.status}
                      </span>
                      <p className="font-black text-[#FF7A00] uppercase text-xs">#{order.id.slice(0, 8)}</p>
                  </div>
                  
                  <div className="flex justify-between items-end gap-4 pt-2">
                    <div className="text-left">
                       <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t.actions}</p>
                       <select 
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="bg-[#1a1c23] border border-white/10 rounded px-2 py-1.5 text-[10px] font-black uppercase outline-none focus:border-[#FF7A00] text-white"
                        >
                          <option value="pending">{t.pending}</option>
                          <option value="processing">{t.processing}</option>
                          <option value="shipped">{t.shipped}</option>
                          <option value="delivered">{t.delivered}</option>
                          <option value="cancelled">{t.cancelled}</option>
                        </select>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-white text-sm">{order.users?.full_name || 'No Name'}</p>
                       <p className="text-[10px] text-slate-500 font-medium">{order.users?.phone || 'No Phone'}</p>
                       <p className="text-[10px] text-slate-400 uppercase mt-1">{order.delivery_locations?.[0]?.city || 'Pending Address'}</p>
                       <p className="text-xs font-black text-white mt-2">${order.final_price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logistics Map View */}
        <div className="glass-panel overflow-hidden flex flex-col relative min-h-[400px]">
           <div className="absolute top-4 left-4 right-4 z-10 glass-panel !bg-black/60 !border-white/5 px-4 py-3 flex items-center justify-between">
             <span className="font-semibold text-sm">Live Delivery Map</span>
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
           </div>
           
           <div className="flex-1 w-full h-full relative group">
             <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               scrolling="no" 
               src="https://www.openstreetmap.org/export/embed.html?bbox=43.5,35.5,45.5,37.5&amp;layer=mapnik"
               style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.2)' }}
               className="grayscale contrast-125"
             ></iframe>
             
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Hub Point Indicator */}
                <div 
                   className="absolute h-4 w-4 bg-[#FF7A00] rounded-full border-2 border-white/20 shadow-[0_0_15px_rgba(255,122,0,0.6)] z-20"
                   style={{ left: '25.45%', top: '65.44%', transform: 'translate(-50%, -50%)' }}
                >
                   <div className="absolute inset-0 animate-ping bg-[#FF7A00] rounded-full opacity-40"></div>
                </div>

                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                   {orders.filter(o => o.live_lat && o.live_lng).map((order) => {
                      const startX = 25.45;
                      const startY = 65.44;
                      const endX = (order.live_lng! - 43.5) / 2 * 100;
                      const endY = 100 - ((order.live_lat! - 35.5) / 2 * 100);
                      
                      // Calculate Bezier Control Point (curved path)
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2 - 8; // Slight upward curve
                      
                      return (
                        <motion.path 
                           key={`line-${order.id}`}
                           d={`M ${startX}% ${startY}% Q ${midX}% ${midY}% ${endX}% ${endY}%`}
                           stroke="#FF7A00"
                           strokeWidth="2"
                           fill="none"
                           strokeDasharray="5,10"
                           initial={{ pathLength: 0, opacity: 0 }}
                           animate={{ 
                             pathLength: 1, 
                             opacity: 0.6,
                             strokeDashoffset: [0, -30] 
                           }}
                           transition={{ 
                             pathLength: { duration: 1.5, ease: "easeOut" },
                             opacity: { duration: 0.3 },
                             strokeDashoffset: { repeat: Infinity, duration: 1, ease: "linear" }
                           }}
                        />
                      );
                   })}
                </svg>

                {orders.filter(o => o.live_lat && o.live_lng).map((order) => {
                    // Simple linear interpolation for demonstration within the fixed Iraq-focused bounding box
                    // Bbox: 43.5,35.5,45.5,37.5 (approx 2 degrees wide/high)
                    const latPercent = 100 - ((order.live_lat! - 35.5) / 2 * 100);
                    const lngPercent = (order.live_lng! - 43.5) / 2 * 100;
                    
                    return (
                        <div key={order.id} className="absolute flex flex-col items-center transition-all duration-1000" 
                             style={{ top: `${Math.max(0, Math.min(100, latPercent))}%`, left: `${Math.max(0, Math.min(100, lngPercent))}%` }}>
                          <div className="relative">
                            <MapPin className="text-[#FF7A00] drop-shadow-[0_0_8px_rgba(255,122,0,1)]" size={32} />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                          </div>
                          <div className="mt-1 bg-[#1a1c23] backdrop-blur-md text-[10px] px-2 py-1 rounded-full border border-[#FF7A00]/40 text-white font-bold whitespace-nowrap shadow-xl flex flex-col items-center">
                            <span>{order.users?.full_name || 'USER'}</span>
                            <span className="text-[8px] text-slate-400">{order.users?.phone}</span>
                          </div>
                        </div>
                    );
                })}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
