'use client';

import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';

const QUOTES = [
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "It's not a bug. It's an undocumented feature.", author: "Anonymous" },
    { text: "Programming is the art of telling another human what one wants the computer to do.", author: "Donald Knuth" },
    { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
    { text: "A language that doesn't affect the way you think about programming is not worth knowing.", author: "Alan Perlis" },
    { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
    { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupery" },
    { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
    { text: "Before software can be reusable, it first has to be usable.", author: "Ralph Johnson" },
];

function getRandomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    const [quote, setQuote] = useState(getRandomQuote);
    const [fadeIn, setFadeIn] = useState(true);

    // Rotate quotes every 4 seconds with a fade transition
    useEffect(() => {
        const interval = setInterval(() => {
            setFadeIn(false);
            setTimeout(() => {
                setQuote(getRandomQuote());
                setFadeIn(true);
            }, 300);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 mesh-gradient opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg">
                {/* Logo + Spinner */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-2xl">
                        <Github size={28} className="text-foreground" />
                    </div>
                    {/* Orbiting ring */}
                    <div className="absolute -inset-3 border-2 border-transparent border-t-primary/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute -inset-5 border border-transparent border-t-primary/20 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                </div>

                {/* Status message */}
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-muted-foreground tracking-wide">
                        {message}
                    </span>
                </div>

                {/* Quote */}
                <div
                    className="text-center transition-all duration-300 min-h-[80px] flex flex-col items-center justify-center"
                    style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(8px)' }}
                >
                    <p className="text-sm text-foreground/70 leading-relaxed italic">
                        &ldquo;{quote.text}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                        -- {quote.author}
                    </p>
                </div>
            </div>
        </div>
    );
}
