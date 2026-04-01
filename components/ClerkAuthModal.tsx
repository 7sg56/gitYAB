'use client';

import { SignIn, SignUp, useUser } from '@clerk/nextjs';
import { ArrowLeft, Github } from 'lucide-react';

type ClerkAuthView = 'signin' | 'signup';

interface ClerkAuthModalProps {
    view: ClerkAuthView;
    onViewChange: (view: ClerkAuthView) => void;
    onBack: () => void;
}

export function ClerkAuthModal({ view, onViewChange, onBack }: ClerkAuthModalProps) {
    const { isLoaded } = useUser();

    // While Clerk is loading or user is being created, show loading
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        );
    }

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

            {/* Auth Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                            <Github size={28} className="text-primary" />
                        </div>

                        <h2 className="text-lg font-bold text-foreground mb-2">
                            {view === 'signin' ? 'Welcome back' : 'Create account'}
                        </h2>

                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {view === 'signin'
                                ? 'Sign in to track your competitive GitHub stats.'
                                : 'Get started tracking your GitHub stats against rivals.'}
                        </p>

                        {/* Toggle between Sign In and Sign Up */}
                        <div className="flex gap-2 mb-6 bg-muted/50 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => onViewChange('signin')}
                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${
                                    view === 'signin'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => onViewChange('signup')}
                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${
                                    view === 'signup'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Clerk Auth Component */}
                        <div className="flex justify-center">
                            {view === 'signin' ? (
                                <SignIn
                                    appearance={{
                                        elements: {
                                            rootBox: 'w-full',
                                            card: 'shadow-none border-none bg-transparent p-0 w-full',
                                            headerTitle: 'hidden',
                                            headerSubtitle: 'hidden',
                                            socialButtonsBlock: 'flex flex-col gap-2',
                                            socialButtonsBlockButton: `
                                                flex items-center justify-center gap-2
                                                py-2.5 px-4
                                                bg-foreground hover:bg-foreground/90
                                                text-background
                                                text-sm font-semibold rounded-lg
                                                transition-colors
                                                w-full
                                            `,
                                            formButtonPrimary: `
                                                w-full py-2.5 px-4
                                                bg-foreground hover:bg-foreground/90
                                                text-background
                                                text-sm font-semibold rounded-lg
                                                transition-colors
                                            `,
                                            dividerRow: 'hidden',
                                            footer: 'hidden',
                                        },
                                    }}
                                    routing="path"
                                    path="/sign-in"
                                    signUpUrl="/sign-up"
                                    forceRedirectUrl="/"
                                />
                            ) : (
                                <SignUp
                                    appearance={{
                                        elements: {
                                            rootBox: 'w-full',
                                            card: 'shadow-none border-none bg-transparent p-0 w-full',
                                            headerTitle: 'hidden',
                                            headerSubtitle: 'hidden',
                                            socialButtonsBlock: 'flex flex-col gap-2',
                                            socialButtonsBlockButton: `
                                                flex items-center justify-center gap-2
                                                py-2.5 px-4
                                                bg-foreground hover:bg-foreground/90
                                                text-background
                                                text-sm font-semibold rounded-lg
                                                transition-colors
                                                w-full
                                            `,
                                            formButtonPrimary: `
                                                w-full py-2.5 px-4
                                                bg-foreground hover:bg-foreground/90
                                                text-background
                                                text-sm font-semibold rounded-lg
                                                transition-colors
                                            `,
                                            dividerRow: 'hidden',
                                            footerActionLink: 'text-primary hover:underline text-xs',
                                        },
                                    }}
                                    routing="path"
                                    path="/sign-up"
                                    signInUrl="/sign-in"
                                    forceRedirectUrl="/"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
