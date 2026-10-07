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
    avatar_url TEXT,
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
    image_layer_url TEXT NOT NULL,
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
    challenge_type TEXT NOT NULL,
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
    stars_earned_json JSONB DEFAULT '{}'::jsonb,
    unlocked_level_number INT DEFAULT 1,
    read_notes_level_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    completed_knowledge_quest_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track)
);

-- 4b. INTERACTIVE LEVEL NOTES
CREATE TABLE IF NOT EXISTS public.level_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id TEXT UNIQUE NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    formulas_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    worked_example JSONB NOT NULL DEFAULT '{}'::jsonb,
    visual_asset_url TEXT,
    real_world_connection TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4c. KNOWLEDGE QUESTS (SYNTHESIS & BOSS REVISION)
CREATE TABLE IF NOT EXISTS public.knowledge_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track course_track NOT NULL,
    module_index INT NOT NULL CHECK (module_index BETWEEN 1 AND 3),
    title TEXT NOT NULL,
    recap_summary TEXT NOT NULL,
    concept_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_formulas JSONB NOT NULL DEFAULT '[]'::jsonb,
    practice_flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
    unlocked_after_level_number INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_track_module UNIQUE (track, module_index)
);

-- 5. BKT ADAPTIVE MASTERY (MVP Active Adaptive System)
CREATE TABLE IF NOT EXISTS public.bkt_topic_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track course_track NOT NULL,
    topic_tag TEXT NOT NULL,
    p_mastery FLOAT DEFAULT 0.30,
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

-- ==========================================================
-- REAL GOOGLE AUTHENTICATION & AUTOMATIC PROFILE TRIGGER
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_google_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_username TEXT;
    default_outfit_id UUID;
BEGIN
    -- Extract username from metadata (full_name, name) or email prefix
    extracted_username := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Find default mascot outfit (EEE_HIGH_VOLTAGE)
    SELECT id INTO default_outfit_id FROM public.mascot_outfits WHERE code = 'EEE_HIGH_VOLTAGE' LIMIT 1;

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        username,
        avatar_url,
        active_track,
        xp,
        spark_coins,
        streak_days,
        hearts,
        max_hearts,
        equipped_outfit_id,
        current_league,
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        extracted_username,
        NEW.raw_user_meta_data->>'avatar_url',
        'EEE',
        0,
        100,
        1,
        5,
        5,
        default_outfit_id,
        'Bronze',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Initialize starting course progress for all 3 tracks
    INSERT INTO public.user_course_progress (user_id, track, unlocked_level_number)
    VALUES 
        (NEW.id, 'EEE', 1),
        (NEW.id, 'CSE', 1),
        (NEW.id, 'ECE', 1)
    ON CONFLICT (user_id, track) DO NOTHING;

    -- Grant default outfit in inventory
    IF default_outfit_id IS NOT NULL THEN
        INSERT INTO public.user_mascot_inventory (user_id, outfit_id)
        VALUES (NEW.id, default_outfit_id)
        ON CONFLICT (user_id, outfit_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users insertion (Supabase Auth)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_google_user();
EXCEPTION
    WHEN undefined_table THEN null; -- If auth.users not present in standalone SQLite/local
END $$;

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Users can manage their own profile
CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- 2. Real-Player Leaderboard: Authenticated users can view usernames, xp, league for rankings
CREATE POLICY "Allow public read for global rankings" ON public.profiles 
    FOR SELECT USING (true);

ALTER TABLE public.user_mascot_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own inventory" ON public.user_mascot_inventory 
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own course progress" ON public.user_course_progress 
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.bkt_topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own topic mastery" ON public.bkt_topic_mastery 
    FOR ALL USING (auth.uid() = user_id);
