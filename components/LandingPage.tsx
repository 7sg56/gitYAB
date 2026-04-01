'use client';

import { Github, BarChart3, Activity, Target, GitCompare, ArrowRight, Zap, Shield, TrendingUp, Trophy } from 'lucide-react';

interface LandingPageProps {
    onSignIn: () => void;
    onSignUp: () => void;
}

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-y-auto custom-scrollbar">
            {/* Nav */}
            <nav className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Github size={20} className="text-primary" />
                        <span className="text-sm font-bold tracking-tight">
                            <span className="text-foreground">Git</span>
                            <span className="text-primary">YAB</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSignIn}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={onSignUp}
                            className="text-xs font-medium bg-success hover:bg-success/90 text-white px-4 py-1.5 rounded-md transition-colors"
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-28 pb-24 px-6 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/[0.07] rounded-full blur-[150px]" />
                    <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-success/[0.04] rounded-full blur-[120px]" />
                    <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-warning/[0.03] rounded-full blur-[100px]" />
                </div>

                <div className="max-w-3xl mx-auto text-center relative">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/80 border border-border text-xs text-muted-foreground mb-8 backdrop-blur-sm">
                        <TrendingUp size={12} className="text-success" />
                        Competitive GitHub analytics
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
                        <span className="text-foreground">Git</span>
                        <span className="text-primary">YAB</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground font-semibold mb-3 tracking-wide">
                        Git You Ain&apos;t Better.
                    </p>

                    <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto mb-10 leading-relaxed">
                        Track your GitHub stats against rivals. Compare commits, PRs, issues, stars,
                        and more. See who really codes harder -- and prove them wrong.
                    </p>

                    <div className="flex items-center justify-center gap-3 mb-16">
                        <button
                            onClick={onSignUp}
                            className="group flex items-center gap-2 bg-success hover:bg-success/90 text-white text-sm font-medium px-7 py-2.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(63,185,80,0.3)]"
                        >
                            Get started free
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={onSignIn}
                            className="flex items-center gap-2 bg-card hover:bg-accent text-foreground text-sm font-medium px-7 py-2.5 rounded-lg border border-border transition-colors"
                        >
                            Sign in
                        </button>
                    </div>

                    {/* Mock stats preview */}
                    <div className="max-w-2xl mx-auto grid grid-cols-4 gap-3">
                        <StatPreview label="Commits" value="1,247" color="text-success" />
                        <StatPreview label="PRs" value="89" color="text-primary" />
                        <StatPreview label="Stars" value="342" color="text-warning" />
                        <StatPreview label="Rivals" value="5" color="text-danger" />
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-4xl mx-auto px-6">
                <div className="border-t border-border/50" />
            </div>

            {/* Features */}
            <section className="px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs text-primary font-medium uppercase tracking-[0.2em] mb-2">Features</p>
                        <h2 className="text-xl font-bold text-foreground">Everything you need to dominate</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureCard
                            icon={<BarChart3 size={20} />}
                            title="Dashboard"
                            description="Bento grid overview with commits, PRs, issues, repos, stars, and followers. Each card links to your latest activity."
                            accent="bg-primary/10 text-primary"
                        />
                        <FeatureCard
                            icon={<Activity size={20} />}
                            title="Activity Feed"
                            description="Chronological timeline of your rivals' GitHub events. Pushes, PRs, issues, forks, reviews -- all in real time."
                            accent="bg-success/10 text-success"
                        />
                        <FeatureCard
                            icon={<GitCompare size={20} />}
                            title="Comparator"
                            description="Sortable table ranking every developer by any metric. See exactly how you lead or trail each rival with diff badges."
                            accent="bg-warning/10 text-warning"
                        />
                        <FeatureCard
                            icon={<Target size={20} />}
                            title="Target Rival"
                            description="Identify the immediate rival to overtake. Track the commit and PR gap needed to climb to the top."
                            accent="bg-danger/10 text-danger"
                        />
                    </div>
                </div>
            </section>

            {/* Trust bar */}
            <section className="px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard
                            icon={<Zap size={16} className="text-warning" />}
                            title="Smart Caching"
                            description="Stats cached 10 min, events 5 min. Auto-rescan at custom intervals."
                        />
                        <InfoCard
                            icon={<Shield size={16} className="text-success" />}
                            title="Encrypted & Secure"
                            description="PAT encrypted client-side before storage. Only read-only GitHub access."
                        />
                        <InfoCard
                            icon={<Trophy size={16} className="text-primary" />}
                            title="Leaderboard"
                            description="Score-based rankings. Victory banners when you reach the top."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 pb-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-card border border-border rounded-xl p-10">
                        <h3 className="text-lg font-bold text-foreground mb-2">Ready to prove yourself?</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Set up in under a minute. Just your GitHub username and a read-only token.
                        </p>
                        <button
                            onClick={onSignUp}
                            className="group inline-flex items-center gap-2 bg-success hover:bg-success/90 text-white text-sm font-medium px-8 py-2.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(63,185,80,0.3)]"
                        >
                            Create your account
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-6 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Github size={14} className="text-primary" />
                        <span className="font-medium">
                            <span className="text-foreground">Git</span>
                            <span className="text-primary">YAB</span>
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/50">
                        Built with Next.js, Zustand &amp; GitHub API
                    </p>
                </div>
            </footer>
        </div>
    );
}

function StatPreview({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-card/80 border border-border/50 rounded-lg p-3 backdrop-blur-sm">
            <p className={`text-lg font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
    return (
        <div className="group bg-card border border-border/50 rounded-xl p-6 hover:border-border transition-colors">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${accent} mb-3`}>
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-card/50 border border-border/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-semibold text-foreground">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">{description}</p>
        </div>
    );
}
