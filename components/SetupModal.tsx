'use client';

import { useEffect, useState } from 'react';
import { Github, KeyRound, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';
import { useAuthSync } from '@/store/useGitStore';

export function SetupModal() {
    const auth = useAuthSync();
    const { pat, completeSetup, apiError, setApiError, hasSetupCompleted } = useGitStore();
    const [initialized, setInitialized] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputPat, setInputPat] = useState('');

    const isInvalidToken = apiError === 'Invalid GitHub Personal Access Token. Please check your credentials.';
    const isVisible = !hasSetupCompleted || isInvalidToken;

    // Initialize form values when modal becomes visible
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (isVisible && !initialized) {
            setInputPat(pat);
            setInitialized(true);
        }
        if (!isVisible) {
            setInitialized(false);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [isVisible, pat, initialized]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (inputPat.trim()) {
            setIsSubmitting(true);
            const result = await completeSetup(inputPat.trim());
            setIsSubmitting(false);

            if (!result.error) {
                setInputPat('');
            } else if (isInvalidToken) {
                setApiError(null);
            }
        }
    };

    if (!isVisible || !auth.isLoaded) return null;

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
                        Please provide a Personal Access Token to enable competitive tracking.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            Needs <code>read:user</code> scope. Encrypted and stored securely in our database.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-success hover:bg-success/90 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                {isInvalidToken ? 'Update Token' : 'Get started'}
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
