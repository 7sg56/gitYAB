'use client';

import { useState, useEffect } from 'react';
import { Github, KeyRound, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

export function SetupModal() {
    const { pat, mainUser, setPat, setMainUser, apiError, setApiError } = useGitStore();
    const [inputPat, setInputPat] = useState(pat || '');
    const [inputUser, setInputUser] = useState(mainUser || '');

    const isInvalidToken = apiError === 'Invalid GitHub Personal Access Token. Please check your credentials.';
    const isVisible = !pat || !mainUser || isInvalidToken;

    useEffect(() => {
        if (isVisible) {
            if (!inputUser && mainUser) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setInputUser(mainUser);
            }
        }
    }, [isVisible, mainUser, inputUser]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputPat.trim() && inputUser.trim()) {
            setPat(inputPat.trim());
            setMainUser(inputUser.trim());
            if (isInvalidToken) setApiError(null);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2.5 mb-5">
                    <Github size={20} className="text-foreground" />
                    <h2 className="text-base font-semibold text-foreground">Set up GitYab</h2>
                </div>

                {isInvalidToken ? (
                    <div className="flex gap-2 items-start p-3 mb-5 bg-danger/10 border border-danger/20 rounded-md">
                        <AlertCircle className="text-danger mt-0.5" size={16} />
                        <p className="text-sm text-danger/90 font-medium">
                            Your Personal Access Token is invalid or expired. Please update it to continue to use GitYab.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground mb-5">
                        Enter your GitHub username and a Personal Access Token to get started.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                required
                                value={inputUser}
                                onChange={(e) => setInputUser(e.target.value)}
                                placeholder="e.g. torvalds"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                            <label className="text-xs font-medium text-muted-foreground">Personal Access Token</label>
                            <a
                                href="https://github.com/settings/tokens/new"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-primary hover:underline"
                            >
                                Create token
                            </a>
                        </div>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="password"
                                required
                                value={inputPat}
                                onChange={(e) => setInputPat(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground/70">
                            Needs <code>read:user</code> scope. Stored in your browser&apos;s local storage.
                        </p>
                        <div className="mt-2 p-2.5 bg-danger/10 border border-danger/20 rounded-md">
                            <p className="text-[11px] text-danger/90 leading-relaxed font-medium">
                                ⚠️ Local storage is not fully secure against XSS.
                                We strongly recommend generating a fine-grained PAT with
                                strictly read-only permissions. Use at your own risk.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-success hover:bg-success/90 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        {isInvalidToken ? 'Update Token' : 'Get started'}
                        <ArrowRight size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
