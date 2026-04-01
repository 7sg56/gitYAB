'use client';

import { useState } from 'react';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';

interface ClerkAuthModalProps {
    onClose: () => void;
}

export function ClerkAuthModal({ onClose }: ClerkAuthModalProps) {
    const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in');

    if (view === 'sign-in') {
        return (
            <SignInModal
                onSwitchToSignUp={() => setView('sign-up')}
                onBack={onClose}
            />
        );
    }

    return (
        <SignUpModal
            onSwitchToSignIn={() => setView('sign-in')}
            onBack={onClose}
        />
    );
}
