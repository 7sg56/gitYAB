'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Activity, Star, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Graphs() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = useMemo(() => rivals.filter((r) => enabledRivals[r] !== false), [rivals, enabledRivals]);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean) as string[], [mainUser, activeRivals]);

    const { data } = useGitHubStats(allUsers);

    if (!mainUser) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Waiting for setup...</p>
            </div>
        );
    }

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

    const tooltipStyle = {
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full gap-4">
            <div className="flex-none flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualize your stats against {activeRivals.length} rival{activeRivals.length === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-12 md:grid-rows-2 gap-4">
                {activeRivals.length > 0 ? (
                    <>
                        {/* Contributions - Top Half */}
                        <div className="col-span-12 row-span-1 bg-card/40 border border-border/60 rounded-xl p-4 md:p-6 flex flex-col min-h-0">
                            <h3 className="text-sm font-medium text-foreground mb-4 flex-none flex items-center gap-2">
                                <Activity size={16} className="text-muted-foreground" />
                                Contributions
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} angle={-35} textAnchor="end" height={60} tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="Commits" fill="#58a6ff" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        <Bar dataKey="PRs" fill="#bc8cff" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        <Bar dataKey="Issues" fill="#3fb950" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Reach - Bottom Left */}
                        <div className="col-span-12 md:col-span-6 row-span-1 bg-card/40 border border-border/60 rounded-xl p-4 md:p-6 flex flex-col min-h-0">
                            <h3 className="text-sm font-medium text-foreground mb-4 flex-none flex items-center gap-2">
                                <Star size={16} className="text-muted-foreground" />
                                Reach
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={popularityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} angle={-35} textAnchor="end" height={60} tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="Stars" fill="#d29922" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        <Bar dataKey="Followers" fill="#bc8cff" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Repositories - Bottom Right */}
                        <div className="col-span-12 md:col-span-6 row-span-1 bg-card/40 border border-border/60 rounded-xl p-4 md:p-6 flex flex-col min-h-0">
                            <h3 className="text-sm font-medium text-foreground mb-4 flex-none flex items-center gap-2">
                                <Users size={16} className="text-muted-foreground" />
                                Repositories
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={popularityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} angle={-35} textAnchor="end" height={60} tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="Repos" fill="#3fb950" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="md:col-span-12 border border-border/60 bg-card/40 rounded-xl p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="p-4 bg-background border border-border/60 rounded-full mb-4">
                            <Users size={24} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-1">No Rivals Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Add some rivals from the panel on the right to compare your stats and see dynamic charts.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
