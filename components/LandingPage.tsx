'use client';

import { motion } from 'framer-motion';
import {
    Github,
    Terminal,
    Swords,
    Trophy,
    LayoutDashboard,
    Activity,
    List,
    ArrowLeftRight,
    Crosshair,
    Network,
    KeyRound,
    UserPlus,
    BarChart3,
    Twitter,
} from 'lucide-react';

interface LandingPageProps {
    onSignIn: () => void;
    onSignUp: () => void;
}

// ========================
// Mock Contribution Graph
// ========================

// Simple seeded PRNG to avoid hydration mismatches with Math.random()
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

function MockGraph() {
    const days = Array.from({ length: 14 * 7 }).map((_, i) => {
        const intensity = seededRandom(i + 42);
        let colorClass = 'bg-[#161b22]';
        if (intensity > 0.8) colorClass = 'bg-[#39d353]';
        else if (intensity > 0.6) colorClass = 'bg-[#26a641]';
        else if (intensity > 0.4) colorClass = 'bg-[#006d32]';
        else if (intensity > 0.2) colorClass = 'bg-[#0e4429]';
        return (
            <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: seededRandom(i + 100) * 1.5, ease: 'easeOut' }}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-[2px] ${colorClass}`}
            />
        );
    });

    return (
        <div className="p-3 sm:p-4 bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl inline-block max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-[10px] sm:text-xs font-mono text-[#8b949e] truncate">rival_comparison.exe</span>
                <span className="text-[10px] sm:text-xs text-[#8b949e] shrink-0 hidden sm:inline">1,337 contributions in the last year</span>
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-[2px] sm:gap-1">{days}</div>
        </div>
    );
}

// ========================
// Navbar
// ========================

function Navbar({ onSignIn }: { onSignIn: () => void }) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Github className="w-8 h-8 text-white" />
                    <span className="font-mono font-bold text-xl tracking-tight text-white">
                        GitYab<span className="text-[#39d353]">_</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="#features" className="hidden md:block text-sm font-medium text-[#8b949e] hover:text-white transition-colors">
                        Features
                    </a>
                    <a href="#how-it-works" className="hidden md:block text-sm font-medium text-[#8b949e] hover:text-white transition-colors">
                        How it Works
                    </a>
                    <button
                        onClick={onSignIn}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-[#238636] hover:bg-[#2ea043] rounded-md border border-[rgba(240,246,252,0.1)] transition-colors shadow-sm"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </nav>
    );
}

// ========================
// Hero
// ========================

function Hero({ onSignUp }: { onSignUp: () => void }) {
    return (
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden min-h-[90vh] flex items-center">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#30363d_1px,transparent_1px),linear-gradient(to_bottom,#30363d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] mb-6">
                            <span className="w-2 h-2 rounded-full bg-[#39d353] animate-pulse" />
                            <span className="text-xs font-mono text-[#8b949e]">v2.0 is live</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-4 sm:mb-6">
                            You Ain&apos;t <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39d353] to-[#2ea043]">
                                Better.
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-[#8b949e] mb-6 sm:mb-8 max-w-xl leading-relaxed">
                            The competitive GitHub developer analytics tool. Connect your PAT,
                            add your rivals, and prove your dominance with year-over-year
                            stats, activity feeds, and 1v1 arena battles.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={onSignUp}
                                className="px-6 py-3 text-base font-bold text-white bg-[#238636] hover:bg-[#2ea043] rounded-md border border-[rgba(240,246,252,0.1)] transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Terminal className="w-5 h-5" />
                                Start Competing
                            </button>
                            <a
                                href="#features"
                                className="px-6 py-3 text-base font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md border border-[#30363d] transition-colors flex items-center gap-2"
                            >
                                View Features
                            </a>
                        </div>

                        <div className="mt-10 flex items-center gap-6 text-sm text-[#8b949e] font-mono">
                            <div className="flex items-center gap-2">
                                <Swords className="w-4 h-4 text-[#39d353]" />
                                <span>1v1 Arena</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#39d353]" />
                                <span>Leaderboards</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative hidden lg:flex lg:h-[500px] items-center justify-center"
                    >
                        {/* Glow behind graph */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#238636]/20 to-transparent blur-3xl rounded-full pointer-events-none" />

                        <div className="relative z-10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <MockGraph />

                            {/* Floating stat card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.5 }}
                                className="absolute -bottom-6 -right-6 bg-[#161b22] border border-[#30363d] p-4 rounded-lg shadow-xl flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-[#39d353]" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">You overtook</div>
                                    <div className="text-xs font-mono text-[#39d353]">@rival_dev</div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ========================
// Features
// ========================

// ========================
// Feature Card Previews
// ========================

function DashboardPreview() {
    const stats = [
        { label: 'Commits', value: 1247, max: 1500, color: '#39d353' },
        { label: 'PRs', value: 89, max: 150, color: '#58a6ff' },
        { label: 'Issues', value: 34, max: 100, color: '#d29922' },
        { label: 'Stars', value: 342, max: 500, color: '#f778ba' },
    ];
    return (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.map((s) => (
                <div key={s.label} className="bg-[#0d1117] rounded-md p-2 border border-[#21262d]">
                    <div className="text-[10px] text-[#8b949e] mb-1">{s.label}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                    <div className="mt-1.5 h-1 rounded-full bg-[#21262d] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(s.value / s.max) * 100}%`, backgroundColor: s.color }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ArenaPreview() {
    return (
        <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#39d353]/20 border border-[#39d353]/40 flex items-center justify-center text-[10px] font-bold text-[#39d353]">W</div>
                <span className="text-[9px] text-[#8b949e] mt-1">You</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-mono text-[#39d353]">5</span>
                <div className="w-12 h-[1px] bg-[#30363d]" />
                <span className="text-[10px] font-mono text-[#f85149]">2</span>
            </div>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#f85149]/20 border border-[#f85149]/40 flex items-center justify-center text-[10px] font-bold text-[#f85149]">L</div>
                <span className="text-[9px] text-[#8b949e] mt-1">Rival</span>
            </div>
        </div>
    );
}

function HeatmapPreview() {
    const rows = 3;
    const cols = 12;
    const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    return (
        <div className="mt-4 flex gap-[3px] justify-center">
            {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="flex flex-col gap-[3px]">
                    {Array.from({ length: rows }).map((_, r) => {
                        const color = colors[Math.floor(seededRandom(c * rows + r + 200) * colors.length)];
                        return <div key={r} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: color }} />;
                    })}
                </div>
            ))}
        </div>
    );
}

function ComparatorPreview() {
    const rows = [
        { name: 'you', score: 1247, leading: true },
        { name: 'rival_1', score: 1103, leading: false },
        { name: 'rival_2', score: 890, leading: false },
    ];
    return (
        <div className="mt-4 space-y-1.5">
            {rows.map((r, i) => (
                <div key={r.name} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${i === 0 ? 'bg-[#39d353]/10 border border-[#39d353]/20' : 'bg-[#0d1117]'}`}>
                    <span className={`font-mono ${i === 0 ? 'text-[#39d353]' : 'text-[#8b949e]'}`}>@{r.name}</span>
                    <span className={`font-mono font-bold ${i === 0 ? 'text-[#39d353]' : 'text-[#c9d1d9]'}`}>{r.score}</span>
                </div>
            ))}
        </div>
    );
}

function TargetPreview() {
    return (
        <div className="mt-4 flex flex-col items-center">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[#30363d]" />
                <div className="absolute inset-2 rounded-full border-2 border-[#30363d]" />
                <div className="absolute inset-4 rounded-full border-2 border-[#f85149]/50" />
                <div className="absolute inset-[26px] rounded-full bg-[#f85149]" />
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#8b949e]">
                <span className="text-[#f85149]">23 commits</span> to overtake
            </div>
        </div>
    );
}

function SocialPreview() {
    const nodes = [
        { x: 24, y: 20, size: 6, main: true },
        { x: 8, y: 10, size: 4, main: false },
        { x: 40, y: 8, size: 4, main: false },
        { x: 12, y: 32, size: 3, main: false },
        { x: 38, y: 30, size: 3, main: false },
        { x: 50, y: 18, size: 3, main: false },
    ];
    return (
        <div className="mt-4 flex justify-center">
            <svg width="60" height="40" viewBox="0 0 60 40" className="text-[#39d353]">
                {nodes.slice(1).map((n, i) => (
                    <line key={i} x1={nodes[0].x} y1={nodes[0].y} x2={n.x} y2={n.y} stroke="#30363d" strokeWidth="1" />
                ))}
                {nodes.map((n, i) => (
                    <circle key={i} cx={n.x} cy={n.y} r={n.size} fill={n.main ? '#39d353' : '#21262d'} stroke={n.main ? '#39d353' : '#30363d'} strokeWidth="1" />
                ))}
            </svg>
        </div>
    );
}

function FeedPreview() {
    const events = [
        { type: 'push', text: 'pushed 3 commits', time: '2m', color: '#39d353' },
        { type: 'pr', text: 'opened PR #42', time: '15m', color: '#58a6ff' },
        { type: 'issue', text: 'closed issue #17', time: '1h', color: '#d29922' },
    ];
    return (
        <div className="mt-4 space-y-1.5">
            {events.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-[#c9d1d9] truncate">{e.text}</span>
                    <span className="text-[#484f58] ml-auto shrink-0">{e.time}</span>
                </div>
            ))}
        </div>
    );
}

// ========================
// Features Section
// ========================

const features = [
    {
        id: 'dashboard',
        title: 'Bento Dashboard',
        description: 'At-a-glance stat cards for commits, PRs, issues, and stars. Compare yourself vs rivals instantly.',
        icon: LayoutDashboard,
        colSpan: 'md:col-span-2',
        preview: DashboardPreview,
        accent: 'from-[#39d353]/8',
    },
    {
        id: 'arena',
        title: '1v1 Arena',
        description: 'Dramatic head-to-head comparisons with radar charts and win/loss streak tracking.',
        icon: Swords,
        colSpan: 'md:col-span-1',
        preview: ArenaPreview,
        accent: 'from-[#f85149]/8',
    },
    {
        id: 'graphs',
        title: 'Heatmaps & Graphs',
        description: 'Contribution calendars and language distribution metrics.',
        icon: Activity,
        colSpan: 'md:col-span-1',
        preview: HeatmapPreview,
        accent: 'from-[#26a641]/8',
    },
    {
        id: 'compare',
        title: 'Sortable Comparator',
        description: 'Rank all users by any metric with +/- diff badges.',
        icon: ArrowLeftRight,
        colSpan: 'md:col-span-1',
        preview: ComparatorPreview,
        accent: 'from-[#58a6ff]/8',
    },
    {
        id: 'target',
        title: 'Target Tracker',
        description: 'See the exact gap to overtake your next rival.',
        icon: Crosshair,
        colSpan: 'md:col-span-1',
        preview: TargetPreview,
        accent: 'from-[#f85149]/8',
    },
    {
        id: 'social',
        title: 'Social Graph',
        description: 'Force-directed network of follower/following relationships.',
        icon: Network,
        colSpan: 'md:col-span-1',
        preview: SocialPreview,
        accent: 'from-[#bc8cff]/8',
    },
    {
        id: 'feed',
        title: 'Activity Feed',
        description: "Live timeline of your rivals' pushes, PRs, and issues.",
        icon: List,
        colSpan: 'md:col-span-2',
        preview: FeedPreview,
        accent: 'from-[#d29922]/8',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function Features() {
    return (
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0d1117] border-t border-[#30363d]">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Seven ways to <span className="text-[#39d353]">assert dominance.</span>
                    </h2>
                    <p className="text-[#8b949e] text-lg max-w-2xl">
                        GitYab pulls year-over-year stats via GitHub GraphQL and REST APIs,
                        visualizing the data across multiple competitive views.
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        const Preview = feature.preview;
                        return (
                            <motion.div
                                key={feature.id}
                                variants={itemVariants}
                                className={`group relative rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#39d353]/40 transition-all duration-300 overflow-hidden ${feature.colSpan}`}
                            >
                                {/* Accent gradient on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                <div className="relative z-10 p-5">
                                    <div className="flex items-start gap-3 mb-1">
                                        <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#21262d] flex items-center justify-center shrink-0 group-hover:border-[#39d353]/40 group-hover:text-[#39d353] transition-colors text-[#8b949e]">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white font-mono leading-tight">{feature.title}</h3>
                                            <p className="text-[#8b949e] text-xs leading-relaxed mt-1">{feature.description}</p>
                                        </div>
                                    </div>
                                    <Preview />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

// ========================
// How It Works
// ========================

const steps = [
    {
        number: '01',
        title: 'Secure Auth',
        description: 'Sign in and provide a read-only GitHub PAT. It is AES-256-GCM encrypted server-side. We never store it in plain text.',
        icon: KeyRound,
    },
    {
        number: '02',
        title: 'Add Rivals',
        description: 'Input the GitHub usernames of your friends, coworkers, or that one guy who thinks he codes faster than you.',
        icon: UserPlus,
    },
    {
        number: '03',
        title: 'Analyze & Destroy',
        description: 'Our 3-tier caching system pulls their stats. Watch the dashboard update and see exactly where you stand.',
        icon: BarChart3,
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#161b22] border-t border-[#30363d]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
                    <p className="text-[#8b949e] text-lg max-w-2xl mx-auto font-mono text-sm">
                        Setup takes less than 2 minutes
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#30363d] to-transparent" />

                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="relative z-10 flex flex-col items-center text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-[#0d1117] border-[4px] border-[#161b22] shadow-[0_0_0_1px_#30363d] flex items-center justify-center mb-6 relative group">
                                    <div className="absolute inset-0 rounded-full bg-[#39d353]/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
                                    <Icon className="w-8 h-8 text-[#c9d1d9] group-hover:text-[#39d353] transition-colors relative z-10" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#238636] text-white text-xs font-bold font-mono flex items-center justify-center border-2 border-[#161b22]">
                                        {step.number}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-[#8b949e] text-sm leading-relaxed max-w-[250px]">{step.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ========================
// CTA Section
// ========================

function CtaSection({ onSignUp }: { onSignUp: () => void }) {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <div className="w-[800px] h-[800px] rounded-full border-[40px] border-[#39d353] blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Ready to prove <span className="text-[#39d353]">you&apos;re better?</span>
                    </h2>
                    <p className="text-xl text-[#8b949e] mb-10 max-w-2xl mx-auto">
                        Stop guessing who the 10x developer is. Connect your GitHub account,
                        add your rivals, and let the data speak for itself.
                    </p>

                    <button
                        onClick={onSignUp}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-[#238636] hover:bg-[#2ea043] rounded-md border border-[rgba(240,246,252,0.1)] transition-all shadow-[0_0_20px_rgba(35,134,54,0.3)] hover:shadow-[0_0_30px_rgba(46,160,67,0.5)] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Github className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Sign Up Free</span>
                    </button>

                    <p className="mt-6 text-sm text-[#8b949e] font-mono">
                        $ npm install domination --global
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

// ========================
// Footer
// ========================

function FooterSection() {
    return (
        <footer className="border-t border-[#30363d] bg-[#0d1117] py-12">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <Github className="w-6 h-6 text-[#8b949e]" />
                    <span className="font-mono font-bold text-lg text-[#8b949e]">GitYab</span>
                </div>
                <p className="text-[#8b949e] text-sm text-center md:text-left">
                    &copy; {new Date().getFullYear()} GitYab. &quot;You Ain&apos;t Better.&quot; Not affiliated with GitHub, Inc.
                </p>
                <div className="flex items-center gap-4">
                    <a href="#" className="text-[#8b949e] hover:text-white transition-colors">
                        <Twitter className="w-5 h-5" />
                    </a>
                    <a href="https://github.com/7sg56/gitYAB" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors">
                        <Github className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
}

// ========================
// Main Landing Page
// ========================

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#39d353]/30 selection:text-white">
            <Navbar onSignIn={onSignIn} />
            <main>
                <Hero onSignUp={onSignUp} />
                <Features />
                <HowItWorks />
                <CtaSection onSignUp={onSignUp} />
            </main>
            <FooterSection />
        </div>
    );
}
