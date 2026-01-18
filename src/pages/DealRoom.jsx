import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/NavBar";
import { AmbientBackground } from "../components/UIEffects"; 
import { Activity, Search, ArrowLeft, Zap, ShieldCheck, DollarSign, Lock, Eye, Sparkles, CheckCircle2 } from "lucide-react";
import { MOCK_OPPORTUNITIES } from "../lib/mockData";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DealRoom() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  
  const [opportunities, setOpportunities] = useState([]);
  const [userRequests, setUserRequests] = useState(new Set()); // NEW: Track User's Requests
  const [search, setSearch] = useState("");
  const [filterBudget, setFilterBudget] = useState("All"); 
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // NEW: Loading state for specific button

  useEffect(() => {
    fetchData();
  }, [user]); 

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Deals
      const { data: deals, error } = await supabase
        .from('startups')
        .select('id, name, stage, tagline, pilot_price_deal, slots_total, slots_taken, eth_aum_score')
        .not('pilot_price_deal', 'is', null) 
        .order('eth_aum_score', { ascending: false });

      if (!error && deals && deals.length > 0) {
          setOpportunities(deals);
      } else {
          setOpportunities(user ? [] : MOCK_OPPORTUNITIES);
      }

      // 2. NEW: Fetch User's Existing Requests (to disable buttons)
      if (user) {
          const { data: requests } = await supabase
            .from('pilot_requests')
            .select('startup_id')
            .eq('buyer_id', user.id);
          
          if (requests) {
              const reqSet = new Set(requests.map(r => r.startup_id));
              setUserRequests(reqSet);
          }
      }

    } catch (err) {
        console.error(err);
        if (!user) setOpportunities(MOCK_OPPORTUNITIES);
    } finally {
        setLoading(false);
    }
  };

  const handleRequestPilot = async (startupId) => {
      if (!user) { navigate('/auth?type=buyer'); return; }
      if (role === 'founder') { alert("Founders cannot request pilots."); return; } 

      setProcessingId(startupId); // Start button loading

      const { error } = await supabase.from('pilot_requests').insert({
          startup_id: startupId,
          buyer_id: user.id,
          status: 'pending'
      });

      if (error) {
          alert("Request Failed: " + error.message);
          setProcessingId(null);
      } else {
          // SUCCESS: Update local state immediately (No Reload/Redirect needed)
          setUserRequests(prev => new Set(prev).add(startupId));
          setProcessingId(null);
          // Optional: Show a subtle toast or alert
          // alert("Request Sent Successfully."); 
      }
  };

  const filteredDeals = opportunities.filter(item => {
      const price = item.pilot_price_deal || 0;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      
      let matchesBudget = true;
      if (filterBudget === "< $10k") matchesBudget = price < 10000;
      if (filterBudget === "$10k - $50k") matchesBudget = price >= 10000 && price <= 50000;
      if (filterBudget === "> $50k") matchesBudget = price > 50000;

      return matchesSearch && matchesBudget;
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full pt-24 px-6 md:px-12 lg:px-20 pb-12 bg-[#020202] font-sans relative overflow-x-hidden selection:bg-ethaum-green selection:text-black">
        <AmbientBackground />
        
        {/* HEADER */}
        <div className="max-w-7xl mx-auto mb-12 relative z-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white mb-8 uppercase tracking-widest transition-colors group">
                <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform"/> Back to Console
            </button>
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-ethaum-green/10 rounded-lg border border-ethaum-green/20 text-ethaum-green shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                            <Activity size={20} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light text-white tracking-tighter uppercase">Deal <span className="font-bold">Room</span></h1>
                    </div>
                    <p className="text-gray-500 text-sm max-w-xl">Secure pilot contracts with high-velocity startups. Inventory is real-time.</p>
                </div>
                
                <div className="flex gap-10">
                    <div className="text-right">
                        <div className="text-3xl font-light text-white tracking-tighter">{opportunities.length}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Active Deals</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-light text-ethaum-green tracking-tighter">$15k</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Avg. Ticket</div>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row gap-6 justify-between items-center relative z-10">
            <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-ethaum-green transition-colors" size={14} />
                <input 
                    type="text" 
                    placeholder="SEARCH PROTOCOLS..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-mono text-white focus:border-ethaum-green focus:bg-black/60 outline-none transition-all placeholder:text-gray-600 uppercase backdrop-blur-sm"
                />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm">
                    <DollarSign size={14} className="text-gray-400"/>
                    <select value={filterBudget} onChange={(e) => setFilterBudget(e.target.value)} className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer border-none focus:ring-0 uppercase tracking-wider">
                        <option value="All" className="bg-black text-gray-400">All Budgets</option>
                        <option value="< $10k" className="bg-black text-gray-400">&lt; $10k Pilot</option>
                        <option value="$10k - $50k" className="bg-black text-gray-400">$10k - $50k Pilot</option>
                        <option value="> $50k" className="bg-black text-gray-400">&gt; $50k Pilot</option>
                    </select>
                </div>
            </div>
        </div>

        {/* DEAL GRID */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {filteredDeals.length === 0 ? (
                <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        {user ? "No active deals found. (Founders must set Pilot Price in Dashboard)" : "No matching opportunities."}
                    </span>
                </div>
            ) : (
                filteredDeals.map((item) => {
                    const slotsLeft = (item.slots_total || 5) - (item.slots_taken || 0);
                    const isSoldOut = slotsLeft <= 0;
                    const isScarce = slotsLeft <= 2 && !isSoldOut;
                    
                    const isFounder = role === 'founder';
                    
                    // NEW: Check if this specific item has been requested
                    const isRequested = userRequests.has(item.id);
                    const isProcessing = processingId === item.id;

                    return (
                        <div key={item.id} className={`group relative bg-black/40 backdrop-blur-sm border rounded-2xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1
                            ${isSoldOut ? 'border-white/5 opacity-60 grayscale' : 'border-white/10 hover:border-ethaum-green/50 hover:bg-black/60 hover:shadow-[0_0_30px_rgba(204,255,0,0.05)]'}
                        `}>
                            {/* SCARCITY BADGE */}
                            {isScarce && !isRequested && (
                                <div className="absolute top-4 right-4 z-20 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest animate-pulse flex items-center gap-1">
                                    <Sparkles size={8}/> Only {slotsLeft} Left
                                </div>
                            )}
                            
                            <div className="p-6 flex-1 relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl font-bold text-white uppercase group-hover:scale-105 transition-transform">
                                        {item.name.charAt(0)}
                                    </div>
                                    {item.eth_aum_score > 800 && (
                                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-ethaum-green bg-ethaum-green/10 px-2.5 py-1 rounded border border-ethaum-green/20 uppercase tracking-widest">
                                            <ShieldCheck size={10} /> Verified
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-ethaum-green transition-colors">{item.name}</h3>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-gray-500"></span> {item.stage}
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed mb-8 h-10 line-clamp-2 border-l border-white/10 pl-3">{item.tagline}</p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Pilot Cost</div>
                                        <div className="text-sm font-mono font-bold text-white">${(item.pilot_price_deal || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Slots Open</div>
                                        <div className={`text-sm font-mono font-bold ${isSoldOut ? 'text-red-500' : 'text-ethaum-green'}`}>
                                            {item.slots_taken || 0} <span className="text-gray-600">/</span> {item.slots_total || 5}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION FOOTER */}
                            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                                <button 
                                    onClick={() => !isSoldOut && !isFounder && !isRequested && handleRequestPilot(item.id)}
                                    disabled={isSoldOut || isFounder || isRequested || isProcessing}
                                    className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all
                                        ${isSoldOut || isFounder || isRequested
                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' 
                                            : 'bg-white text-black hover:bg-ethaum-green hover:shadow-[0_0_20px_rgba(204,255,0,0.4)]'}
                                    `}
                                >
                                    {isProcessing ? (
                                        "Processing..."
                                    ) : isFounder ? (
                                        <><Eye size={12} /> Founder View Only</>
                                    ) : isRequested ? (
                                        <><CheckCircle2 size={12} /> Request Pending</> // STATUS CHANGE
                                    ) : isSoldOut ? (
                                        <><Lock size={12} /> Capacity Full</>
                                    ) : (
                                        <><Zap size={14} className={!isSoldOut ? "fill-current" : ""} /> Request Pilot Access</>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </>
  );
}