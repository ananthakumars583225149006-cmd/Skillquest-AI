-- ==========================================================
-- Skill Quest AI: Supabase & PostgreSQL Unified Schema
-- ==========================================================

-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN
    CREATE TYPE course_track AS ENUM ('CSE', 'ECE', 'EEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE outfit_category AS ENUM ('TRACK', 'CULTURAL', 'ACHIEVEMENT', 'BOSS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. USERS & PROFILES (Synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    active_track course_track DEFAULT 'EEE',
    xp INT DEFAULT 0,
    spark_coins INT DEFAULT 100,
    streak_days INT DEFAULT 1,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    hearts INT DEFAULT 5,
    max_hearts INT DEFAULT 5,
    equipped_outfit_id UUID,
    current_league TEXT DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MASCOT OUTFITS & INVENTORY
CREATE TABLE IF NOT EXISTS public.mascot_outfits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category outfit_category NOT NULL,
    image_layer_url TEXT NOT NULL, -- Supabase Storage Bucket URL or SVG key
    price_coins INT DEFAULT 0,
    unlock_required_badge TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_mascot_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    outfit_id UUID REFERENCES public.mascot_outfits(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, outfit_id)
);

-- 3. CURRICULUM: LEVELS & CHALLENGES
CREATE TABLE IF NOT EXISTS public.levels (
    id TEXT PRIMARY KEY, -- e.g. "eee-lvl-12"
    track course_track NOT NULL,
    module_index INT NOT NULL, -- 1, 2, 3
    level_number INT NOT NULL, -- 1 to 30 (scalable to 500)
    title TEXT NOT NULL,
    topic_tag TEXT NOT NULL,
    learning_objective TEXT NOT NULL,
    prerequisite TEXT NOT NULL,
    short_lesson_markdown TEXT NOT NULL,
    is_boss_level BOOLEAN DEFAULT FALSE,
    boss_scenario_brief TEXT,
    xp_reward INT DEFAULT 100,
    coin_reward INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id TEXT REFERENCES public.levels(id) ON DELETE CASCADE,
    order_index INT NOT NULL, -- 1 to 10
    challenge_type TEXT NOT NULL, -- SPICE_CIRCUIT, CODE_DEBUG, TRUTH_TABLE, SLIDER_TUNING, PHASOR_ALIGN
    prompt_text TEXT NOT NULL,
    initial_state_json JSONB NOT NULL,
    target_state_json JSONB NOT NULL,
    hints_json JSONB NOT NULL,
    difficulty_rating FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER PROGRESS & TELEMETRY
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track course_track NOT NULL,
    completed_level_ids JSONB DEFAULT '[]'::jsonb,
    stars_earned_json JSONB DEFAULT '{}'::jsonb, -- {"eee-lvl-1": 3}
    unlocked_level_number INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track)
);

-- 5. BKT ADAPTIVE MASTERY (MVP Active Adaptive System)
CREATE TABLE IF NOT EXISTS public.bkt_topic_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track course_track NOT NULL,
    topic_tag TEXT NOT NULL,
    p_mastery FLOAT DEFAULT 0.30, -- Initial L_0
    last_decay_timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_tag)
);

-- 6. FUTURE-READY BEHAVIORAL ANALYTICS HOOK
CREATE TABLE IF NOT EXISTS public.advanced_ml_telemetry_hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    raw_feature_vector JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUANTUM LEAGUES TABLE
CREATE TABLE IF NOT EXISTS public.league_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    league_tier TEXT NOT NULL DEFAULT 'Bronze',
    weekly_xp INT DEFAULT 0,
    division_id INT DEFAULT 1,
    rank INT DEFAULT 1,
    week_start_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, week_start_date)
);

-- RLS SECURITY POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read/update own profile" ON public.profiles 
    FOR ALL USING (auth.uid() = id);

ALTER TABLE public.user_mascot_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own inventory" ON public.user_mascot_inventory 
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own course progress" ON public.user_course_progress 
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.bkt_topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own topic mastery" ON public.bkt_topic_mastery 
    FOR ALL USING (auth.uid() = user_id);
