'use client';

import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { useAuthSync } from '@/store/useGitStore';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

export function UserMenu() {
    const auth = useAuthSync();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const { user } = useUser();

    // Show Clerk UserButton if user is authenticated
    if (auth.isSignedIn) {
        return (
            <div className="relative">
                <UserButton
                    appearance={{
                        elements: {
                            rootBox: 'relative',
                            avatarBox: 'w-8 h-8 rounded-md overflow-hidden',
                            trigger: 'flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer',
                        },
                    }}
                />
            </div>
        );
    }

    // Fallback: custom menu for non-Clerk auth (shouldn't happen with Clerk integration)
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
                <UserIcon size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground truncate max-w-[120px]">{user?.primaryEmailAddress?.emailAddress || 'User'}</span>
                <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border">
                            <p className="text-xs text-muted-foreground">Signed in as</p>
                            <p className="text-xs text-foreground truncate">{user?.primaryEmailAddress?.emailAddress || 'User'}</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsSigningOut(true);
                                void window.location.reload(); // Clerk handles sign out via UserButton
                            }}
                            disabled={isSigningOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSigningOut ? (
                                <>
                                    Signing out...
                                </>
                            ) : (
                                <>
                                    <LogOut size={12} />
                                    Sign out
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
