export interface ContributionDay {
    contributionCount: number;
    date: string;
    weekday: number;
    color: string;
}

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
    totalContributions: number;
    weeks: ContributionWeek[];
}

export interface LanguageBreakdown {
    name: string;
    color: string;
    count: number;
}

export interface GitHubUserStats {
    login: string;
    avatarUrl: string;
    name: string;
    followers: number;
    following: number;
    totalCommitsYear: number;
    totalIssuesYear: number;
    totalPRsYear: number;
    totalStars: number;
    totalRepos: number;
    topLanguage?: { name: string; color: string } | null;
    latestLanguage?: { name: string; color: string; repoName?: string } | null;
    languageDistribution?: LanguageBreakdown[];
    contributionCalendar?: ContributionCalendar | null;
    bio?: string | null;
    company?: string | null;
    location?: string | null;
    websiteUrl?: string | null;
    twitterUsername?: string | null;
    createdAt?: string | null;
    status?: { emoji?: string | null; message?: string | null } | null;
    latestIssues?: Array<{
        title: string;
        url: string;
        number: number;
        state: string;
        createdAt: string;
        repository: { name: string };
    }>;
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
      bio
      company
      location
      websiteUrl
      twitterUsername
      createdAt
      status {
        emoji
        message
      }
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
        totalCount
        nodes {
          name
          updatedAt
          stargazers {
            totalCount
          }
          primaryLanguage {
            name
            color
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
              color
            }
          }
        }
      }
      issues(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          title
          url
          number
          state
          createdAt
          repository {
            name
          }
        }
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

        const json = await res.json() as {
            data?: {
                user?: {
                    name: string | null;
                    login: string;
                    avatarUrl: string;
                    bio?: string | null;
                    company?: string | null;
                    location?: string | null;
                    websiteUrl?: string | null;
                    twitterUsername?: string | null;
                    createdAt?: string | null;
                    status?: { emoji?: string | null; message?: string | null } | null;
                    followers: { totalCount: number };
                    following: { totalCount: number };
                    repositories: {
                        totalCount: number;
                        nodes: Array<{
                            name: string;
                            updatedAt: string;
                            stargazers: { totalCount: number };
                            primaryLanguage?: { name: string; color: string } | null;
                        }>;
                    };
                    contributionsCollection: {
                        totalCommitContributions: number;
                        totalIssueContributions: number;
                        totalPullRequestContributions: number;
                        restrictedContributionsCount: number;
                        contributionCalendar?: {
                            totalContributions: number;
                            weeks: Array<{
                                contributionDays: Array<{
                                    contributionCount: number;
                                    date: string;
                                    weekday: number;
                                    color: string;
                                }>;
                            }>;
                        };
                    };
                    issues: {
                        nodes: Array<{
                            title: string;
                            url: string;
                            number: number;
                            state: string;
                            createdAt: string;
                            repository: { name: string };
                        }>;
                    };
                } | null;
            };
            errors?: Array<{ type?: string; message?: string }>;
        };

        if (json.errors) {
            console.error(`GraphQL Errors for ${username}:`, JSON.stringify(json.errors, null, 2));
            if (json.errors[0]?.type === 'RATE_LIMITED' || json.errors.some((e: { message?: string }) => typeof e.message === 'string' && e.message.toLowerCase().includes('rate limit'))) {
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
            (acc: number, repo: { stargazers: { totalCount: number } }) => {
                return acc + repo.stargazers.totalCount;
            },
            0
        ) || 0;

        const languages: Record<string, { count: number; color: string }> = {};
        user.repositories?.nodes?.forEach((repo: { primaryLanguage?: { name: string; color: string } | null }) => {
            if (repo.primaryLanguage) {
                const lang = repo.primaryLanguage.name;
                if (!languages[lang]) {
                    languages[lang] = { count: 0, color: repo.primaryLanguage.color };
                }
                languages[lang].count++;
            }
        });

        // Latest language: from the most recently updated repo that has a language
        // Repos are already ordered by PUSHED_AT DESC from the query
        const latestRepo = user.repositories?.nodes?.find(
            (repo: { primaryLanguage?: { name: string; color: string } | null }) => repo.primaryLanguage
        );
        const latestLanguage = latestRepo?.primaryLanguage
            ? { name: latestRepo.primaryLanguage.name, color: latestRepo.primaryLanguage.color, repoName: latestRepo.name }
            : null;

        let topLanguage: { name: string; color: string } | null = null;
        let maxCount = 0;
        for (const [name, data] of Object.entries(languages)) {
            if (data.count > maxCount) {
                maxCount = data.count;
                topLanguage = { name, color: data.color };
            }
        }

        // Build language distribution array sorted by count
        const languageDistribution: LanguageBreakdown[] = Object.entries(languages)
            .map(([name, data]) => ({ name, color: data.color, count: data.count }))
            .sort((a, b) => b.count - a.count);

        // Extract contribution calendar
        const rawCalendar = user.contributionsCollection?.contributionCalendar;
        const contributionCalendar: ContributionCalendar | null = rawCalendar ? {
            totalContributions: rawCalendar.totalContributions ?? 0,
            weeks: (rawCalendar.weeks ?? []).map((w: { contributionDays: ContributionDay[] }) => ({
                contributionDays: (w.contributionDays ?? []).map((d: ContributionDay) => ({
                    contributionCount: d.contributionCount ?? 0,
                    date: d.date ?? '',
                    weekday: d.weekday ?? 0,
                    color: d.color ?? '#161b22',
                })),
            })),
        } : null;

        return {
            login: user.login,
            avatarUrl: user.avatarUrl,
            name: user.name || user.login,
            followers: user.followers?.totalCount || 0,
            following: user.following?.totalCount || 0,
            totalRepos: user.repositories?.totalCount || 0,
            totalStars,
            totalCommitsYear: (user.contributionsCollection?.totalCommitContributions || 0) + (user.contributionsCollection?.restrictedContributionsCount || 0),
            totalIssuesYear: user.contributionsCollection?.totalIssueContributions || 0,
            totalPRsYear: user.contributionsCollection?.totalPullRequestContributions || 0,
            topLanguage,
            latestLanguage,
            languageDistribution,
            contributionCalendar,
            bio: user.bio,
            company: user.company,
            location: user.location,
            websiteUrl: user.websiteUrl,
            twitterUsername: user.twitterUsername,
            createdAt: user.createdAt,
            status: user.status,
            latestIssues: user.issues?.nodes || [],
        };
    } catch (error: unknown) {
        if (error instanceof Error && (error.message === 'RATE_LIMIT' || error.message === 'BAD_CREDENTIALS')) throw error;
        console.error(`Exception fetching stats for ${username}:`, error);
        return null;
    }
}

export async function fetchGitHubEvents(username: string, pat: string, page: number = 1): Promise<GitHubEvent[]> {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/events?page=${page}&per_page=30`, {
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
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data;
    } catch (error: unknown) {
        if (error instanceof Error && (error.message === 'RATE_LIMIT' || error.message === 'BAD_CREDENTIALS')) throw error;
        console.error('Error fetching git events:', error);
        return [];
    }
}

const CONNECTIONS_QUERY = `
  query userConnections($login: String!) {
    user(login: $login) {
      followers(first: 100) {
        nodes {
          login
          avatarUrl
          name
        }
      }
      following(first: 100) {
        nodes {
          login
          avatarUrl
          name
        }
      }
    }
  }
`;

export interface GitHubConnection {
    login: string;
    avatarUrl: string;
    name: string | null;
}

export interface UserConnections {
    followers: GitHubConnection[];
    following: GitHubConnection[];
}

export async function fetchUserConnections(username: string, pat: string): Promise<UserConnections | null> {
    try {
        const res = await fetch(GITHUB_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${pat}`,
            },
            body: JSON.stringify({
                query: CONNECTIONS_QUERY,
                variables: { login: username },
            }),
        });

        if (!res.ok) {
            console.error(`GitHub API HTTP error fetching connections for ${username}:`, res.status);
            return null;
        }

        const json = await res.json() as {
            data?: {
                user?: {
                    followers?: { nodes: GitHubConnection[] };
                    following?: { nodes: GitHubConnection[] };
                } | null;
            };
            errors?: Array<unknown>;
        };

        if (json.errors) {
            console.error(`GraphQL Errors fetching connections for ${username}:`, json.errors);
            return null;
        }

        const user = json.data?.user;
        if (!user) return null;

        return {
            followers: user.followers?.nodes || [],
            following: user.following?.nodes || [],
        };
    } catch (error) {
        console.error(`Exception fetching connections for ${username}:`, error);
        return null;
    }
}
