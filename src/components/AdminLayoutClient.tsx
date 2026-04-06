"use client"

import { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Gavel, Package, Users, Settings, ShoppingBag, MessageSquare, LogOut, Lock, Menu, X, RefreshCw } from 'lucide-react';
import { adminTranslations } from "@/lib/translations";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [pinVerified, setPinVerified] = useState(false)
  const [pin, setPin] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 1. Synchronize mounting first
  useEffect(() => {
    setIsMounted(true)
    const session = localStorage.getItem("4bid_admin_session")
    if (session) {
      setIsAuthorized(true)
    }
  }, [])

  // 2. Redirect if not authorized (only after mounting)
  useEffect(() => {
    if (isMounted && !isAuthorized && pathname !== "/login") {
      router.push("/login")
    }
  }, [isMounted, pathname, router, isAuthorized])

  const closeSidebar = () => setIsSidebarOpen(false)

  const t = adminTranslations.ku;

  // 3. Prevent Hydration Errors: Return a baseline shell during SSR and first client render
  if (!isMounted) {
    return <div className="bg-[#0F1115] w-full h-full min-h-screen"></div>
  }

  if (!isAuthorized && pathname !== "/login") {
    return <div className="bg-[#0F1115] w-full h-full min-h-screen"></div>
  }

  if (pathname === "/login") {
    return <>{children}</>
  }

  // PIN Protection on every refresh (useState resets)
  if (!pinVerified) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0F1115] flex items-center justify-center p-4">
        <div className="max-w-xs w-full glass-panel p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-[#FF7A00]/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="text-[#FF7A00]" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black">قوفڵی دڵنیایی</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">١١ ٨٦ پێویستە</p>
          </div>
          <input 
            type="password" 
            autoFocus
            value={pin}
            onChange={(e) => {
              const val = e.target.value.trim().slice(0, 4);
              setPin(val);
              if (val === "1186") setPinVerified(true);
            }}
            onPaste={(e) => {
              const pastedData = e.clipboardData.getData('text').trim().slice(0, 4);
              if (pastedData === "1186") {
                setPin(pastedData);
                setPinVerified(true);
              }
            }}
            placeholder="****"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 text-center text-2xl font-black tracking-[1em] focus:outline-none focus:border-[#FF7A00] transition-all"
          />
          <div className="flex justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${pin.length >= 1 ? 'bg-[#FF7A00]' : 'bg-white/10'}`}></div>
            <div className={`w-3 h-3 rounded-full ${pin.length >= 2 ? 'bg-[#FF7A00]' : 'bg-white/10'}`}></div>
            <div className={`w-3 h-3 rounded-full ${pin.length >= 3 ? 'bg-[#FF7A00]' : 'bg-white/10'}`}></div>
            <div className={`w-3 h-3 rounded-full ${pin.length >= 4 ? 'bg-[#FF7A00]' : 'bg-white/10'}`}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1115] text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative top-0 right-0 z-40 h-full w-60 flex-shrink-0 border-l lg:border-r border-white/10 bg-[#0F1115] lg:bg-white/5 backdrop-blur-md flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="4bid Logo" 
              width={32} 
              height={32} 
              className="shadow-[0_0_15px_rgba(255,122,0,0.3)] rounded-lg" 
            />
            <h1 className="text-lg font-black tracking-tighter text-[#FF7A00]">4BID <span className="text-white">ADMIN</span></h1>
          </div>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
          <Link href="/" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">{t.dashboard}</span>
          </Link>
          <Link href="/auctions" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/auctions" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <Gavel size={18} />
            <span className="text-sm font-medium">{t.auctions}</span>
          </Link>
          <Link href="/products" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/products" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <Package size={18} />
            <span className="text-sm font-medium">{t.products}</span>
          </Link>
          <Link href="/orders" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/orders" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <ShoppingBag size={18} />
            <span className="text-sm font-medium">{t.orders}</span>
          </Link>
          <Link href="/users" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/users" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <Users size={18} />
            <span className="text-sm font-medium">{t.users}</span>
          </Link>
          <Link href="/support" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/support" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <MessageSquare size={18} />
            <span className="text-sm font-medium">{t.support}</span>
          </Link>
          <Link href="/reports" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 rounded-lg transition-colors ${pathname === "/reports" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <Gavel size={18} className="rotate-180" />
            <span className="text-sm font-medium">{t.reports}</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link href="/settings" onClick={closeSidebar} className={`flex items-center gap-3 px-3 py-1.5 lg:py-2.5 w-full rounded-lg transition-colors ${pathname === "/settings" ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
            <Settings size={18} />
            <span className="text-sm font-medium">{t.settings}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Top Header Placeholder */}
          <header className="h-14 flex-shrink-0 border-b border-white/10 flex items-center px-4 lg:px-6 justify-between z-10 bg-[#0F1115]/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button 
               className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
               onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="text-xs font-bold text-slate-400 hidden sm:block uppercase tracking-widest">{t.welcome_admin}</div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('refreshData'));
                }}
                className="flex items-center gap-2 p-2 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-[#FF7A00] transition-all hover:bg-[#FF7A00]/5 hover:border-[#FF7A00]/20"
                title={t.refresh}
              >
                <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:block">{t.refresh}</span>
                <RefreshCw size={16} className={`${isAuthorized ? "animate-spin-slow" : ""}`} style={{ animationDuration: '3s' }} />
              </button>

              <button 
               onClick={() => {
                 localStorage.removeItem("4bid_admin_session")
                 router.push("/login")
               }}
               className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
               title={t.logout}
              >
                <LogOut size={18} />
              </button>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF7A00] to-orange-400 border border-white/10"></div>
            </div>
          </header>
         
         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto p-3 lg:p-6 relative z-0">
           {children}
         </div>
      </main>
    </div>
  );
}
