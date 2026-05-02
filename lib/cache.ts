export interface CachedEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

const CACHE_PREFIX = 'gityab_cache_';

export function getCacheKey(namespace: string, id: string): string {
    return `${CACHE_PREFIX}${namespace}_${id}`;
}

export function getCache<T>(key: string): CachedEntry<T> | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const entry: CachedEntry<T> = JSON.parse(raw);
        if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(key);
            return null;
        }
        return entry;
    } catch {
        return null;
    }
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
    const entry: CachedEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
    };
    try {
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage full or unavailable -- try evicting stale entries
        try {
            pruneExpiredCache();
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            // Still full, give up silently
        }
    }
}

export function clearCache(namespace?: string): void {
    const prefix = namespace ? `${CACHE_PREFIX}${namespace}_` : CACHE_PREFIX;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function getCacheTimestamp(key: string): number | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        return entry.timestamp || null;
    } catch {
        return null;
    }
}

/**
 * Remove all expired cache entries to free up localStorage space
 */
function pruneExpiredCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const entry = JSON.parse(raw);
                    if (entry.expiresAt && now > entry.expiresAt) {
                        keysToRemove.push(key);
                    }
                }
            } catch {
                keysToRemove.push(key);
            }
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Default TTLs -- kept generous to avoid refetches on navigation
export const STATS_TTL = 30 * 60 * 1000;  // 30 minutes (was 10m -- too aggressive for page switches)
export const EVENTS_TTL = 10 * 60 * 1000; // 10 minutes (was 5m)
