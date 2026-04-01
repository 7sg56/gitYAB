import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

// Create client without strict typing to avoid inference issues
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Types for our database tables
export interface User {
    id: string;
    auth_id: string;
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

// Helper function to get current user's user record (not auth record)
export async function getCurrentUserRecord() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { data: null, error: authError };
    }

    let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

    // In GitHub SSO, the username is under user_name or preferred_username
    // In our old email flow, it was github_username
    const actualGithubUsername = user.user_metadata?.preferred_username ||
        user.user_metadata?.user_name ||
        user.user_metadata?.github_username || '';

    if (!data && !error) {
        // Automatically create the user record if the trigger failed or is missing
        const { data: newData, error: insertError } = await supabase
            .from('users')
            .insert({
                auth_id: user.id,
                github_username: actualGithubUsername,
                encrypted_pat: ''
            })
            .select()
            .maybeSingle();

        if (newData) {
            // Also create user_settings with explicit defaults
            await supabase.from('user_settings').insert({
                user_id: newData.id,
                right_panel_open: true,
                auto_rescan_enabled: false,
                auto_rescan_interval_ms: 600000 // 10 minutes
            });
        }

        data = newData;
        error = insertError;
    } else if (data && !data.github_username && actualGithubUsername) {
        // Self-healing: if the row was created previously with an empty username, fix it
        await supabase
            .from('users')
            .update({ github_username: actualGithubUsername })
            .eq('id', data.id);
        data.github_username = actualGithubUsername;
    }

    return { data, error };
}

// Helper function to get current user ID (from users table)
export async function getCurrentUserId() {
    const { data, error } = await getCurrentUserRecord();
    if (error || !data) {
        return null;
    }
    return data.id;
}
