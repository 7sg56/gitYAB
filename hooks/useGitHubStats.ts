import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGitHubStats, GitHubUserStats } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, STATS_TTL } from '@/lib/cache';

export function useGitHubStats(usernames: string[]) {
    const { pat, autoRescanEnabled, autoRescanIntervalMs, setLastScanTimestamp } = useGitStore();
    const [data, setData] = useState<Record<string, GitHubUserStats | null>>({});
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async (forceRefresh = false) => {
        if (!pat || usernames.length === 0) return;

        setLoading(true);
        const results: Record<string, GitHubUserStats | null> = {};

        const promises = usernames.map(async (username) => {
            if (!forceRefresh) {
                const cached = getCache<GitHubUserStats>(getCacheKey('stats', username));
                if (cached) {
                    results[username] = cached.data;
                    return;
                }
            }

            const stats = await fetchGitHubStats(username, pat);
            results[username] = stats;
            if (stats) {
                setCache(getCacheKey('stats', username), stats, STATS_TTL);
            }
        });

        await Promise.all(promises);
        setData((prev) => ({ ...prev, ...results }));
        setLastScanTimestamp(Date.now());
        setLoading(false);
    }, [usernames.join(','), pat, setLastScanTimestamp]);

    const rescan = useCallback(() => {
        clearCache('stats');
        fetchData(true);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
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
    }, [autoRescanEnabled, autoRescanIntervalMs, fetchData, pat, usernames.length]);

    return { data, loading, rescan };
}
