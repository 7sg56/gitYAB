import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGitHubStats, GitHubUserStats } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';
import { getCache, setCache, getCacheKey, clearCache, STATS_TTL } from '@/lib/cache';
import { getCachedData, cacheData } from '@/lib/auth';

// ============================
// Shared in-memory stats cache (survives component unmounts within the same page session)
// This prevents duplicate fetches when Dashboard, RivalsPanel, Comparator, etc.
// all mount/unmount and call useGitHubStats with overlapping user lists.
// ============================
const memoryStatsCache = new Map<string, GitHubUserStats>();
const memoryStatsFetchedAt = new Map<string, number>();
const MEMORY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getMemoryCache(username: string): GitHubUserStats | null {
    const data = memoryStatsCache.get(username);
    const fetchedAt = memoryStatsFetchedAt.get(username) ?? 0;
    if (data && (Date.now() - fetchedAt) < MEMORY_CACHE_TTL) {
        return data;
    }
    return null;
}

function setMemoryCache(username: string, data: GitHubUserStats) {
    memoryStatsCache.set(username, data);
    memoryStatsFetchedAt.set(username, Date.now());
}

export function clearMemoryStatsCache() {
    memoryStatsCache.clear();
    memoryStatsFetchedAt.clear();
}

// Track in-flight fetches to prevent duplicate concurrent requests for the same user
const inFlightFetches = new Map<string, Promise<GitHubUserStats | null>>();

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

        // Phase 1: Immediately populate from memory cache (instant, no async)
        const usersNeedingFetch: string[] = [];
        if (!forceRefresh) {
            for (const username of currentUsers) {
                const memCached = getMemoryCache(username);
                if (memCached) {
                    results[username] = memCached;
                } else {
                    usersNeedingFetch.push(username);
                }
            }
        } else {
            usersNeedingFetch.push(...currentUsers);
        }

        // If everything was in memory, skip network entirely
        if (usersNeedingFetch.length === 0) {
            setData((prev) => ({ ...prev, ...results }));
            setLastScanTimestamp(Date.now());
            setLoading(false);
            return;
        }

        // Phase 2: Show memory-cached results immediately while we fetch the rest
        if (Object.keys(results).length > 0) {
            setData((prev) => ({ ...prev, ...results }));
        }

        // Phase 3: For remaining users, check localStorage + DB cache + API in parallel batches
        for (let i = 0; i < usersNeedingFetch.length; i += 3) {
            const batch = usersNeedingFetch.slice(i, i + 3);
            await Promise.all(batch.map(async (username: string) => {
                if (!forceRefresh) {
                    // 1. Check localStorage (fast, synchronous)
                    const localCached = getCache<GitHubUserStats>(getCacheKey('stats', username));
                    if (localCached) {
                        results[username] = localCached.data;
                        setMemoryCache(username, localCached.data);
                        return;
                    }

                    // 2. Check Supabase DB cache (persists across sessions/devices)
                    try {
                        const dbCached = await getCachedData<GitHubUserStats>('stats', username);
                        if (dbCached) {
                            results[username] = dbCached;
                            // Backfill localStorage and memory for faster subsequent reads
                            setCache(getCacheKey('stats', username), dbCached, STATS_TTL);
                            setMemoryCache(username, dbCached);
                            return;
                        }
                    } catch {
                        // DB unreachable, continue to API
                    }
                }

                if (isBadCredentials) return;

                // 3. Fetch from GitHub API (deduplicated)
                try {
                    // Check if another hook instance is already fetching this user
                    let fetchPromise = inFlightFetches.get(username);
                    if (!fetchPromise) {
                        fetchPromise = fetchGitHubStats(username, pat);
                        inFlightFetches.set(username, fetchPromise);
                    }

                    const stats = await fetchPromise;
                    inFlightFetches.delete(username);

                    results[username] = stats;
                    if (stats) {
                        // Write to all cache layers
                        setMemoryCache(username, stats);
                        setCache(getCacheKey('stats', username), stats, STATS_TTL);
                        cacheData('stats', username, stats).catch(() => { });
                    }
                } catch (error: unknown) {
                    inFlightFetches.delete(username);
                    if (error instanceof Error) {
                        if (error.message === 'RATE_LIMIT') isRateLimited = true;
                        if (error.message === 'BAD_CREDENTIALS') isBadCredentials = true;
                    }
                }
            }));

            if (isBadCredentials) break;

            if (i + 3 < usersNeedingFetch.length) {
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
        clearMemoryStatsCache();
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
                clearMemoryStatsCache();
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