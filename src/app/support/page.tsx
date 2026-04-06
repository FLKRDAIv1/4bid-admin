"use client"
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Clock, AlertCircle } from 'lucide-react'
import { adminTranslations } from '@/lib/translations'
import { acceptSupportRequest, sendSupportMessage, getSupportRequests, getSupportMessages } from './actions'
import { SupportRequest, SupportMessage } from '@/types'

export default function SupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedRequest = requests.find(r => r.id === selectedRequestId)
  
  const t = adminTranslations.ku;

  const selectedUserIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    selectedUserIdRef.current = selectedRequest?.user_id || null
  }, [selectedRequest?.user_id])
  
  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getSupportRequests()
      if (result.success) {
        setRequests(result.data || [])
      } else {
        console.error("Fetch support requests error:", result.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Support requests fetch execution error:", message);
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const result = await getSupportMessages(userId)
      if (result.success) {
        setMessages(result.data || [])
      } else {
        console.error("Fetch support messages error:", result.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Support messages fetch execution error:", message);
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    
    const handleRefresh = () => fetchRequests()
    window.addEventListener('refreshData', handleRefresh)

    const channel = supabase
      .channel('admin-support-global')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'support_requests' 
      }, () => fetchRequests())
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages' 
      }, (payload) => {
          const newMsg = payload.new as SupportMessage
          if (newMsg.user_id === selectedUserIdRef.current) {
              setMessages(prev => {
                  if (prev.some(m => m.id === newMsg.id)) return prev
                  return [...prev, newMsg]
              })
          }
      })
      .subscribe()

    return () => { 
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(channel) 
    }
  }, [fetchRequests])

  useEffect(() => {
    if (selectedRequest?.user_id) {
      fetchMessages(selectedRequest.user_id)
    }
  }, [selectedRequestId, selectedRequest?.user_id, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAcceptRequest = async (id: string) => {
      const result = await acceptSupportRequest(id)
      
      if (!result.success) {
        console.error("Support Accept Error:", result.error, "[Code: " + result.code + "]");
        alert("Execution Error: " + result.error);
      } else {
        fetchRequests()
      }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRequest) return

    const content = newMessage
    setNewMessage('')

    const result = await sendSupportMessage(selectedRequest.user_id, content)
    
    if (result.success && result.data) {
        const sentData = result.data
        setMessages(prev => {
            if (prev.some(m => m.id === sentData.id)) return prev
            return [...prev, sentData]
        })
    } else if (!result.success) {
      console.error("Send Message Error:", result.error, "[Code: " + result.code + "]");
      alert("Error sending message: " + result.error);
    }
  }

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`skeleton ${className}`}></div>
  )

  return (
    <div className="flex -mt-2 lg:mt-0 h-[calc(100vh-145px)] lg:h-[calc(100vh-140px)] gap-3 lg:gap-6 antialiased overflow-hidden text-right">
      {/* Sidebar: List of Requests */}
      <div className={`${selectedRequestId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 glass-panel flex-col overflow-hidden`}>
        <div className="p-4 lg:p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h2 className="text-base lg:text-xl font-black uppercase tracking-tighter text-white">{t.support}</h2>
            <div className="bg-[#FF7A00] text-black text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,122,0,0.3)]">LIVE</div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="p-4 space-y-4">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest opacity-30">هیچ داواکارییەک نییە</div>
            ) : requests.map(req => (
                <button
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`w-full p-4 border-b border-white/5 text-right transition-all relative ${selectedRequestId === req.id ? 'bg-[#FF7A00]/10' : 'hover:bg-white/5'}`}
                >
                    {selectedRequestId === req.id && <div className="absolute inset-y-0 left-0 w-1 bg-[#FF7A00] shadow-[0_0_15px_#FF7A00]"></div>}
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${req.status === 'pending' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            {t[req.status as keyof typeof t] || req.status}
                        </span>
                    </div>
                    <p className="font-black text-sm text-white truncate">{req.users?.full_name || 'بەکارهێنەر'}</p>
                    <p className="text-[10px] text-[#FF7A00] font-black font-mono tracking-tighter">{req.users?.phone}</p>
                </button>
            ))}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div className={`${!selectedRequestId ? 'hidden lg:flex' : 'flex'} flex-1 glass-panel flex-col overflow-hidden`}>
        {selectedRequest ? (
            <>
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <h3 className="font-black text-sm lg:text-base uppercase tracking-tight text-white">{selectedRequest.users?.full_name}</h3>
                            <p className="text-[9px] lg:text-xs text-slate-400 font-bold opacity-60 uppercase">{selectedRequest.users?.phone}</p>
                        </div>
                    </div>
                    
                    {selectedRequest.status === 'pending' ? (
                        <button onClick={() => handleAcceptRequest(selectedRequest.id)} className="bg-[#FF7A00] text-black px-6 py-2 rounded-lg font-black text-xs hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,122,0,0.2)]">
                            وەڵامدانەوە
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black font-mono text-[#FF7A00] uppercase">
                                    {new Date(selectedRequest.expires_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="h-10 w-10 lg:h-10 lg:w-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                <Clock size={16} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/40">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-xl shadow-lg text-right ${msg.is_from_admin ? 'bg-[#FF7A00] text-black rounded-tr-none shadow-[#FF7A00]/10' : 'bg-white/5 text-white rounded-tl-none border border-white/10'}`}>
                                <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] mt-2 font-black uppercase tracking-tighter ${msg.is_from_admin ? 'text-black/40' : 'text-slate-500'} font-mono`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {selectedRequest.status === 'active' && (
                    <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5 flex gap-4">
                        <button type="submit" className="bg-[#FF7A00] text-black p-3 rounded-xl hover:bg-orange-600 transition-colors shadow-[0_0_15px_rgba(255,122,0,0.3)]">
                            <Send size={20} className="rotate-180" />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t.type_message}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#FF7A00] transition-colors text-right text-white"
                        />
                    </form>
                )}
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 opacity-40">
                <AlertCircle size={48} className="mb-4" />
                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">{t.admin_support}</h3>
                <p className="max-w-[240px] text-sm font-bold leading-tight">بەکارهێنەرێک هەڵبژێرە بۆ دەستپێکردنی قسەکردن</p>
            </div>
        )}
      </div>
    </div>
  )
}
