import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create client for data storage only (auth handled by Clerk)
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Types for our database tables
export interface User {
    id: string;
    clerk_user_id: string;
    github_username: string;
    encrypted_pat: string;
    created_at: string;
    updated_at: string;
}

export interface UserSettings {
    id: string;
    user_id: string;
    auto_rescan_enabled: boolean;
    auto_rescan_interval_ms: number;
    last_scan: string | null;
    right_panel_open: boolean;
    created_at: string;
    updated_at: string;
}

export interface Rival {
    id: string;
    user_id: string;
    rival_username: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface GitHubStatsCache {
    id: string;
    username: string;
    data: unknown;
    expires_at: string;
    created_at: string;
}
