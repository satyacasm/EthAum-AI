import React from "react";
import { Globe, LayoutDashboard, Radio, Edit3, Sparkles, Zap, FileText, ExternalLink, CheckCircle, XCircle, MessageCircle, Clock, Rocket } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function FounderMainView({ 
  startup, requests, activeTab, setActiveTab, setIsEditModalOpen, handleRequestStatus, setActiveChatRequest 
}) {

  // UPDATED: "Upsert" Logic (Prevent Duplicates)
  const handleGoLive = async () => {
      if (!window.confirm("Confirm: Launch/Update Global Leaderboard Status?")) return;
      
      try {
          // 1. Check if already live
          const { data: existingLaunch, error: fetchError } = await supabase
            .from('launches')
            .select('id')
            .eq('startup_id', startup.id)
            .eq('status', 'live')
            .maybeSingle();

          if (fetchError) throw fetchError;

          if (existingLaunch) {
              // OPTION A: UPDATE existing entry (e.g., refresh timestamp)
              const { error } = await supabase
                .from('launches')
                .update({ 
                    launch_date: new Date().toISOString().split('T')[0],
                    // We don't change rank here to preserve position, or reset it if you want
                })
                .eq('id', existingLaunch.id);

              if (error) throw error;
              alert("SUCCESS: Launch status updated! Your latest profile changes are live.");
          
          } else {
              // OPTION B: INSERT new entry
              const { error } = await supabase.from('launches').insert({
                  startup_id: startup.id,
                  launch_date: new Date().toISOString().split('T')[0],
                  status: 'live',
                  day_rank: 1 // Default rank for testing
              });

              if (error) throw error;
              alert("SUCCESS: You are now LIVE on the Home Page!");
          }

      } catch (err) {
          alert("Launch Error: " + err.message);
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-1000">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-ethaum-green rounded-full animate-pulse"></div>
            <span className="text-[9px] font-mono text-ethaum-green uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none mb-3">{startup.name}</h1>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white">{startup.stage}</span>
             <span className="text-[10px] font-mono text-gray-500">{startup.arr_range}</span>
             {startup.website_url && (
                <a href={startup.website_url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                    <Globe size={10}/> TERMINAL
                </a>
             )}
          </div>
        </div>
        
        <div className="flex gap-2">
            {/* GO LIVE BUTTON */}
            <button onClick={handleGoLive} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg">
                <Rocket size={12}/> Go Live / Update
            </button>

            <div className="flex bg-[#0A0A0A] p-1 rounded-xl border border-white/10">
                <button onClick={() => setActiveTab("listed")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'listed' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <LayoutDashboard size={12}/> Dashboard
                </button>
                <button onClick={() => setActiveTab("pilots")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'pilots' ? 'bg-ethaum-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <Radio size={12} /> Signals <span className="bg-black/20 px-1.5 rounded text-[9px]">{requests.length}</span>
                </button>
            </div>
        </div>
      </div>

      {activeTab === "listed" ? (
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[1.5rem] relative group">
              <button onClick={() => setIsEditModalOpen(true)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white hover:text-black rounded-lg text-gray-400 transition-all opacity-0 group-hover:opacity-100">
                  <Edit3 size={14}/>
              </button>
              
              <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={14} className="text-ethaum-green"/>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Public Profile</h3>
              </div>

              <h4 className="text-xl md:text-2xl font-light text-white mb-4 leading-tight">"{startup.tagline}"</h4>
              <p className="text-gray-400 text-sm leading-relaxed font-medium mb-8 max-w-2xl border-l-2 border-white/10 pl-4">{startup.description}</p>
              
              <div className="bg-[#050505] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Active Deal Offer</div>
                    <div className="text-sm font-bold text-white">{startup.deal_offer}</div>
                    <div className="text-[9px] text-ethaum-green font-mono mt-1">
                        ${startup.pilot_price_deal || 0} / {startup.slots_total || 5} Slots
                    </div>
                  </div>
                  <Zap size={18} className="text-ethaum-green"/>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-[1.5rem]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vault Status</h3>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-ethaum-green rounded-full"></div>
                    <span className="text-[9px] font-bold text-ethaum-green">SECURE</span>
                </div>
              </div>
              <div className="space-y-2">
                {['pitch_deck_url', 'technical_docs_url', 'financials_url', 'compliance_url'].map(key => startup[key] && (
                  <a key={key} href={startup[key]} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:border-ethaum-green hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-center gap-3">
                      <FileText size={12} className="text-gray-600 group-hover:text-ethaum-green" />
                      <span className="text-[9px] font-bold uppercase text-gray-400 group-hover:text-white tracking-wider">{key.replace('_url', '').replace('_', ' ')}</span>
                    </div>
                    <ExternalLink size={10} className="text-gray-700 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-3">
            {requests.length > 0 ? requests.map((req) => (
              <div key={req.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-lg bg-[#111] border border-white/5 flex items-center justify-center text-xs font-black text-white">
                      {req.profiles?.full_name?.charAt(0) || 'B'}
                    </div>
                    <div>
                       <div className="text-sm font-bold text-white uppercase">{req.profiles?.full_name || 'Hidden Entity'}</div>
                       <div className="text-[10px] text-gray-500 font-mono uppercase mt-0.5 flex items-center gap-2">
                          {req.profiles?.role} <span className="w-1 h-1 bg-gray-600 rounded-full"></span> <Clock size={10}/> {new Date(req.created_at).toLocaleDateString()}
                       </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleRequestStatus(req.id, 'approved')} className="p-2 bg-ethaum-green/10 text-ethaum-green rounded hover:bg-ethaum-green hover:text-black transition-all" title="Approve"><CheckCircle size={16}/></button>
                        <button onClick={() => handleRequestStatus(req.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all" title="Reject"><XCircle size={16}/></button>
                      </>
                    ) : (
                      <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded border ${req.status === 'approved' ? 'border-ethaum-green text-ethaum-green' : 'border-red-500 text-red-500'}`}>{req.status}</span>
                    )}
                    <button onClick={() => setActiveChatRequest(req)} className="ml-2 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                      <MessageCircle size={12}/> Open Uplink
                    </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-30">
                  <Radio size={32} className="mx-auto mb-3"/>
                  <div className="text-[10px] font-bold uppercase tracking-widest">No Signals Detected</div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}