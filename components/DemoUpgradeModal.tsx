'use client';

import { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, X, Github, Shield } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

interface DemoUpgradeModalProps {
    open: boolean;
    onClose: () => void;
    onSignUp: () => void;
}

export function DemoUpgradeModal({ open, onClose, onSignUp }: DemoUpgradeModalProps) {
    const { mainUser, exitDemoMode } = useGitStore();
    const [inputPat, setInputPat] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleSubmitPat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputPat.trim() || isValidating) return;

        setIsValidating(true);
        setError(null);

        try {
            const res = await fetch('https://api.github.com/user', {
                headers: { Authorization: `token ${inputPat.trim()}` },
            });

            if (!res.ok) {
                setError('Invalid token. Make sure it has read:user scope.');
                setIsValidating(false);
                return;
            }

            // PAT is valid. Exit demo and push to sign-up flow so they can
            // persist it with a real account.
            exitDemoMode();
            onClose();
            onSignUp();
        } catch {
            setError('Could not validate token. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-[#8b949e] hover:text-white rounded-md hover:bg-[#30363d] transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#238636]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#39d353]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Unlock Full Access</h2>
                        <p className="text-xs text-[#8b949e]">Currently previewing as @{mainUser}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-[#0d1117] rounded-lg border border-[#21262d]">
                        <KeyRound className="w-4 h-4 text-[#39d353] mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-white">What you get with a PAT</p>
                            <ul className="text-xs text-[#8b949e] mt-1 space-y-1">
                                <li>Private contribution data included</li>
                                <li>Unlimited rivals (vs {1} in demo)</li>
                                <li>5,000 API requests/hr (vs 60)</li>
                                <li>Auto-rescan and persistent settings</li>
                                <li>Social graph access</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Option 1: Sign up for full account */}
                <button
                    onClick={() => {
                        exitDemoMode();
                        onClose();
                        onSignUp();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-bold rounded-md border border-[rgba(240,246,252,0.1)] transition-colors mb-3"
                >
                    <Github size={16} />
                    Create Account &amp; Add PAT
                    <ArrowRight size={14} />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-[#30363d]" />
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-widest">or validate PAT first</span>
                    <div className="flex-1 h-px bg-[#30363d]" />
                </div>

                {/* Option 2: Quick PAT validation (still redirects to sign-up) */}
                <form onSubmit={handleSubmitPat} className="space-y-3">
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={14} />
                        <input
                            type="password"
                            value={inputPat}
                            onChange={(e) => setInputPat(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#238636] focus:border-[#238636] placeholder:text-[#484f58] transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 px-1">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!inputPat.trim() || isValidating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-medium rounded-md border border-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isValidating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                Validate &amp; Sign Up
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-[#484f58] text-center">
                        Needs <code className="text-[#8b949e]">read:user</code> scope.{' '}
                        <a
                            href="https://github.com/settings/tokens/new"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#58a6ff] hover:underline"
                        >
                            Create one
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
