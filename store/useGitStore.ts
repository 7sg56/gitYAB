import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    signIn,
    signUp,
    signOut,
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
import { supabase } from '@/lib/supabase';

type ViewType = 'home' | 'feed' | 'comparator' | 'target';

interface GitState {
    // Auth state
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    user: { email: string; id: string } | null;
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
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    completeSetup: (githubUsername: string, pat: string) => Promise<{ error: any }>;
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

export const useGitStore = create<GitState>()(
    persist(
        (set, get) => ({
            // Initial state
            isAuthenticated: false,
            isAuthenticating: true,
            user: null,
            hasSetupCompleted: false,
            isLoading: true,

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
            signIn: async (email: string, password: string) => {
                set({ isAuthenticating: true, apiError: null });
                const { data, error } = await signIn(email, password);

                if (error) {
                    set({ isAuthenticating: false, apiError: error.message });
                    return { error };
                }

                if (data.user) {
                    await get().refreshAuthState();
                }

                set({ isAuthenticating: false });
                return { error: null };
            },

            signUp: async (email: string, password: string) => {
                set({ isAuthenticating: true, apiError: null });
                const { data, error } = await signUp(email, password);

                if (error) {
                    set({ isAuthenticating: false, apiError: error.message });
                    return { error };
                }

                set({ isAuthenticating: false });
                return { error: null };
            },

            signOut: async () => {
                set({ isAuthenticating: true });
                const { error } = await signOut();
                clearSessionKey();
                set({
                    isAuthenticated: false,
                    user: null,
                    hasSetupCompleted: false,
                    pat: '',
                    mainUser: '',
                    rivals: [],
                    enabledRivals: {},
                    isAuthenticating: false,
                });
                return { error };
            },

            completeSetup: async (githubUsername: string, pat: string) => {
                set({ isLoading: true, apiError: null });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await completeSetup(githubUsername, pat);

                if (error) {
                    set({ isLoading: false, apiError: error.message });
                    return { error };
                }

                await get().refreshAuthState();
                set({ isLoading: false });
                return { error: null };
            },

            refreshAuthState: async () => {
                set({ isLoading: true });
                try {
                    // Check auth status
                    const { data: { user }, error: authError } = await supabase.auth.getUser();

                    if (authError || !user) {
                        set({
                            isAuthenticated: false,
                            user: null,
                            hasSetupCompleted: false,
                            isLoading: false,
                        });
                        return;
                    }

                    set({
                        isAuthenticated: true,
                        user: { email: user.email || '', id: user.id },
                    });

                    // Initialize session key
                    initSessionKey();

                    // Check if setup is complete
                    const setupComplete = await hasCompletedSetup();
                    set({ hasSetupCompleted: setupComplete });

                    if (setupComplete) {
                        await get().syncFromDatabase();
                    }
                } catch (error) {
                    console.error('Error refreshing auth state:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            // Data actions
            setPat: (pat) => set({ pat }),
            setMainUser: (mainUser) => set({ mainUser }),
            addRival: async (user: string) => {
                const { error } = await addRivalDb(user);
                if (!error) {
                    await get().syncFromDatabase();
                }
            },

            removeRival: async (user: string) => {
                const rivals = await getRivals();
                const rival = rivals.find((r) => r.rival_username === user.toLowerCase());
                if (rival) {
                    const { error } = await removeRivalDb(rival.id);
                    if (!error) {
                        await get().syncFromDatabase();
                    }
                }
            },

            toggleRival: async (user: string) => {
                const rivals = await getRivals();
                const rival = rivals.find((r) => r.rival_username === user.toLowerCase());
                if (rival) {
                    const { error } = await toggleRivalDb(rival.id, !rival.enabled);
                    if (!error) {
                        await get().syncFromDatabase();
                    }
                }
            },

            setCurrentView: (view) => set({ currentView: view }),
            setAutoRescanEnabled: async (enabled) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await updateUserSettings({ auto_rescan_enabled: enabled });
                if (!error) {
                    set({ autoRescanEnabled: enabled });
                }
            },

            setAutoRescanIntervalMs: async (ms) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await updateUserSettings({ auto_rescan_interval_ms: ms });
                if (!error) {
                    set({ autoRescanIntervalMs: ms });
                }
            },

            setLastScanTimestamp: (ts) => set({ lastScanTimestamp: ts }),
            setRightPanelOpen: async (open) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await updateUserSettings({ right_panel_open: open });
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
                    // Get PAT
                    const pat = await getPat();
                    set({ pat: pat || '' });

                    // Get GitHub username
                    const mainUser = await getGithubUsername();
                    set({ mainUser: mainUser || '' });

                    // Get user settings
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const settings = await getUserSettings();
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
                    const rivals = await getRivals();
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

// Initialize auth state change listener
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange(async (event, session) => {
        const store = useGitStore.getState();
        if (event === 'SIGNED_IN') {
            await store.refreshAuthState();
        } else if (event === 'SIGNED_OUT') {
            clearSessionKey();
            useGitStore.setState({
                isAuthenticated: false,
                user: null,
                hasSetupCompleted: false,
                pat: '',
                mainUser: '',
                rivals: [],
                enabledRivals: {},
            });
        }
    });
}
