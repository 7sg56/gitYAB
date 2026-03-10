import { useState, useEffect } from 'react';
import { fetchGitHubEvents, GitHubEvent } from '@/lib/github';
import { useGitStore } from '@/store/useGitStore';

export function useGitHubEvents(usernames: string[]) {
    const { pat } = useGitStore();
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pat || usernames.length === 0) {
            setEvents([]);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchData = async () => {
            const promises = usernames.map((username) => fetchGitHubEvents(username, pat));
            const results = await Promise.all(promises);

            if (isMounted) {
                // Flatten and sort by date descending
                const allEvents = results.flat().sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setEvents(allEvents);
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [usernames.join(','), pat]);

    return { events, loading };
}
