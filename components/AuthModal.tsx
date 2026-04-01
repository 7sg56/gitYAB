'use client';

import { Github, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

interface AuthFormProps {
    onBack: () => void;
}

export function AuthForm({ onBack }: AuthFormProps) {
    const { isAuthenticating, signInWithGithub, apiError, setApiError } = useGitStore();

    const isLoading = isAuthenticating;

    const handleGithubSignIn = async () => {
        if (isLoading) return;
        setApiError(null);
        await signInWithGithub();
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Top bar */}
            <div className="flex items-center h-14 px-6 border-b border-border/50">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>
            </div>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                            <Github size={28} className="text-primary" />
                        </div>

                        <h2 className="text-lg font-bold text-foreground mb-2">
                            Welcome to GitYAB
                        </h2>

                        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                            Sign in with your GitHub account to start tracking your competitive stats against rivals.
                        </p>

                        {/* Error display */}
                        {apiError && (
                            <div className="flex gap-2 items-start p-3 mb-6 bg-danger/10 border border-danger/20 rounded-lg text-left">
                                <AlertCircle className="text-danger mt-0.5 shrink-0" size={14} />
                                <p className="text-xs text-danger/90 font-medium">{apiError}</p>
                            </div>
                        )}

                        <button
                            onClick={handleGithubSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Github size={16} />
                                    Continue with GitHub
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
