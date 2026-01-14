import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/NavBar";
import SmoothScrollWrapper from "./components/SmoothScrollWrapper";
import { AmbientBackground } from "./components/UIEffects";
import Hero from "./components/Hero";
import TrendingLaunches from "./components/TrendingLaunches";
import MarketIntelligence from "./components/MarketIntelligence";
import EnterpriseDeals from "./components/EnterpriseDeals";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import StartupDetails from "./pages/StartupDetails";
import BuyerDashboard from "./pages/BuyerDashboard";
import AuthPage from "./pages/AuthPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import FounderDashboard from "./pages/FounderDashboard";
import MarketConsole from "./pages/MarketConsole";
import LaunchIntelligence from "./pages/LaunchIntelligence";
import DealRoom from "./pages/DealRoom"; // NEW IMPORT

function LandingPage() {
  return (
    <main className="w-full relative overflow-hidden">
      <Navbar />
      <Hero />
      <TrendingLaunches isPublic={true} />
      <MarketIntelligence isPublic={true} />
      <EnterpriseDeals isPublic={true} />
      <Footer />
    </main>
  );
}

function AppContent() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (location.pathname === "/" && !hasSeenIntro) {
      setShowIntro(true);
    } else {
      setShowIntro(false);
    }
  }, [location.pathname]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem("hasSeenIntro", "true"); 
  };

  return (
    <>
      {showIntro && <Loader onComplete={handleIntroComplete} />}
      <AmbientBackground />
      <div className={`w-full overflow-x-hidden relative ${showIntro ? 'h-screen overflow-hidden' : ''}`}>
        <SmoothScrollWrapper>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/startup/:id" element={<StartupDetails />} />
            
            {/* PRIVATE DASHBOARDS */}
            <Route element={<ProtectedRoute allowedRole="founder" />}>
              <Route path="/founder/dashboard" element={<FounderDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedRole="buyer" />}>
              <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            </Route>

            {/* CONSOLES (Accessible to Logged In) */}
            <Route element={<ProtectedRoute />}>
               <Route path="/market" element={<MarketConsole />} />
               <Route path="/launches" element={<LaunchIntelligence />} />
               <Route path="/deals" element={<DealRoom />} /> {/* NEW ROUTE */}
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </SmoothScrollWrapper>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}