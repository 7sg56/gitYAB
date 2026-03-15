'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo, useState } from 'react';
import { Swords, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const METRICS = [
    { key: 'totalCommitsYear', label: 'Commits', shortLabel: 'Commits' },
    { key: 'totalPRsYear', label: 'PRs', shortLabel: 'PRs' },
    { key: 'totalIssuesYear', label: 'Issues', shortLabel: 'Issues' },
    { key: 'totalStars', label: 'Stars', shortLabel: 'Stars' },
    { key: 'followers', label: 'Followers', shortLabel: 'Followers' },
    { key: 'totalRepos', label: 'Repos', shortLabel: 'Repos' },
];

type SortKey = typeof METRICS[number]['key'] | 'name';
type SortDir = 'asc' | 'desc';

export function Comparator() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean), [mainUser, activeRivals]);
    const { data, loading } = useGitHubStats(allUsers);
    const [sortKey, setSortKey] = useState<SortKey>('totalCommitsYear');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const mainStats = data[mainUser];

    // Build rows: all users including self
    const rows = useMemo(() => {
        const entries = allUsers.map((user) => {
            const d = data[user];
            return {
                login: user,
                name: d?.name || user,
                avatarUrl: d?.avatarUrl || '',
                isMain: user === mainUser,
                totalCommitsYear: d?.totalCommitsYear || 0,
                totalPRsYear: d?.totalPRsYear || 0,
                totalIssuesYear: d?.totalIssuesYear || 0,
                totalStars: d?.totalStars || 0,
                followers: d?.followers || 0,
                totalRepos: d?.totalRepos || 0,
            };
        });

        entries.sort((a, b) => {
            let aVal: string | number = 0;
            let bVal: string | number = 0;
            if (sortKey === 'name') {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else {
                aVal = a[sortKey as keyof typeof a] as number || 0;
                bVal = b[sortKey as keyof typeof b] as number || 0;
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return entries;
    }, [allUsers, data, sortKey, sortDir, mainUser]);

    // Find the max value per metric for highlighting
    const maxPerMetric = useMemo(() => {
        const maxes: Record<string, number> = {};
        METRICS.forEach((m) => {
            maxes[m.key] = Math.max(...rows.map((r) => r[m.key as keyof typeof r] as number || 0));
        });
        return maxes;
    }, [rows]);

    if (activeRivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <Swords size={32} className="opacity-30" />
                <p className="text-sm">Enable rivals from the right panel to compare stats.</p>
            </div>
        );
    }

    if (loading && !mainStats) {
        return (
            <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
                <div className="h-8 w-48 bg-card rounded animate-pulse" />
                <div className="h-96 bg-card rounded-lg animate-pulse" />
            </div>
        );
    }

    const renderSortIcon = (col: SortKey) => {
        if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground/40" />;
        return sortDir === 'desc'
            ? <ArrowDown size={12} className="text-primary" />
            : <ArrowUp size={12} className="text-primary" />;
    };

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-foreground">Compare</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {rows.length} developers -- click column headers to sort.
                </p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                    <thead>
                        <tr className="border-b border-border bg-accent/30">
                            <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-8 text-center">#</th>
                            <th
                                className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                                onClick={() => handleSort('name')}
                            >
                                <span className="flex items-center gap-1.5">
                                    Developer {renderSortIcon('name')}
                                </span>
                            </th>
                            {METRICS.map((m) => (
                                <th
                                    key={m.key}
                                    className="px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none text-right"
                                    onClick={() => handleSort(m.key as SortKey)}
                                >
                                    <span className="flex items-center justify-end gap-1.5">
                                        {m.shortLabel} {renderSortIcon(m.key as SortKey)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={row.login}
                                className={cn(
                                    "border-b border-border last:border-b-0 transition-colors",
                                    row.isMain
                                        ? "bg-primary/5 hover:bg-primary/8"
                                        : "hover:bg-accent/40",
                                )}
                            >
                                <td className="px-4 py-3 text-xs text-muted-foreground text-center tabular-nums">
                                    {i + 1}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {row.avatarUrl ? (
                                            <img src={row.avatarUrl} alt={row.login} className="w-6 h-6 rounded-full shrink-0" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-accent shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {row.name}
                                                {row.isMain && (
                                                    <span className="ml-1.5 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        you
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">@{row.login}</p>
                                        </div>
                                    </div>
                                </td>
                                {METRICS.map((m) => {
                                    const val = row[m.key as keyof typeof row] as number || 0;
                                    const isMax = val === maxPerMetric[m.key] && val > 0;
                                    const mainVal = mainStats ? mainStats[m.key as keyof typeof mainStats] as number || 0 : 0;
                                    const diff = row.isMain ? null : val - mainVal;

                                    return (
                                        <td key={m.key} className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {diff !== null && diff !== 0 && (
                                                    <span className={cn(
                                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                                        diff > 0
                                                            ? "bg-danger/10 text-danger"
                                                            : "bg-success/10 text-success"
                                                    )}>
                                                        {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "text-sm tabular-nums",
                                                    isMax ? "font-bold text-foreground" : "font-medium text-foreground/80"
                                                )}>
                                                    {val.toLocaleString()}
                                                </span>
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
