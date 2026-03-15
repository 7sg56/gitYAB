'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Trophy, ArrowUp, Check, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface RivalRanking {
    login: string;
    name: string;
    avatarUrl: string;
    score: number;
    status: 'defeated' | 'target' | 'above';
}

export function TargetRival() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean), [mainUser, activeRivals]);
    const { data, loading } = useGitHubStats(allUsers);

    const leaderboard = useMemo(() => {
        if (!data[mainUser]) return null;
        const mainStat = data[mainUser]!;
        const mainScore = mainStat.totalCommitsYear + mainStat.totalPRsYear;

        const rivalScores: RivalRanking[] = activeRivals
            .filter((r) => data[r])
            .map((r) => {
                const s = data[r]!;
                const score = s.totalCommitsYear + s.totalPRsYear;
                return {
                    login: s.login,
                    name: s.name || s.login,
                    avatarUrl: s.avatarUrl,
                    score,
                    status: score > mainScore ? 'above' as const : 'defeated' as const,
                };
            })
            .sort((a, b) => b.score - a.score);

        // Find the immediate target (lowest score above you)
        const aboveRivals = rivalScores.filter((r) => r.status === 'above');
        if (aboveRivals.length > 0) {
            const immediateTarget = aboveRivals[aboveRivals.length - 1];
            immediateTarget.status = 'target';
        }

        // Find user's position
        const userPosition = rivalScores.filter((r) => r.score > mainScore).length + 1;

        return {
            rankings: rivalScores,
            mainScore,
            mainName: mainStat.name || mainUser,
            mainAvatar: mainStat.avatarUrl,
            userPosition,
            totalPlayers: rivalScores.length + 1,
            isOnTop: aboveRivals.length === 0,
            target: aboveRivals.length > 0 ? aboveRivals[aboveRivals.length - 1] : null,
            gap: aboveRivals.length > 0 ? aboveRivals[aboveRivals.length - 1].score - mainScore : 0,
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

    if (loading || !leaderboard) {
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
                <h1 className="text-xl font-semibold text-foreground">Leaderboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    You are ranked #{leaderboard.userPosition} of {leaderboard.totalPlayers}. Score = commits + PRs (past year).
                </p>
            </div>

            {/* Target banner */}
            {leaderboard.isOnTop ? (
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                    <Trophy size={28} className="text-warning shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-foreground">You are on top of all your rivals.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Score: {leaderboard.mainScore.toLocaleString()} -- No one to overtake.
                        </p>
                    </div>
                </div>
            ) : leaderboard.target && (
                <div className="bg-card border border-danger/30 rounded-lg p-5 flex items-center gap-4">
                    <Image src={leaderboard.target.avatarUrl} alt={leaderboard.target.login} width={40} height={40} className="w-10 h-10 rounded-full shrink-0" unoptimized />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                            Current target: <span className="text-danger">{leaderboard.target.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Their score: {leaderboard.target.score.toLocaleString()} --
                            Gap: <span className="text-danger font-medium">{leaderboard.gap.toLocaleString()}</span> commits + PRs to overtake
                        </p>
                    </div>
                    <ArrowUp size={16} className="text-danger shrink-0" />
                </div>
            )}

            {/* Leaderboard table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-accent/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rankings</p>
                </div>

                <div className="divide-y divide-border">
                    {leaderboard.rankings.map((rival, i) => {
                        // Insert current user row before defeated rivals
                        const showUserBefore = i === 0
                            ? rival.status === 'defeated'
                            : leaderboard.rankings[i - 1]?.status !== 'defeated' && rival.status === 'defeated';

                        return (
                            <div key={rival.login}>
                                {showUserBefore && (
                                    <div className="flex items-center gap-4 px-5 py-3.5 bg-primary/5 border-l-2 border-l-primary">
                                        <span className="text-xs font-mono text-muted-foreground w-6 text-center tabular-nums">
                                            #{leaderboard.userPosition}
                                        </span>
                                        <Image src={leaderboard.mainAvatar} alt={mainUser} width={28} height={28} className="w-7 h-7 rounded-full" unoptimized />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{leaderboard.mainName}</p>
                                            <p className="text-[11px] text-primary">you</p>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground tabular-nums">
                                            {leaderboard.mainScore.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-center gap-4 px-5 py-3.5 transition-colors",
                                    rival.status === 'target' && "bg-danger/5",
                                    rival.status === 'defeated' && "opacity-60",
                                )}>
                                    <span className="text-xs font-mono text-muted-foreground w-6 text-center tabular-nums">
                                        #{i + (leaderboard.userPosition <= i + 1 ? 2 : 1)}
                                    </span>
                                    <Image src={rival.avatarUrl} alt={rival.login} width={28} height={28} className="w-7 h-7 rounded-full" unoptimized />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{rival.name}</p>
                                        <p className="text-[11px] text-muted-foreground">@{rival.login}</p>
                                    </div>
                                    {rival.status === 'target' && (
                                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-danger/10 text-danger">
                                            next
                                        </span>
                                    )}
                                    {rival.status === 'defeated' && (
                                        <Check size={14} className="text-success" />
                                    )}
                                    <span className="text-sm font-semibold text-foreground tabular-nums">
                                        {rival.score.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* User row at bottom if they're the lowest */}
                    {leaderboard.rankings.every((r) => r.status !== 'defeated') && (
                        <div className="flex items-center gap-4 px-5 py-3.5 bg-primary/5 border-l-2 border-l-primary">
                            <span className="text-xs font-mono text-muted-foreground w-6 text-center tabular-nums">
                                #{leaderboard.userPosition}
                            </span>
                            <Image src={leaderboard.mainAvatar} alt={mainUser} width={28} height={28} className="w-7 h-7 rounded-full" unoptimized />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{leaderboard.mainName}</p>
                                <p className="text-[11px] text-primary">you</p>
                            </div>
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                                {leaderboard.mainScore.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
