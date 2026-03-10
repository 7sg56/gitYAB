'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { GitCommit, GitPullRequest, CircleDot, Star, BookMarked, Users, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function Dashboard() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean), [mainUser, activeRivals]);
    const { data, loading, rescan } = useGitHubStats(allUsers);

    if (!mainUser) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Waiting for setup...</p>
            </div>
        );
    }

    const mainStats = data[mainUser];

    const chartData = allUsers.map((user) => {
        const d = data[user];
        return {
            name: user,
            Commits: d?.totalCommitsYear || 0,
            PRs: d?.totalPRsYear || 0,
            Issues: d?.totalIssuesYear || 0,
        };
    });

    const popularityData = allUsers.map((user) => {
        const d = data[user];
        return {
            name: user,
            Stars: d?.totalStars || 0,
            Followers: d?.followers || 0,
            Repos: d?.totalRepos || 0,
        };
    });

    const stats = mainStats ? [
        { icon: GitCommit, label: 'Commits', value: mainStats.totalCommitsYear, color: 'text-primary' },
        { icon: GitPullRequest, label: 'PRs', value: mainStats.totalPRsYear, color: 'text-primary' },
        { icon: CircleDot, label: 'Issues', value: mainStats.totalIssuesYear, color: 'text-primary' },
        { icon: Star, label: 'Stars', value: mainStats.totalStars, color: 'text-warning' },
        { icon: Users, label: 'Followers', value: mainStats.followers, color: 'text-muted-foreground' },
        { icon: BookMarked, label: 'Repos', value: mainStats.totalRepos, color: 'text-success' },
    ] : [];

    const tooltipStyle = {
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
        fontSize: '12px',
    };

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Overview</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        @{mainUser} vs {activeRivals.length} rival{activeRivals.length === 1 ? '' : 's'}
                    </p>
                </div>
                <button
                    onClick={rescan}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Scanning...' : 'Rescan'}
                </button>
            </div>

            {/* Stat cards */}
            {mainStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {stats.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="p-4 bg-card border border-border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon size={14} className={s.color} />
                                    <span className="text-xs text-muted-foreground">{s.label}</span>
                                </div>
                                <p className="text-2xl font-semibold text-foreground tabular-nums">
                                    {s.value.toLocaleString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />
                    ))}
                </div>
            )}

            {/* Charts */}
            {activeRivals.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-5">
                        <h3 className="text-sm font-medium text-foreground mb-4">Contributions (past year)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                                    <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="Commits" fill="#58a6ff" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="PRs" fill="#bc8cff" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Issues" fill="#3fb950" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-5">
                        <h3 className="text-sm font-medium text-foreground mb-4">Popularity & Reach</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={popularityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                                    <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="Stars" fill="#d29922" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Followers" fill="#bc8cff" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Repos" fill="#3fb950" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeRivals.length === 0 && (
                <div className="border border-dashed border-border rounded-lg p-12 text-center">
                    <Users size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Add rivals from the panel on the right to see comparison charts.</p>
                </div>
            )}
        </div>
    );
}
