-- Migration: Add Level Notes and Knowledge Quests
-- File: supabase/migrations/20261007_add_level_notes_and_knowledge_quests.sql

-- 1. Create public.level_notes Table
CREATE TABLE IF NOT EXISTS public.level_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id TEXT UNIQUE NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_points JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of bullet cards
    formulas_rules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of LaTeX objects {"label": "Ohm's Law", "latex": "V = I \\times R"}
    worked_example JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"problem": "...", "step_by_step": "...", "solution": "..."}
    visual_asset_url TEXT, -- Diagram or interactive visual URL
    real_world_connection TEXT NOT NULL, -- e.g. "How smartphone chargers regulate voltage"
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create public.knowledge_quests Table
CREATE TABLE IF NOT EXISTS public.knowledge_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track course_track NOT NULL,
    module_index INT NOT NULL CHECK (module_index BETWEEN 1 AND 3), -- Every 10 levels (1-10, 11-20, 21-30)
    title TEXT NOT NULL,
    recap_summary TEXT NOT NULL,
    concept_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb, -- Synthesized concepts across the 10 levels
    key_formulas JSONB NOT NULL DEFAULT '[]'::jsonb,
    practice_flashcards JSONB NOT NULL DEFAULT '[]'::jsonb, -- Interactive revision cards
    unlocked_after_level_number INT NOT NULL, -- e.g. Level 10, Level 20, Level 30
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_track_module UNIQUE (track, module_index)
);

-- 3. Update public.user_course_progress Table
ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS read_notes_level_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS completed_knowledge_quest_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
