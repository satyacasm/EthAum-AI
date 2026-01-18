import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import StackedSection from "./StackedSection";
import { MOCK_DEALS } from "../lib/mockData";
import { Activity, Globe, Clock, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EnterpriseDeals({ isPublic = true }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth(); // Import Auth

  useEffect(() => {
    fetchDeals();

    // Subscribe only if user is logged in (Real data updates)
    let channel;
    if (user) {
        channel = supabase.channel('realtime-deals')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pilot_requests' }, async (payload) => {
              const newDeal = await fetchSingleDeal(payload.new.id);
              if (newDeal) setDeals(prev => [newDeal, ...prev]);
          }).subscribe();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  const fetchDeals = async () => {
    // 1. GUEST MODE: Show Mocks immediately
    if (!user) {
        setDeals(MOCK_DEALS);
        setLoading(false);
        return;
    }

    // 2. USER MODE: Fetch Real Data
    try {
      setLoading(true);
      const limit = isPublic ? 10 : 50;
      
      const { data, error } = await supabase
        .from('pilot_requests')
        .select(`id, status, created_at, startups ( name, pilot_price_deal, slots_total, slots_taken ), profiles:buyer_id ( startup_name, full_name )`)
        .neq('status', 'rejected') 
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        setDeals(formatDeals(data));
      } else {
        // If DB is empty for user, show empty array (Real State)
        setDeals([]);
      }
    } catch (err) {
      console.error(err);
      setDeals([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleDeal = async (id) => {
    const { data } = await supabase
      .from('pilot_requests')
      .select(`id, status, created_at, startups ( name, pilot_price_deal, slots_total, slots_taken ), profiles:buyer_id ( startup_name, full_name )`)
      .eq('id', id)
      .single();
    return data ? formatDeals([data])[0] : null;
  };

  const formatDeals = (rawData) => {
    if (!rawData) return [];
    return rawData.map(item => ({
      id: item.id,
      company: item.profiles?.startup_name || "Enterprise Buyer", 
      startup: item.startups?.name || "Stealth Startup",
      value: item.startups?.pilot_price_deal ? `$${(item.startups.pilot_price_deal / 1000).toFixed(0)}k Pilot` : "Undisclosed",
      status: item.status === 'active' ? 'Signed' : 'In Talks',
      time: item.created_at,
      slots_left: (item.startups?.slots_total || 5) - (item.startups?.slots_taken || 0)
    }));
  };

  const getTimeAgo = (dateString) => {
    if (!dateString || dateString.includes('ago')) return dateString; 
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return "1d+ ago";
  };

  const scrollDeals = deals.length > 0 && deals.length < 5 ? [...deals, ...deals, ...deals, ...deals] : [...deals, ...deals];

  const content = (
    <div className={`w-full h-full flex flex-col justify-center ${isPublic ? 'p-8 md:p-12' : 'p-4'}`}>
        
        {isPublic ? (
            <>
                <style>{`
                    @keyframes infiniteScroll { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
                    .animate-smooth-scroll { animation: infiniteScroll 45s linear infinite; }
                    .animate-smooth-scroll:hover { animation-play-state: paused; }
                    .fade-mask { mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); }
                `}</style>

                <div className="flex items-center gap-3 mb-8">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <span className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.2em]">Real-Time Deal Flow</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center h-full">
                    <div className="z-10 relative">
                        <h2 className="text-5xl md:text-7xl font-light text-white mb-6 leading-[0.9] tracking-tighter">
                          Scale with <br/><span className="font-bold text-blue-500">Giants.</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-md border-l-2 border-white/10 pl-6">
                          Startups on EthAum secure pilots with Fortune 500s <span className="text-white font-bold">4x faster</span>. 
                        </p>
                        
                        <div className="mt-10 flex flex-wrap gap-4 items-center">
                          {/* BUTTON LOGIC */}
                          <button 
                            onClick={() => navigate(user ? '/deals' : '/auth?type=buyer')}
                            className="group px-6 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center gap-2"
                          >
                            Enter Deal Room <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                          </button>
                          
                          <div className="px-5 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex flex-col justify-center">
                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Avg. Close Time</span>
                             <span className="text-white font-bold text-xs">14 Days</span>
                          </div>
                        </div>
                    </div>

                    <div className="relative h-[300px] w-full overflow-hidden fade-mask bg-gradient-to-b from-transparent via-white/[0.02] to-transparent rounded-2xl border border-white/5">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center text-blue-500 text-xs font-bold uppercase tracking-widest animate-pulse gap-2">
                                <Activity size={14} /> Encrypting Feed...
                            </div>
                        )}
                        
                        {!loading && deals.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50">
                                <Lock size={24} className="mb-2"/>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Vault Sealed</span>
                            </div>
                        )}

                        {!loading && deals.length > 0 && (
                          <div className="animate-smooth-scroll flex flex-col gap-3 p-4">
                              {scrollDeals.map((deal, i) => (
                                  <div key={`${deal.id}-${i}`} className="group flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/10 rounded-xl hover:bg-[#111] hover:border-blue-500/50 transition-all cursor-default relative overflow-hidden">
                                      {deal.slots_left < 3 && <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden z-20"><div className="absolute top-[10px] -right-[22px] rotate-45 bg-blue-600 text-white text-[7px] font-bold px-6 py-1 uppercase tracking-widest shadow-lg animate-pulse">Hot</div></div>}
                                      <div className="flex items-center gap-4 z-10">
                                          <div className="relative">
                                              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm border border-white/5 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                                                  {deal.company.charAt(0)}
                                              </div>
                                          </div>
                                          <div>
                                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                                  {deal.company} <span className="text-gray-600 text-[10px]">✕</span> {deal.startup}
                                              </div>
                                              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                  <Globe size={10} /> Enterprise Match
                                              </div>
                                          </div>
                                      </div>
                                      <div className="text-right z-10">
                                          <div className="text-sm font-bold text-ethaum-green flex items-center justify-end gap-1 mb-0.5"><Activity size={12} /> {deal.value}</div>
                                          <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-gray-500"><span className={`transition-colors ${deal.status === 'Signed' ? 'text-white' : 'group-hover:text-white'}`}>{deal.status}</span><span className="flex items-center gap-1 opacity-50"><Clock size={8} /> {getTimeAgo(deal.time)}</span></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                        )}
                    </div>
                </div>
            </>
        ) : (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0A0A0A] z-10 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                        <tr><th className="pb-4 pl-2">Buyer</th><th className="pb-4">Startup</th><th className="pb-4 text-right">Value</th><th className="pb-4 text-right">Time</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {deals.map((deal) => (
                            <tr key={deal.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 pl-2 flex items-center gap-3"><div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">{deal.company.charAt(0)}</div><span className="text-xs font-bold text-white">{deal.company}</span></td>
                                <td className="py-3 text-xs text-gray-400">{deal.startup}</td>
                                <td className="py-3 text-right text-xs font-mono text-ethaum-green">{deal.value}</td>
                                <td className="py-3 text-right text-[10px] text-gray-600">{getTimeAgo(deal.time)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );

  return isPublic ? <StackedSection title="Active Pilots" index={3} id="pilots">{content}</StackedSection> : content;
}