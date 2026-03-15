'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { formatTimeAgo } from '@/lib/utils';
import { useMemo } from 'react';
import { GitCommit, GitPullRequest, CircleDot, Star, BookMarked, Users, RefreshCw, Activity, CheckCircle2, GitBranch } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
    const allUsers = useMemo(() => [mainUser, ...activeRivals].filter(Boolean) as string[], [mainUser, activeRivals]);

    const { data, loading: statsLoading, rescan: rescanStats } = useGitHubStats(allUsers);

    // Fetch events for main user only on the dashboard
    const mainUserArr = useMemo(() => mainUser ? [mainUser] : [], [mainUser]);
    const { events, loading: eventsLoading, rescan: rescanEvents } = useGitHubEvents(mainUserArr);

    const loading = statsLoading || eventsLoading;

    const handleRescan = () => {
        rescanStats();
        rescanEvents();
    };

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

    const tooltipStyle = {
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    };

    // Find latest meaningful events
    const latestPush = events.find(e => e.type === 'PushEvent');
    const latestPushPayload = latestPush?.payload as Record<string, unknown>;

    const latestPR = events.find(e => e.type === 'PullRequestEvent');
    const latestPRPayload = latestPR?.payload as Record<string, unknown>;

    const latestIssue = events.find(e => e.type === 'IssuesEvent');
    const latestIssuePayload = latestIssue?.payload as Record<string, unknown>;

    const latestCreateRepo = events.find(e => e.type === 'CreateEvent' && typeof e.payload === 'object' && e.payload !== null && 'ref_type' in e.payload && e.payload.ref_type === 'repository');

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        @{mainUser} vs {activeRivals.length} rival{activeRivals.length === 1 ? '' : 's'}
                    </p>
                </div>
                <button
                    onClick={handleRescan}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-md text-foreground bg-accent/30 hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Syncing...' : 'Rescan'}
                </button>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* --- STATS BENTO CARDS --- */}
                {mainStats ? (
                    <>
                        {/* Commits Bento Card */}
                        <div className="md:col-span-12 lg:col-span-6 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[160px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                        <GitCommit size={16} className="text-muted-foreground" />
                                        <span>Commits <span className="text-muted-foreground/50">(past year)</span></span>
                                    </div>
                                    <p className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">
                                        {mainStats.totalCommitsYear.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {latestPush && (
                                <div className="mt-auto pt-4 border-t border-border/40">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                            <Activity size={14} className="text-muted-foreground" />
                                            Latest Commit
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(latestPush.created_at)}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://github.com/${latestPush.repo.name}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-foreground hover:text-primary transition-colors line-clamp-1 mb-1.5"
                                    >
                                        {latestPush.repo.name}
                                    </a>
                                    {Array.isArray(latestPushPayload?.commits) && (latestPushPayload.commits as Record<string, unknown>[])[0] && (
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {String((latestPushPayload.commits as Record<string, unknown>[])[0].message ?? '')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pull Requests Bento Card */}
                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[160px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                        <GitPullRequest size={16} className="text-muted-foreground" />
                                        <span>Pull Requests</span>
                                    </div>
                                    <p className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">
                                        {mainStats.totalPRsYear.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {latestPR && (
                                <div className="mt-auto pt-4 border-t border-border/40">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`text-xs font-medium flex items-center gap-1.5 ${latestPRPayload?.action === 'closed' ? ((latestPRPayload?.pull_request as Record<string, unknown>)?.merged ? 'text-purple-400' : 'text-red-400') : 'text-emerald-400'}`}>
                                            <GitBranch size={14} />
                                            {latestPRPayload?.action === 'closed' ? ((latestPRPayload?.pull_request as Record<string, unknown>)?.merged ? 'Merged' : 'Closed') : (typeof latestPRPayload?.action === 'string' ? latestPRPayload.action.charAt(0).toUpperCase() + latestPRPayload.action.slice(1) : 'Opened')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(latestPR.created_at)}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://github.com/${latestPR.repo.name}/pull/${latestPRPayload?.number}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                                    >
                                        {String((latestPRPayload?.pull_request as Record<string, unknown>)?.title ?? `Pull Request #${latestPRPayload?.number ?? (latestPRPayload?.pull_request as Record<string, unknown>)?.number ?? ''}`)}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Issues Bento Card */}
                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[160px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                        <CircleDot size={16} className="text-muted-foreground" />
                                        <span>Issues</span>
                                    </div>
                                    <p className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">
                                        {mainStats.totalIssuesYear.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {latestIssue && (
                                <div className="mt-auto pt-4 border-t border-border/40">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`text-xs font-medium flex items-center gap-1.5 ${latestIssuePayload?.action === 'closed' ? 'text-purple-400' : 'text-emerald-400'}`}>
                                            {latestIssuePayload?.action === 'closed' ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}
                                            {typeof latestIssuePayload?.action === 'string' ? latestIssuePayload.action.charAt(0).toUpperCase() + latestIssuePayload.action.slice(1) : 'Opened'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(latestIssue.created_at)}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://github.com/${latestIssue.repo.name}/issues/${(latestIssuePayload?.issue as Record<string, unknown>)?.number}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                                    >
                                        {String((latestIssuePayload?.issue as Record<string, unknown>)?.title ?? `Issue #${(latestIssuePayload?.issue as Record<string, unknown>)?.number ?? ''}`)}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Smaller Stats Row (Repos, Stars, Followers) */}
                        <div className="md:col-span-4 lg:col-span-4 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <BookMarked size={16} className="text-muted-foreground" />
                                <span>Repositories</span>
                            </div>
                            <p className="text-3xl font-semibold text-foreground tabular-nums tracking-tight mb-2">
                                {mainStats.totalRepos.toLocaleString()}
                            </p>
                            {latestCreateRepo && (
                                <div className="mt-auto text-xs text-muted-foreground pt-3 border-t border-border/40 truncate">
                                    <span className="text-foreground">{latestCreateRepo.repo.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-4 lg:col-span-4 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <Star size={16} className="text-muted-foreground" />
                                <span>Stars Earned</span>
                            </div>
                            <p className="text-3xl font-semibold text-foreground tabular-nums tracking-tight mt-auto">
                                {mainStats.totalStars.toLocaleString()}
                            </p>
                        </div>

                        <div className="md:col-span-4 lg:col-span-4 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <Users size={16} className="text-muted-foreground" />
                                <span>Followers</span>
                            </div>
                            <p className="text-3xl font-semibold text-foreground tabular-nums tracking-tight mt-auto">
                                {mainStats.followers.toLocaleString()}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-card/40 border border-border/60 rounded-xl animate-pulse" />
                        ))}
                    </div>
                )}


                {/* --- CHARTS SECTION --- */}
                {activeRivals.length > 0 ? (
                    <>
                        {/* Contributions Chart */}
                        <div className="md:col-span-12 lg:col-span-6 bg-card/40 border border-border/60 rounded-xl p-6 flex flex-col min-h-[380px]">
                            <h3 className="text-sm font-medium text-foreground mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-muted-foreground" />
                                Contributions
                            </h3>
                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
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

                        {/* Popularity & Reach Chart */}
                        <div className="md:col-span-12 lg:col-span-6 bg-card/40 border border-border/60 rounded-xl p-6 min-h-[380px] flex flex-col">
                            <h3 className="text-sm font-medium text-foreground mb-6 flex items-center gap-2">
                                <Star size={16} className="text-muted-foreground" />
                                Reach
                            </h3>
                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={popularityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <XAxis dataKey="name" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} angle={-35} textAnchor="end" height={60} tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val} />
                                        <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                                        <Tooltip contentStyle={{ ...tooltipStyle, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="Stars" fill="#d29922" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        <Bar dataKey="Followers" fill="#bc8cff" radius={[4, 4, 0, 0]} maxBarSize={48} />
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
