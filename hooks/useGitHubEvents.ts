/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { fetchGitHubEvents, GitHubEvent } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, EVENTS_TTL } from '@/lib/cache';

// In-memory events cache to prevent refetches on page switches
const memoryEventsCache = new Map<string, GitHubEvent[]>();
const memoryEventsFetchedAt = new Map<string, number>();
const MEMORY_EVENTS_TTL = 10 * 60 * 1000; // 10 minutes

function getMemoryEventsCache(key: string): GitHubEvent[] | null {
    const data = memoryEventsCache.get(key);
    const fetchedAt = memoryEventsFetchedAt.get(key) ?? 0;
    if (data && (Date.now() - fetchedAt) < MEMORY_EVENTS_TTL) {
        return data;
    }
    return null;
}

function setMemoryEventsCache(key: string, data: GitHubEvent[]) {
    memoryEventsCache.set(key, data);
    memoryEventsFetchedAt.set(key, Date.now());
}

export function useGitHubEvents(usernames: string[]) {
    const { pat, setApiError } = useGitStore();
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const usernamesKey = usernames.join(',');

    const fetchData = useCallback(async (forceRefresh = false, pageNum = 1) => {
        await Promise.resolve();
        const currentUsers = usernamesKey ? usernamesKey.split(',') : [];
        if (!pat || currentUsers.length === 0) {
            setEvents([]);
            return;
        }

        if (pageNum === 1) setLoading(true);
        else setIsLoadingMore(true);

        let isRateLimited = false;
        let isBadCredentials = false;
        const allEventPromises = [];

        for (let i = 0; i < currentUsers.length; i += 3) {
            const batch = currentUsers.slice(i, i + 3);
            const batchPromises = batch.map(async (username: string) => {
                if (!forceRefresh && pageNum === 1) {
                    // Check memory cache first
                    const memKey = `events_${pageNum}_${username}`;
                    const memCached = getMemoryEventsCache(memKey);
                    if (memCached) return memCached;

                    // Then localStorage
                    const cached = getCache<GitHubEvent[]>(getCacheKey(`events_${pageNum}`, username));
                    if (cached) {
                        setMemoryEventsCache(memKey, cached.data);
                        return cached.data;
                    }
                }

                if (isBadCredentials) return [];

                try {
                    const result = await fetchGitHubEvents(username, pat, pageNum);
                    if (pageNum === 1) {
                        setCache(getCacheKey(`events_${pageNum}`, username), result, EVENTS_TTL);
                        setMemoryEventsCache(`events_${pageNum}_${username}`, result);
                    }
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

        const newEventsArray = results.flat();
        if (newEventsArray.length === 0) {
            setHasMore(false);
        } else {
            // A page is full if a user returned 30 events. If no user returned 30 events, we have reached the end of their event streams.
            const hasFullPage = results.some(userEvents => userEvents.length === 30);
            setHasMore(hasFullPage);
        }

        if (pageNum === 1) {
            const allEvents = newEventsArray.sort((a: GitHubEvent, b: GitHubEvent) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setEvents(allEvents);
        } else {
            setEvents(prev => {
                const combined = [...prev, ...newEventsArray];
                // Deduplicate by ID just in case
                const uniqueIds = new Set();
                const uniqueEvents = [];
                for (const ev of combined) {
                    if (!uniqueIds.has(ev.id)) {
                        uniqueIds.add(ev.id);
                        uniqueEvents.push(ev);
                    }
                }
                return uniqueEvents.sort((a: GitHubEvent, b: GitHubEvent) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            });
        }

        if (pageNum === 1) setLoading(false);
        else setIsLoadingMore(false);
    }, [usernamesKey, pat, setApiError]);

    const rescan = useCallback(() => {
        clearCache('events_1'); // Note: doesn't clear all pages, but typically enough
        // Also clear memory cache for events
        for (const key of memoryEventsCache.keys()) {
            if (key.startsWith('events_1_')) {
                memoryEventsCache.delete(key);
                memoryEventsFetchedAt.delete(key);
            }
        }
        setPage(1);
        setHasMore(true);
        fetchData(true, 1);
    }, [fetchData]);

    const loadMore = useCallback(() => {
        if (!loading && !isLoadingMore && hasMore) {
            setPage(p => p + 1);
        }
    }, [loading, isLoadingMore, hasMore]);

    useEffect(() => {
        fetchData(false, page);
    }, [fetchData, page]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setEvents([]);
        // The fetchData effect will handle fetching since fetchData depends on usernamesKey
    }, [usernamesKey]);

    return { events, loading, isLoadingMore, hasMore, loadMore, rescan };
}