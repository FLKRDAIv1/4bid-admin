"use client"
"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { DollarSign, Gavel, Package, Users, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { adminTranslations } from "@/lib/translations"
import { getDashboardStats } from "./dashboard-actions"
import { DashboardStats, ChartData, DashboardBid, DashboardUser } from "@/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    activeAuctions: 0,
    pendingCheckouts: 0,
    totalUsers: 0,
    activeSupport: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [liveBids, setLiveBids] = useState<DashboardBid[]>([])
  const [pendingUsers, setPendingUsers] = useState<DashboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = adminTranslations.ku;

  const fetchStatsData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getDashboardStats()
      if (result.success && result.data) {
        setStats(result.data.stats)
        setChartData(result.data.chartData)
        setLiveBids(result.data.liveBids)
        setPendingUsers(result.data.pendingUsers)
      } else {
        setError(result.error || "Failed to fetch stats")
      }
    } catch (err: unknown) {
      setError("Execution error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Wrap initial fetch in setTimeout to move it out of the synchronous render/effect cycle
    const timer = setTimeout(() => {
      fetchStatsData()
    }, 0)

    const handleRefresh = () => fetchStatsData()
    window.addEventListener('refreshData', handleRefresh)

    const bidsSub = supabase.channel('public:bids')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, () => {
         fetchStatsData()
      })
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(bidsSub)
    }
  }, [fetchStatsData])

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`skeleton ${className}`}></div>
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]"><span className="text-white">{t.overview}</span></h2>
        <div className="flex gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('refreshData'))}
            className="bg-white/5 text-slate-400 text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            <Activity size={14} />
            {t.refresh}
          </button>
          <a href="/auctions" className="bg-[#FF7A00] text-black text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-[#FF7A00]/20 uppercase">
            <Gavel size={14} />
            {t.auctions}
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: t.revenue, val: `$${new Intl.NumberFormat('en-US').format(stats.revenue)}`, icon: <DollarSign size={14} className="text-[#FF7A00]" /> },
          { label: t.active_auctions, val: stats.activeAuctions, icon: <Activity size={14} className="text-blue-500" /> },
          { label: t.pending_checkouts, val: stats.pendingCheckouts, icon: <Package size={14} className="text-amber-500" /> },
          { label: t.total_users, val: stats.totalUsers, icon: <Users size={14} className="text-purple-500" /> },
          { label: t.active_support, val: stats.activeSupport, icon: <Activity size={14} className="text-red-500" /> }
        ].map((card, i) => (
          <div key={i} className="glass-panel p-3 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-tighter">{card.label}</span>
              {card.icon}
            </div>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-xl font-black">{card.val}</p>}
          </div>
        ))}
      </div>

      {error && (
        <div className="glass-panel !bg-red-500/10 border-red-500/20 p-4 flex items-center justify-between">
            <span className="text-red-400 text-sm font-bold">⚠️ {error}</span>
            <button onClick={() => fetchStatsData()} className="text-xs font-black uppercase text-white hover:underline">{t.refresh}</button>
        </div>
      )}

      {/* Charts and Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-panel p-4">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4">{t.revenue_chart}</h3>
          <div style={{ width: '100%', height: 300 }}>
            {isLoading ? (
               <div className="w-full h-full space-y-4">
                  <Skeleton className="h-full w-full rounded-xl"/>
               </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#8A8D93" />
                  <YAxis stroke="#8A8D93" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F1115', border: '1px solid rgba(255,122,0,0.5)', borderRadius: '8px' }} 
                    itemStyle={{ color: '#FF7A00' }} 
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#FF7A00" strokeWidth={3} dot={{ r: 4, fill: '#FF7A00' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-500">No revenue data yet.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Market Activity Ticker */}
          <div className="glass-panel p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest">{t.market_activity}</h3>
              <Activity size={14} className={`text-[#FF7A00] ${isLoading ? '' : 'animate-pulse'}`} />
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {isLoading ? (
                [1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)
              ) : liveBids.length === 0 ? (
                <p className="text-slate-500 text-sm">Waiting for live bids...</p>
              ) : liveBids.map((bid) => (
                <div key={bid.id} className="flex items-center gap-3 text-sm border-b border-white/5 pb-3 group">
                  <div className="w-2 h-2 rounded-full bg-[#FF7A00] group-hover:scale-125 transition-transform"></div>
                  <div className="flex-1">
                    <span className="font-bold text-white">${bid.amount}</span> 
                    <span className="text-slate-400"> on </span>
                    <a href={`/auctions/${bid.auction_id}`} className="text-[#FF7A00] hover:underline truncate inline-block max-w-[120px] align-bottom font-medium">
                      {bid.auctions?.products?.title}
                    </a>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{format(new Date(bid.created_at), 'HH:mm:ss')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals Feed */}
          <div className="glass-panel p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest">{t.pending_approvals}</h3>
              <Users size={14} className="text-blue-400" />
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[200px] pr-2">
               {isLoading ? (
                  [1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)
               ) : pendingUsers.length === 0 ? (
                   <p className="text-slate-400 text-sm">No users pending approval.</p>
               ) : pendingUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{u.full_name || 'New User'}</p>
                      <p className="text-xs text-slate-400">{u.city || 'Location Pending'}</p>
                    </div>
                    <a href="/users" className="text-xs font-bold text-blue-400 hover:text-blue-300">{t.review}</a>
                  </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
