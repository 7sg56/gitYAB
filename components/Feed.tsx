'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { formatTimeAgo } from '@/lib/utils';
import { GitCommit, GitPullRequest, CircleDot, GitBranch, Star, Activity, RefreshCw, GitFork, MessageSquare } from 'lucide-react';
import { GitHubEvent } from '@/lib/github';
import Image from 'next/image';
import { useMemo } from 'react';

export function Feed() {
    const { rivals, enabledRivals } = useGitStore();
    const activeRivals = useMemo(() => rivals.filter((r) => enabledRivals[r] !== false), [rivals, enabledRivals]);
    const { events, loading, rescan } = useGitHubEvents(activeRivals);

    if (activeRivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <Activity size={32} className="opacity-30" />
                <p className="text-sm">Enable rivals to see their recent GitHub activity.</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Activity</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Recent actions from your rivals.</p>
                </div>
                <button
                    onClick={rescan}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {loading && events.length === 0 ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">No recent activity found.</p>
                </div>
            ) : (
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventItem({ event }: { event: GitHubEvent }) {
    const info = getEventDetail(event);

    return (
        <div className="flex gap-3 px-4 py-3.5 hover:bg-accent/30 transition-colors">
            {/* Avatar */}
            <Image
                src={event.actor.avatar_url}
                alt={event.actor.login}
                width={32}
                height={32}
                className="rounded-full mt-0.5 shrink-0"
                unoptimized
            />

            <div className="flex-1 min-w-0">
                {/* Main action line */}
                <p className="text-sm text-foreground leading-snug">
                    <a
                        href={`https://github.com/${event.actor.login}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary transition-colors"
                    >
                        {event.actor.login}
                    </a>
                    <span className="text-muted-foreground"> {info.action} </span>
                    <a
                        href={`https://github.com/${event.repo.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                    >
                        {event.repo.name}
                    </a>
                </p>

                {/* Detail section */}
                {info.details && info.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {info.details.map((detail, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="text-muted-foreground/50 mt-0.5 shrink-0">{info.detailIcon}</span>
                                <span className="truncate">{detail}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* PR/Issue title */}
                {info.title && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            {info.statusIcon}
                            {info.title}
                        </span>
                    </p>
                )}

                {/* Timestamp */}
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">{formatTimeAgo(event.created_at)}</p>
            </div>

            {/* Event type icon */}
            <div className={`shrink-0 mt-0.5 ${info.color}`}>
                {info.icon}
            </div>
        </div>
    );
}

function getEventDetail(event: GitHubEvent) {
    const payload = event.payload as Record<string, unknown>;

    switch (event.type) {
        case 'PushEvent': {
            const commits = (payload.commits as { sha?: string; message?: string }[]) || [];
            const branch = typeof payload.ref === 'string' ? payload.ref.replace('refs/heads/', '') : 'unknown';
            const count = (payload.size as number) ?? commits.length;

            if (count === 0) {
                return {
                    icon: <GitBranch size={16} />,
                    color: 'text-primary',
                    action: `pushed to ${branch} in`,
                    details: null,
                    detailIcon: null,
                    title: null,
                    statusIcon: null,
                };
            }

            return {
                icon: <GitCommit size={16} />,
                color: 'text-primary',
                action: `pushed ${count} commit${count === 1 ? '' : 's'} to ${branch} in`,
                details: commits.slice(0, 3).map((c) => `${c.sha?.slice(0, 7)} ${c.message?.split('\n')[0] || ''}`),
                detailIcon: '\u2022',
                title: count > 3 ? `... and ${count - 3} more commit${count - 3 === 1 ? '' : 's'}` : null,
                statusIcon: null,
            };
        }
        case 'PullRequestEvent': {
            const pr = payload.pull_request as { number?: number; title?: string; merged?: boolean } | undefined;
            const action = payload.action as string | undefined;
            const merged = pr?.merged;
            let statusColor = 'text-success';
            let statusLabel = 'opened';
            if (action === 'closed' && merged) {
                statusColor = 'text-[#a371f7]';
                statusLabel = 'merged';
            } else if (action === 'closed') {
                statusColor = 'text-danger';
                statusLabel = 'closed';
            } else {
                statusLabel = action ?? 'opened';
            }
            const prNumber = pr?.number ?? (payload.number as number | undefined);
            return {
                icon: <GitPullRequest size={16} />,
                color: statusColor,
                action: `${statusLabel} a pull request in`,
                details: null,
                detailIcon: null,
                title: (pr?.title as string) || (prNumber ? `Pull Request #${prNumber}` : null),
                statusIcon: <span className={`inline-block w-2 h-2 rounded-full ${statusColor === 'text-success' ? 'bg-success' : statusColor === 'text-danger' ? 'bg-danger' : 'bg-[#a371f7]'} mr-1`} />,
            };
        }
        case 'IssuesEvent': {
            const issue = payload.issue as { number?: number; title?: string } | undefined;
            const action = payload.action as string | undefined;
            return {
                icon: <CircleDot size={16} />,
                color: action === 'closed' ? 'text-[#a371f7]' : 'text-success',
                action: `${action ?? 'opened'} an issue in`,
                details: null,
                detailIcon: null,
                title: (issue?.title as string) || (issue?.number ? `Issue #${issue.number}` : null),
                statusIcon: <span className={`inline-block w-2 h-2 rounded-full ${action === 'closed' ? 'bg-[#a371f7]' : 'bg-success'} mr-1`} />,
            };
        }
        case 'IssueCommentEvent': {
            const issue = payload.issue as { title?: string } | undefined;
            return {
                icon: <MessageSquare size={16} />,
                color: 'text-muted-foreground',
                action: 'commented on an issue in',
                details: null,
                detailIcon: null,
                title: (issue?.title as string) || null,
                statusIcon: null,
            };
        }
        case 'CreateEvent': {
            const refType = payload.ref_type as string | undefined;
            const ref = payload.ref as string | undefined;
            return {
                icon: <GitBranch size={16} />,
                color: 'text-primary',
                action: `created ${refType ?? 'ref'}${ref ? ` ${ref}` : ''} in`,
                details: null,
                detailIcon: null,
                title: (payload.description as string) || null,
                statusIcon: null,
            };
        }
        case 'ForkEvent':
            return {
                icon: <GitFork size={16} />,
                color: 'text-muted-foreground',
                action: 'forked',
                details: null,
                detailIcon: null,
                title: null,
                statusIcon: null,
            };
        case 'WatchEvent':
            return {
                icon: <Star size={16} />,
                color: 'text-warning',
                action: 'starred',
                details: null,
                detailIcon: null,
                title: null,
                statusIcon: null,
            };
        case 'DeleteEvent':
            return {
                icon: <GitBranch size={16} />,
                color: 'text-danger',
                action: `deleted ${payload.ref_type as string ?? ''} ${(payload.ref as string) || ''} in`,
                details: null,
                detailIcon: null,
                title: null,
                statusIcon: null,
            };
        case 'PullRequestReviewEvent': {
            const pr = payload.pull_request as { title?: string } | undefined;
            return {
                icon: <GitPullRequest size={16} />,
                color: 'text-[#a371f7]',
                action: `reviewed a pull request in`,
                details: null,
                detailIcon: null,
                title: (pr?.title as string) || null,
                statusIcon: null,
            };
        }
        default:
            return {
                icon: <Activity size={16} />,
                color: 'text-muted-foreground',
                action: 'interacted with',
                details: null,
                detailIcon: null,
                title: null,
                statusIcon: null,
            };
    }
}
