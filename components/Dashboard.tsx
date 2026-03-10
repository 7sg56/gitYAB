'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { motion } from 'framer-motion';
import { GitCommit, GitPullRequest, CircleDot, Star, BookMarked, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

export function Dashboard() {
    const { mainUser, rivals } = useGitStore();
    const allUsers = useMemo(() => [mainUser, ...rivals].filter(Boolean), [mainUser, rivals]);
    const { data, loading } = useGitHubStats(allUsers);

    if (!mainUser) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-muted-foreground animate-pulse text-lg tracking-widest uppercase font-semibold">Waiting for setup...</p>
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
            Stars: d?.totalStars || 0,
            Followers: d?.followers || 0,
            Repos: d?.totalRepos || 0,
        };
    });

    const mainStats = data[mainUser];

    return (
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 relative z-10 pb-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-tighter">
                        Dashboard Overview
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Comparing <span className="text-primary font-semibold">@{mainUser}</span> against {rivals.length} rival{rivals.length === 1 ? '' : 's'}.
                    </p>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        Syncing data...
                    </div>
                )}
            </motion.div>

            {/* Main User Stat Cards */}
            {mainStats ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                >
                    <StatCard icon={<GitCommit />} label="Commits (1yr)" value={mainStats.totalCommitsYear} />
                    <StatCard icon={<GitPullRequest />} label="PRs (1yr)" value={mainStats.totalPRsYear} />
                    <StatCard icon={<CircleDot />} label="Issues (1yr)" value={mainStats.totalIssuesYear} />
                    <StatCard icon={<Star className="text-yellow-500" />} label="Stars" value={mainStats.totalStars} />
                    <StatCard icon={<Users className="text-purple-400" />} label="Followers" value={mainStats.followers} />
                    <StatCard icon={<BookMarked className="text-green-400" />} label="Repositories" value={mainStats.totalRepos} />
                </motion.div>
            ) : (
                <div className="h-24 glass rounded-3xl border border-white/5 animate-pulse" />
            )}

            {/* Comparison Charts */}
            {rivals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-8"
                >
                    <ChartCard title="Contributions (past year)">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="PRs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Issues" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Popularity & Reach">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="Stars" fill="#eab308" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Followers" fill="#c084fc" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Repos" fill="#4ade80" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </motion.div>
            )}

            {/* Rivals Grid Comparison Table Data Output (Fallback if no rivals) */}
            {rivals.length === 0 && (
                <div className="h-64 glass rounded-3xl border border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                    <Users size={48} className="opacity-20" />
                    <p>Add rivals from the sidebar to visualize comparison charts.</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
    return (
        <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-3 hover:bg-white/5 transition-colors group">
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{label}</p>
            </div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-foreground mb-6">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                {children}
            </div>
        </div>
    );
}
