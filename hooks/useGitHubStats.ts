import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGitHubStats, GitHubUserStats } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, STATS_TTL } from '@/lib/cache';
import { getCachedData, cacheData } from '@/lib/auth';

export function useGitHubStats(usernames: string[]) {
    const { pat, autoRescanEnabled, autoRescanIntervalMs, setLastScanTimestamp, setApiError } = useGitStore();
    const [data, setData] = useState<Record<string, GitHubUserStats | null>>({});
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const usernamesKey = usernames.join(',');

    const fetchData = useCallback(async (forceRefresh = false) => {
        await Promise.resolve();
        const currentUsers = usernamesKey ? usernamesKey.split(',') : [];
        if (!pat || currentUsers.length === 0) return;

        setLoading(true);
        const results: Record<string, GitHubUserStats | null> = {};

        let isRateLimited = false;
        let isBadCredentials = false;

        for (let i = 0; i < currentUsers.length; i += 3) {
            const batch = currentUsers.slice(i, i + 3);
            await Promise.all(batch.map(async (username: string) => {
                if (!forceRefresh) {
                    // 1. Check localStorage first (fastest)
                    const localCached = getCache<GitHubUserStats>(getCacheKey('stats', username));
                    if (localCached) {
                        results[username] = localCached.data;
                        return;
                    }

                    // 2. Check Supabase DB cache (persists across sessions/devices)
                    try {
                        const dbCached = await getCachedData<GitHubUserStats>('stats', username);
                        if (dbCached) {
                            results[username] = dbCached;
                            // Backfill localStorage for faster subsequent reads
                            setCache(getCacheKey('stats', username), dbCached, STATS_TTL);
                            return;
                        }
                    } catch {
                        // DB unreachable, continue to API
                    }
                }

                if (isBadCredentials) return;

                // 3. Fetch from GitHub API
                try {
                    const stats = await fetchGitHubStats(username, pat);
                    results[username] = stats;
                    if (stats) {
                        // Write to both caches
                        setCache(getCacheKey('stats', username), stats, STATS_TTL);
                        cacheData('stats', username, stats).catch(() => { });
                    }
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        if (error.message === 'RATE_LIMIT') isRateLimited = true;
                        if (error.message === 'BAD_CREDENTIALS') isBadCredentials = true;
                    }
                }
            }));

            if (isBadCredentials) break;

            if (i + 3 < currentUsers.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        if (isBadCredentials) {
            setApiError('Invalid GitHub Personal Access Token. Please check your credentials.');
        } else if (isRateLimited) {
            setApiError('API Rate limit exceeded. Check your PAT or try again later.');
        } else {
            setApiError(null);
        }
        setData((prev) => ({ ...prev, ...results }));
        setLastScanTimestamp(Date.now());
        setLoading(false);
    }, [usernamesKey, pat, setLastScanTimestamp, setApiError]);

    const rescan = useCallback(() => {
        clearCache('stats');
        fetchData(true);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, [fetchData]);

    // Auto-rescan interval
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (autoRescanEnabled && pat && usernamesKey) {
            intervalRef.current = setInterval(() => {
                clearCache('stats');
                fetchData(true);
            }, autoRescanIntervalMs);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRescanEnabled, autoRescanIntervalMs, fetchData, pat, usernamesKey]);

    return { data, loading, rescan };
}