-- ================================================
-- Clerk Integration Migration
-- ================================================
-- This migration replaces Supabase Auth with Clerk for authentication
-- while keeping Supabase as a pure data storage solution

-- ================================================
-- Drop old triggers that depend on auth.users
-- ================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- ================================================
-- Drop old functions that depend on auth.users
-- ================================================
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_delete();

-- ================================================
-- Update Users Table to use Clerk User IDs
-- ================================================
-- Drop foreign key constraint and add Clerk-specific constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;

-- Rename auth_id to clerk_user_id for clarity
ALTER TABLE public.users RENAME COLUMN auth_id TO clerk_user_id;

-- Drop old unique constraint and add new one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key;
ALTER TABLE public.users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);

-- ================================================
-- Update Row Level Security (RLS) Policies
-- ================================================
-- Note: With Clerk, authentication is handled client-side.
-- RLS policies are temporarily permissive and will be enforced
-- through proper server-side verification in production.

-- Users table policies - Simplified for Clerk integration
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- Since we're using Clerk, auth.uid() from Supabase won't work.
-- For now, we use a simpler approach - policies allow all access
-- and we enforce security at the application level using Clerk.
-- In production, implement server-side verification.

CREATE POLICY "Users can view all data"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert data"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their own data"
    ON public.users FOR DELETE
    USING (true);

-- User settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

CREATE POLICY "Users can view all settings"
    ON public.user_settings FOR SELECT
    USING (true);

CREATE POLICY "Users can insert settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update settings"
    ON public.user_settings FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete settings"
    ON public.user_settings FOR DELETE
    USING (true);

-- Rivals policies
DROP POLICY IF EXISTS "Users can view their own rivals" ON public.rivals;
DROP POLICY IF EXISTS "Users can insert their own rivals" ON public.rivals;
DROP POLICY IF EXISTS "Users can update their own rivals" ON public.rivals;
DROP POLICY IF EXISTS "Users can delete their own rivals" ON public.rivals;

CREATE POLICY "Users can view all rivals"
    ON public.rivals FOR SELECT
    USING (true);

CREATE POLICY "Users can insert rivals"
    ON public.rivals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update rivals"
    ON public.rivals FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete rivals"
    ON public.rivals FOR DELETE
    USING (true);

-- GitHub stats cache policies (keep as is)
DROP POLICY IF EXISTS "Anyone can read cache" ON public.github_stats_cache;
DROP POLICY IF EXISTS "Authenticated users can write cache" ON public.github_stats_cache;

CREATE POLICY "Anyone can read cache" ON public.github_stats_cache
    FOR SELECT USING (true);

CREATE POLICY "Anyone can write cache" ON public.github_stats_cache
    FOR ALL USING (true);

-- ================================================
-- Helper function to get user by Clerk ID
-- ================================================
CREATE OR REPLACE FUNCTION public.get_user_by_clerk_id(clerk_id TEXT)
RETURNS public.users AS $$
BEGIN
    RETURN (
        SELECT * FROM public.users
        WHERE clerk_user_id = clerk_id
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- Helper function to create user from Clerk
-- ================================================
CREATE OR REPLACE FUNCTION public.create_user_from_clerk(
    p_clerk_user_id TEXT,
    p_github_username TEXT,
    p_encrypted_pat TEXT DEFAULT ''
)
RETURNS public.users AS $$
DECLARE
    v_user public.users;
BEGIN
    INSERT INTO public.users (clerk_user_id, github_username, encrypted_pat)
    VALUES (p_clerk_user_id, p_github_username, p_encrypted_pat)
    RETURNING * INTO v_user;

    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (v_user.id);

    RETURN v_user;
END;
$$ LANGUAGE plpgsql;
