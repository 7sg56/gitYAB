'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LandingPage } from '@/components/LandingPage';
import { SignInModal } from '@/components/SignInModal';
import { SignUpModal } from '@/components/SignUpModal';
import { SetupModal } from '@/components/SetupModal';
import { Dashboard } from '@/components/Dashboard';
import { Feed } from '@/components/Feed';
import { Comparator } from '@/components/Comparator';
import { TargetRival } from '@/components/TargetRival';
import { RivalsPanel } from '@/components/RivalsPanel';
import { Graphs } from '@/components/Graphs';
import { SocialGraph } from '@/components/SocialGraph';
import { Arena } from '@/components/Arena';
import { useGitStore, useAuthSync } from '@/store/useGitStore';

type AuthView = null | 'signin' | 'signup';

export default function Home() {
    const auth = useAuthSync();
    const { currentView, apiError, setApiError, isLoading } = useGitStore();
    const [authView, setAuthView] = useState<AuthView>(null);

    // Wait only for Clerk to initialize
    if (!auth.isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        );
    }

    // Unauthenticated flow: landing page or auth forms
    if (!auth.isSignedIn) {
        return (
            authView === 'signin' ? (
                <SignInModal
                    onSwitchToSignUp={() => setAuthView('signup')}
                    onBack={() => setAuthView(null)}
                />
            ) : authView === 'signup' ? (
                <SignUpModal
                    onSwitchToSignIn={() => setAuthView('signin')}
                    onBack={() => setAuthView(null)}
                />
            ) : (
                <LandingPage
                    onSignIn={() => setAuthView('signin')}
                    onSignUp={() => setAuthView('signup')}
                />
            )
        );
    }

    // Authenticated but still loading DB data
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Syncing your data...
                </div>
            </div>
        );
    }

    // Authenticated app
    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            {apiError && (
                <div className="flex-none bg-danger/10 border-b border-danger/20 px-4 py-2 flex items-center justify-between z-[60]">
                    <p className="text-xs text-danger/90 font-medium">{apiError}</p>
                    <button onClick={() => setApiError(null)} className="text-danger/70 hover:text-danger text-xs px-2 py-0.5 rounded hover:bg-danger/10 transition-colors">Dismiss</button>
                </div>
            )}
            <div className="flex flex-1 min-h-0 bg-background overflow-hidden w-full">
                <SetupModal />
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {currentView === 'home' && <Dashboard />}
                    {currentView === 'graphs' && <Graphs />}
                    {currentView === 'feed' && <Feed />}
                    {currentView === 'comparator' && <Comparator />}
                    {currentView === 'arena' && <Arena />}
                    {currentView === 'target' && <TargetRival />}
                    {currentView === 'social' && <SocialGraph />}
                </main>
                {currentView !== 'social' && <RivalsPanel />}
            </div>
        </div>
    );
}
