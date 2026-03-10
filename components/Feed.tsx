'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { GitCommit, GitPullRequest, CircleDot, GitBranch, Star, Activity, RefreshCw } from 'lucide-react';

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export function Feed() {
    const { rivals, enabledRivals } = useGitStore();
    const activeRivals = rivals.filter((r) => enabledRivals[r] !== false);
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
                        <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">No recent activity found.</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-0">
                        {events.map((event) => {
                            const { icon, color, text } = getEventInfo(event);
                            return (
                                <div key={event.id} className="relative flex gap-3 py-2.5 pl-0">
                                    {/* Timeline dot */}
                                    <div className={`relative z-10 w-[38px] h-[38px] shrink-0 flex items-center justify-center rounded-full bg-background border border-border ${color}`}>
                                        {icon}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1.5">
                                        <p className="text-sm text-foreground">
                                            <span className="font-medium">{event.actor.login}</span>
                                            <span className="text-muted-foreground"> {text} </span>
                                            <a
                                                href={`https://github.com/${event.repo.name}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {event.repo.name}
                                            </a>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {timeAgo(event.created_at)} ago
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function getEventInfo(event: any) {
    switch (event.type) {
        case 'PushEvent': {
            const count = event.payload.commits?.length || 0;
            return {
                icon: <GitCommit size={16} />,
                color: 'text-primary',
                text: `pushed ${count} commit${count === 1 ? '' : 's'} to`,
            };
        }
        case 'PullRequestEvent':
            return {
                icon: <GitPullRequest size={16} />,
                color: event.payload.action === 'closed' ? 'text-[#bc8cff]' : 'text-success',
                text: `${event.payload.action} a PR in`,
            };
        case 'IssuesEvent':
            return {
                icon: <CircleDot size={16} />,
                color: event.payload.action === 'closed' ? 'text-[#bc8cff]' : 'text-success',
                text: `${event.payload.action} an issue in`,
            };
        case 'CreateEvent':
            return {
                icon: <GitBranch size={16} />,
                color: 'text-primary',
                text: `created a ${event.payload.ref_type} in`,
            };
        case 'WatchEvent':
            return {
                icon: <Star size={16} />,
                color: 'text-warning',
                text: 'starred',
            };
        default:
            return {
                icon: <Activity size={16} />,
                color: 'text-muted-foreground',
                text: 'interacted with',
            };
    }
}
