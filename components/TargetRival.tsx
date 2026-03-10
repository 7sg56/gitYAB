'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Crosshair, Trophy, ArrowUp } from 'lucide-react';

export function TargetRival() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean), [mainUser, activeRivals]);
    const { data, loading } = useGitHubStats(allUsers);

    const targetInfo = useMemo(() => {
        if (!data[mainUser]) return null;
        const mainStat = data[mainUser]!;
        const mainScore = mainStat.totalCommitsYear + mainStat.totalPRsYear;

        let currentTarget = null;
        let minDiff = Infinity;

        for (const rival of activeRivals) {
            const rStat = data[rival];
            if (!rStat) continue;
            const rScore = rStat.totalCommitsYear + rStat.totalPRsYear;
            if (rScore > mainScore) {
                const diff = rScore - mainScore;
                if (diff < minDiff) {
                    minDiff = diff;
                    currentTarget = rStat;
                }
            }
        }

        if (!currentTarget) return { isWinner: true, mainScore };
        return {
            target: currentTarget,
            gap: minDiff,
            mainScore,
            targetScore: currentTarget.totalCommitsYear + currentTarget.totalPRsYear,
        };
    }, [data, mainUser, activeRivals]);

    if (activeRivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <Crosshair size={32} className="opacity-30" />
                <p className="text-sm">Enable rivals to find your next target.</p>
            </div>
        );
    }

    if (loading || !data[mainUser]) {
        return (
            <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
                <div className="h-8 w-48 bg-card rounded animate-pulse" />
                <div className="h-64 bg-card rounded-lg animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-foreground">Next Target</h1>
                <p className="text-sm text-muted-foreground mt-0.5">The rival immediately above you.</p>
            </div>

            {targetInfo?.isWinner ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
                    <Trophy size={40} className="mx-auto text-warning" />
                    <h2 className="text-lg font-semibold text-foreground">You are on top</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        None of your enabled rivals have a higher combined commit + PR score. Keep it up.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Your score: <span className="text-foreground font-medium">{targetInfo.mainScore.toLocaleString()}</span>
                    </p>
                </div>
            ) : targetInfo?.target ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {/* Target header */}
                    <div className="p-6 flex items-center gap-4 border-b border-border">
                        <img
                            src={targetInfo.target.avatarUrl}
                            alt={targetInfo.target.login}
                            className="w-14 h-14 rounded-full"
                        />
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">{targetInfo.target.name}</h2>
                            <p className="text-sm text-muted-foreground">@{targetInfo.target.login}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-danger/10 text-danger">
                                target
                            </span>
                        </div>
                    </div>

                    {/* Score comparison */}
                    <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-5 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Their score</p>
                            <p className="text-2xl font-semibold text-foreground tabular-nums">
                                {targetInfo.targetScore?.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-5 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Your score</p>
                            <p className="text-2xl font-semibold text-foreground tabular-nums">
                                {targetInfo.mainScore?.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Gap */}
                    <div className="p-5 border-t border-border bg-accent/30 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <ArrowUp size={14} className="text-danger" />
                            <span className="text-muted-foreground">Gap:</span>
                            <span className="font-semibold text-danger">{targetInfo.gap.toLocaleString()}</span>
                            <span className="text-muted-foreground">commits + PRs to overtake</span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
