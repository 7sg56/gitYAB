import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuth, useUser } from '@clerk/nextjs';
import {
    completeSetup,
    getPat,
    getGithubUsername,
    hasCompletedSetup,
    getUserSettings,
    updateUserSettings,
    getRivals,
    addRival as addRivalDb,
    removeRival as removeRivalDb,
    toggleRival as toggleRivalDb,
    initSessionKey,
} from '@/lib/auth';
import { syncClerkUserToSupabase } from '@/lib/clerk-auth';

type ViewType = 'home' | 'social' | 'feed' | 'comparator' | 'target' | 'graphs';

interface GitState {
    // Auth state
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    clerkUserId: string | null;
    hasSetupCompleted: boolean;
    isLoading: boolean;

    // Data state
    pat: string;
    mainUser: string;
    rivals: string[];
    enabledRivals: Record<string, boolean>;
    currentView: ViewType;
    autoRescanEnabled: boolean;
    autoRescanIntervalMs: number;
    lastScanTimestamp: number | null;
    rightPanelOpen: boolean;
    apiError: string | null;

    // Auth actions
    signInWithGithub: () => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
    completeSetup: (pat: string) => Promise<{ error: { message: string } | null }>;
    refreshAuthState: () => Promise<void>;

    // Data actions
    setPat: (pat: string) => void;
    setMainUser: (user: string) => void;
    addRival: (user: string) => Promise<void>;
    removeRival: (user: string) => Promise<void>;
    toggleRival: (user: string) => Promise<void>;
    clearState: () => void;
    setCurrentView: (view: ViewType) => void;
    setAutoRescanEnabled: (enabled: boolean) => Promise<void>;
    setAutoRescanIntervalMs: (ms: number) => Promise<void>;
    setLastScanTimestamp: (ts: number) => void;
    setRightPanelOpen: (open: boolean) => Promise<void>;
    setApiError: (error: string | null) => void;
    getActiveRivals: () => string[];
    syncFromDatabase: () => Promise<void>;
}

// Guard against concurrent refreshAuthState calls
let isRefreshing = false;

export const useGitStore = create<GitState>()(
    persist(
        (set, get) => ({
            // Initial state
            isAuthenticated: false,
            isAuthenticating: false,
            hasSetupCompleted: false,
            isLoading: false,
            clerkUserId: null,

            pat: '',
            mainUser: '',
            rivals: [],
            enabledRivals: {},
            currentView: 'home',
            autoRescanEnabled: false,
            autoRescanIntervalMs: 10 * 60 * 1000,
            lastScanTimestamp: null,
            rightPanelOpen: true,
            apiError: null,

            // Auth actions
            signInWithGithub: async () => {
                // Clerk handles sign-in
                return { error: null };
            },

            signOut: async () => {
                // We DON'T clear the session key on sign out anymore so that it persists 
                // for the next time the same user logs into this browser.
                set({
                    isAuthenticated: false,
                    clerkUserId: null,
                    hasSetupCompleted: false,
                    isLoading: false,
                    pat: '',
                    mainUser: '',
                    rivals: [],
                    enabledRivals: {},
                    isAuthenticating: false,
                });
                return { error: null };
            },

            completeSetup: async (pat: string) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) {
                    return { error: { message: 'User not authenticated' } };
                }

                set({ apiError: null });
                const result = await completeSetup(clerkUserId, pat);

                if (result.error) {
                    set({ apiError: result.error.message });
                    return { error: result.error };
                }

                await get().refreshAuthState();
                return { error: null };
            },

            refreshAuthState: async () => {
                if (isRefreshing) return;
                isRefreshing = true;
                set({ isLoading: true });
                try {
                    // Auth state is now managed by Clerk hooks
                    // This function is called from components that use useAuth
                    // So we just need to sync data from database
                    const clerkUserId = get().clerkUserId;

                    if (!clerkUserId) {
                        set({
                            isAuthenticated: false,
                            clerkUserId: null,
                            hasSetupCompleted: false,
                            isLoading: false,
                        });
                        return;
                    }

                    set({ isAuthenticated: true });

                    // Initialize session key
                    initSessionKey(clerkUserId);

                    // Check if setup is complete
                    const setupComplete = await hasCompletedSetup(clerkUserId);
                    set({ hasSetupCompleted: setupComplete });

                    if (setupComplete) {
                        await get().syncFromDatabase();
                    }
                } catch (error) {
                    console.error('Error refreshing auth state:', error);
                } finally {
                    set({ isLoading: false, isAuthenticating: false });
                    isRefreshing = false;
                }
            },

            // Data actions
            setPat: (pat) => set({ pat }),
            setMainUser: (mainUser) => set({ mainUser }),

            addRival: async (user: string) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const { error } = await addRivalDb(clerkUserId, user);
                if (!error) {
                    await get().syncFromDatabase();
                }
            },

            removeRival: async (user: string) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const rivals = await getRivals(clerkUserId);
                const rival = rivals.find((r) => r.rival_username === user.toLowerCase());
                if (rival) {
                    const { error } = await removeRivalDb(clerkUserId, rival.id);
                    if (!error) {
                        await get().syncFromDatabase();
                    }
                }
            },

            toggleRival: async (user: string) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const rivals = await getRivals(clerkUserId);
                const rival = rivals.find((r) => r.rival_username === user.toLowerCase());
                if (rival) {
                    const { error } = await toggleRivalDb(clerkUserId, rival.id, !rival.enabled);
                    if (!error) {
                        await get().syncFromDatabase();
                    }
                }
            },

            setCurrentView: (view) => set({ currentView: view }),

            setAutoRescanEnabled: async (enabled) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const { error } = await updateUserSettings(clerkUserId, { auto_rescan_enabled: enabled });
                if (!error) {
                    set({ autoRescanEnabled: enabled });
                }
            },

            setAutoRescanIntervalMs: async (ms) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const { error } = await updateUserSettings(clerkUserId, { auto_rescan_interval_ms: ms });
                if (!error) {
                    set({ autoRescanIntervalMs: ms });
                }
            },

            setLastScanTimestamp: (ts) => set({ lastScanTimestamp: ts }),

            setRightPanelOpen: async (open) => {
                const clerkUserId = get().clerkUserId;
                if (!clerkUserId) return;

                const { error } = await updateUserSettings(clerkUserId, { right_panel_open: open });
                if (!error) {
                    set({ rightPanelOpen: open });
                }
            },

            setApiError: (apiError) => set({ apiError }),

            clearState: () => set({
                pat: '',
                mainUser: '',
                rivals: [],
                enabledRivals: {},
                lastScanTimestamp: null,
                apiError: null,
            }),

            getActiveRivals: () => {
                const state = get();
                return state.rivals.filter((r) => state.enabledRivals[r] !== false);
            },

            syncFromDatabase: async () => {
                try {
                    const clerkUserId = get().clerkUserId;
                    if (!clerkUserId) return;

                    // Fire all DB queries in parallel instead of sequentially
                    const [pat, mainUser, settings, rivals] = await Promise.all([
                        getPat(clerkUserId),
                        getGithubUsername(clerkUserId),
                        getUserSettings(clerkUserId),
                        getRivals(clerkUserId),
                    ]);

                    // Apply all state in a single batch update
                    set({
                        pat: pat || '',
                        mainUser: mainUser || '',
                        ...(settings ? {
                            autoRescanEnabled: settings.auto_rescan_enabled,
                            autoRescanIntervalMs: settings.auto_rescan_interval_ms,
                            rightPanelOpen: settings.right_panel_open,
                            lastScanTimestamp: settings.last_scan
                                ? new Date(settings.last_scan).getTime()
                                : null,
                        } : {}),
                        rivals: rivals.map((r) => r.rival_username),
                        enabledRivals: rivals.reduce((acc, r) => {
                            acc[r.rival_username] = r.enabled;
                            return acc;
                        }, {} as Record<string, boolean>),
                    });
                } catch (error) {
                    console.error('Error syncing from database:', error);
                }
            },
        }),
        {
            name: 'gityab-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentView: state.currentView,
                lastScanTimestamp: state.lastScanTimestamp,
            }),
        }
    )
);

// Hook to sync Clerk auth state with Zustand store
export function useAuthSync() {
    const { isLoaded, isSignedIn, userId } = useAuth();
    const { user: clerkUser } = useUser();
    const clerkUserId = useGitStore((s) => s.clerkUserId);

    // Use refs to track previous values and avoid infinite loops
    const prevUserIdRef = React.useRef<string | null | undefined>(undefined);
    const prevSignedInRef = React.useRef<boolean | undefined>(undefined);
    const hasSyncedRef = React.useRef(false);

    // Sync Clerk user ID to store when it changes
    React.useEffect(() => {
        if (!isLoaded) return;

        const userIdChanged = userId !== prevUserIdRef.current;
        const signedInChanged = isSignedIn !== prevSignedInRef.current;

        prevUserIdRef.current = userId;
        prevSignedInRef.current = isSignedIn;

        // Only process if auth state actually changed
        if (!userIdChanged && !signedInChanged && hasSyncedRef.current) return;
        hasSyncedRef.current = true;

        if (isSignedIn && userId && userId !== clerkUserId) {
            // User signed in -- sync to store and trigger DB sync
            useGitStore.setState({ clerkUserId: userId, isLoading: true });
            syncClerkUserToSupabase(userId, clerkUser).then(() => {
                useGitStore.getState().refreshAuthState();
            });
        } else if (!isSignedIn) {
            // User is not signed in -- ensure loading is off
            useGitStore.setState({
                isAuthenticated: false,
                clerkUserId: null,
                hasSetupCompleted: false,
                isLoading: false,
                isAuthenticating: false,
            });
        }
    }, [isLoaded, isSignedIn, userId, clerkUserId, clerkUser]);

    return { isLoaded, isSignedIn, userId };
}
