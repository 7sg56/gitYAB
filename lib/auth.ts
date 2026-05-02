import { supabase } from './supabase';
import { getCurrentUserId, getCurrentUserRecord, invalidateUserCache } from './clerk-auth';

/**
 * Authentication and data management functions
 * Clerk handles authentication, Supabase handles data storage
 *
 * SECURITY: PAT encryption/decryption is handled server-side via /api/pat.
 * The encryption key (PAT_ENCRYPTION_SECRET) lives exclusively in the server
 * environment and never reaches the browser. This eliminates the previous
 * vulnerability where the key was stored in localStorage.
 */

/**
 * One-time cleanup: remove any legacy encryption keys from localStorage
 * that were left by the old client-side encryption implementation.
 */
export function cleanupLegacyKeys(clerkUserId: string): void {
    if (typeof window === 'undefined') return;
    const legacyKeys = [
        `gityab_session_key_${clerkUserId}`,
        `gityab_sk_${clerkUserId}`,
        'gityab_session_key',
    ];
    for (const key of legacyKeys) {
        localStorage.removeItem(key);
        try { sessionStorage.removeItem(key); } catch { /* ignore */ }
    }
}

/**
 * Encrypt PAT via server-side API route
 */
// In-memory PAT decryption cache -- avoids repeated /api/pat serverless
// cold starts on Vercel.  Keyed by the encrypted ciphertext so a changed
// PAT automatically invalidates the cache.
let _cachedDecryptedPat: string | null = null;
let _cachedEncryptedInput: string | null = null;

export function clearPatCache() {
    _cachedDecryptedPat = null;
    _cachedEncryptedInput = null;
}

async function encryptPatForStorage(pat: string): Promise<string> {
    const res = await fetch('/api/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'encrypt', data: pat }),
    });
    if (!res.ok) {
        throw new Error('Failed to encrypt PAT');
    }
    const { result } = await res.json();
    // Invalidate decrypt cache since PAT changed
    clearPatCache();
    return result;
}

/**
 * Decrypt PAT via server-side API route
 */
async function decryptPatFromStorage(encryptedPat: string): Promise<string> {
    // Return cached result if we already decrypted this exact ciphertext
    if (_cachedEncryptedInput === encryptedPat && _cachedDecryptedPat !== null) {
        return _cachedDecryptedPat;
    }

    const res = await fetch('/api/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decrypt', data: encryptedPat }),
    });
    if (!res.ok) {
        throw new Error('Failed to decrypt PAT');
    }
    const { result } = await res.json();

    // Cache so subsequent calls skip the serverless round-trip
    _cachedEncryptedInput = encryptedPat;
    _cachedDecryptedPat = result;

    return result;
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
    return { data: { subscription: { unsubscribe: () => { } } }, error: null };
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

    const encryptedPat = await encryptPatForStorage(pat);

    const { data, error } = await supabase
        .from('users')
        .update({ encrypted_pat: encryptedPat })
        .eq('id', userId)
        .select()
        .single();

    // Invalidate cached user record so next read picks up the new PAT
    if (!error) invalidateUserCache(clerkUserId);

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
        return await decryptPatFromStorage(data.encrypted_pat);
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

    // Invalidate cached user record so next read picks up the new username
    if (!error) invalidateUserCache(clerkUserId);

    return { data, error };
}

/**
 * Check if user has completed setup
 */
export async function hasCompletedSetup(clerkUserId: string): Promise<boolean> {
    const [username, pat] = await Promise.all([
        getGithubUsername(clerkUserId),
        getPat(clerkUserId),
    ]);
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
// DB Cache (Supabase)
// ========================

// Default TTLs per category (in minutes)
export const CACHE_TTLS = {
    profile: 24 * 60,     // 24 hours
    stats: 30,            // 30 minutes
    connections: 6 * 60,  // 6 hours
} as const;

export type CacheCategory = keyof typeof CACHE_TTLS;

/**
 * Get cached data for a username from Supabase
 */
export async function getCachedData<T = unknown>(category: CacheCategory, username: string): Promise<T | null> {
    const key = `${category}:${username.toLowerCase()}`;
    const { data, error } = await supabase
        .from('github_stats_cache')
        .select('*')
        .eq('username', key)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

    if (error || !data || new Date(data.expires_at) <= new Date()) {
        return null;
    }

    return data.data as T;
}

/**
 * Cache data for a username to Supabase
 */
export async function cacheData(category: CacheCategory, username: string, data: unknown, ttlMinutes?: number): Promise<void> {
    const key = `${category}:${username.toLowerCase()}`;
    const ttl = ttlMinutes ?? CACHE_TTLS[category];
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttl);

    await supabase
        .from('github_stats_cache')
        .upsert(
            { username: key, data, expires_at: expiresAt.toISOString() } as Record<string, unknown>,
            { onConflict: 'username' }
        );
}

// Backwards-compatible aliases
export const getCachedStats = (username: string) => getCachedData('stats', username);
export const cacheStats = (username: string, data: unknown, ttlMinutes?: number) => cacheData('stats', username, data, ttlMinutes);

