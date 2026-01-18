import { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import { AmbientBackground } from "../components/UIEffects";
import EnterpriseDeals from "../components/EnterpriseDeals";
import TrendingLaunches from "../components/TrendingLaunches";
import MarketIntelligence from "../components/MarketIntelligence";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MarketConsole() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Basic Protection Check
  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      {/* SCROLL FIX: 'min-h-screen' ensures full background, 'overflow-y-auto' enables scrolling */}
      <div className="min-h-screen w-full bg-[#020202] pt-24 pb-12 px-4 md:px-8 font-sans relative overflow-y-auto custom-scrollbar">
        <AmbientBackground />
        
        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-10">
           <h1 className="text-4xl md:text-5xl font-light text-white tracking-tighter uppercase mb-2">Market <span className="font-bold">Console</span></h1>
           <p className="text-gray-500 text-sm max-w-xl">Real-time intelligence on active pilots, trending launches, and market signals.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
            
            {/* 1. Market Quadrant (Large Chart) */}
            <div className="lg:col-span-8 h-[400px] md:h-[500px] bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden relative">
                <MarketIntelligence isPublic={false} />
            </div>

            {/* 2. Trending Launches (Side List) */}
            {/* This card has its own internal scroll, but if the page is small, the main page will now scroll too */}
            <div className="lg:col-span-4 h-[400px] md:h-[500px] bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden relative">
                <TrendingLaunches isPublic={false} />
            </div>

            {/* 3. Deal Flow (Bottom Wide) */}
            <div className="lg:col-span-12 h-[350px] bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden relative">
                 <div className="absolute top-4 left-6 z-10">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest">Live Deal Flow</h3>
                 </div>
                 <EnterpriseDeals isPublic={false} />
            </div>

        </div>
      </div>
    </>
  );
}