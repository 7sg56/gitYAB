import { useState, useEffect } from 'react';
import { fetchGitHubStats, GitHubUserStats } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';

export function useGitHubStats(usernames: string[]) {
    const { pat } = useGitStore();
    const [data, setData] = useState<Record<string, GitHubUserStats | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pat || usernames.length === 0) return;

        let isMounted = true;
        setLoading(true);

        const fetchData = async () => {
            const results: Record<string, GitHubUserStats | null> = {};

            const promises = usernames.map(async (username) => {
                // Simple memory cache per session
                if (data[username]) {
                    results[username] = data[username];
                    return;
                }

                const stats = await fetchGitHubStats(username, pat);
                results[username] = stats;
            });

            await Promise.all(promises);

            if (isMounted) {
                setData((prev) => ({ ...prev, ...results }));
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [usernames.join(','), pat]);

    return { data, loading };
}
