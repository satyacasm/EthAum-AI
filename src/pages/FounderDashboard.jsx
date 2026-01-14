import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { generateLaunchAssets, generateEmbedding } from "../lib/openai"; // AI LIVE
import { Loader2 } from "lucide-react"; 

// Components
import Navbar from "../components/NavBar"; 
import ChatWindow from "../components/ChatWindow";
import EditStartupModal from "../components/EditStartupModal";
import FounderOnboarding from "../components/dashboard/FounderOnboarding";
import VaultUploader from "../components/dashboard/VaultUploader";
import FounderMainView from "../components/dashboard/FounderMainView";

export default function FounderDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [startup, setStartup] = useState(null);
  const [requests, setRequests] = useState([]);
  
  // UI State
  const [step, setStep] = useState(0); 
  const [activeTab, setActiveTab] = useState("listed"); 
  const [activeChatRequest, setActiveChatRequest] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [signedUrls, setSignedUrls] = useState({});

  // Form State - UPDATED WITH DEAL PARAMS
  const [formData, setFormData] = useState({
    name: "", website_url: "", tagline: "", description: "", 
    stage: "Series A", arr_range: "$1M-$5M", deal_offer: "",
    pilot_price_deal: 0, 
    slots_total: 5       
  });
  const [files, setFiles] = useState({
    pitch_deck_url: null, technical_docs_url: null, financials_url: null, compliance_url: null
  });
  
  // AI & Upload State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (user) fetchInitialData(); }, [user]);

  // Generate Signed URLs for Vault Access
  useEffect(() => {
    if (!startup) return;
    const generateFounderLinks = async () => {
        const fileKeys = ['pitch_deck_url', 'technical_docs_url', 'financials_url', 'compliance_url'];
        const urls = {};
        for (const key of fileKeys) {
            const path = startup[key];
            if (path && !path.startsWith('http')) {
                const { data } = await supabase.storage.from('vault-assets').createSignedUrl(path, 3600);
                if (data?.signedUrl) urls[key] = data.signedUrl;
            } else if (path) {
                urls[key] = path; 
            }
        }
        setSignedUrls(urls);
    };
    generateFounderLinks();
  }, [startup]);

  const fetchInitialData = async () => {
    try {
      const { data } = await supabase.from('startups').select('*').eq('founder_id', user.id).maybeSingle();
      if (data) {
        setStartup(data);
        setFormData({
            name: data.name || "", website_url: data.website_url || "", tagline: data.tagline || "",
            description: data.description || "", stage: data.stage || "Series A",
            arr_range: data.arr_range || "$1M-$5M", deal_offer: data.deal_offer || "",
            pilot_price_deal: data.pilot_price_deal || 0, // Load Price
            slots_total: data.slots_total || 5            // Load Slots
        });
        
        // Determine Logic Step
        if (!data.is_onboarded) setStep(0);
        else if (!data.vault_ready) setStep(1);
        else { 
            setStep(2); 
            fetchRequests(data.id); 
        }
      } else {
          setStep(0);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchRequests = async (startupId) => {
    const { data } = await supabase.from('pilot_requests').select('*, profiles:buyer_id (full_name, role, email)').eq('startup_id', startupId).order('created_at', { ascending: false });
    setRequests(data || []);
  };

  // --- AI LOGIC: GENERATE ASSETS ---
  const handleAiFill = async () => {
    if (!formData.description || formData.description.length < 5) {
        alert("Please provide a basic description or URL first.");
        return;
    }
    setAiLoading(true); 
    setAiError(null);
    try {
      const assets = await generateLaunchAssets(formData.description, formData.website_url);
      setFormData(prev => ({ 
          ...prev, 
          tagline: assets.tagline || prev.tagline, 
          deal_offer: assets.offer || prev.deal_offer, 
          description: assets.elaborated_description || prev.description 
      }));
    } catch (error) {
      console.error(error); 
      setAiError("Neural Uplink Failed. Check API Quota.");
    } finally { setAiLoading(false); }
  };

  const uploadToStorage = async (file, field) => {
    const path = `${user.id}/${field}_${Date.now()}.pdf`;
    const { error } = await supabase.storage.from('vault-assets').upload(path, file);
    if (error) throw error;
    return path;
  };

  // --- UPDATE STARTUP (Including Deal Params) ---
  const handleUpdateStartup = async () => {
    setUploading(true);
    try {
      const updates = { ...formData };
      
      if (formData.description) {
         try {
             const embedding = await generateEmbedding(formData.description);
             if (embedding) updates.description_embedding = embedding;
         } catch (e) { console.error("Vector generation failed", e); }
      }

      for (const key in files) {
          if (files[key]) updates[key] = await uploadToStorage(files[key], key);
      }
      
      await supabase.from('startups').update(updates).eq('id', startup.id);
      await fetchInitialData();
      setIsEditModalOpen(false);
    } finally { setUploading(false); }
  };

  const handleRequestStatus = async (requestId, newStatus) => {
    const { error } = await supabase.from('pilot_requests').update({ status: newStatus }).eq('id', requestId);
    if (!error) setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-ethaum-green" size={40} />
    </div>
  );

  const displayStartup = startup ? { ...startup, ...signedUrls } : null;

  return (
    <>
      <Navbar />
      {activeChatRequest && <ChatWindow request={activeChatRequest} currentUser={user} onClose={() => setActiveChatRequest(null)} />}
      
      <EditStartupModal 
        isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        formData={formData} setFormData={setFormData}
        handleAiFill={handleAiFill} aiLoading={aiLoading}
        uploading={uploading} onSave={handleUpdateStartup} setFiles={setFiles}
      />

      <div className="min-h-screen bg-black pt-24 pb-12 px-4 md:px-8 text-white font-sans selection:bg-ethaum-green selection:text-black">
        {step === 0 && (
          <FounderOnboarding 
            formData={formData} setFormData={setFormData} 
            handleAiFill={handleAiFill} aiLoading={aiLoading} aiError={aiError}
            onSave={async () => {
               if (!formData.name || !formData.description) return alert("Terminal requires Name and Description.");
               let embedding = null;
               try { embedding = await generateEmbedding(formData.description); } catch (e) {}

               const { data, error } = await supabase.from('startups').upsert({
                 founder_id: user.id, 
                 ...formData, 
                 description_embedding: embedding,
                 is_onboarded: true
               }).select().single();

               if (error) { alert("Initialization Failed: " + error.message); return; }
               setStartup(data); 
               setStep(1); 
            }}
          />
        )}

        {step === 1 && (
          <VaultUploader 
            files={files} setFiles={setFiles} uploading={uploading} stage={formData.stage}
            onLaunch={async () => {
               setUploading(true);
               try {
                 const updates = { vault_ready: true };
                 for (const key in files) {
                    if (files[key]) updates[key] = await uploadToStorage(files[key], key);
                 }
                 const { error } = await supabase.from('startups').update(updates).eq('founder_id', user.id);
                 if (error) throw error;
                 fetchInitialData();
               } catch (err) { alert("Launch Failed: " + err.message); } 
               finally { setUploading(false); }
            }}
          />
        )}

        {step === 2 && (
          <FounderMainView 
            startup={displayStartup}
            requests={requests}
            activeTab={activeTab} setActiveTab={setActiveTab}
            setIsEditModalOpen={setIsEditModalOpen}
            handleRequestStatus={handleRequestStatus}
            setActiveChatRequest={setActiveChatRequest}
          />
        )}
      </div>
    </>
  );
}