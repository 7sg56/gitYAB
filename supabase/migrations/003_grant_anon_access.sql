-- ================================================
-- Grant Anon Access Migration
-- ================================================
-- This migration ensures that the 'anon' role (used by Clerk via the frontend)
-- has the necessary permissions to access the public schema and tables,
-- allowing RLS policies to take effect instead of blocking at the schema level.

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions for users table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- Grant permissions for user_settings table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Grant permissions for rivals table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rivals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rivals TO authenticated;

-- Grant permissions for github_stats_cache table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_stats_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_stats_cache TO authenticated;
