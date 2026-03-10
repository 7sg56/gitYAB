# GitYAB

**YAB -- You Ain't Better.** A rival analysis tool for GitHub developers. Compare your stats against competitors and prove who codes harder.

## Features

- **Dashboard** -- stat cards and comparison bar charts for your key GitHub metrics
- **Activity Feed** -- timeline of your rivals' recent GitHub events (commits, PRs, issues, stars) with commit messages, branch names, and PR titles
- **Compare** -- sortable table ranking all developers by any metric, with diff badges showing where you lead or trail
- **Leaderboard** -- ranked view showing defeated rivals, your current target, and the gap to overtake them
- **Caching** -- stats cached locally for 10 minutes, events for 5 minutes. Manual rescan and auto-rescan toggle available
- **Rival Toggles** -- show/hide individual rivals from all charts and views via the right panel

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Select **Classic** token
3. Give it a name (e.g. "gityab")
4. Set expiration to your preference
5. Select the `read:user` scope (minimum required)
6. Optionally select `repo` if you want private repo data included
7. Click **Generate token** and copy it

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
- With a PAT you get 5,000 requests/hour for each API
- Default 10-minute rescan interval with ~6 rivals uses roughly 36 stats queries + 36 event queries per hour (well within limits)
- The auto-rescan toggle in the left sidebar enables automatic background refreshes

## Tech Stack

- [Next.js](https://nextjs.org) 16
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Recharts](https://recharts.org) for charts
- [Lucide](https://lucide.dev) for icons
- [Tailwind CSS](https://tailwindcss.com) v4

## Build

```bash
npm run build
npm start
```
