import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewType = 'home' | 'feed' | 'comparator' | 'target';

interface GitState {
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

    setPat: (pat: string) => void;
    setMainUser: (user: string) => void;
    addRival: (user: string) => void;
    removeRival: (user: string) => void;
    toggleRival: (user: string) => void;
    clearState: () => void;
    setCurrentView: (view: ViewType) => void;
    setAutoRescanEnabled: (enabled: boolean) => void;
    setAutoRescanIntervalMs: (ms: number) => void;
    setLastScanTimestamp: (ts: number) => void;
    setRightPanelOpen: (open: boolean) => void;
    setApiError: (error: string | null) => void;
    getActiveRivals: () => string[];
}

export const useGitStore = create<GitState>()(
    persist(
        (set, get) => ({
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

            setPat: (pat) => set({ pat }),
            setMainUser: (mainUser) => set({ mainUser }),
            setCurrentView: (view) => set({ currentView: view }),
            setAutoRescanEnabled: (enabled) => set({ autoRescanEnabled: enabled }),
            setAutoRescanIntervalMs: (ms) => set({ autoRescanIntervalMs: ms }),
            setLastScanTimestamp: (ts) => set({ lastScanTimestamp: ts }),
            setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
            setApiError: (apiError) => set({ apiError }),

            addRival: (user) =>
                set((state) => ({
                    rivals: state.rivals.includes(user) ? state.rivals : [...state.rivals, user],
                    enabledRivals: { ...state.enabledRivals, [user]: true },
                })),
            removeRival: (user) =>
                set((state) => {
                    const newEnabled = { ...state.enabledRivals };
                    delete newEnabled[user];
                    return {
                        rivals: state.rivals.filter((r) => r !== user),
                        enabledRivals: newEnabled,
                    };
                }),
            toggleRival: (user) =>
                set((state) => ({
                    enabledRivals: {
                        ...state.enabledRivals,
                        [user]: !state.enabledRivals[user],
                    },
                })),
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
        }),
        {
            name: 'gityab-storage',
        }
    )
);
