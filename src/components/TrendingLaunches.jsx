import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext"; 
import { useNavigate } from "react-router-dom"; 
import StackedSection from "./StackedSection";
import { MOCK_LAUNCHES } from "../lib/mockData";
import { ChevronUp, Award, Loader2, Lock, LayoutDashboard, Trophy, ArrowRight, Database } from "lucide-react";

export default function TrendingLaunches({ isPublic = true }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState(new Set());

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // LOGIC UPDATE: 
      // User Signed In -> Fetch 20 (Scrollable)
      // User Guest -> Fetch 3 (Product of the Day + 2 Trending)
      const fetchLimit = user ? 20 : 3; 
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_leaderboard')
        .select('*')
        .eq('launch_date', today)
        .order('calculated_rank', { ascending: true })
        .limit(fetchLimit);

      if (!error && data && data.length > 0) {
          setLaunches(data.map(item => ({
              id: item.startup_id,
              name: item.name,
              stage: item.stage,
              tagline: item.tagline,
              upvotes_count: item.upvotes_count,
              arr_range: item.arr_range,
              rank: item.calculated_rank,
              badge: item.calculated_rank === 1 ? "Product of the Day #1" : `Daily Top ${item.calculated_rank}`
          })));
      } else {
          // Fallback Mocks: Show 3 for guests, Full list for users
          setLaunches(user ? [...MOCK_LAUNCHES, ...MOCK_LAUNCHES] : MOCK_LAUNCHES.slice(0, 3));
      }

      if (user) {
        const { data: votes } = await supabase.from('startup_upvotes').select('startup_id').eq('user_id', user.id);
        if (votes) setVotedIds(new Set(votes.map(v => v.startup_id)));
      }
    } catch (error) { console.error(error); setLaunches(MOCK_LAUNCHES.slice(0, 3)); } 
    finally { setLoading(false); }
  };

  const handleUpvote = async (e, startupId) => {
    e.stopPropagation();
    if (!user) { if(window.confirm("Sign in to upvote?")) navigate("/auth?type=buyer&mode=login"); return; }
    if (role === 'founder') { alert("Restricted: Founders cannot upvote."); return; }
    if (votedIds.has(startupId)) return;

    setLaunches(prev => prev.map(s => s.id === startupId ? { ...s, upvotes_count: (s.upvotes_count || 0) + 1 } : s));
    setVotedIds(prev => new Set(prev).add(startupId));

    if (!startupId.toString().startsWith('m-')) {
         const { error } = await supabase.from('startup_upvotes').insert({ startup_id: startupId, user_id: user.id });
         if (error) {
             setLaunches(prev => prev.map(s => s.id === startupId ? { ...s, upvotes_count: (s.upvotes_count || 0) - 1 } : s));
             setVotedIds(prev => { const n = new Set(prev); n.delete(startupId); return n; });
             alert("Vote failed.");
         }
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";

  // --- CONTENT ---
  const content = (
    <div className={`w-full flex flex-col ${isPublic ? 'p-8 md:p-12' : 'p-6'} h-full relative`}>
        
        {/* CSS INJECTION: Scrollbar Styling */}
        <style>{`
            .custom-list-scroll {
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #333 transparent;
            }
            .custom-list-scroll::-webkit-scrollbar {
                width: 4px;
            }
            .custom-list-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-list-scroll::-webkit-scrollbar-thumb {
                background-color: #333;
                border-radius: 20px;
            }
            .custom-list-scroll:hover::-webkit-scrollbar-thumb {
                background-color: #ccff00; 
            }
        `}</style>

        {/* HEADER */}
        {isPublic && (
            <div className="shrink-0 flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="text-ethaum-green" size={16} />
                        <p className="text-ethaum-green text-[10px] font-bold uppercase tracking-widest">Active Buzz Cycle</p>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-light text-white mb-1">Launch Intelligence</h2>
                    <p className="text-gray-500 text-xs md:text-sm">Top-voted Series A–D products.</p>
                </div>
                
                {/* CONSOLE BUTTON (Logged In Only) */}
                {user && (
                    <button onClick={() => navigate('/market')} className="hidden md:flex items-center gap-2 text-[10px] font-bold text-ethaum-green border border-ethaum-green/20 px-4 py-2 rounded-full hover:bg-ethaum-green hover:text-black transition-all uppercase tracking-widest">
                        <LayoutDashboard size={12} /> Console
                    </button>
                )}
            </div>
        )}

        {/* LIST CONTAINER */}
        <div 
            className="custom-list-scroll flex-1 pr-2 space-y-3"
            style={{ 
                maxHeight: isPublic ? '60vh' : '100%', 
                minHeight: '0px'
            }}
        >
            {loading ? <div className="flex justify-center text-ethaum-green pt-10"><Loader2 className="animate-spin" /></div> : (
                <>
                    {launches.map((item) => {
                        const isVoted = votedIds.has(item.id);
                        const isProductOfDay = item.rank === 1; 
                        
                        return (
                            <div key={item.id} onClick={() => navigate(`/startup/${item.id}`)} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isProductOfDay ? "border-ethaum-green/50 bg-black/60 shadow-[0_0_15px_rgba(204,255,0,0.1)]" : "border-white/5 bg-black/40 hover:border-ethaum-green"}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl border flex items-center justify-center text-xl font-bold text-white bg-black ${isProductOfDay ? "border-ethaum-green/50" : "border-white/10"}`}>
                                        {isProductOfDay ? <Trophy size={18} className="text-ethaum-green" /> : getInitials(item.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-ethaum-green transition-colors truncate">{item.name}</h3>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${isProductOfDay ? "bg-ethaum-green text-black border-ethaum-green" : "bg-white/5 text-ethaum-green border-ethaum-green/20"}`}>{item.badge}</span>
                                            <span className="text-[10px] font-bold uppercase text-gray-500 hidden sm:inline-block">{item.stage}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={(e) => handleUpvote(e, item.id)} disabled={isVoted || role === 'founder'} className={`shrink-0 flex flex-col items-center justify-center w-12 h-12 border rounded-xl transition-all z-10 ${isVoted ? "bg-ethaum-green border-ethaum-green text-black" : "bg-black border-white/10 hover:border-ethaum-green text-white"}`}>
                                    {role === 'founder' ? <Lock size={14}/> : <ChevronUp size={20}/>} 
                                    <span className="text-[10px] font-bold">{item.upvotes_count}</span>
                                </button>
                            </div>
                        )
                    })}
                </>
            )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="shrink-0 mt-4 pt-4 border-t border-white/5 flex justify-center">
            {isPublic ? (
                user ? (
                    // BUTTON 2: LAUNCH INTELLIGENCE (Logged In)
                    <button onClick={() => navigate('/launches')} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-white border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/5 transition-all uppercase tracking-widest">
                        <Database size={12} /> Open Full Launch Intelligence
                    </button>
                ) : (
                    // GUEST: LOGIN MSG
                    <button onClick={() => navigate('/auth?type=buyer')} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                        <Lock size={12} /> Login for Full Leaderboard
                    </button>
                )
            ) : (
                <button onClick={() => navigate('/launches')} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 transition-all flex items-center gap-2">
                    Open Intelligence Vault <ArrowRight size={12}/>
                </button>
            )}
        </div>
    </div>
  );

  return isPublic ? <StackedSection title="Trending Launches" index={1} id="launches">{content}</StackedSection> : content;
}