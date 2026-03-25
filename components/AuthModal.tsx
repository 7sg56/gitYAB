'use client';

import { useState } from 'react';
import { Github, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

export function AuthModal() {
    const { isAuthenticating, signIn, signUp, apiError, setApiError } = useGitStore();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isLoading = isAuthenticating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        const result = mode === 'signin'
            ? await signIn(email, password)
            : await signUp(email, password);

        if (!result.error) {
            // Auth successful, component will be unmounted by parent
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2.5 mb-5">
                    <Github size={20} className="text-foreground" />
                    <h2 className="text-base font-semibold text-foreground">
                        {mode === 'signin' ? 'Sign in to GitYab' : 'Create an account'}
                    </h2>
                </div>

                {apiError && (
                    <div className="flex gap-2 items-start p-3 mb-5 bg-danger/10 border border-danger/20 rounded-md">
                        <AlertCircle className="text-danger mt-0.5" size={16} />
                        <p className="text-sm text-danger/90 font-medium">
                            {apiError}
                        </p>
                    </div>
                )}

                <p className="text-sm text-muted-foreground mb-5">
                    {mode === 'signin'
                        ? 'Enter your email and password to sign in.'
                        : 'Create an account to save your rivals and preferences.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                                className="w-full pr-9 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground/70">
                            Minimum 6 characters
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-success hover:bg-success/90 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            <>
                                {mode === 'signin' ? 'Sign in' : 'Create account'}
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setApiError(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {mode === 'signin'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
