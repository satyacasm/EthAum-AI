-- ==============================================================================
-- ETHAUM.AI - ENTERPRISE MARKETPLACE SCHEMA
-- VERSION: 3.0 (Production Release)
-- 
-- DESCRIPTION:
-- Full database setup for Ethaum.ai including AI Vector Search, 
-- Launch Leaderboards, Deal Room Logic, and Secure Vault Storage.
--
-- INSTRUCTIONS:
-- 1. Create a new Supabase Project.
-- 2. Enable the "Vector" extension in Dashboard if not running this script.
-- 3. Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & CONFIGURATION
-- ------------------------------------------------------------------------------
-- Enable Vector extension for OpenAI embeddings (1536 dimensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------------------------
-- 2. PUBLIC TABLES
-- ------------------------------------------------------------------------------

-- 2.1 PROFILES
-- Extends the default Supabase auth.users table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text CHECK (role IN ('founder', 'buyer')),
  full_name text,
  startup_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 VERIFIED BUYERS
-- Whitelist for Enterprise Buyers (e.g., Microsoft, BMW)
CREATE TABLE public.verified_buyers (
  domain text NOT NULL PRIMARY KEY,
  company_name text NOT NULL,
  weight_score integer DEFAULT 5, -- Used for weighted voting logic
  logo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.3 STARTUPS
-- The core entity. Includes "Deal Room" fields and AI Embeddings.
CREATE TABLE public.startups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Public Profile
  name text NOT NULL,
  tagline text,
  description text,
  website_url text,
  logo_url text,
  stage text CHECK (stage IN ('Seed', 'Series A', 'Series B', 'Series C', 'Series D')),
  arr_range text,
  
  -- Deal Room Configuration
  deal_offer text,
  pilot_price_deal integer, -- Discounted price for platform
  pilot_price_retail integer, -- Original price (for comparison)
  slots_total integer DEFAULT 5,
  slots_taken integer DEFAULT 0,
  
  -- Launch Assets (Secure Paths)
  vault_ready boolean DEFAULT false,
  pitch_deck_url text,
  technical_docs_url text,
  financials_url text,
  compliance_url text,
  
  -- System Flags
  is_onboarded boolean DEFAULT false,
  upvotes_count integer DEFAULT 0,
  eth_aum_score integer DEFAULT 0, -- AI calculated innovation score
  
  -- AI Vector (OpenAI text-embedding-3-small)
  description_embedding vector(1536),
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 LAUNCHES (Launch Intelligence)
-- Tracks historical performance and "Product of the Day" status
CREATE TABLE public.launches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  launch_date date NOT NULL DEFAULT CURRENT_DATE,
  day_rank integer, -- Snapshot of rank for that day
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'completed')),
  featured_asset_url text,
  maker_comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.5 PILOT REQUESTS (Deal Flow)
-- Connects Buyers to Startups
CREATE TABLE public.pilot_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 PILOT MESSAGES (Chat)
CREATE TABLE public.pilot_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.pilot_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.7 UPVOTES
CREATE TABLE public.startup_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.8 REVIEWS
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. VIEWS (ADVANCED LOGIC)
-- ------------------------------------------------------------------------------

-- 3.1 DAILY LEADERBOARD VIEW
-- Automatically calculates rankings (1, 2, 3...) based on votes.
-- Handles tie-breaking by creation date.
CREATE OR REPLACE VIEW public.daily_leaderboard AS
SELECT 
    l.id AS launch_id,
    l.startup_id,
    l.launch_date,
    s.name,
    s.upvotes_count,
    s.tagline,
    s.stage,
    s.arr_range,
    s.logo_url,
    ROW_NUMBER() OVER (
        PARTITION BY l.launch_date 
        ORDER BY s.upvotes_count DESC, l.created_at ASC
    ) as calculated_rank
FROM public.launches l
JOIN public.startups s ON l.startup_id = s.id
WHERE l.status = 'live';

-- ------------------------------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- 4.1 AUTOMATIC VOTE COUNTER
-- Updates the startups table whenever a vote is cast
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.startups
  SET upvotes_count = COALESCE(upvotes_count, 0) + 1
  WHERE id = NEW.startup_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_vote_added
AFTER INSERT ON public.startup_upvotes
FOR EACH ROW
EXECUTE FUNCTION increment_vote_count();

-- 4.2 AI SEMANTIC MATCHING
-- Performs vector similarity search
CREATE OR REPLACE FUNCTION match_startups (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  tagline text,
  stage text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.tagline,
    s.stage,
    (1 - (s.description_embedding <=> query_embedding)) as similarity
  FROM public.startups s
  WHERE 1 - (s.description_embedding <=> query_embedding) > match_threshold
  ORDER BY s.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKETS
-- ------------------------------------------------------------------------------
-- Note: You might need to run this part in the Supabase Dashboard "Storage" section if SQL fails
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-assets', 'vault-assets', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_upvotes ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self Update Profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Startups
CREATE POLICY "Public Read Startups" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Founder Manage Startup" ON public.startups FOR ALL USING (auth.uid() = founder_id);

-- Launches
CREATE POLICY "Public Read Launches" ON public.launches FOR SELECT USING (true);
CREATE POLICY "Founder Manage Launches" ON public.launches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);

-- Requests
CREATE POLICY "Buyer Create Request" ON public.pilot_requests FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "View Own Requests" ON public.pilot_requests FOR SELECT USING (
  auth.uid() = buyer_id OR 
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);
CREATE POLICY "Founder Update Request" ON public.pilot_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);

-- Upvotes
CREATE POLICY "Public Read Votes" ON public.startup_upvotes FOR SELECT USING (true);
CREATE POLICY "User Vote" ON public.startup_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage (Vault)
CREATE POLICY "Founder Manage Own Assets" ON storage.objects
FOR ALL USING ( bucket_id = 'vault-assets' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Buyer Read Approved Assets" ON storage.objects
FOR SELECT USING (
    bucket_id = 'vault-assets'
    AND EXISTS (
        SELECT 1 FROM public.pilot_requests pr
        JOIN public.startups s ON pr.startup_id = s.id
        WHERE pr.buyer_id = auth.uid()
        AND pr.status = 'approved'
        AND s.founder_id::text = (storage.foldername(name))[1]
    )
);

-- ------------------------------------------------------------------------------
-- END OF SCHEMA
-- ------------------------------------------------------------------------------