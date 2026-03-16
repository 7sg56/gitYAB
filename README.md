# GitYAB

**YAB -- You Ain't Better.** A rival analysis tool for GitHub developers. Compare your stats against competitors and prove who codes harder.

## Features

### Overview
- **Bento Grid Dashboard** -- stat cards displaying commits, PRs, issues, repositories, stars, and followers (past year)
- **Latest Activity** -- each card shows your most recent action with links to commits, PRs, and issues
- **Comparison Charts** -- bar charts comparing contributions (commits, PRs, issues) and reach (stars, followers, repos) against enabled rivals

### Activity
- **Event Timeline** -- chronological feed of your rivals' recent GitHub activity
- **Event Types** -- PushEvent, PullRequestEvent, IssuesEvent, IssueCommentEvent, CreateEvent, ForkEvent, WatchEvent, DeleteEvent, PullRequestReviewEvent
- **Rich Details** -- commit messages, branch names, PR/issue titles, and timestamps

### Compare
- **Sortable Table** -- rank all developers by any metric (click column headers)
- **Diff Badges** -- see exactly how you lead (+) or trail (-) each rival
- **Metric Highlights** -- highest values per metric are bolded

### Target
- **Leaderboard Rankings** -- score = commits + PRs (past year)
- **Current Target** -- identify the immediate rival to overtake
- **Gap Tracking** -- see how many commits/PRs needed to climb the ranks
- **Victory Display** -- trophy banner when you're on top of all rivals

### Other Features
- **Smart Caching** -- stats cached for 10 minutes, events for 5 minutes
- **Auto-Rescan** -- optional background refresh at configurable intervals
- **Rival Management** -- add, remove, and toggle rivals from the collapsible right panel
- **Privacy** -- all data stored locally in your browser

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Create a **Fine-grained token** (recommended) or Classic token
3. Give it a name (e.g. "gityab")
4. Set expiration to your preference
5. For fine-grained: enable read permissions for **Account information** (`read:user`)
6. For classic: select the `read:user` scope
7. Click **Generate token** and copy it

> **Warning**: Local storage is not fully secure against XSS. Use a read-only token with minimal scope.

### 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Configure

On first visit, the setup modal will ask for:

- **GitHub Username** -- your GitHub handle (e.g. `torvalds`)
- **Personal Access Token** -- the token you just created

Both are stored in your browser's `localStorage`. Nothing is sent to any server other than GitHub's API.

After setup, add rival usernames from the right panel to start comparing.

## Data & Rate Limits

- Uses the GitHub **GraphQL API** for user stats and the **REST API** for events
- With a fine-grained PAT you get up to 5,000 requests/hour
- Default 10-minute rescan interval with ~6 rivals uses ~36 stats queries + ~36 event queries per hour (well within limits)
- The auto-rescan toggle in the left sidebar enables automatic background refreshes

## Tech Stack

- [Next.js](https://nextjs.org) 16
- [React](https://react.dev) 19
- [Zustand](https://github.com/pmndrs/zustand) for state management (with persist middleware)
- [Recharts](https://recharts.org) for charts
- [Framer Motion](https://www.framer.com/motion) for animations
- [Lucide](https://lucide.dev) for icons
- [Tailwind CSS](https://tailwindcss.com) v4
- [TypeScript](https://www.typescriptlang.org)

## Build

```bash
npm run build
npm start
```
