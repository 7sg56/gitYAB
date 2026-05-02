'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { Github, LayoutDashboard, Activity, Swords, Crosshair, Timer, LogOut, ChevronUp, BarChart2, Users, Zap, Menu, X, Eye, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClerk } from '@clerk/nextjs';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';

export function Sidebar() {
    const {
        mainUser,
        currentView,
        setCurrentView,
        autoRescanEnabled,
        setAutoRescanEnabled,
        lastScanTimestamp,
        isDemoMode,
        exitDemoMode,
        requestDemoAuth,
    } = useGitStore();

    // Fetch main user stats for avatar
    const users = useMemo(() => (mainUser ? [mainUser] : []), [mainUser]);
    const { data } = useGitHubStats(users);
    const mainStats = data[mainUser];
    const { signOut } = useClerk();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const navItems = [
        { id: 'home' as const, label: 'Insights', icon: LayoutDashboard },
        { id: 'graphs' as const, label: 'Analytics', icon: BarChart2 },
        { id: 'feed' as const, label: 'Activity', icon: Activity },
        { id: 'comparator' as const, label: 'Compare', icon: Swords },
        { id: 'arena' as const, label: 'Arena', icon: Zap },
        { id: 'target' as const, label: 'Target', icon: Crosshair },
        // Social graph is disabled in demo mode
        ...(!isDemoMode ? [{ id: 'social' as const, label: 'Social', icon: Users }] : []),
    ];

    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getTimeSince = (ts: number | null) => {
        if (!ts) return 'Never';
        const diff = Math.floor((currentTime - ts) / 1000);
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
                    {!isDemoMode && (
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
                    )}

                    {isDemoMode && (
                        <div className="pt-4 mt-4 border-t border-border px-3 space-y-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye size={12} className="text-amber-400" />
                                    <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-medium">Demo Mode</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Public data only. Sign in for full access.
                                </p>
                            </div>
                            <button
                                onClick={() => requestDemoAuth('signup')}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#238636] hover:bg-[#2ea043] text-white transition-colors"
                            >
                                <LogIn size={14} />
                                Sign Up
                            </button>
                            <button
                                onClick={() => requestDemoAuth('signin')}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                Already have an account? Sign in
                            </button>
                        </div>
                    )}
                </nav>
            )}

            {/* User info */}
            {mainUser && (
                <div className="border-t border-border p-3 relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors hover:bg-accent/50",
                            userMenuOpen && "bg-accent/50"
                        )}
                    >
                        {mainStats?.avatarUrl ? (
                            <Image
                                src={mainStats.avatarUrl}
                                alt={mainUser}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full"
                                unoptimized
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-foreground">
                                {mainUser.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                            <span className="text-sm text-foreground truncate block">{mainStats?.name || mainUser}</span>
                            <span className="text-[11px] text-muted-foreground truncate block">@{mainUser}</span>
                        </div>
                        <ChevronUp size={14} className={cn("text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
                    </button>

                    {userMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                            <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        if (isDemoMode) {
                                            exitDemoMode();
                                        } else {
                                            void signOut();
                                        }
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                                >
                                    <LogOut size={14} />
                                    {isDemoMode ? 'Exit Demo' : 'Log out'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
