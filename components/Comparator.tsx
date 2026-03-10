'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Swords } from 'lucide-react';

const METRICS = [
    { key: 'totalCommitsYear', label: 'Commits (1yr)' },
    { key: 'totalPRsYear', label: 'Pull Requests' },
    { key: 'totalIssuesYear', label: 'Issues' },
    { key: 'totalStars', label: 'Stars' },
    { key: 'followers', label: 'Followers' },
    { key: 'totalRepos', label: 'Repositories' },
];

export function Comparator() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean), [mainUser, activeRivals]);
    const { data, loading } = useGitHubStats(allUsers);

    if (activeRivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <Swords size={32} className="opacity-30" />
                <p className="text-sm">Enable rivals from the right panel to compare stats.</p>
            </div>
        );
    }

    if (loading || !data[mainUser]) {
        return (
            <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
                <div className="h-8 w-48 bg-card rounded animate-pulse" />
                <div className="h-96 bg-card rounded-lg animate-pulse" />
            </div>
        );
    }

    const mainStats = data[mainUser]!;

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-foreground">Compare</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Side-by-side metric breakdown.</p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr className="border-b border-border bg-accent/30">
                            <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Metric</th>
                            <th className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    {mainStats.avatarUrl && (
                                        <img src={mainStats.avatarUrl} alt={mainUser} className="w-6 h-6 rounded-full" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{mainUser}</p>
                                        <p className="text-[10px] text-primary">you</p>
                                    </div>
                                </div>
                            </th>
                            {activeRivals.map((rival) => {
                                const stat = data[rival];
                                return (
                                    <th key={rival} className="px-4 py-3 border-l border-border">
                                        <div className="flex items-center gap-2.5">
                                            {stat?.avatarUrl ? (
                                                <img src={stat.avatarUrl} alt={rival} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-accent" />
                                            )}
                                            <p className="text-sm font-medium text-foreground">{rival}</p>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {METRICS.map((metric, i) => (
                            <tr key={metric.key} className={i % 2 === 0 ? '' : 'bg-accent/20'}>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{metric.label}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums">
                                    {((mainStats as any)[metric.key] || 0).toLocaleString()}
                                </td>
                                {activeRivals.map((rival) => {
                                    const rivalStat = data[rival];
                                    if (!rivalStat) return <td key={rival} className="px-4 py-3 border-l border-border text-sm text-muted-foreground">--</td>;

                                    const rVal = (rivalStat as any)[metric.key] || 0;
                                    const mVal = (mainStats as any)[metric.key] || 0;
                                    const diff = rVal - mVal;

                                    return (
                                        <td key={rival} className="px-4 py-3 border-l border-border">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground tabular-nums">
                                                    {rVal.toLocaleString()}
                                                </span>
                                                {diff !== 0 && (
                                                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${diff > 0
                                                            ? 'bg-danger/10 text-danger'
                                                            : 'bg-success/10 text-success'
                                                        }`}>
                                                        {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                                    </span>
                                                )}
                                                {diff === 0 && (
                                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                                                        tie
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
