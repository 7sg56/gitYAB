'use client';

import { supabase } from './supabase';

/**
 * Clerk-based authentication state and utilities
 */

export interface ClerkUser {
    id: string;
    clerkUserId: string;
    email?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
}

// ============================
// In-memory cache for user lookups
// Prevents repeated Supabase round-trips for the same user within a session
// ============================
const userIdCache = new Map<string, string>();           // clerkUserId -> supabase id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userRecordCache = new Map<string, any>();           // clerkUserId -> full user record
const USER_RECORD_MAX_AGE = 60_000;                       // 60s before we allow a re-fetch
const userRecordTimestamps = new Map<string, number>();    // clerkUserId -> last fetch time

export function invalidateUserCache(clerkUserId: string) {
    userIdCache.delete(clerkUserId);
    userRecordCache.delete(clerkUserId);
    userRecordTimestamps.delete(clerkUserId);
}

/**
 * Syncs a Clerk user to the Supabase database if they don't exist
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncClerkUserToSupabase(userId: string, user: any) {
    try {
        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', userId)
            .maybeSingle();

        if (existingUser) {
            // Warm the cache
            userIdCache.set(userId, existingUser.id);
            userRecordCache.set(userId, existingUser);
            userRecordTimestamps.set(userId, Date.now());
            return existingUser;
        } else if (!fetchError) {
            // Create new user in Supabase
            const githubUsername = user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '';

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    clerk_user_id: userId,
                    github_username: githubUsername,
                    encrypted_pat: ''
                })
                .select()
                .maybeSingle();

            if (newUser && !insertError) {
                // Warm the cache
                userIdCache.set(userId, newUser.id);
                userRecordCache.set(userId, newUser);
                userRecordTimestamps.set(userId, Date.now());

                // Create default user settings
                await supabase.from('user_settings').insert({
                    user_id: newUser.id,
                    right_panel_open: true,
                    auto_rescan_enabled: false,
                    auto_rescan_interval_ms: 600000
                });

                return newUser;
            }
        }
    } catch (error) {
        console.error('Error syncing user to Supabase:', error);
    }
    return null;
}

/**
 * Get the Supabase user ID from Clerk user ID (cached)
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
    // Check in-memory cache first
    const cached = userIdCache.get(clerkUserId);
    if (cached) return cached;

    try {
        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle();

        if (data?.id) {
            userIdCache.set(clerkUserId, data.id);
        }
        return data?.id || null;
    } catch (error) {
        console.error('Error getting Supabase user ID:', error);
        return null;
    }
}

/**
 * Helper function to get current user ID (from users table)
 */
export async function getCurrentUserId(clerkUserId: string): Promise<string | null> {
    return getSupabaseUserId(clerkUserId);
}

/**
 * Helper function to get current user's user record (cached for 60s)
 */
export async function getCurrentUserRecord(clerkUserId: string) {
    // Check in-memory cache
    const cachedRecord = userRecordCache.get(clerkUserId);
    const cachedTime = userRecordTimestamps.get(clerkUserId) ?? 0;
    if (cachedRecord && (Date.now() - cachedTime) < USER_RECORD_MAX_AGE) {
        return { data: cachedRecord, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle();

        if (data && !error) {
            userRecordCache.set(clerkUserId, data);
            userRecordTimestamps.set(clerkUserId, Date.now());
            userIdCache.set(clerkUserId, data.id);
        }

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}
