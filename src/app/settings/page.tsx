"use client"
"use client"

import { useState } from "react"
import { Shield, Globe, Save } from "lucide-react"
import { adminTranslations } from "@/lib/translations"

interface AdminSettings {
  maintenanceMode: boolean
  commissionRate: number
  minBidIncrement: number
  iraqShippingBase: number
  globalAlert: string
  authLockout: number
}

export default function SettingsPage() {
  const t = adminTranslations.ku;
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    commissionRate: 5,
    minBidIncrement: 10,
    iraqShippingBase: 15,
    globalAlert: "بەخێربێن بۆ 4bid v1.0.4 - سیستەم ئامادەیە",
    authLockout: 5
  })

  const handleSave = () => {
    // Simulated save
    alert(t.save_changes + " - " + t.success)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right">
      <div className="flex flex-col items-end">
        <h2 className="text-3xl font-black tracking-tight text-white uppercase">{t.settings}</h2>
        <p className="text-slate-500 mt-2 text-sm font-bold">ڕێکخستنە گشتییەکانی ژینگەی 4bid</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Core Logistics */}
        <div className="glass-panel p-8 space-y-6 border border-white/5 hover:border-[#FF7A00]/20 transition-all">
          <h3 className="text-lg font-black flex items-center justify-end gap-2 border-b border-white/10 pb-4 text-white uppercase tracking-widest">
            {t.logistics || "لۆجستی و ئابووری"}
            <Globe className="text-[#FF7A00]" size={20} />
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">داشکاندنی سەکۆ (%)</label>
              <input 
                type="number" 
                value={settings.commissionRate}
                onChange={(e) => setSettings({...settings, commissionRate: parseInt(e.target.value) || 0})}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#FF7A00] text-white text-right font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">کەمترین بڕی زیادکردن (USD)</label>
              <input 
                type="number" 
                value={settings.minBidIncrement}
                onChange={(e) => setSettings({...settings, minBidIncrement: parseInt(e.target.value) || 0})}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#FF7A00] text-white text-right font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">تێچووی گەیاندنی بنەڕەتی بۆ عێراق (USD)</label>
              <input 
                type="number" 
                value={settings.iraqShippingBase}
                onChange={(e) => setSettings({...settings, iraqShippingBase: parseInt(e.target.value) || 0})}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#FF7A00] text-white text-right font-mono" 
              />
            </div>
          </div>
        </div>

        {/* Safety & System */}
        <div className="glass-panel p-8 space-y-6 border border-white/5 hover:border-blue-500/20 transition-all">
          <h3 className="text-lg font-black flex items-center justify-end gap-2 border-b border-white/10 pb-4 text-white uppercase tracking-widest">
            {t.safety || "پارێزگاری و سیستەم"}
            <Shield className="text-blue-500" size={20} />
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
              <div className="flex flex-col items-end">
                <p className="font-black text-sm text-white">Maintenance Mode</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">وەستاندنی هەموو کارەکان لە مۆبایل</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                className="w-14 h-7 rounded-full appearance-none bg-slate-800 checked:bg-[#FF7A00] transition-all relative cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all checked:after:left-8 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">نامەی گشتی ئاگادارکردنەوە لە ئاپ</label>
              <textarea 
                value={settings.globalAlert}
                onChange={(e) => setSettings({...settings, globalAlert: e.target.value})}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#FF7A00] text-sm text-white text-right leading-relaxed" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start pt-6">
        <button 
          onClick={handleSave}
          className="bg-[#FF7A00] text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 transition-all shadow-[0_0_30px_rgba(255,122,0,0.2)] active:scale-95 group"
        >
          <Save size={20} className="group-hover:scale-110 transition-transform"/> {t.save_changes}
        </button>
      </div>
    </div>
  )
}
