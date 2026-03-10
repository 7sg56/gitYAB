'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubEvents } from '@/hooks/useGitHubEvents';
import { motion } from 'framer-motion';
import { GitCommit, GitPullRequest, CircleDot, GitBranch, Star, Activity } from 'lucide-react';

export function Feed() {
    const { rivals } = useGitStore();
    const { events, loading } = useGitHubEvents(rivals);

    if (rivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
                <Activity size={48} className="opacity-20" />
                <p>Add rivals from the sidebar to see their recent GitHub activity.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-6">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-8 relative z-10 pb-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tighter">
                    Activity Feed
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Recent actions from your rivals across GitHub.
                </p>
            </motion.div>

            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground glass rounded-2xl border border-white/5">
                        No recent activity found. Maybe they stopped coding?
                    </div>
                ) : (
                    events.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} />
                    ))
                )}
            </div>
        </div>
    );
}

function EventCard({ event, index }: { event: any; index: number }) {
    let icon = <Activity />;
    let color = "text-gray-400";
    let actionText = "did something";

    switch (event.type) {
        case 'PushEvent':
            icon = <GitCommit size={20} />;
            color = "text-blue-400";
            const commitCount = event.payload.commits?.length || 0;
            actionText = `pushed ${commitCount} commit${commitCount === 1 ? '' : 's'} to`;
            break;
        case 'PullRequestEvent':
            icon = <GitPullRequest size={20} />;
            color = event.payload.action === 'closed' ? "text-purple-500" : "text-green-500";
            actionText = `${event.payload.action} a pull request in`;
            break;
        case 'IssuesEvent':
            icon = <CircleDot size={20} />;
            color = event.payload.action === 'closed' ? "text-purple-500" : "text-green-500";
            actionText = `${event.payload.action} an issue in`;
            break;
        case 'CreateEvent':
            icon = <GitBranch size={20} />;
            color = "text-blue-400";
            actionText = `created a ${event.payload.ref_type} in`;
            break;
        case 'WatchEvent':
            icon = <Star size={20} />;
            color = "text-yellow-500";
            actionText = `starred`;
            break;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
            className="glass p-5 rounded-2xl border border-white/5 flex gap-4 items-start hover:bg-white/5 transition-colors"
        >
            <img
                src={event.actor.avatar_url}
                alt={event.actor.login}
                className="w-10 h-10 rounded-full bg-white/10 ring-2 ring-white/10"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90">
                    <strong className="text-foreground">{event.actor.login}</strong> {actionText} <a href={`https://github.com/${event.repo.name}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">{event.repo.name}</a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.created_at).toLocaleString()}
                </p>
            </div>
            <div className={`p-2 rounded-xl bg-white/5 ${color} shrink-0`}>
                {icon}
            </div>
        </motion.div>
    );
}
