-- ================================================
-- GitYab Database Schema
-- ================================================
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- Users Table (linked to auth.users)
-- ================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    github_username TEXT NOT NULL UNIQUE,
    encrypted_pat TEXT NOT NULL,  -- Client-side encrypted PAT
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- User Settings Table
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    auto_rescan_enabled BOOLEAN DEFAULT FALSE,
    auto_rescan_interval_ms INTEGER DEFAULT 600000,  -- 10 minutes
    last_scan TIMESTAMPTZ,
    right_panel_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Rivals Table
-- ================================================
CREATE TABLE IF NOT EXISTS public.rivals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rival_username TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, rival_username)
);

-- ================================================
-- GitHub Stats Cache Table (Optional - for performance)
-- ================================================
CREATE TABLE IF NOT EXISTS public.github_stats_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,  -- Stores the full GitHubUserStats object
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Indexes for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_rivals_user_id ON public.rivals(user_id);
CREATE INDEX IF NOT EXISTS idx_rivals_rival_username ON public.rivals(rival_username);
CREATE INDEX IF NOT EXISTS idx_github_stats_cache_username ON public.github_stats_cache(username);
CREATE INDEX IF NOT EXISTS idx_github_stats_cache_expires ON public.github_stats_cache(expires_at);

-- ================================================
-- Updated At Trigger
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rivals_updated_at ON public.rivals;
CREATE TRIGGER update_rivals_updated_at
    BEFORE UPDATE ON public.rivals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Row Level Security (RLS) Policies
-- ================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_stats_cache ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth_id = auth.uid());

CREATE POLICY "Users can insert their own data"
    ON public.users FOR INSERT
    WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth_id = auth.uid());

CREATE POLICY "Users can delete their own data"
    ON public.users FOR DELETE
    USING (auth_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings FOR DELETE
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Rivals table policies
CREATE POLICY "Users can view their own rivals"
    ON public.rivals FOR SELECT
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own rivals"
    ON public.rivals FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own rivals"
    ON public.rivals FOR UPDATE
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own rivals"
    ON public.rivals FOR DELETE
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- GitHub stats cache policies (read-only cache)
CREATE POLICY "Anyone can read cache" ON public.github_stats_cache
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can write cache" ON public.github_stats_cache
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- Auto-create user profile on signup
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, github_username, encrypted_pat)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'github_username', ''),
        ''
    );
    INSERT INTO public.user_settings (user_id)
    VALUES ((SELECT id FROM public.users WHERE auth_id = NEW.id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- Cleanup on user deletion
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.rivals WHERE user_id = OLD.id;
    DELETE FROM public.user_settings WHERE user_id = OLD.id;
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();
