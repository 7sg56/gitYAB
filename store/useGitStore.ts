import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitState {
    pat: string;
    mainUser: string;
    rivals: string[];
    setPat: (pat: string) => void;
    setMainUser: (user: string) => void;
    addRival: (user: string) => void;
    removeRival: (user: string) => void;
    clearState: () => void;
    currentView: 'home' | 'feed' | 'comparator' | 'target';
    setCurrentView: (view: 'home' | 'feed' | 'comparator' | 'target') => void;
}

export const useGitStore = create<GitState>()(
    persist(
        (set) => ({
            pat: '',
            mainUser: '',
            rivals: [],
            currentView: 'home',
            setPat: (pat) => set({ pat }),
            setMainUser: (mainUser) => set({ mainUser }),
            setCurrentView: (view) => set({ currentView: view }),
            addRival: (user) =>
                set((state) => ({
                    rivals: state.rivals.includes(user) ? state.rivals : [...state.rivals, user],
                })),
            removeRival: (user) =>
                set((state) => ({
                    rivals: state.rivals.filter((r) => r !== user),
                })),
            clearState: () => set({ pat: '', mainUser: '', rivals: [] }),
        }),
        {
            name: 'gityab-storage', // key in localStorage
        }
    )
);
