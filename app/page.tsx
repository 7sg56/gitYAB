'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RivalsPanel } from '@/components/RivalsPanel';
import { AuthModal } from '@/components/AuthModal';
import { SetupModal } from '@/components/SetupModal';
import { UserMenu } from '@/components/UserMenu';
import { Dashboard } from '@/components/Dashboard';
import { Feed } from '@/components/Feed';
import { Comparator } from '@/components/Comparator';
import { TargetRival } from '@/components/TargetRival';
import { useGitStore } from '@/store/useGitStore';

export default function Home() {
  const { currentView, apiError, setApiError, isAuthenticated, isLoading, refreshAuthState } = useGitStore();

  // Refresh auth state on mount
  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {apiError && (
        <div className="flex-none bg-danger/10 border-b border-danger/20 px-4 py-2 flex items-center justify-between z-[60]">
          <p className="text-xs text-danger/90 font-medium">⚠️ {apiError}</p>
          <button onClick={() => setApiError(null)} className="text-danger/70 hover:text-danger text-xs px-2 py-0.5 rounded hover:bg-danger/10 transition-colors">Dismiss</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0 bg-background overflow-hidden w-full">
        <SetupModal />
        <Sidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'home' && <Dashboard />}
          {currentView === 'feed' && <Feed />}
          {currentView === 'comparator' && <Comparator />}
          {currentView === 'target' && <TargetRival />}
        </main>
      </div>
      <div className="absolute top-3 right-3 z-40">
        <UserMenu />
      </div>
    </div>
  );
}
