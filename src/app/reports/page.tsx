"use client"
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { AlertCircle, Search, Phone, Tag, Clock } from "lucide-react"
import { adminTranslations } from "@/lib/translations"
import { updateReportStatus, getReports } from "./actions"
import { Report } from "@/types"

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const t = adminTranslations.ku

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await getReports()
      if (result.success && result.data) {
        setReports(result.data)
      } else {
        console.error("Fetch reports error:", result.error);
      }
    } catch (err: unknown) {
      console.error("Reports fetch execution error");
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports()
    }, 0)

    const channel = supabase.channel('reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId)
    try {
      const result = await updateReportStatus(reportId, newStatus)
      
      if (!result.success) {
        alert(`Error: ${result.error}`);
      } else {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus as Report['status'] } : r))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Server Action Execution error:", message);
      alert("Error: " + message);
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusLabel = (status: string) => {
    const key = status as keyof typeof t
    return (t as Record<string, string>)[key] || status
  }

  const filteredReports = reports.filter(r => 
    (r.phone_number || "").includes(search) || 
    (r.reason || "").includes(search) ||
    (r.details || "").includes(search)
  )

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`skeleton ${className}`}></div>
  )

  return (
    <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]">
          <span className="text-white">{t.report_management}</span>
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchReports()}
            className="bg-white/5 text-slate-400 text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            {isLoading ? <Clock className="animate-spin" size={14} /> : <AlertCircle size={14} />}
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="glass-panel flex flex-col overflow-hidden flex-1">
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

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest bg-white/5 border border-white/5 m-4 rounded-2xl">
              {t.no_reports || "هیچ ڕاپۆرتێک نییە"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 relative overflow-hidden group hover:border-[#FF7A00]/30 transition-all">
                  <div className="flex items-start justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      report.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      report.status === 'investigating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {getStatusLabel(report.status)}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                        {new Date(report.created_at).toLocaleString('ku-IQ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <div>
                      <h3 className="text-white font-black text-lg">{report.reason}</h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        {report.details}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                       <div className="flex items-center justify-end gap-2 text-[#FF7A00]">
                         <span className="text-xs font-bold">{report.phone_number}</span>
                         <Phone size={14} />
                       </div>
                       {report.target_type && (
                         <div className="flex items-center justify-end gap-2 text-slate-400">
                           <span className="text-[10px] font-bold uppercase">{report.target_type}: {report.target_id?.slice(0, 8)}</span>
                           <Tag size={12} />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button 
                      disabled={updatingId === report.id}
                      onClick={() => handleUpdateStatus(report.id, 'investigating')}
                      className={`flex-1 ${updatingId === report.id ? 'opacity-50' : 'bg-white/5 hover:bg-white/10'} text-white py-2 rounded-lg text-[10px] font-black uppercase transition-all`}
                    >
                      {updatingId === report.id ? 'Updating...' : 'Investigate'}
                    </button>
                    <button 
                      disabled={updatingId === report.id}
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      className={`flex-1 ${updatingId === report.id ? 'opacity-50' : 'bg-green-500/10 hover:bg-green-500/20'} text-green-400 py-2 rounded-lg text-[10px] font-black uppercase border border-green-500/20 transition-all`}
                    >
                      {updatingId === report.id ? 'Updating...' : 'Resolve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
