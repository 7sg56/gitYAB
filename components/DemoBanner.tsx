'use client';

import { useGitStore, DEMO_RIVAL_LIMIT } from '@/store/useGitStore';
import { LogIn, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function DemoBanner() {
    const { isDemoMode, requestDemoAuth } = useGitStore();
    const [dismissed, setDismissed] = useState(false);

    if (!isDemoMode || dismissed) return null;

    return (
        <div className="flex-none bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between z-[60]">
            <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300/90 font-medium truncate">
                    <span className="hidden sm:inline">Demo mode -- </span>
                    Limited to public data &amp; {DEMO_RIVAL_LIMIT} rival.{' '}
                    <button
                        onClick={() => requestDemoAuth('signup')}
                        className="inline-flex items-center gap-1 text-amber-200 hover:text-white underline underline-offset-2 transition-colors"
                    >
                        <LogIn size={11} />
                        Sign up for full access
                    </button>
                </p>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="text-amber-400/70 hover:text-amber-300 text-xs px-2 py-0.5 rounded hover:bg-amber-500/10 transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
}
