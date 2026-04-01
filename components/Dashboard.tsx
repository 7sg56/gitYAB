'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { formatTimeAgo } from '@/lib/utils';
import { useMemo } from 'react';
import { GitCommit, GitPullRequest, CircleDot, Star, BookMarked, Users, RefreshCw, Activity, CheckCircle2, GitBranch, Code2, MapPin, Building2, Link as LinkIcon, CalendarDays } from 'lucide-react';

export function Dashboard() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = useMemo(() => rivals.filter((r) => enabledRivals[r] !== false), [rivals, enabledRivals]);
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
            {mainStats ? (
                <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/20 p-6 md:p-10 mesh-gradient group">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary/10" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={mainStats.avatarUrl}
                                    alt={`${mainStats.login}'s avatar`}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 border-border/50 shadow-2xl object-cover ring-4 ring-primary/5"
                                />
                            </div>

                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight py-1">
                                        {mainStats.name}
                                    </h1>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <a href={`https://github.com/${mainStats.login}`} target="_blank" rel="noreferrer" className="text-lg font-medium text-primary hover:text-primary/80 transition-colors">
                                        @{mainStats.login}
                                    </a>
                                </div>

                                {mainStats.bio && (
                                    <p className="text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
                                        {mainStats.bio}
                                    </p>
                                )}

                                <div className="flex items-center flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground mt-5">
                                    {mainStats.location && (
                                        <span className="flex items-center gap-2 hover:text-foreground transition-colors cursor-default"><MapPin size={14} className="text-primary/70" />{mainStats.location}</span>
                                    )}
                                    {mainStats.company && (
                                        <span className="flex items-center gap-2 hover:text-foreground transition-colors cursor-default"><Building2 size={14} className="text-primary/70" />{mainStats.company}</span>
                                    )}
                                    {mainStats.websiteUrl && (
                                        <a href={mainStats.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                            <LinkIcon size={14} className="text-primary/70" />{new URL(mainStats.websiteUrl).hostname}
                                        </a>
                                    )}
                                    {mainStats.createdAt && (
                                        <span className="flex items-center gap-2 hover:text-foreground transition-colors cursor-default"><CalendarDays size={14} className="text-primary/70" />Joined {new Date(mainStats.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center gap-3 self-center md:self-end mt-4 md:mt-0">
                            <button
                                onClick={handleRescan}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-border rounded-xl text-foreground bg-accent/30 hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Syncing...' : 'Rescan'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-card/20 rounded-3xl border border-border/50 animate-pulse">
                    <div className="w-32 h-32 rounded-3xl bg-muted" />
                    <div className="flex-1 space-y-4">
                        <div className="h-10 w-64 bg-muted rounded-xl" />
                        <div className="h-6 w-full max-w-md bg-muted rounded-lg" />
                        <div className="flex gap-4">
                            <div className="h-5 w-24 bg-muted rounded-md" />
                            <div className="h-5 w-24 bg-muted rounded-md" />
                            <div className="h-5 w-24 bg-muted rounded-md" />
                        </div>
                    </div>
                </div>
            )}

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* --- STATS BENTO CARDS --- */}
                {mainStats ? (
                    <>
                        {/* Commits Bento Card */}
                        <div className="md:col-span-12 lg:col-span-6 glass-card p-6 flex flex-col justify-between min-h-[180px]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        <GitCommit size={16} className="text-primary" />
                                        <span>Commits</span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <p className="text-5xl font-bold text-foreground tabular-nums tracking-tighter">
                                            {mainStats.totalCommitsYear.toLocaleString()}
                                        </p>
                                        <span className="text-sm font-medium text-muted-foreground/60">THIS YEAR</span>
                                    </div>
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
                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[180px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        <GitPullRequest size={16} className="text-purple-400" />
                                        <span>Pull Requests</span>
                                    </div>
                                    <p className="text-5xl font-bold text-foreground tabular-nums tracking-tighter">
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
                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[180px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        <CircleDot size={16} className="text-emerald-400" />
                                        <span>Issues</span>
                                    </div>
                                    <p className="text-5xl font-bold text-foreground tabular-nums tracking-tighter">
                                        {mainStats.totalIssuesYear.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {mainStats.latestIssues && mainStats.latestIssues.length > 0 ? (
                                <div className="mt-auto pt-4 border-t border-border/40 space-y-3">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Recent Issues</p>
                                    <div className="space-y-2">
                                        {mainStats.latestIssues.slice(0, 3).map((issue) => (
                                            <div key={issue.number} className="group/issue">
                                                <a
                                                    href={issue.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-start gap-2 text-xs text-foreground/80 hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    <span className="text-muted-foreground font-mono">#{issue.number}</span>
                                                    <span className="flex-1 truncate">{issue.title}</span>
                                                </a>
                                                <p className="text-[10px] text-muted-foreground pl-7 truncate">{issue.repository.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : latestIssue && (
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



                        {/* Smaller Stats Row (Language, Repos, Stars, Followers) */}
                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Code2 size={16} className="text-blue-400" />
                                <span>Top Language</span>
                            </div>
                            {mainStats.topLanguage ? (
                                <div className="mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full shadow-sm ring-2 ring-background"
                                            style={{ backgroundColor: mainStats.topLanguage.color }}
                                        />
                                        <p className="text-3xl font-bold text-foreground tracking-tight">
                                            {mainStats.topLanguage.name}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-3xl font-bold text-foreground tracking-tight mt-auto">
                                    N/A
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <BookMarked size={16} className="text-amber-400" />
                                <span>Repositories</span>
                            </div>
                            <p className="text-4xl font-bold text-foreground tabular-nums tracking-tighter mb-2">
                                {mainStats.totalRepos.toLocaleString()}
                            </p>
                            {latestCreateRepo && (
                                <div className="mt-auto text-[10px] text-muted-foreground pt-3 border-t border-border/40 truncate">
                                    LATEST: <span className="text-foreground/90 font-medium">{latestCreateRepo.repo.name.split('/').pop()}</span>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Star size={16} className="text-yellow-400" />
                                <span>Stars Earned</span>
                            </div>
                            <p className="text-4xl font-bold text-foreground tabular-nums tracking-tighter mt-auto">
                                {mainStats.totalStars.toLocaleString()}
                            </p>
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 glass-card p-6 flex flex-col justify-between min-h-[140px]">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Users size={16} className="text-pink-400" />
                                <span>Followers</span>
                            </div>
                            <p className="text-4xl font-bold text-foreground tabular-nums tracking-tighter mt-auto">
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

            </div>
        </div>
    );
}
