'use client';

import { useGitStore } from '@/store/useGitStore';
import { Github, LayoutDashboard, Activity, Swords, Crosshair, LogOut, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const {
        mainUser,
        clearState,
        currentView,
        setCurrentView,
        autoRescanEnabled,
        setAutoRescanEnabled,
        lastScanTimestamp,
    } = useGitStore();

    const navItems = [
        { id: 'home' as const, label: 'Overview', icon: LayoutDashboard },
        { id: 'feed' as const, label: 'Activity', icon: Activity },
        { id: 'comparator' as const, label: 'Compare', icon: Swords },
        { id: 'target' as const, label: 'Target', icon: Crosshair },
    ];

    const getTimeSince = (ts: number | null) => {
        if (!ts) return 'Never';
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    return (
        <div className="w-60 h-full border-r border-border bg-card flex flex-col shrink-0">
            {/* Header */}
            <div className="h-14 px-4 flex items-center gap-2.5 border-b border-border">
                <Github size={20} className="text-foreground" />
                <span className="text-sm font-semibold text-foreground tracking-tight">GitYab</span>
            </div>

            {/* Navigation */}
            {mainUser && (
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                    isActive
                                        ? "bg-accent text-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <Icon size={16} />
                                {item.label}
                            </button>
                        );
                    })}

                    {/* Scan info section */}
                    <div className="pt-4 mt-4 border-t border-border space-y-3">
                        <div className="px-3">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Last scan</p>
                            <p className="text-xs text-foreground mt-0.5">{getTimeSince(lastScanTimestamp)}</p>
                        </div>

                        <button
                            onClick={() => setAutoRescanEnabled(!autoRescanEnabled)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                                autoRescanEnabled
                                    ? "text-success bg-success/10"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Timer size={14} />
                            <span className="flex-1 text-left">Auto-rescan</span>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                autoRescanEnabled ? "bg-success/20 text-success" : "bg-accent text-muted-foreground"
                            )}>
                                {autoRescanEnabled ? 'ON' : 'OFF'}
                            </span>
                        </button>
                    </div>
                </nav>
            )}

            {/* User + Logout */}
            {mainUser && (
                <div className="border-t border-border p-3 space-y-1">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-foreground">
                            {mainUser.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground truncate flex-1">{mainUser}</span>
                    </div>
                    <button
                        onClick={clearState}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                        <LogOut size={14} />
                        Reset
                    </button>
                </div>
            )}
        </div>
    );
}
