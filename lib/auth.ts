import { supabase } from './supabase';
import { generateSessionKey, encryptWithSessionKey, decryptWithSessionKey } from './encryption';
import { getCurrentUserId, getCurrentUserRecord } from './clerk-auth';

/**
 * Authentication and data management functions
 * Clerk handles authentication, Supabase handles data storage
 */

/**
 * Initialize or retrieve the session key from sessionStorage
 */
export function initSessionKey(): string {
    if (typeof window === 'undefined') {
        throw new Error('Session key must be initialized in browser');
    }

    let key = sessionStorage.getItem('gityab_session_key');
    if (!key) {
        key = generateSessionKey();
        sessionStorage.setItem('gityab_session_key', key);
    }
    return key;
}

/**
 * Clear the session key (on logout)
 */
export function clearSessionKey(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gityab_session_key');
    }
}

/**
 * Encrypt PAT using the session key
 */
function encryptPatForStorage(pat: string): string {
    const key = initSessionKey();
    return encryptWithSessionKey(pat, key);
}

/**
 * Decrypt PAT using the session key
 */
function decryptPatFromStorage(encryptedPat: string): string {
    const key = initSessionKey();
    return decryptWithSessionKey(encryptedPat, key);
}

// ========================
// Authentication (handled by Clerk)
// ========================

/**
 * Sign in is handled by Clerk components
 * This function is kept for backwards compatibility
 */
export async function signInWithGithub() {
    // Clerk handles sign-in via their components
    return { data: null, error: null };
}

/**
 * Sign out is handled by Clerk
 * This function is kept for backwards compatibility
 */
export async function signOut() {
    // Clerk handles sign-out via their hooks
    clearSessionKey();
    return { error: null };
}

/**
 * Check if user is authenticated
 * This is now handled by Clerk hooks
 */
export async function isAuthenticated() {
    // Clerk handles auth state
    return { isAuthenticated: true, error: null };
}

/**
 * Listen to auth state changes
 * This is now handled by Clerk hooks
 */
export function onAuthStateChange() {
    // Clerk handles auth state via useAuth hook
    // This function is kept for backwards compatibility
    return { data: { subscription: { unsubscribe: () => {} } }, error: null };
}

// ========================
// User Data
// ========================

/**
 * Complete initial setup - save PAT
 */
export async function completeSetup(clerkUserId: string, pat: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const encryptedPat = encryptPatForStorage(pat);

    const { data, error } = await supabase
        .from('users')
        .update({ encrypted_pat: encryptedPat })
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Get user's GitHub PAT (decrypted)
 */
export async function getPat(clerkUserId: string): Promise<string | null> {
    const { data, error } = await getCurrentUserRecord(clerkUserId);
    if (error || !data || !data.encrypted_pat) {
        return null;
    }

    try {
        return decryptPatFromStorage(data.encrypted_pat);
    } catch {
        return null;
    }
}

/**
 * Get user's GitHub username
 */
export async function getGithubUsername(clerkUserId: string): Promise<string | null> {
    const { data, error } = await getCurrentUserRecord(clerkUserId);
    if (error) {
        console.error('Error fetching user record:', error);
        return null;
    }
    if (!data) {
        return null;
    }
    return data.github_username;
}

/**
 * Update user's GitHub username
 */
export async function updateGithubUsername(clerkUserId: string, username: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('users')
        .update({ github_username: username })
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Check if user has completed setup
 */
export async function hasCompletedSetup(clerkUserId: string): Promise<boolean> {
    const username = await getGithubUsername(clerkUserId);
    const pat = await getPat(clerkUserId);
    return !!(username && pat);
}

// ========================
// User Settings
// ========================

/**
 * Get user settings
 */
export async function getUserSettings(clerkUserId: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return null;
    }

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    return error ? null : data;
}

/**
 * Update user settings
 */
export async function updateUserSettings(clerkUserId: string, settings: { auto_rescan_enabled?: boolean; auto_rescan_interval_ms?: number; right_panel_open?: boolean; last_scan?: string }) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await (supabase
        .from('user_settings')
        .update(settings as Record<string, unknown>)
        .eq('user_id', userId)
        .select()
        .single());

    return { data, error };
}

// ========================
// Rivals
// ========================

/**
 * Get all rivals for the current user
 */
export async function getRivals(clerkUserId: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('rivals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    return error ? [] : (data ?? []);
}

/**
 * Add a new rival
 */
export async function addRival(clerkUserId: string, rivalUsername: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('rivals')
        .insert({ user_id: userId, rival_username: rivalUsername.toLowerCase(), enabled: true })
        .select()
        .single();

    return { data, error };
}

/**
 * Remove a rival
 */
export async function removeRival(clerkUserId: string, rivalId: string) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { error } = await supabase
        .from('rivals')
        .delete()
        .eq('id', rivalId)
        .eq('user_id', userId);

    return { error };
}

/**
 * Toggle rival enabled state
 */
export async function toggleRival(clerkUserId: string, rivalId: string, enabled: boolean) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('rivals')
        .update({ enabled })
        .eq('id', rivalId)
        .eq('user_id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Batch update rivals enabled states
 */
export async function updateRivalsEnabledStates(clerkUserId: string, rivalsEnabled: Record<string, boolean>) {
    const userId = await getCurrentUserId(clerkUserId);
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const updates = Object.entries(rivalsEnabled).map(([rivalUsername, enabled]) =>
        supabase
            .from('rivals')
            .update({ enabled })
            .eq('user_id', userId)
            .eq('rival_username', rivalUsername.toLowerCase())
    );

    await Promise.all(updates);
    return { error: null };
}

// ========================
// Stats Cache (Optional)
// ========================

/**
 * Get cached stats for a username
 */
export async function getCachedStats(username: string) {
    const { data, error } = await supabase
        .from('github_stats_cache')
        .select('*')
        .eq('username', username.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

    if (error || !data || new Date(data.expires_at) <= new Date()) {
        return null;
    }

    return data.data;
}

/**
 * Cache stats for a username
 */
export async function cacheStats(username: string, data: unknown, expiresInMinutes: number = 5) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const { error } = await supabase
        .from('github_stats_cache')
        .upsert({ username: username.toLowerCase(), data, expires_at: expiresAt.toISOString() } as Record<string, unknown>);

    return { error };
}
