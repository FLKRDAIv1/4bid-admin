"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User, ShieldCheck } from "lucide-react"

export default function AdminLoginPage() {
  const [step, setStep] = useState<'login' | 'security'>('login')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [favoriteColor, setFavoriteColor] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Step 1: Credentials
    if (email === "flkrdstudio@gmail.com" && password === "121212148790") {
      setStep('security')
      setIsLoading(false)
    } else {
      setError("Credentials Incorrect")
      setIsLoading(false)
    }
  }

  const handleSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Step 2: Favorite Color
    if (favoriteColor.trim().toLowerCase() === "red and white") {
      localStorage.setItem("4bid_admin_session", "active")
      router.push("/")
    } else {
      setError("Incorrect Answer")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#FF7A00]/10 mb-4 ring-1 ring-[#FF7A00]/20">
            <ShieldCheck className="text-[#FF7A00]" size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">4BID <span className="text-[#FF7A00]">ADMIN</span></h1>
          <p className="text-slate-400 text-sm">
            {step === 'login' ? "تەنها بۆ کارمەندانی ڕێگەپێدراو" : "Security Check Step 2"}
          </p>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ئیمەیڵی تەنها ئەدمین" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="وشەی نهێنی" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#FF7A00] to-orange-500 text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition-all disabled:opacity-50 disabled:grayscale"
            >
              Next Step (دوایین هەنگاو)
            </button>
          </form>
        ) : (
          <form onSubmit={handleSecurity} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm text-slate-400 block mb-2 px-1 text-center">What is your favorite color?</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={favoriteColor}
                  onChange={(e) => setFavoriteColor(e.target.value)}
                  placeholder="Type answer here..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white text-center font-bold focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-[#FF7A00] text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(255,122,0,0.4)] transition-all"
            >
              Verify & Enter
            </button>
            <button 
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-slate-500 text-xs hover:text-[#FF7A00] transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest leading-loose">
          تەنها بۆ کەسانی ڕێگەپێدراو. هەموو هەوڵەکانی چوونەژوورەوە تۆمار دەکرێن و چاودێری دەکرێن.
        </p>
      </div>
    </div>
  )
}
