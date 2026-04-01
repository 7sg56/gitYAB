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
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={mainStats.avatarUrl}
                            alt={`${mainStats.login}'s avatar`}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-border/50 flex-shrink-0"
                        />
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {mainStats.name}
                                </h1>
                                <a href={`https://github.com/${mainStats.login}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                    @{mainStats.login}
                                </a>
                                {mainStats.status && (mainStats.status.emoji || mainStats.status.message) && (
                                    <span className="text-foreground/70 bg-accent/30 px-2 py-0.5 rounded-full text-xs border border-border/40">
                                        {mainStats.status.emoji && <span>{mainStats.status.emoji} </span>}
                                        {mainStats.status.message && <span>{mainStats.status.message}</span>}
                                    </span>
                                )}
                            </div>
                            {mainStats.bio && (
                                <p className="text-sm text-muted-foreground mt-1.5 max-w-lg leading-snug">
                                    {mainStats.bio}
                                </p>
                            )}
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-2">
                                {mainStats.location && (
                                    <span className="flex items-center gap-1"><MapPin size={12} />{mainStats.location}</span>
                                )}
                                {mainStats.company && (
                                    <span className="flex items-center gap-1"><Building2 size={12} />{mainStats.company}</span>
                                )}
                                {mainStats.websiteUrl && (
                                    <a href={mainStats.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                                        <LinkIcon size={12} />{new URL(mainStats.websiteUrl).hostname}
                                    </a>
                                )}
                                {mainStats.createdAt && (
                                    <span className="flex items-center gap-1"><CalendarDays size={12} />Joined {new Date(mainStats.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                )}
                                
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRescan}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-md text-foreground bg-accent/30 hover:bg-accent transition-colors disabled:opacity-50 flex-shrink-0 self-start"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Syncing...' : 'Rescan'}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                    <div>
                        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
                    </div>
                </div>
            )}

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* --- STATS BENTO CARDS --- */}
                {mainStats ? (
                    <>
                        {/* Commits Bento Card */}
                        <div className="md:col-span-12 lg:col-span-6 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[160px]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                        <GitCommit size={16} className="text-muted-foreground" />
                                        <span>Commits</span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <p className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">
                                            {mainStats.totalCommitsAllTime > 0 ? mainStats.totalCommitsAllTime.toLocaleString() : mainStats.totalCommitsYear.toLocaleString()}
                                        </p>
                                        {mainStats.totalCommitsAllTime > 0 && (
                                            <p className="text-sm text-muted-foreground mb-1 tabular-nums">
                                                {mainStats.totalCommitsYear.toLocaleString()} this year
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {mainStats.totalCommitsAllTime > 0 && (
                                    <span className="text-xs text-muted-foreground/60 mt-1">all time</span>
                                )}
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



                        {/* Smaller Stats Row (Language, Repos, Stars, Followers) */}
                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <Code2 size={16} className="text-muted-foreground" />
                                <span>Top Language</span>
                            </div>
                            {mainStats.topLanguage ? (
                                <div className="mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: mainStats.topLanguage.color }}
                                        />
                                        <p className="text-2xl font-semibold text-foreground tracking-tight">
                                            {mainStats.topLanguage.name}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-2xl font-semibold text-foreground tracking-tight mt-auto">
                                    N/A
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
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

                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <Star size={16} className="text-muted-foreground" />
                                <span>Stars Earned</span>
                            </div>
                            <p className="text-3xl font-semibold text-foreground tabular-nums tracking-tight mt-auto">
                                {mainStats.totalStars.toLocaleString()}
                            </p>
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 bg-card/40 border border-border/60 rounded-xl p-6 hover:border-border transition-colors flex flex-col justify-between min-h-[120px]">
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

            </div>
        </div>
    );
}
