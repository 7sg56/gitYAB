'use client';

import { useState } from 'react';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';
import { cn } from '@/lib/utils';

export function UserMenu() {
    const { user, signOut } = useGitStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
        setIsOpen(false);
        setIsSigningOut(false);
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
                <UserIcon size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground truncate max-w-[120px]">{user.email}</span>
                <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border">
                            <p className="text-xs text-muted-foreground">Signed in as</p>
                            <p className="text-xs text-foreground truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
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
