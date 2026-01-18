import React, { useEffect } from "react";
import { X, Zap, Sparkles, DollarSign } from "lucide-react";
import { useLenis } from "@studio-freight/react-lenis";

export default function EditStartupModal({ 
  isOpen, onClose, formData, setFormData, handleAiFill, aiLoading, uploading, onSave, setFiles 
}) {
  const lenis = useLenis();

  useEffect(() => {
    if (isOpen) { lenis?.stop(); document.body.style.overflow = 'hidden'; } 
    else { lenis?.start(); document.body.style.overflow = 'unset'; }
    return () => { lenis?.start(); document.body.style.overflow = 'unset'; };
  }, [isOpen, lenis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" data-lenis-prevent>
      <div className="bg-[#050505] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] font-mono overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#080808] shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="text-ethaum-green" size={18}/>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Sync Terminal</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Company Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white focus:border-ethaum-green outline-none" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Website</label>
                <input value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white focus:border-ethaum-green outline-none" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Stage</label>
                <select className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none cursor-pointer" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                  {["Series A", "Series B", "Series C", "Seed"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">ARR</label>
                <select className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none cursor-pointer" value={formData.arr_range} onChange={e => setFormData({...formData, arr_range: e.target.value})}>
                  {["$1M-$5M", "$5M-$20M", "$50M+"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
          </div>

          {/* --- NEW: DEAL CONFIGURATION (THE FIX) --- */}
          <div className="p-4 border border-ethaum-green/20 bg-ethaum-green/5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-ethaum-green mb-2">
                  <DollarSign size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deal Parameters</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Pilot Price ($)</label>
                      <input 
                        type="number" 
                        value={formData.pilot_price_deal} 
                        onChange={e => setFormData({...formData, pilot_price_deal: e.target.value})} 
                        className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white focus:border-ethaum-green outline-none font-mono"
                        placeholder="15000"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Total Slots</label>
                      <input 
                        type="number" 
                        value={formData.slots_total} 
                        onChange={e => setFormData({...formData, slots_total: e.target.value})} 
                        className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white focus:border-ethaum-green outline-none font-mono"
                        placeholder="5"
                      />
                  </div>
              </div>
          </div>
          {/* ------------------------------------------- */}

          <div className="space-y-2">
            <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Deal Offer Title</label>
            <input value={formData.deal_offer} onChange={e => setFormData({...formData, deal_offer: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white focus:border-ethaum-green outline-none" placeholder="e.g. Enterprise Pilot (3 Months)" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Description</label>
                <button onClick={handleAiFill} className="text-ethaum-green text-[9px] font-black flex items-center gap-1">{aiLoading ? "PROCESSING..." : <><Sparkles size={10}/> AI ENHANCE</>}</button>
            </div>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white outline-none resize-none" rows={4}/>
          </div>

        </div>

        <div className="p-6 border-t border-white/5 bg-[#080808] shrink-0">
          <button onClick={onSave} disabled={uploading} className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-ethaum-green transition-all">
            {uploading ? "Uploading..." : "Confirm & Update"}
          </button>
        </div>
      </div>
    </div>
  );
}