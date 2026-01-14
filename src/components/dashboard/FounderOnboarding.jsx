import React from "react";
import { Zap, Sparkles, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

export default function FounderOnboarding({ 
  formData, setFormData, handleAiFill, aiLoading, aiError, onSave 
}) {
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl relative">
        <div className="bg-[#0f0f0f] border-b border-white/5 p-6 flex justify-between items-center">
            <h2 className="text-lg font-light tracking-tight flex items-center gap-3">
                <div className="p-1.5 bg-ethaum-green rounded text-black"><Zap size={14}/></div>
                <span>Initialize <span className="font-bold text-white">Startup Node.</span></span>
            </h2>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Step 1/2</div>
        </div>

        <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 group">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest group-focus-within:text-ethaum-green transition-colors">Venture Name</label>
                    <input 
                        placeholder="ENTER NAME" 
                        className="w-full bg-[#050505] border border-white/10 p-3 text-xs font-bold text-white focus:border-ethaum-green outline-none transition-all rounded-lg"
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5 group">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest group-focus-within:text-ethaum-green transition-colors">Website URL</label>
                    <input 
                        placeholder="HTTPS://" 
                        className="w-full bg-[#050505] border border-white/10 p-3 text-xs font-mono text-ethaum-green focus:border-ethaum-green outline-none transition-all rounded-lg"
                        value={formData.website_url} 
                        onChange={e => setFormData({...formData, website_url: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Stage</label>
                    <select className="w-full bg-[#050505] border border-white/10 p-3 text-xs font-bold text-white focus:border-ethaum-green outline-none rounded-lg cursor-pointer" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                        {["Series A", "Series B", "Series C", "Series D"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Capital Raised</label>
                    <select className="w-full bg-[#050505] border border-white/10 p-3 text-xs font-bold text-white focus:border-ethaum-green outline-none rounded-lg cursor-pointer" value={formData.arr_range} onChange={e => setFormData({...formData, arr_range: e.target.value})}>
                        {["$1M-$5M", "$5M-$20M", "$20M-$50M", "$50M+"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            <div className="relative pt-2">
                <label className="flex justify-between items-end mb-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Core Intelligence Description</span>
                    {aiError && <span className="text-red-500 text-[9px] font-bold flex items-center gap-1"><AlertTriangle size={10}/> {aiError}</span>}
                </label>
                <div className="relative group">
                    <textarea 
                        placeholder="Describe your tech, market, and value prop..." 
                        className="w-full bg-[#050505] border border-white/10 p-4 text-xs leading-relaxed focus:border-ethaum-green outline-none text-gray-300 transition-all resize-none rounded-lg h-32 group-focus-within:shadow-[0_0_20px_rgba(204,255,0,0.05)]" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                    <button 
                        onClick={handleAiFill} 
                        disabled={aiLoading}
                        className="absolute bottom-3 right-3 bg-white text-black px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-ethaum-green transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {aiLoading ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />}
                        {aiLoading ? "ANALYZING..." : "AI ENHANCE"}
                    </button>
                </div>
            </div>

            {/* Generated Fields Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Tagline</label>
                    <div className="text-xs font-mono text-ethaum-green truncate">{formData.tagline || "Waiting for AI..."}</div>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Deal Offer</label>
                    <div className="text-xs font-mono text-white truncate">{formData.deal_offer || "Waiting for AI..."}</div>
                </div>
            </div>

            <button 
                onClick={onSave} 
                className="w-full py-4 mt-2 bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-ethaum-green hover:shadow-[0_0_30px_rgba(204,255,0,0.4)] transition-all flex items-center justify-center gap-3 group"
            >
                Initialize & Secure Vault <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>
      </div>
    </div>
  );
}