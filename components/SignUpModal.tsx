'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/shared/types';
import { ArrowLeft, Github, Mail, KeyRound, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface SignUpModalProps {
    onSwitchToSignIn: () => void;
    onBack: () => void;
}

export function SignUpModal({ onSwitchToSignIn, onBack }: SignUpModalProps) {
    const { signUp, errors, fetchStatus } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const isLoading = fetchStatus === 'fetching';

    // Safely extract the first error message from Clerk's Errors object
    const getFirstError = (errObj: unknown): string | null => {
        if (!errObj || typeof errObj !== 'object') return null;
        const keys = Object.keys(errObj);
        if (keys.length > 0) {
            const firstKey = keys[0] as keyof typeof errObj;
            const firstError = errObj[firstKey] as { message?: string } | undefined;
            return firstError?.message || null;
        }
        return null;
    };

    const errorMessage = localError || getFirstError(errors);

    // --- GitHub OAuth ---
    const handleGitHubAuth = async () => {
        setLocalError(null);
        try {
            await signUp.sso({
                strategy: 'oauth_github' as OAuthStrategy,
                redirectCallbackUrl: '/sso-callback',
                redirectUrl: '/',
            });
        } catch (err) {
            console.error('OAuth error:', err);
            setLocalError('Failed to initiate GitHub sign-up. Please try again.');
        }
    };

    // --- Email Sign Up ---
    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setLocalError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        try {
            const { error } = await signUp.password({
                emailAddress: email,
                password,
            });

            if (error) {
                setLocalError(error.message || 'Sign-up failed.');
                return;
            }

            // Send verification email
            const { error: sendError } = await signUp.verifications.sendEmailCode();
            if (sendError) {
                setLocalError(sendError.message || 'Failed to send verification email.');
                return;
            }
            setShowVerification(true);
        } catch (err: unknown) {
            const clerkErr = err as { errors?: Array<{ message: string }> };
            setLocalError(clerkErr?.errors?.[0]?.message || 'Sign-up failed. Please try again.');
        }
    };

    // --- Email Verification ---
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!verificationCode.trim()) {
            setLocalError('Please enter the verification code.');
            return;
        }

        try {
            const { error } = await signUp.verifications.verifyEmailCode({ code: verificationCode });
            if (error) {
                setLocalError(error.message || 'Invalid verification code.');
                return;
            }

            if (signUp.status === 'complete') {
                await signUp.finalize();
            } else {
                setLocalError('Verification incomplete. Please try again.');
            }
        } catch (err: unknown) {
            const clerkErr = err as { errors?: Array<{ message: string }> };
            setLocalError(clerkErr?.errors?.[0]?.message || 'Invalid verification code.');
        }
    };

    // --- Verification Code Screen ---
    if (showVerification) {
        return (
            <div className="min-h-screen flex flex-col bg-background text-foreground">
                <div className="flex items-center h-14 px-6 border-b border-border/50">
                    <button
                        onClick={() => setShowVerification(false)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm">
                        <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                                <Mail size={28} className="text-primary" />
                            </div>

                            <h2 className="text-lg font-bold text-foreground mb-2">Check your email</h2>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                We sent a verification code to <span className="font-medium text-foreground">{email}</span>
                            </p>

                            {errorMessage && (
                                <div className="flex gap-2 items-start p-3 mb-4 bg-danger/10 border border-danger/20 rounded-lg text-left">
                                    <AlertCircle className="text-danger mt-0.5 shrink-0" size={14} />
                                    <p className="text-xs text-danger/90 font-medium">{errorMessage}</p>
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="space-y-4">
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    className="w-full px-4 py-2.5 text-sm text-center tracking-[0.3em] font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 placeholder:tracking-normal transition-colors"
                                    maxLength={6}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Main Auth Screen ---
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
                    <div className="bg-card border border-border/50 rounded-xl p-8">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                                <Github size={28} className="text-primary" />
                            </div>

                            <h2 className="text-lg font-bold text-foreground mb-2">
                                Create account
                            </h2>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Get started tracking your GitHub stats against rivals.
                            </p>
                        </div>

                        {/* Error display */}
                        {errorMessage && (
                            <div className="flex gap-2 items-start p-3 mb-4 bg-danger/10 border border-danger/20 rounded-lg text-left">
                                <AlertCircle className="text-danger mt-0.5 shrink-0" size={14} />
                                <p className="text-xs text-danger/90 font-medium">{errorMessage}</p>
                            </div>
                        )}

                        {/* GitHub OAuth Button */}
                        <button
                            onClick={handleGitHubAuth}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Github size={16} />
                            )}
                            Continue with GitHub
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailSignUp} className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-success hover:bg-success/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create account
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Switch view link */}
                        <p className="text-center text-xs text-muted-foreground mt-5">
                            Already have an account?{' '}
                            <button onClick={onSwitchToSignIn} className="text-primary hover:underline font-medium focus:outline-none">
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
