'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo } from 'react';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';

const METRICS = [
    { key: 'totalCommitsYear', label: 'Commits (1yr)', type: 'number' },
    { key: 'totalPRsYear', label: 'Pull Requests', type: 'number' },
    { key: 'totalIssuesYear', label: 'Issues', type: 'number' },
    { key: 'totalStars', label: 'Total Stars', type: 'number' },
    { key: 'followers', label: 'Followers', type: 'number' },
    { key: 'totalRepos', label: 'Repositories', type: 'number' },
];

export function Comparator() {
    const { mainUser, rivals } = useGitStore();
    const allUsers = useMemo(() => [mainUser, ...rivals].filter(Boolean), [mainUser, rivals]);
    const { data, loading } = useGitHubStats(allUsers);

    if (rivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
                <Swords size={48} className="opacity-20" />
                <p>Add rivals from the sidebar to compare detailed stats.</p>
            </div>
        );
    }

    if (loading || !data[mainUser]) {
        return (
            <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 w-64 bg-white/5 rounded-lg" />
                <div className="h-[400px] w-full bg-white/5 rounded-3xl" />
            </div>
        );
    }

    const mainStats = data[mainUser]!;

    return (
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 relative z-10 pb-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent tracking-tighter">
                    Detailed Comparator
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Line-by-line breakdown of your stats vs rivals.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl border border-white/5 overflow-hidden custom-scrollbar overflow-x-auto"
            >
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider w-48">Metric</th>
                            <th className="p-6 min-w-[150px]">
                                <div className="flex items-center gap-3">
                                    <img src={mainStats.avatarUrl} alt={mainUser} className="w-8 h-8 rounded-full ring-2 ring-primary" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{mainUser}</p>
                                        <p className="text-xs text-primary font-medium tracking-wide uppercase">You</p>
                                    </div>
                                </div>
                            </th>
                            {rivals.map((rival) => {
                                const stat = data[rival];
                                return (
                                    <th key={rival} className="p-6 min-w-[200px] border-l border-white/5">
                                        <div className="flex items-center gap-3">
                                            {stat ? (
                                                <img src={stat.avatarUrl} alt={rival} className="w-8 h-8 rounded-full ring-2 ring-white/10" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{rival}</p>
                                                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Rival</p>
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {METRICS.map((metric) => (
                            <tr key={metric.key} className="hover:bg-white/5 transition-colors">
                                <td className="p-6 text-sm font-medium text-muted-foreground">
                                    {metric.label}
                                </td>
                                <td className="p-6 text-lg font-bold text-foreground">
                                    {((mainStats as any)[metric.key] || 0).toLocaleString()}
                                </td>
                                {rivals.map((rival) => {
                                    const rivalStat = data[rival];
                                    if (!rivalStat) return <td key={rival} className="p-6 border-l border-white/5">-</td>;

                                    const rValue = (rivalStat as any)[metric.key] || 0;
                                    const mValue = (mainStats as any)[metric.key] || 0;
                                    const diff = rValue - mValue;

                                    return (
                                        <td key={rival} className="p-6 border-l border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-foreground">{rValue.toLocaleString()}</span>
                                                {diff !== 0 && (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${diff > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                                    </span>
                                                )}
                                                {diff === 0 && (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-white/5 text-muted-foreground">
                                                        Tie
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
            </motion.div>
        </div>
    );
}
