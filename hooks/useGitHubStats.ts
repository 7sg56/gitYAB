import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGitHubStats, GitHubUserStats } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, STATS_TTL } from '@/lib/cache';

export function useGitHubStats(usernames: string[]) {
    const { pat, autoRescanEnabled, autoRescanIntervalMs, setLastScanTimestamp, setApiError } = useGitStore();
    const [data, setData] = useState<Record<string, GitHubUserStats | null>>({});
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async (forceRefresh = false) => {
        await Promise.resolve();
        const currentUsers = usernames;
        if (!pat || currentUsers.length === 0) return;

        setLoading(true);
        const results: Record<string, GitHubUserStats | null> = {};

        let isRateLimited = false;
        let isBadCredentials = false;

        for (let i = 0; i < currentUsers.length; i += 3) {
            const batch = currentUsers.slice(i, i + 3);
            await Promise.all(batch.map(async (username: string) => {
                if (!forceRefresh) {
                    const cached = getCache<GitHubUserStats>(getCacheKey('stats', username));
                    if (cached) {
                        results[username] = cached.data;
                        return;
                    }
                }

                if (isBadCredentials) return;

                try {
                    const stats = await fetchGitHubStats(username, pat);
                    results[username] = stats;
                    if (stats) {
                        setCache(getCacheKey('stats', username), stats, STATS_TTL);
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
    }, [usernames, pat, setLastScanTimestamp, setApiError]);

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

        if (autoRescanEnabled && pat && usernames.length > 0) {
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
    }, [autoRescanEnabled, autoRescanIntervalMs, fetchData, pat, usernames]);

    return { data, loading, rescan };
}