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
    payload: any;
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
            console.error(`GitHub API HTTP error for ${username}:`, res.status, await res.text());
            return null;
        }

        const json = await res.json();

        if (json.errors) {
            console.error(`GraphQL Errors for ${username}:`, JSON.stringify(json.errors, null, 2));
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
            (acc: number, repo: any) => acc + (repo?.stargazers?.totalCount || 0),
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
    } catch (error) {
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
            console.error(`GitHub API error fetching events for ${username}`, await res.text());
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching git events:', error);
        return [];
    }
}
