'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
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

/**
 * Hook that combines Clerk auth with Supabase user data
 */
export function useClerkAuth() {
    const { isLoaded, isSignedIn, userId, signOut } = useAuth();
    const { user } = useUser();
    const [dbUser, setDbUser] = useState<ClerkUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn || !userId) {
            setDbUser(null);
            setIsLoading(false);
            return;
        }

        // Fetch or create user in Supabase
        async function syncUser() {
            try {
                // Check if user exists in Supabase
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('clerk_user_id', userId)
                    .maybeSingle();

                if (existingUser) {
                    setDbUser({
                        id: existingUser.id,
                        clerkUserId: existingUser.clerk_user_id,
                        email: user?.primaryEmailAddress?.emailAddress || null,
                        username: existingUser.github_username || null,
                    });
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
                        // Create default user settings
                        await supabase.from('user_settings').insert({
                            user_id: newUser.id,
                            right_panel_open: true,
                            auto_rescan_enabled: false,
                            auto_rescan_interval_ms: 600000
                        });

                        setDbUser({
                            id: newUser.id,
                            clerkUserId: newUser.clerk_user_id,
                            email: user?.primaryEmailAddress?.emailAddress || null,
                            username: newUser.github_username || null,
                        });
                    }
                }
            } catch (error) {
                console.error('Error syncing user to Supabase:', error);
            } finally {
                setIsLoading(false);
            }
        }

        syncUser();
    }, [isLoaded, isSignedIn, userId, user]);

    return {
        isLoaded,
        isSignedIn: isSignedIn && !!dbUser,
        userId,
        user: dbUser,
        clerkUser: user,
        isLoading,
        signOut
    };
}

/**
 * Get the Supabase user ID from Clerk user ID
 */
export async function getSupabaseUserId(clerkUserId: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle();

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
 * Helper function to get current user's user record
 */
export async function getCurrentUserRecord(clerkUserId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}
