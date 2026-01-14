import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/NavBar";
import ChatWindow from "../components/ChatWindow";
import { generateEmbedding } from "../lib/openai"; // AI LIVE
import { 
  BarChart3, Search, Clock, CheckCircle2, XCircle, 
  TrendingUp, MessageCircle, Zap, Sparkles, Loader2 
} from "lucide-react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("watchlist"); 
  const [watchlist, setWatchlist] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeChatRequest, setActiveChatRequest] = useState(null);
  
  useEffect(() => {
    if (user) fetchBuyerData();
  }, [user]);

  const fetchBuyerData = async () => {
    try {
      // 1. Fetch Watchlist
      const { data: watchData } = await supabase.from('startup_upvotes').select(`startup_id, startups ( * )`).eq('user_id', user.id);
      const upvoted = watchData?.map(item => item.startups).filter(Boolean) || [];

      // 2. Fetch Requests
      const { data: reqData } = await supabase.from('pilot_requests').select(`*, startups ( * )`).eq('buyer_id', user.id);
      const allRequests = reqData || [];
      setRequests(allRequests);

      // Combine for initial view
      const approvedStartups = allRequests.filter(r => r.status === 'approved' && r.startups).map(r => r.startups);
      const combined = [...upvoted, ...approvedStartups];
      const uniqueWatchlist = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setWatchlist(uniqueWatchlist);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  // --- AI LOGIC: SEMANTIC SEARCH ---
  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) { fetchBuyerData(); return; }
    
    setIsSearching(true);
    
    try {
        console.log("Vectorizing query:", searchTerm);
        // 1. Convert Search Query to Vector
        const vector = await generateEmbedding(searchTerm);
        
        if (!vector) throw new Error("Failed to vectorize query");

        // 2. Call Database RPC (Vector Match)
        const { data: results, error } = await supabase.rpc('match_startups', {
            query_embedding: vector,
            match_threshold: 0.1, // Adjusted for broader matching
            match_count: 10
        });

        if (error) throw error;

        // 3. Update UI
        if (activeTab === 'watchlist') {
            setWatchlist(results || []);
        } else {
            // Filter existing requests by semantic match IDs
            const resultIds = results.map(r => r.id);
            setRequests(prev => prev.filter(req => resultIds.includes(req.startup_id)));
        }

    } catch (err) {
        console.error("Search Logic Error:", err);
        // Fallback to basic text search
        const term = searchTerm.toLowerCase();
        setWatchlist(prev => prev.filter(s => s.name.toLowerCase().includes(term) || s.tagline.toLowerCase().includes(term)));
    } finally {
        setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(".dash-item", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 });
    }
  }, [loading, activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-ethaum-green" size={40} />
    </div>
  );

  return (
    <>
      <Navbar />
      {activeChatRequest && <ChatWindow request={activeChatRequest} currentUser={user} onClose={() => setActiveChatRequest(null)} />}

      <div className="min-h-screen w-full pt-24 px-6 md:px-12 lg:px-20 pb-12 bg-black text-white font-sans selection:bg-ethaum-green selection:text-black">
        
        {/* HEADER */}
        <div className="dash-item flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ethaum-green animate-pulse"></div>
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Buyer Terminal</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              Deal Flow<span className="text-ethaum-green">.</span>
            </h1>
          </div>
          
          <div className="flex gap-8 mt-6 md:mt-0">
             <div className="text-right">
                <div className="text-2xl font-black text-white tracking-tighter">{watchlist.length}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Watchlist</div>
             </div>
             <div className="text-right">
                <div className="text-2xl font-black text-white tracking-tighter">{requests.length}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Total Pilots</div>
             </div>
          </div>
        </div>

        {/* SEARCH & TABS */}
        <div className="dash-item flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-white/10">
                <button onClick={() => setActiveTab("watchlist")} className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'watchlist' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Watchlist</button>
                <button onClick={() => setActiveTab("pilots")} className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'pilots' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Pilot Requests</button>
            </div>
            
            <form onSubmit={handleSemanticSearch} className="relative w-full md:max-w-md ml-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="AI SEMANTIC SEARCH..." 
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-[10px] font-mono text-white outline-none focus:border-ethaum-green transition-all uppercase"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-ethaum-green">
                  {isSearching ? <Sparkles className="animate-spin" size={14} /> : <Zap size={14} />}
                </button>
            </form>
        </div>

        {/* WATCHLIST GRID */}
        {activeTab === 'watchlist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchlist.length > 0 ? watchlist.map(startup => (
                    <div key={startup.id} onClick={() => navigate(`/startup/${startup.id}`)} className="dash-item group bg-[#0A0A0A] border border-white/10 p-6 rounded-xl hover:border-ethaum-green transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center text-lg font-black text-white uppercase">{startup.name?.charAt(0)}</div>
                            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-gray-500 font-bold uppercase">{startup.stage}</div>
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight group-hover:text-ethaum-green">{startup.name}</h3>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mb-6 h-8 font-medium uppercase tracking-tight">{startup.tagline}</p>
                        <div className="flex items-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest border-t border-white/5 pt-4 font-bold">
                            <TrendingUp size={12} className="text-ethaum-green" /> Analytics Active
                        </div>
                    </div>
                )) : (
                  <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl opacity-30">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Vault Empty (or No Match Found)</span>
                  </div>
                )}
            </div>
        )}

        {/* PILOT LIST */}
        {activeTab === 'pilots' && (
            <div className="flex flex-col gap-2">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="dash-item grid grid-cols-12 px-6 py-4 bg-[#0A0A0A] border border-white/10 rounded-xl items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-4 flex items-center gap-4">
                            <div className="w-8 h-8 bg-white/5 border border-white/10 rounded flex items-center justify-center font-bold text-white text-[10px] uppercase">{req.startups?.name?.charAt(0)}</div>
                            <span className="text-xs font-bold text-white uppercase tracking-tight">{req.startups?.name}</span>
                        </div>
                        <div className="col-span-2 text-[10px] text-gray-600 font-bold uppercase">{req.startups?.stage}</div>
                        <div className="col-span-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border
                                ${req.status === 'pending' ? 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20' : ''}
                                ${req.status === 'approved' ? 'bg-ethaum-green/5 text-ethaum-green border-ethaum-green/20' : ''}
                                ${req.status === 'rejected' ? 'bg-red-500/5 text-red-500 border-red-500/20' : ''}
                            `}>
                                {req.status === 'pending' && <Clock size={10} />}
                                {req.status === 'approved' && <CheckCircle2 size={10} />}
                                {req.status === 'rejected' && <XCircle size={10} />}
                                {req.status}
                            </span>
                        </div>
                        <div className="col-span-3 text-right flex justify-end gap-2">
                             <button onClick={() => setActiveChatRequest(req)} className="px-4 py-2 rounded border border-white/10 text-gray-500 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <MessageCircle size={12} /> Chat
                             </button>
                             <button onClick={() => navigate(`/startup/${req.startup_id}`)} className="px-4 py-2 rounded bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-ethaum-green transition-all">Vault</button>
                        </div>
                    </div>
                )) : (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-xl opacity-30">
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Active Pilots</span>
                  </div>
                )}
            </div>
        )}
      </div>
    </>
  );
}