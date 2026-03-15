'use client';

import { Sidebar } from '@/components/Sidebar';
import { RivalsPanel } from '@/components/RivalsPanel';
import { SetupModal } from '@/components/SetupModal';
import { Dashboard } from '@/components/Dashboard';
import { Feed } from '@/components/Feed';
import { Comparator } from '@/components/Comparator';
import { TargetRival } from '@/components/TargetRival';
import { useGitStore } from '@/store/useGitStore';

export default function Home() {
  const { currentView, mainUser, apiError, setApiError } = useGitStore();

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
        {mainUser && <RivalsPanel />}
      </div>
    </div>
  );
}
