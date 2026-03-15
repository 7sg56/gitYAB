export interface GitHubUserStats {
    login: string;
    avatarUrl: string;
    name: string;
    followers: number;
    totalCommitsYear: number;
    totalIssuesYear: number;
    totalPRsYear: number;
    totalStars: number;
    totalRepos: number;
}

export interface GitHubEvent {
    id: string;
    type: string;
    actor: {
        login: string;
        avatar_url: string;
    };
    repo: {
        name: string;
        url: string;
    };
    payload: Record<string, unknown>;
    created_at: string;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const STATS_QUERY = `
  query userInfo($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      followers {
        totalCount
      }
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazers {
            totalCount
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        restrictedContributionsCount
      }
    }
  }
`;

export async function fetchGitHubStats(username: string, pat: string): Promise<GitHubUserStats | null> {
    try {
        const res = await fetch(GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${pat}`,
            },
            body: JSON.stringify({
                query: STATS_QUERY,
                variables: { login: username },
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`GitHub API HTTP error for ${username}:`, res.status, body);
            if (res.status === 401) {
                throw new Error('BAD_CREDENTIALS');
            }
            if (res.status === 403 || res.status === 429 || body.toLowerCase().includes('rate limit')) {
                throw new Error('RATE_LIMIT');
            }
            return null;
        }

        const json = await res.json();

        if (json.errors) {
            console.error(`GraphQL Errors for ${username}:`, JSON.stringify(json.errors, null, 2));
            if (json.errors[0]?.type === 'RATE_LIMITED' || json.errors.some((e: Record<string, unknown>) => typeof e.message === 'string' && e.message.toLowerCase().includes('rate limit'))) {
                throw new Error('RATE_LIMIT');
            }
            // If we have data despite errors (partial success), we can continue, 
            // but usually a "User not found" error makes the user object null.
            if (!json.data?.user) return null;
        }

        const user = json.data?.user;
        if (!user) {
            console.warn(`No user data found for "${username}". It might be an organization or an invalid username.`);
            return null;
        }

        const totalStars = user.repositories?.nodes?.reduce(
            (acc: number, repo: Record<string, unknown>) => {
                const stargazers = repo?.stargazers as Record<string, unknown> | undefined;
                return acc + (typeof stargazers?.totalCount === 'number' ? stargazers.totalCount : 0);
            },
            0
        ) || 0;

        return {
            login: user.login,
            avatarUrl: user.avatarUrl,
            name: user.name || user.login,
            followers: user.followers?.totalCount || 0,
            totalRepos: user.repositories?.totalCount || 0,
            totalStars,
            totalCommitsYear: (user.contributionsCollection?.totalCommitContributions || 0) + (user.contributionsCollection?.restrictedContributionsCount || 0),
            totalIssuesYear: user.contributionsCollection?.totalIssueContributions || 0,
            totalPRsYear: user.contributionsCollection?.totalPullRequestContributions || 0,
        };
    } catch (error: unknown) {
        if (error instanceof Error && (error.message === 'RATE_LIMIT' || error.message === 'BAD_CREDENTIALS')) throw error;
        console.error(`Exception fetching stats for ${username}:`, error);
        return null;
    }
}

export async function fetchGitHubEvents(username: string, pat: string): Promise<GitHubEvent[]> {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/events`, {
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!res.ok) {
            const body = await res.text();
            console.error(`GitHub API error fetching events for ${username}`, body);
            if (res.status === 401) {
                throw new Error('BAD_CREDENTIALS');
            }
            if (res.status === 403 || res.status === 429 || body.toLowerCase().includes('rate limit')) {
                throw new Error('RATE_LIMIT');
            }
            return [];
        }
        return await res.json();
    } catch (error: unknown) {
        if (error instanceof Error && (error.message === 'RATE_LIMIT' || error.message === 'BAD_CREDENTIALS')) throw error;
        console.error('Error fetching git events:', error);
        return [];
    }
}
