"use client"
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Search, CheckCircle, Trash2, UserPlus, X, Image as ImageIcon } from "lucide-react"
import { adminTranslations } from "@/lib/translations"
import { getUsers, updateUserStatus, updateUserStrikes, updateUserPayLimit, deleteUser, createUser } from "@/lib/users-api"
import { User } from "@/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ full_name: "", email: "", username: "", phone: "", city: "", pay_limit: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const t = adminTranslations.ku;

  const fetchUsersData = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await getUsers()
      if (result.success && result.data) {
        setUsers(result.data as User[])
      } else {
        console.error("Users fetch error:", result.error)
      }
    } catch (err: unknown) {
      console.error("Users fetch execution error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsersData()
    }, 0)

    const handleRefresh = () => fetchUsersData()
    window.addEventListener('refreshData', handleRefresh)

    const userChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsersData())
      .subscribe()
    
    const reportChannel = supabase
      .channel('admin-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchUsersData())
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('refreshData', handleRefresh)
      supabase.removeChannel(userChannel)
      supabase.removeChannel(reportChannel)
    }
  }, [fetchUsersData])

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    if (!confirm(t.confirm_delete.replace("سڕینەوەی ئەم بڕگەیە", newStatus))) return
    const result = await updateUserStatus(userId, newStatus)
    if (!result.success) alert("Error: " + result.error)
    fetchUsersData()
  }

  const handleUpdateStrikes = async (userId: string, currentStrikes: number, delta: number) => {
    const newStrikes = Math.max(0, Math.min(4, currentStrikes + delta))
    const result = await updateUserStrikes(userId, newStrikes)
    if (!result.success) alert("Error: " + result.error)
    fetchUsersData()
  }

  const handleUpdatePayLimit = async (userId: string, newLimit: number) => {
    const result = await updateUserPayLimit(userId, newLimit)
    if (!result.success) alert("Error: " + result.error)
    fetchUsersData()
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t.confirm_delete)) return
    const result = await deleteUser(userId)
    if (!result.success) alert("Error: " + result.error)
    fetchUsersData()
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const result = await createUser(newUser as Omit<User, 'id' | 'status' | 'strikes' | 'created_at'>)
    if (!result.success) alert("Error: " + result.error)
    else {
      setIsAddModalOpen(false)
      setNewUser({ full_name: "", email: "", username: "", phone: "", city: "", pay_limit: 0 })
      fetchUsersData()
    }
    setIsSaving(false)
  }

  const filteredUsers = users.filter(u => 
    (u.phone || '').includes(search) || 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`skeleton ${className}`}></div>
  )

  return (
    <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight uppercase text-[#FF7A00]"><span className="text-white">{t.user_management}</span></h2>
        <div className="flex gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('refreshData'))}
            className="bg-white/5 text-slate-400 text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 uppercase"
          >
            <CheckCircle size={16} />
            {t.refresh}
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#FF7A00] text-black text-xs font-black h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-[#FF7A00]/20 uppercase">
            <UserPlus size={16} /> {t.add_user}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 text-right">
        <div className="relative flex-1 text-right">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search_placeholder} 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[#FF7A00] text-right"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3 overflow-y-auto h-full pb-20">
          {isLoading ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">{t.no_users}</div>
          ) : filteredUsers.map((user) => (
            <div key={user.id} className="glass-panel p-4 space-y-4 border border-white/5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${user.profile_image_url || 'https://via.placeholder.com/40'})` }}></div>
                  <div>
                    <h4 className="font-black text-white text-sm">{user.full_name || 'No Name'}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-[#FF7A00]">{user.phone}</p>
                      {user.reportCount && user.reportCount > 0 && (
                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {user.reportCount} ڕاپۆرت
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {user.status}
                  </span>
                  <div className="flex gap-2">
                    {user.document_url && <a href={user.document_url.startsWith('http') ? user.document_url : `https://fdjtsehoebichpimansk.supabase.co/storage/v1/object/public/verification-documents/${user.document_url}`} target="_blank" className="text-[9px] font-black text-blue-400 uppercase underline">{t.id_card}</a>}
                    {user.face_url && <a href={user.face_url.startsWith('http') ? user.face_url : `https://fdjtsehoebichpimansk.supabase.co/storage/v1/object/public/verification-documents/${user.face_url}`} target="_blank" className="text-[9px] font-black text-orange-400 uppercase underline">{t.face_photo}</a>}
                  </div>
                </div>
              </div>
                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{t.pay_limit}</span>
                    <input 
                      type="number" 
                      defaultValue={user.pay_limit || 0}
                      onBlur={(e) => handleUpdatePayLimit(user.id, Number(e.target.value))}
                      className="w-20 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-black text-[#FF7A00] text-center focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStrikes(user.id, user.strikes || 0, 1)} className="flex-1 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded uppercase border border-red-500/10">+ {t.strikes}</button>
                      {user.status === 'banned' && (
                        <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="px-3 py-1.5 bg-green-500 text-black text-[10px] font-black rounded uppercase">
                          {t.unban}
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded border border-red-500/10"><Trash2 size={14}/></button>
                    </div>
                </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block glass-panel overflow-hidden h-full">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-right border-collapse">
              <thead className="sticky top-0 bg-[#0F1115] z-10 border-b border-white/10">
                <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">{t.user_profile}</th>
                  <th className="px-6 py-4 text-center">{t.verification}</th>
                  <th className="px-6 py-4 text-center">{t.pay_limit}</th>
                  <th className="px-6 py-4 text-center">{t.strikes}</th>
                  <th className="px-6 py-4 text-center">{t.status}</th>
                  <th className="px-6 py-4 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm">
                      {t.no_users}
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <div>
                          <div className="flex items-center gap-2 justify-end">
                            {user.reportCount && user.reportCount > 0 && (
                              <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-500/20">
                                {user.reportCount} REPORTS
                              </span>
                            )}
                            <p className="font-black text-white text-xs">{user.full_name || 'No Name'}</p>
                          </div>
                          <p className="text-[10px] text-[#FF7A00] font-bold">{user.phone}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 bg-cover bg-center border border-white/5" style={{ backgroundImage: `url(${user.profile_image_url || 'https://via.placeholder.com/32'})` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center gap-2">
                         {user.document_url && <a href={user.document_url.startsWith('http') ? user.document_url : `https://fdjtsehoebichpimansk.supabase.co/storage/v1/object/public/verification-documents/${user.document_url}`} target="_blank" className="p-1 hover:bg-white/5 rounded"><ImageIcon size={14} className="text-blue-400" /></a>}
                         {user.face_url && <a href={user.face_url.startsWith('http') ? user.face_url : `https://fdjtsehoebichpimansk.supabase.co/storage/v1/object/public/verification-documents/${user.face_url}`} target="_blank" className="p-1 hover:bg-white/5 rounded"><ImageIcon size={14} className="text-orange-400" /></a>}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <input 
                         type="number" 
                         defaultValue={user.pay_limit || 0}
                         onBlur={(e) => handleUpdatePayLimit(user.id, Number(e.target.value))}
                         className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-black text-[#FF7A00] text-center focus:outline-none focus:border-[#FF7A00] transition-all"
                       />
                     </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                         {[1,2,3].map(s => <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= (user.strikes || 0) ? 'bg-red-500' : 'bg-white/10'}`}></div>)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded border border-red-500/10"><Trash2 size={12}/></button>
                        <button onClick={() => handleUpdateStrikes(user.id, user.strikes || 0, 1)} className="px-2 py-1 bg-white/5 text-white text-[9px] font-black rounded border border-white/10 uppercase">+ {t.strikes}</button>
                        {user.status === 'pending_approval' && <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="px-2 py-1 bg-blue-500 text-white text-[9px] font-black rounded uppercase">{t.approve_user}</button>}
                        {user.status === 'banned' && <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="px-2 py-1 bg-green-500 text-black text-[9px] font-black rounded uppercase">{t.unban}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 border border-white/10">
          <div className="glass-panel w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
            <h3 className="text-2xl font-black mb-8 text-white">{t.add_user}</h3>
            
            <form onSubmit={handleAddUser} className="space-y-6 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.full_name}</label>
                  <input type="text" required value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Username</label>
                  <input type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.phone_number}</label>
                  <input type="tel" required value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.email}</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.city}</label>
                  <input type="text" value={newUser.city} onChange={e => setNewUser({...newUser, city: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.pay_limit}</label>
                  <input type="number" required value={newUser.pay_limit} onChange={e => setNewUser({...newUser, pay_limit: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF7A00] text-right" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-transform active:scale-95 disabled:opacity-50">
                  {isSaving ? '...' : t.add_user}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 bg-white/5 border border-white/10 rounded-xl font-black text-slate-400 hover:text-white transition-colors uppercase text-sm">{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
