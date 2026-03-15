'use client';

import { useState } from 'react';
import { useGitStore } from '@/store/useGitStore';
import { Plus, X, Eye, EyeOff, Users, PanelRightClose, PanelRightOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import Image from 'next/image';

export function RivalsPanel() {
    const {
        mainUser, rivals, addRival, removeRival, toggleRival, enabledRivals,
        rightPanelOpen, setRightPanelOpen,
    } = useGitStore();
    const [newRival, setNewRival] = useState('');
    const allUsers = [mainUser, ...rivals].filter(Boolean);
    const { data, rescan, loading } = useGitHubStats(allUsers);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newRival.trim();
        if (name && name !== mainUser && !rivals.includes(name)) {
            addRival(name);
            setNewRival('');
        }
    };

    // Toggle button (always visible)
    if (!rightPanelOpen) {
        return (
            <button
                onClick={() => setRightPanelOpen(true)}
                className="fixed right-0 top-3. z-30 p-2 bg-card border border-border border-r-0 rounded-l-md text-muted-foreground hover:text-foreground transition-colors"
                title="Open rivals panel"
            >
                <PanelRightOpen size={16} />
            </button>
        );
    }

    return (
        <div className="w-72 h-full border-l border-border bg-card flex flex-col shrink-0">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Rivals</span>
                    <span className="counter-badge">{rivals.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={rescan}
                        disabled={loading}
                        className={cn(
                            "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                            loading && "animate-spin text-primary"
                        )}
                        title="Rescan all"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        onClick={() => setRightPanelOpen(false)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Close panel"
                    >
                        <PanelRightClose size={14} />
                    </button>
                </div>
            </div>

            {/* Add rival */}
            <div className="px-3 py-3 border-b border-border">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newRival}
                        onChange={(e) => setNewRival(e.target.value)}
                        placeholder="Add username..."
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newRival.trim()}
                        className="px-2.5 py-1.5 bg-accent text-foreground rounded-md text-sm hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </form>
            </div>

            {/* Rivals list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rivals.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm text-muted-foreground">No rivals added yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Add a GitHub username above.</p>
                    </div>
                ) : (
                    <div className="py-1">
                        {rivals.map((rival) => {
                            const isEnabled = enabledRivals[rival] !== false;
                            const stats = data[rival];
                            return (
                                <div
                                    key={rival}
                                    className={cn(
                                        "group flex items-center gap-2.5 px-4 py-2.5 hover:bg-accent/50 transition-colors",
                                        !isEnabled && "opacity-50"
                                    )}
                                >
                                    {stats?.avatarUrl ? (
                                        <Image
                                            src={stats.avatarUrl}
                                            alt={rival}
                                            width={28}
                                            height={28}
                                            className="w-7 h-7 rounded-full bg-accent"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                                            {rival.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{rival}</p>
                                        {stats && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {stats.totalCommitsYear} commits
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleRival(rival)}
                                            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                                            title={isEnabled ? 'Hide from charts' : 'Show in charts'}
                                        >
                                            {isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                                        </button>
                                        <button
                                            onClick={() => removeRival(rival)}
                                            className="p-1 rounded text-muted-foreground hover:text-danger transition-colors"
                                            title="Remove rival"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
