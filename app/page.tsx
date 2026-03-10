'use client';

import { Sidebar } from '@/components/Sidebar';
import { SetupModal } from '@/components/SetupModal';
import { Dashboard } from '@/components/Dashboard';
import { Feed } from '@/components/Feed';
import { Comparator } from '@/components/Comparator';
import { TargetRival } from '@/components/TargetRival';
import { useGitStore } from '@/store/useGitStore';

export default function Home() {
  const { currentView } = useGitStore();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      <SetupModal />
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        {currentView === 'home' && <Dashboard />}
        {currentView === 'feed' && <Feed />}
        {currentView === 'comparator' && <Comparator />}
        {currentView === 'target' && <TargetRival />}
      </main>
    </div>
  );
}
