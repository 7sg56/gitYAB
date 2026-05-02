'use client';

import { useGitStore } from '@/store/useGitStore';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useMemo, useState } from 'react';
import { Zap, ChevronDown, Trophy, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

const BATTLE_METRICS = [
    { key: 'totalCommitsYear', label: 'Commits', short: 'Commits' },
    { key: 'totalPRsYear', label: 'Pull Requests', short: 'PRs' },
    { key: 'totalIssuesYear', label: 'Issues', short: 'Issues' },
    { key: 'totalStars', label: 'Stars', short: 'Stars' },
    { key: 'followers', label: 'Followers', short: 'Followers' },
    { key: 'totalRepos', label: 'Repositories', short: 'Repos' },
] as const;

type MetricKey = typeof BATTLE_METRICS[number]['key'];

export function Arena() {
    const { mainUser, rivals, enabledRivals } = useGitStore();
    const activeRivals = useMemo(
        () => rivals.filter((r) => enabledRivals[r] !== false),
        [rivals, enabledRivals]
    );
    const allUsers = useMemo(
        () => [mainUser, ...activeRivals].filter(Boolean),
        [mainUser, activeRivals]
    );
    const { data, loading } = useGitHubStats(allUsers);
    const [selectedRival, setSelectedRival] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const rival = selectedRival || activeRivals[0] || null;
    const myStats = data[mainUser];
    const rivalStats = rival ? data[rival] : null;

    // Normalize stats for radar chart (0-100 scale)
    const radarData = useMemo(() => {
        if (!myStats || !rivalStats) return [];
        return BATTLE_METRICS.map((m) => {
            const myVal = (myStats[m.key as keyof typeof myStats] as number) || 0;
            const rivalVal = (rivalStats[m.key as keyof typeof rivalStats] as number) || 0;
            const max = Math.max(myVal, rivalVal, 1);
            return {
                metric: m.short,
                you: Math.round((myVal / max) * 100),
                rival: Math.round((rivalVal / max) * 100),
                youRaw: myVal,
                rivalRaw: rivalVal,
            };
        });
    }, [myStats, rivalStats]);

    // Battle results per metric
    const battleResults = useMemo(() => {
        if (!myStats || !rivalStats) return [];
        return BATTLE_METRICS.map((m) => {
            const myVal = (myStats[m.key as keyof typeof myStats] as number) || 0;
            const rivalVal = (rivalStats[m.key as keyof typeof rivalStats] as number) || 0;
            const total = Math.max(myVal + rivalVal, 1);
            return {
                ...m,
                myVal,
                rivalVal,
                myPct: Math.round((myVal / total) * 100),
                rivalPct: Math.round((rivalVal / total) * 100),
                winner: myVal > rivalVal ? 'you' : rivalVal > myVal ? 'rival' : 'tie',
            };
        });
    }, [myStats, rivalStats]);

    const wins = battleResults.filter((r) => r.winner === 'you').length;
    const losses = battleResults.filter((r) => r.winner === 'rival').length;
    const ties = battleResults.filter((r) => r.winner === 'tie').length;

    const overallVerdict = wins > losses ? 'you' : losses > wins ? 'rival' : 'tie';

    if (activeRivals.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <Zap size={32} className="opacity-30" />
                <p className="text-sm">Enable rivals to enter the arena.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-6">
            {/* Header with Rival Picker */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Zap className="text-amber-400" /> Arena
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Head-to-head battle. Pick your opponent.
                    </p>
                </div>
                {/* Rival selector */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-accent transition-colors min-w-[180px]"
                    >
                        {rival && data[rival] ? (
                            <>
                                <Image
                                    src={data[rival]!.avatarUrl}
                                    alt={rival}
                                    width={20}
                                    height={20}
                                    className="rounded-full"
                                    unoptimized
                                />
                                <span className="text-foreground truncate flex-1 text-left">{rival}</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground flex-1 text-left">Select rival...</span>
                        )}
                        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                    </button>
                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {activeRivals.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            setSelectedRival(r);
                                            setDropdownOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                                            r === rival && "bg-accent/50"
                                        )}
                                    >
                                        {data[r]?.avatarUrl ? (
                                            <Image src={data[r]!.avatarUrl} alt={r} width={20} height={20} className="rounded-full" unoptimized />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-accent" />
                                        )}
                                        <span className="text-foreground truncate">{r}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* VS Banner */}
            {myStats && rivalStats && rival ? (
                <>
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-6 md:p-8">
                        {/* Background decorative gradients */}
                        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -ml-24 -mt-24" />
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-24 -mt-24" />

                        <div className="relative z-10 flex items-center justify-between gap-4">
                            {/* You */}
                            <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                <div className="relative">
                                    <Image
                                        src={myStats.avatarUrl}
                                        alt={mainUser}
                                        width={80}
                                        height={80}
                                        className={cn(
                                            "w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 object-cover",
                                            overallVerdict === 'you'
                                                ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                                                : 'border-border/50'
                                        )}
                                        unoptimized
                                    />
                                    {overallVerdict === 'you' && (
                                        <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1">
                                            <Trophy size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-foreground mt-3 truncate max-w-full">{myStats.name}</p>
                                <p className="text-[11px] text-primary">@{myStats.login}</p>
                            </div>

                            {/* VS */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center">
                                    <span className="text-lg md:text-xl font-black text-amber-400 tracking-tighter">VS</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-xs font-bold text-emerald-400">{wins}W</span>
                                    <span className="text-xs text-muted-foreground">-</span>
                                    <span className="text-xs font-bold text-rose-400">{losses}L</span>
                                    {ties > 0 && (
                                        <>
                                            <span className="text-xs text-muted-foreground">-</span>
                                            <span className="text-xs font-bold text-muted-foreground">{ties}T</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Rival */}
                            <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                <div className="relative">
                                    <Image
                                        src={rivalStats.avatarUrl}
                                        alt={rival}
                                        width={80}
                                        height={80}
                                        className={cn(
                                            "w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 object-cover",
                                            overallVerdict === 'rival'
                                                ? 'border-rose-500 ring-4 ring-rose-500/20'
                                                : 'border-border/50'
                                        )}
                                        unoptimized
                                    />
                                    {overallVerdict === 'rival' && (
                                        <div className="absolute -top-2 -right-2 bg-rose-500 rounded-full p-1">
                                            <Trophy size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-foreground mt-3 truncate max-w-full">{rivalStats.name}</p>
                                <p className="text-[11px] text-rose-400">@{rivalStats.login}</p>
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="glass-card rounded-xl p-5 flex flex-col items-center">
                        <h3 className="text-sm font-medium text-foreground mb-2 self-start">Skill Overlay</h3>
                        <div className="w-full max-w-[400px] aspect-square">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                    <PolarGrid stroke="#30363d" strokeDasharray="3 3" />
                                    <PolarAngleAxis
                                        dataKey="metric"
                                        tick={{ fill: '#8b949e', fontSize: 12 }}
                                    />
                                    <Radar
                                        name="You"
                                        dataKey="you"
                                        stroke="#58a6ff"
                                        fill="#58a6ff"
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                    <Radar
                                        name={rival}
                                        dataKey="rival"
                                        stroke="#f43f5e"
                                        fill="#f43f5e"
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(222, 22%, 10%)',
                                            border: '1px solid #30363d',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value, name, props) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const payload = (props as any)?.payload;
                                            const raw = name === 'You' ? payload?.youRaw : payload?.rivalRaw;
                                            return [`${(raw ?? value)?.toLocaleString()}`, name as string];
                                        }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-primary rounded" />
                                <span className="text-xs text-muted-foreground">You</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-rose-500 rounded" />
                                <span className="text-xs text-muted-foreground">{rival}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat-by-Stat Comparison Bars */}
                    <div className="glass-card rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Category Breakdown</h3>

                        <div className="space-y-5">
                            {battleResults.map((result) => (
                                <div key={result.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn(
                                            "font-medium tabular-nums",
                                            result.winner === 'you' ? 'text-emerald-400' : 'text-foreground/70'
                                        )}>
                                            {result.myVal.toLocaleString()}
                                        </span>
                                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                            {result.winner === 'tie' && <Minus size={10} />}
                                            {result.label}
                                            {result.winner === 'you' && <span className="text-emerald-400 text-[10px]">W</span>}
                                            {result.winner === 'rival' && <span className="text-rose-400 text-[10px]">L</span>}
                                        </span>
                                        <span className={cn(
                                            "font-medium tabular-nums",
                                            result.winner === 'rival' ? 'text-rose-400' : 'text-foreground/70'
                                        )}>
                                            {result.rivalVal.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex h-2 rounded-full overflow-hidden bg-accent/50 gap-[2px]">
                                        <div
                                            className={cn(
                                                "h-full rounded-l-full transition-all duration-500",
                                                result.winner === 'you' ? 'bg-emerald-500' : 'bg-primary/50'
                                            )}
                                            style={{ width: `${result.myPct}%` }}
                                        />
                                        <div
                                            className={cn(
                                                "h-full rounded-r-full transition-all duration-500",
                                                result.winner === 'rival' ? 'bg-rose-500' : 'bg-rose-500/30'
                                            )}
                                            style={{ width: `${result.rivalPct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Verdict */}
                    <div className={cn(
                        "rounded-xl border p-5 text-center",
                        overallVerdict === 'you'
                            ? "bg-emerald-500/5 border-emerald-500/30"
                            : overallVerdict === 'rival'
                                ? "bg-rose-500/5 border-rose-500/30"
                                : "bg-card border-border"
                    )}>
                        <p className="text-sm font-bold text-foreground">
                            {overallVerdict === 'you'
                                ? `You dominate ${rivalStats.name} -- ${wins} to ${losses}`
                                : overallVerdict === 'rival'
                                    ? `${rivalStats.name} leads -- ${losses} to ${wins}`
                                    : `Dead even with ${rivalStats.name} -- ${wins} to ${losses}`
                            }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {BATTLE_METRICS.length} categories
                        </p>
                    </div>
                </>
            ) : loading ? (
                <div className="space-y-4">
                    <div className="h-40 bg-card/40 border border-border/60 rounded-2xl animate-pulse" />
                    <div className="h-80 bg-card/40 border border-border/60 rounded-xl animate-pulse" />
                </div>
            ) : (
                <div className="border border-border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">Select a rival to start the battle.</p>
                </div>
            )}
        </div>
    );
}
