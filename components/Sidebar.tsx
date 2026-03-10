'use client';

import { useState } from 'react';
import { useGitStore } from '@/store/useGitStore';
import { Github, Plus, Trash2, Users, User, LogOut, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const { mainUser, rivals, addRival, removeRival, clearState, currentView, setCurrentView } = useGitStore();
    const [newRival, setNewRival] = useState('');

    const handleAddRival = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRival.trim() && newRival.trim() !== mainUser) {
            addRival(newRival.trim());
            setNewRival('');
        }
    };

    return (
        <div className="w-80 h-full border-r border-white/5 bg-background/50 flex flex-col backdrop-blur-3xl shrink-0 sticky top-0">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary ring-1 ring-primary/30">
                    <Github size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent tracking-tighter">
                        GitYab
                    </h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                        <Swords size={10} /> Stats Showdown
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 custom-scrollbar">

                {/* Navigation Section */}
                {mainUser && (
                    <div className="space-y-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Navigation</h2>
                        <nav className="flex flex-col gap-1">
                            <button
                                onClick={() => setCurrentView('home')}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    currentView === 'home' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Github size={18} /> Home Dashboard
                            </button>
                            <button
                                onClick={() => setCurrentView('feed')}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    currentView === 'feed' ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Users size={18} /> Activity Feed
                            </button>
                            <button
                                onClick={() => setCurrentView('comparator')}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    currentView === 'comparator' ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Swords size={18} /> Detailed Comparator
                            </button>
                            <button
                                onClick={() => setCurrentView('target')}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    currentView === 'target' ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <User size={18} /> Next Target Series
                            </button>
                        </nav>
                    </div>
                )}

                {/* Main User */}
                {mainUser && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> You
                        </h2>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {mainUser.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{mainUser}</p>
                                <p className="text-xs text-muted-foreground truncate">Main Contender</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rivals Section */}
                <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} /> Rivals ({rivals.length})
                    </h2>

                    <AnimatePresence>
                        <div className="space-y-2">
                            {rivals.map((rival) => (
                                <motion.div
                                    key={rival}
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-between p-2 pl-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                                            {rival.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-medium text-foreground/90 truncate">{rival}</p>
                                    </div>
                                    <button
                                        onClick={() => removeRival(rival)}
                                        className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove Rival"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>

                    {/* Add Rival Input */}
                    <form onSubmit={handleAddRival} className="pt-2">
                        <div className="relative group">
                            <input
                                type="text"
                                value={newRival}
                                onChange={(e) => setNewRival(e.target.value)}
                                placeholder="Add rival username..."
                                className={cn(
                                    "w-full pl-4 pr-10 py-2.5 bg-background border border-white/10 rounded-xl text-sm",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all",
                                    "placeholder:text-muted-foreground/50",
                                    "group-hover:border-white/20"
                                )}
                            />
                            <button
                                type="submit"
                                disabled={!newRival.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-primary/20 hover:bg-primary text-primary hover:text-white disabled:opacity-50 disabled:hover:bg-primary/20 disabled:hover:text-primary rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer Settings */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={clearState}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    <span>Reset Configuration</span>
                </button>
            </div>
        </div>
    );
}
