import { useState, useEffect, useCallback } from 'react';
import { fetchGitHubEvents, GitHubEvent } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, EVENTS_TTL } from '@/lib/cache';

export function useGitHubEvents(usernames: string[]) {
    const { pat } = useGitStore();
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        if (!pat || usernames.length === 0) {
            setEvents([]);
            return;
        }

        setLoading(true);

        const promises = usernames.map(async (username) => {
            if (!forceRefresh) {
                const cached = getCache<GitHubEvent[]>(getCacheKey('events', username));
                if (cached) return cached.data;
            }

            const result = await fetchGitHubEvents(username, pat);
            setCache(getCacheKey('events', username), result, EVENTS_TTL);
            return result;
        });

        const results = await Promise.all(promises);
        const allEvents = results.flat().sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setEvents(allEvents);
        setLoading(false);
    }, [usernames.join(','), pat]);

    const rescan = useCallback(() => {
        clearCache('events');
        fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { events, loading, rescan };
}
