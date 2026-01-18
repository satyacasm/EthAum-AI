import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import StackedSection from "./StackedSection";
import { MOCK_QUADRANT } from "../lib/mockData"; 
import { Target, ShieldCheck, TrendingUp, Zap, MoveRight, MoveUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import Auth
import gsap from "gsap";

export default function MarketIntelligence({ isPublic = true }) {
  const { user } = useAuth(); // Get User Status
  const [startups, setStartups] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIntelligence();
    
    // Only subscribe to live updates if user is logged in
    let channel;
    if (user) {
        channel = supabase.channel('live-quadrant')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'startups' }, (payload) => {
              setStartups(prev => prev.map(s => s.id === payload.new.id ? normalizeNode(payload.new, prev) : s));
          }).subscribe();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  const fetchIntelligence = async () => {
    // 1. GUEST MODE: Show Mocks immediately
    if (!user) {
        processData(MOCK_QUADRANT);
        return;
    }

    // 2. USER MODE: Fetch Real Data
    try {
        const { data } = await supabase
            .from('startups')
            .select('id, name, stage, tagline, upvotes_count, eth_aum_score')
            .order('upvotes_count', { ascending: false })
            .limit(20); 
        
        if (data && data.length > 0) {
            processData(data);
        } else {
            // Optional: If DB is empty for user, show empty state or mocks?
            // Currently showing empty to indicate "No Real Data Yet"
            setStartups([]); 
        }
    } catch(err) {
        console.error(err);
        setStartups([]);
    }
  };

  const processData = (data) => {
    const maxVotes = Math.max(...data.map(s => s.upvotes_count || 0), 20); 
    const maxScore = Math.max(...data.map(s => s.eth_aum_score || 0), 200); 
    setStartups(data.map(s => ({
      ...s,
      x: 5 + ((s.upvotes_count || 0) / maxVotes) * 90,
      y: 5 + ((s.eth_aum_score || 0) / maxScore) * 90,
    })));
  };

  const normalizeNode = (newNode, currentList) => {
    const maxVotes = Math.max(...currentList.map(s => s.upvotes_count || 0), newNode.upvotes_count || 0, 20);
    const maxScore = Math.max(...currentList.map(s => s.eth_aum_score || 0), newNode.eth_aum_score || 0, 200);
    return { ...newNode, x: 5 + ((newNode.upvotes_count || 0) / maxVotes) * 90, y: 5 + ((newNode.eth_aum_score || 0) / maxScore) * 90 };
  };

  const handleMouseMove = (e) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".zone-leaders", { backgroundColor: "rgba(204, 255, 0, 0.03)", duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".data-dot-pulse", { scale: 1.8, opacity: 0, duration: 2, repeat: -1, ease: "power1.out", stagger: { amount: 2, from: "random" } });
    }, containerRef);
    return () => ctx.revert();
  }, [startups]);

  // --- CHART COMPONENT ---
  const Chart = () => (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className="flex flex-row items-center justify-center gap-4">
            {/* Y-Axis */}
            <div className="h-[300px] md:h-[400px] flex items-center justify-center w-6">
                <div className="-rotate-90 whitespace-nowrap flex items-center gap-2 text-[9px] font-bold text-ethaum-green uppercase tracking-widest"><MoveUp size={10} /> Innovation Score</div>
            </div>
            {/* Grid */}
            <div ref={gridRef} onMouseMove={handleMouseMove} className="relative w-[280px] sm:w-[350px] md:w-[450px] aspect-square bg-[#050505] border border-white/20 rounded-xl shadow-2xl overflow-hidden group cursor-crosshair">
                <div className="absolute top-0 bottom-0 w-[1px] bg-white/10 pointer-events-none z-10" style={{ left: mousePos.x }}></div>
                <div className="absolute left-0 right-0 h-[1px] bg-white/10 pointer-events-none z-10" style={{ top: mousePos.y }}></div>
                <div className="absolute w-2 h-2 border border-white/50 rounded-full pointer-events-none z-20 -ml-1 -mt-1 shadow-[0_0_10px_white]" style={{ left: mousePos.x, top: mousePos.y }}></div>
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 z-0">
                    <div className="border-r border-b border-white/5 p-3 relative"><span className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute top-3 left-3">Visionaries</span></div>
                    <div className="zone-leaders border-b border-white/5 p-3 relative bg-ethaum-green/[0.01]"><span className="text-[8px] font-black text-ethaum-green/40 uppercase tracking-widest absolute top-3 right-3">Leaders</span></div>
                    <div className="border-r border-white/5 p-3 relative"><span className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute bottom-3 left-3">Niche</span></div>
                    <div className="p-3 relative"><span className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute bottom-3 right-3">Challengers</span></div>
                </div>
                {/* Grid Lines */}
                <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none opacity-10"><div className="w-px h-full bg-white"></div><div className="w-px h-full bg-white"></div><div className="w-px h-full bg-white"></div></div>
                <div className="absolute inset-0 flex flex-col justify-between py-[25%] pointer-events-none opacity-10"><div className="h-px w-full bg-white"></div><div className="h-px w-full bg-white"></div><div className="h-px w-full bg-white"></div></div>
                {/* Nodes */}
                {startups.map((node) => (
                    <div key={node.id} className="absolute z-30 group/node" style={{ left: `${node.x}%`, bottom: `${node.y}%`, transform: 'translate(-50%, 50%)' }} onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)} onClick={() => navigate(`/startup/${node.id}`)}>
                        <div className="relative w-6 h-6 flex items-center justify-center -m-3"> 
                            <div className="data-dot-pulse absolute w-2 h-2 border border-ethaum-green/50 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)] group-hover/node:bg-ethaum-green group-hover/node:scale-150 transition-all duration-300 relative z-10"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        {/* X-Axis */}
        <div className="mt-4 ml-6 flex items-center gap-2 text-[9px] font-bold text-blue-500 uppercase tracking-widest">Market Traction (Upvotes) <MoveRight size={10} /></div>
        
        {/* Tooltip */}
        {hoveredNode && (
            <div className="absolute z-[60] bg-[#0A0A0A]/95 backdrop-blur-md border border-white/20 rounded-lg p-4 w-52 flex flex-col gap-3 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150" style={{ left: '50%', top: '50%', transform: `translate(${hoveredNode.x > 50 ? '-110%' : '10%'}, ${hoveredNode.y > 50 ? '10%' : '-110%'})` }}>
                <div className="flex justify-between items-start pb-2 border-b border-white/10">
                    <div><span className="text-xs font-black text-white uppercase tracking-wider block">{hoveredNode.name}</span><span className="text-[9px] font-bold text-gray-500">{hoveredNode.stage}</span></div>
                    <ShieldCheck size={14} className="text-ethaum-green" />
                </div>
                <div className="text-[10px] text-gray-400 leading-snug">{hoveredNode.tagline}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-white/5 p-1.5 rounded text-center"><div className="text-[8px] text-blue-400 uppercase font-bold">Traction</div><div className="text-xs font-black text-white">{hoveredNode.upvotes_count || 0}</div></div>
                    <div className="bg-white/5 p-1.5 rounded text-center"><div className="text-[8px] text-ethaum-green uppercase font-bold">Score</div><div className="text-xs font-black text-white">{hoveredNode.eth_aum_score || 0}</div></div>
                </div>
            </div>
        )}
    </div>
  );

  // --- RENDER LOGIC ---
  if (!isPublic) {
      return (
          <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
              <Chart />
          </div>
      );
  }

  // PUBLIC VIEW
  const content = (
      <div ref={containerRef} className="w-full h-full p-6 md:p-12 flex flex-col justify-center relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 h-full">
            <div className="lg:w-1/3 flex flex-col justify-center relative z-20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-1.5 bg-ethaum-green rounded-full shadow-[0_0_8px_#ccff00] animate-pulse"></div>
                    <span className="text-ethaum-green text-[10px] font-bold uppercase tracking-[0.3em]">Live Quadrant</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-[0.9] tracking-tighter">
                  Validate <br/><span className="font-bold text-white">Execution.</span>
                </h2>
                <div className="space-y-6 mb-8 border-l-2 border-white/10 pl-6 py-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> X-Axis (Traction)</span>
                        <span className="text-xs text-gray-500">Weighted enterprise upvotes & deal velocity.</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-ethaum-green"/> Y-Axis (Vertical)</span>
                        <span className="text-sm font-bold text-white">Innovation Score</span>
                        <span className="text-xs text-gray-500">AI-verified technical differentiation.</span>
                    </div>
                </div>
                <div className="flex gap-8">
                    <div><div className="text-3xl font-black text-white mb-1">{startups.length}</div><div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-widest font-bold"><Target size={12} /> Live Nodes</div></div>
                </div>
                
                {/* ACTION BUTTON */}
                <div className="mt-6">
                    {user ? (
                        <button onClick={() => navigate('/market')} className="flex items-center gap-2 text-xs font-bold text-ethaum-green border border-ethaum-green/30 px-4 py-2 rounded-lg hover:bg-ethaum-green hover:text-black transition-all">
                            Open Full Console <ExternalLink size={14}/>
                        </button>
                    ) : (
                        <button onClick={() => navigate('/auth')} className="flex items-center gap-2 text-xs font-bold text-gray-500 border border-white/10 px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all">
                            Login to Access <ExternalLink size={14}/>
                        </button>
                    )}
                </div>
            </div>
            <div className="lg:w-2/3 w-full flex flex-col items-center justify-center relative">
                <Chart />
            </div>
        </div>
      </div>
  );
  return <StackedSection title="Market Intelligence" index={2} id="quadrants">{content}</StackedSection>;
}