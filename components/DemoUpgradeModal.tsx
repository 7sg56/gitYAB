'use client';

import { ArrowRight, X, Shield, Zap, Users, BarChart3, RefreshCw } from 'lucide-react';
import { useGitStore } from '@/store/useGitStore';

interface DemoUpgradeModalProps {
    open: boolean;
    onClose: () => void;
}

export function DemoUpgradeModal({ open, onClose }: DemoUpgradeModalProps) {
    const { mainUser, requestDemoAuth } = useGitStore();

    if (!open) return null;

    const benefits = [
        { icon: BarChart3, label: 'Private contribution data' },
        { icon: Users, label: 'Unlimited rivals' },
        { icon: Zap, label: '5,000 API requests/hr' },
        { icon: RefreshCw, label: 'Auto-rescan & persistence' },
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-[#8b949e] hover:text-white rounded-md hover:bg-[#30363d] transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-[#238636]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#39d353]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Unlock Full Access</h2>
                        <p className="text-xs text-[#8b949e]">Currently previewing as @{mainUser}</p>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    {benefits.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-3 px-3 py-2 bg-[#0d1117] rounded-lg border border-[#21262d]">
                            <Icon className="w-4 h-4 text-[#39d353] shrink-0" />
                            <span className="text-sm text-[#c9d1d9]">{label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => {
                        onClose();
                        requestDemoAuth('signup');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-bold rounded-md border border-[rgba(240,246,252,0.1)] transition-colors mb-3"
                >
                    Sign Up
                    <ArrowRight size={14} />
                </button>

                <button
                    onClick={() => {
                        onClose();
                        requestDemoAuth('signin');
                    }}
                    className="w-full text-center text-xs text-[#8b949e] hover:text-white py-2 transition-colors"
                >
                    Already have an account? Sign in
                </button>
            </div>
        </div>
    );
}
