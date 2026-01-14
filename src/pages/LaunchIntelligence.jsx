import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/NavBar";
import { AmbientBackground } from "../components/UIEffects"; 
import { ChevronUp, Search, Filter, Calendar, Trophy, ArrowLeft, Loader2 } from "lucide-react";
import { MOCK_HISTORY } from "../lib/mockData";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LaunchIntelligence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [launches, setLaunches] = useState([]);
  const [filterTime, setFilterTime] = useState("Today"); 
  const [filterStage, setFilterStage] = useState("All"); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [filterTime]); 

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 1. Base Query
      let query = supabase
        .from('launches')
        .select(`
            launch_date, day_rank, status,
            startups ( id, name, stage, tagline, upvotes_count, logo_url, arr_range )
        `)
        .eq('status', 'live')
        .order('launch_date', { ascending: false })
        .order('day_rank', { ascending: true });

      // 2. Apply Time Logic
      const today = new Date().toISOString().split('T')[0];
      
      if (filterTime === "Today") {
          query = query.eq('launch_date', today);
      } 

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
          let formatted = data.map(l => ({
              ...l.startups,
              rank: l.day_rank,
              date: l.launch_date === today ? "Today" : l.launch_date,
              badge: l.day_rank === 1 ? "Top 1" : `#${l.day_rank}`
          }));
          setLaunches(formatted);
      } else {
          // 3. Fallback Logic
          const mockSource = filterTime === "Today" 
            ? MOCK_HISTORY.filter(m => !m.date) 
            : MOCK_HISTORY.filter(m => m.date); 
          setLaunches(mockSource);
      }

    } catch (err) {
        console.error(err);
        setLaunches(MOCK_HISTORY);
    } finally {
        setLoading(false);
    }
  };

  // Client-Side Filter
  const filteredLaunches = launches.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.tagline.toLowerCase().includes(search.toLowerCase());
      const matchesStage = filterStage === "All" || item.stage === filterStage;
      return matchesSearch && matchesStage;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
        <AmbientBackground />
        <Loader2 className="animate-spin text-ethaum-green relative z-10" size={40} />
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full pt-24 px-6 md:px-12 lg:px-20 pb-12 bg-[#020202] font-sans relative overflow-x-hidden selection:bg-ethaum-green selection:text-black">
        <AmbientBackground />
        
        {/* HEADER */}
        <div className="max-w-6xl mx-auto mb-12 relative z-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white mb-8 uppercase tracking-widest transition-colors group">
                <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform"/> Back to Console
            </button>
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-ethaum-green/10 rounded-lg border border-ethaum-green/20 text-ethaum-green shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                            <Trophy size={20} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light text-white tracking-tighter uppercase">Launch <span className="font-bold">Intelligence</span></h1>
                    </div>
                    <p className="text-gray-500 text-sm max-w-xl">Historical archive of top-performing enterprise startups. Filter by funding stage and velocity.</p>
                </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row gap-6 justify-between items-center relative z-10">
            
            {/* Search */}
            <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-ethaum-green transition-colors" size={14} />
                <input 
                    type="text" 
                    placeholder="SEARCH ARCHIVE..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-mono text-white focus:border-ethaum-green focus:bg-black/60 outline-none transition-all placeholder:text-gray-600 uppercase backdrop-blur-sm"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm group hover:border-ethaum-green/30">
                    <Calendar size={14} className="text-gray-400 group-hover:text-ethaum-green transition-colors"/>
                    <select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer border-none focus:ring-0 uppercase tracking-wider">
                        <option value="Today" className="bg-black text-gray-400">Today's Leaderboard</option>
                        <option value="Yesterday" className="bg-black text-gray-400">Yesterday</option>
                        <option value="All" className="bg-black text-gray-400">All Time</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm group hover:border-ethaum-green/30">
                    <Filter size={14} className="text-gray-400 group-hover:text-ethaum-green transition-colors"/>
                    <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer border-none focus:ring-0 uppercase tracking-wider">
                        <option value="All" className="bg-black text-gray-400">All Stages</option>
                        <option value="Seed" className="bg-black text-gray-400">Seed</option>
                        <option value="Series A" className="bg-black text-gray-400">Series A</option>
                        <option value="Series B" className="bg-black text-gray-400">Series B</option>
                    </select>
                </div>
            </div>
        </div>

        {/* DATA TABLE */}
        <div className="max-w-6xl mx-auto space-y-3 relative z-10">
            {filteredLaunches.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">No startups found matching criteria</span>
                </div>
            ) : (
                filteredLaunches.map((item, idx) => (
                    <div key={idx} onClick={() => navigate(`/startup/${item.id}`)} className="group flex items-center justify-between p-6 bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl hover:bg-black/60 hover:border-ethaum-green/50 transition-all cursor-pointer">
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col items-center w-12 shrink-0">
                                <span className={`text-2xl font-black ${item.rank === 1 ? 'text-ethaum-green drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 'text-gray-700'}`}>#{item.rank}</span>
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-1">{item.date || "Today"}</span>
                            </div>
                            
                            <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl font-bold text-white uppercase group-hover:scale-105 transition-transform shadow-lg group-hover:border-ethaum-green/30">
                                {item.logo_url ? <img src={item.logo_url} className="w-full h-full object-cover rounded-xl"/> : item.name.charAt(0)}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-1 group-hover:text-ethaum-green transition-colors">
                                    {item.name} 
                                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-widest border border-white/5 group-hover:border-white/20 transition-colors">{item.stage}</span>
                                </h3>
                                <p className="text-sm text-gray-400">{item.tagline}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="text-right hidden md:block">
                                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">ARR Range</div>
                                <div className="text-sm font-bold text-white font-mono">{item.arr_range || "Undisclosed"}</div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#111] border border-white/10 rounded-xl group-hover:border-ethaum-green group-hover:shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all">
                                <ChevronUp size={20} className="text-gray-400 group-hover:text-ethaum-green mb-[-2px]" />
                                <span className="text-xs font-bold text-white">{item.upvotes_count}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </>
  );
}