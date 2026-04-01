import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useClerkAuth } from '@/lib/clerk-auth';
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
    clearSessionKey,
} from '@/lib/auth';

type ViewType = 'home' | 'feed' | 'comparator' | 'target';

interface GitState {
    // Auth state
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    user: { email: string | null; id: string; clerkUserId: string } | null;
    hasSetupCompleted: boolean;
    isLoading: boolean;
    clerkUserId: string | null;

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
    setClerkUserId: (userId: string | null) => void;

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
            user: null,
            hasSetupCompleted: false,
            isLoading: true,
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
                clearSessionKey();
                set({
                    isAuthenticated: false,
                    user: null,
                    clerkUserId: null,
                    hasSetupCompleted: false,
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
                    // This function is called from components that use useClerkAuth
                    // So we just need to sync data from database
                    const clerkUserId = get().clerkUserId;

                    if (!clerkUserId) {
                        set({
                            isAuthenticated: false,
                            user: null,
                            hasSetupCompleted: false,
                            isLoading: false,
                        });
                        return;
                    }

                    set({ isAuthenticated: true });

                    // Initialize session key
                    initSessionKey();

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

            setClerkUserId: (userId: string | null) => {
                set({ clerkUserId: userId });
                if (userId) {
                    set({
                        user: {
                            email: null, // Will be populated by useClerkAuth
                            id: userId,
                            clerkUserId: userId,
                        },
                    });
                } else {
                    set({ user: null, isAuthenticated: false });
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

                    // Get PAT
                    const pat = await getPat(clerkUserId);
                    set({ pat: pat || '' });

                    // Get GitHub username
                    const mainUser = await getGithubUsername(clerkUserId);
                    set({ mainUser: mainUser || '' });

                    // Get user settings
                    const settings = await getUserSettings(clerkUserId);
                    if (settings) {
                        set({
                            autoRescanEnabled: settings.auto_rescan_enabled,
                            autoRescanIntervalMs: settings.auto_rescan_interval_ms,
                            rightPanelOpen: settings.right_panel_open,
                            lastScanTimestamp: settings.last_scan
                                ? new Date(settings.last_scan).getTime()
                                : null,
                        });
                    }

                    // Get rivals
                    const rivals = await getRivals(clerkUserId);
                    set({
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
            partialize: (state) => ({
                currentView: state.currentView,
                lastScanTimestamp: state.lastScanTimestamp,
            }),
        }
    )
);

// Hook to sync Clerk auth state with Zustand store
export function useAuthSync() {
    const auth = useClerkAuth();
    const setClerkUserId = useGitStore((state) => state.setClerkUserId);
    const refreshAuthState = useGitStore((state) => state.refreshAuthState);

    // Sync Clerk user ID to store
    const prevUserId = useGitStore((state) => state.clerkUserId);

    if (auth.userId !== prevUserId) {
        setClerkUserId(auth.userId ?? null);
        if (auth.userId && auth.isSignedIn) {
            refreshAuthState();
        }
    }

    return auth;
}
