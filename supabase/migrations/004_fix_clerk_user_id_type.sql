-- ================================================
-- Fix clerk_user_id Data Type Migration
-- ================================================
-- Clerk uses string IDs (e.g., 'user_2bK...'), not UUIDs.
-- The previous migration renamed 'auth_id' to 'clerk_user_id'
-- but left the data type as UUID. This migration fixes the type.

ALTER TABLE public.users ALTER COLUMN clerk_user_id TYPE TEXT USING clerk_user_id::TEXT;
