'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Crosshair, Trophy, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export function TargetRival() {
    const { mainUser, rivals } = useGitStore();
    const allUsers = useMemo(() => [mainUser, ...rivals].filter(Boolean), [mainUser, rivals]);
    const { data, loading } = useGitHubStats(allUsers);

    const targetInfo = useMemo(() => {
        if (!data[mainUser]) return null;

        const mainStat = data[mainUser];
        if (!mainStat) return null;

        const mainScore = mainStat.totalCommitsYear + mainStat.totalPRsYear;

        let currentTarget = null;
        let minDiff = Infinity;

        for (const rival of rivals) {
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
        return { target: currentTarget, gap: minDiff, mainScore, targetScore: currentTarget.totalCommitsYear + currentTarget.totalPRsYear };
    }, [data, mainUser, rivals]);

    if (rivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
                <Crosshair size={48} className="opacity-20" />
                <p>Add rivals from the sidebar to find your next target.</p>
            </div>
        );
    }

    if (loading || !data[mainUser]) {
        return (
            <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 w-64 bg-white/5 rounded-lg" />
                <div className="h-[400px] w-full bg-white/5 rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12 relative z-10 pb-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent tracking-tighter flex items-center gap-4">
                    <Crosshair className="text-red-500" size={40} /> Next Target
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Hunt down the developer immediately ahead of you.
                </p>
            </motion.div>

            {targetInfo?.isWinner ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-12 rounded-3xl shadow-2xl border border-yellow-500/20 text-center space-y-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-3xl -mx-10" />
                    <Trophy size={64} className="text-yellow-500 mx-auto" />
                    <h2 className="text-3xl font-black text-foreground">You are the Apex!</h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        None of your current rivals have a higher combined commit and PR score than you. Keep up the phenomenal work.
                    </p>
                </motion.div>
            ) : targetInfo?.target ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl border border-red-500/20 overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />

                    <div className="p-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="relative shrink-0">
                            <img
                                src={targetInfo.target.avatarUrl}
                                alt={targetInfo.target.login}
                                className="w-32 h-32 rounded-full ring-4 ring-red-500/50 shadow-2xl relative z-10"
                            />
                            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                TARGET
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-3xl font-black text-foreground mb-2">{targetInfo.target.name}</h2>
                            <p className="text-red-400 font-medium tracking-wide">@{targetInfo.target.login}</p>

                            <div className="mt-6 flex flex-col md:flex-row gap-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Their Score</p>
                                    <p className="text-2xl font-bold text-foreground">{targetInfo.targetScore?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Your Score</p>
                                    <p className="text-2xl font-bold text-foreground">{targetInfo.mainScore?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-3 border-t border-red-500/10">
                        <Flame size={32} className="text-orange-500" />
                        <h3 className="text-xl font-bold text-foreground">
                            You need <span className="text-red-500">{targetInfo.gap.toLocaleString()}</span> more commits/PRs to surpass them!
                        </h3>
                        <p className="text-sm text-red-400/80 font-medium">Get to work. The gap is closing.</p>
                    </div>
                </motion.div>
            ) : null}
        </div>
    );
}
