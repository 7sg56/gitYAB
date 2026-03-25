import { supabase, getCurrentUserRecord, getCurrentUserId } from './supabase';
import { generateSessionKey, encryptWithSessionKey, decryptWithSessionKey } from './encryption';

/**
 * Authentication and data management functions
 */

// Session key for encrypting/decrypting PAT during the user's session
let sessionKey: string | null = null;

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
    sessionKey = key;
    return key;
}

/**
 * Clear the session key (on logout)
 */
export function clearSessionKey(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gityab_session_key');
    }
    sessionKey = null;
}

/**
 * Encrypt PAT using session key
 */
function encryptPatForStorage(pat: string): string {
    const key = initSessionKey();
    return encryptWithSessionKey(pat, key);
}

/**
 * Decrypt PAT using session key
 */
function decryptPatFromStorage(encryptedPat: string): string {
    const key = initSessionKey();
    return decryptWithSessionKey(encryptedPat, key);
}

// ========================
// Authentication
// ========================

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
    clearSessionKey();
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const { data, error } = await supabase.auth.getUser();
    return { isAuthenticated: !!data.user, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

// ========================
// User Data
// ========================

/**
 * Complete initial setup - save GitHub username and PAT
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function completeSetup(githubUsername: string, pat: string) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const encryptedPat = encryptPatForStorage(pat);

    const { data, error } = await supabase
        .from('users')
        .update({ github_username: githubUsername, encrypted_pat: encryptedPat } as any)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Get user's GitHub PAT (decrypted)
 */
export async function getPat(): Promise<string | null> {
    const { data, error } = await getCurrentUserRecord();
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
export async function getGithubUsername(): Promise<string | null> {
    const { data, error } = await getCurrentUserRecord();
    if (error || !data) {
        return null;
    }
    return data.github_username;
}

/**
 * Check if user has completed setup
 */
export async function hasCompletedSetup(): Promise<boolean> {
    const username = await getGithubUsername();
    const pat = await getPat();
    return !!(username && pat);
}

// ========================
// User Settings
// ========================

/**
 * Get user settings
 */
export async function getUserSettings() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return null;
    }

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    return error ? null : (data as any | null);
}

/**
 * Update user settings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserSettings(settings: any) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('user_settings')
        .update(settings as any)
        .eq('user_id', userId)
        .select()
        .single();

    return { data, error };
}

// ========================
// Rivals
// ========================

/**
 * Get all rivals for the current user
 */
export async function getRivals() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('rivals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    return error ? [] : (data as any[] || []);
}

/**
 * Add a new rival
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addRival(rivalUsername: string) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('rivals')
        .insert({ user_id: userId, rival_username: rivalUsername.toLowerCase(), enabled: true } as any)
        .select()
        .single();

    return { data, error };
}

/**
 * Remove a rival
 */
export async function removeRival(rivalId: string) {
    const userId = await getCurrentUserId();
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function toggleRival(rivalId: string, enabled: boolean) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('rivals')
        .update({ enabled } as any)
        .eq('id', rivalId)
        .eq('user_id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Batch update rivals enabled states
 */
export async function updateRivalsEnabledStates(rivalsEnabled: Record<string, boolean>) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: { message: 'User not authenticated' } };
    }

    const updates = Object.entries(rivalsEnabled).map(([rivalUsername, enabled]) =>
        supabase
            .from('rivals')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update({ enabled } as any)
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheStats(username: string, data: any, expiresInMinutes: number = 5) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const { error } = await supabase
        .from('github_stats_cache')
        .upsert({ username: username.toLowerCase(), data, expires_at: expiresAt.toISOString() } as any);

    return { error };
}
