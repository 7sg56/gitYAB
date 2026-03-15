import { useState, useEffect, useCallback } from 'react';
import { fetchGitHubEvents, GitHubEvent } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, EVENTS_TTL } from '@/lib/cache';

export function useGitHubEvents(usernames: string[]) {
    const { pat, setApiError } = useGitStore();
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        await Promise.resolve();
        const usernamesStr = usernames.join(',');
        const currentUsers = usernamesStr ? usernamesStr.split(',') : [];
        if (!pat || currentUsers.length === 0) {
            setEvents([]);
            return;
        }

        setLoading(true);

        let isRateLimited = false;
        let isBadCredentials = false;
        const allEventPromises = [];

        for (let i = 0; i < currentUsers.length; i += 3) {
            const batch = currentUsers.slice(i, i + 3);
            const batchPromises = batch.map(async (username: string) => {
                if (!forceRefresh) {
                    const cached = getCache<GitHubEvent[]>(getCacheKey('events', username));
                    if (cached) return cached.data;
                }

                if (isBadCredentials) return [];

                try {
                    const result = await fetchGitHubEvents(username, pat);
                    setCache(getCacheKey('events', username), result, EVENTS_TTL);
                    return result;
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        if (error.message === 'RATE_LIMIT') isRateLimited = true;
                        if (error.message === 'BAD_CREDENTIALS') isBadCredentials = true;
                    }
                    return [];
                }
            });
            allEventPromises.push(...batchPromises);

            if (isBadCredentials) break;

            if (i + 3 < currentUsers.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        const results = await Promise.all(allEventPromises);

        if (isBadCredentials) {
            setApiError('Invalid GitHub Personal Access Token. Please check your credentials.');
        } else if (isRateLimited) {
            setApiError('API Rate limit exceeded. Check your PAT or try again later.');
        } else {
            setApiError(null);
        }
        const allEvents = results.flat().sort((a: GitHubEvent, b: GitHubEvent) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setEvents(allEvents);
        setLoading(false);
    }, [usernames, pat, setApiError]);

    const rescan = useCallback(() => {
        clearCache('events');
        fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, [fetchData]);

    return { events, loading, rescan };
}