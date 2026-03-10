'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, KeyRound, User, ArrowRight } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

export function SetupModal() {
    const { pat, mainUser, setPat, setMainUser } = useGitStore();

    const [inputPat, setInputPat] = useState('');
    const [inputUser, setInputUser] = useState('');

    // Only show if we don't have both set
    const isVisible = !pat || !mainUser;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputPat.trim() && inputUser.trim()) {
            setPat(inputPat.trim());
            setMainUser(inputUser.trim());
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', bounce: 0.3 }}
                        className="w-full max-w-md p-8 glass rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="p-3 bg-primary/20 rounded-full text-primary ring-1 ring-primary/30">
                                <Github size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-foreground mb-2">
                            Welcome to GitYab
                        </h2>
                        <p className="text-center text-muted-foreground mb-8 text-sm">
                            Enter your GitHub username and a Personal Access Token (classic with repo & user scope) to unlock rich metrics and compare with rivals.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">GitHub Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={inputUser}
                                        onChange={(e) => setInputUser(e.target.value)}
                                        placeholder="e.g. torvalds"
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="justify-between flex items-baseline ml-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Personal Access Token</label>
                                    <a
                                        href="https://github.com/settings/tokens/new"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        Get a Token (classic)
                                    </a>
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={inputPat}
                                        onChange={(e) => setInputPat(e.target.value)}
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground/80 pt-1 ml-1">
                                    Stored securely in your browser. Needs `read:user` (and optionally `repo`) scope.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all active:scale-[0.98] group"
                            >
                                <span>Initialize Dashboard</span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
