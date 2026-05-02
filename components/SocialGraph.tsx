'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGitStore } from '@/store/useGitStore';
import { fetchUserConnections, GitHubConnection, UserConnections } from '@/lib/github';
import { getCachedData, cacheData } from '@/lib/auth';
import { RefreshCw, Users, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium">Initializing Graph Space...</p>
            </div>
        </div>
    )
});

// connectionType: 'mutual' = both follow each other, 'follower' = only follows a key user, 'following' = only followed by a key user
type ConnectionType = 'mutual' | 'follower' | 'following' | null;

interface GraphNode {
    id: string;
    group: number;
    val: number;
    login: string;
    avatarUrl: string;
    name: string | null;
    connectionType: ConnectionType;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string;
    target: string;
    value: number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export function SocialGraph() {
    const { mainUser, rivals, enabledRivals, pat } = useGitStore();
    const activeRivals = useMemo(() => rivals.filter(r => enabledRivals[r] !== false), [rivals, enabledRivals]);

    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const buildGraph = useCallback(async () => {
        if (!mainUser || !pat) return;
        setLoading(true);
        setProgress(0);

        const usersToFetch = [mainUser, ...activeRivals];
        const nodesMap = new Map<string, GraphNode>();
        const links: GraphLink[] = [];

        // Helper to add nodes safely
        const addNode = (userConfig: GitHubConnection, group: number, val: number, connType: ConnectionType = null) => {
            if (!nodesMap.has(userConfig.login)) {
                nodesMap.set(userConfig.login, {
                    id: userConfig.login,
                    group,
                    val,
                    login: userConfig.login,
                    avatarUrl: userConfig.avatarUrl,
                    name: userConfig.name,
                    connectionType: connType
                });
            } else {
                const existing = nodesMap.get(userConfig.login)!;
                if (existing.group > group) {
                    existing.group = group;
                }
                if (existing.group === 3) {
                    existing.val = Math.min(existing.val + 1, 15);
                }
                // Upgrade connection type to mutual if seen from both directions
                if (connType && existing.connectionType && connType !== existing.connectionType) {
                    existing.connectionType = 'mutual';
                } else if (connType && !existing.connectionType) {
                    existing.connectionType = connType;
                }
            }
        };

        let fetchedCount = 0;

        for (const login of usersToFetch) {
            const isMain = login === mainUser;
            const group = isMain ? 1 : 2;
            const val = isMain ? 30 : 20;

            addNode({ login, avatarUrl: `https://github.com/${login}.png`, name: login }, group, val);

            try {
                // Check DB cache first
                let connections: UserConnections | null = null;
                try {
                    const cached = await getCachedData<UserConnections>('connections', login);
                    if (cached) {
                        connections = cached;
                    }
                } catch {
                    // DB unreachable, continue to API
                }

                if (!connections) {
                    connections = await fetchUserConnections(login, pat);
                    // Cache the result
                    if (connections) {
                        cacheData('connections', login, connections).catch(() => { });
                    }
                }

                if (connections) {
                    const followerLogins = new Set(connections.followers.map(f => f.login));
                    const followingLogins = new Set(connections.following.map(f => f.login));

                    // Process Followers
                    connections.followers.forEach(follower => {
                        const isMutual = followingLogins.has(follower.login);
                        addNode(follower, 3, isMutual ? 8 : 5, isMutual ? 'mutual' : 'follower');
                        links.push({ source: follower.login, target: login, value: 1 });
                    });

                    // Process Following
                    connections.following.forEach(followed => {
                        const isMutual = followerLogins.has(followed.login);
                        addNode(followed, 3, isMutual ? 8 : 5, isMutual ? 'mutual' : 'following');
                        links.push({ source: login, target: followed.login, value: 1 });
                    });
                }
            } catch (err) {
                console.error(`Skipping connections for ${login} due to error`, err);
            }

            fetchedCount++;
            setProgress(Math.round((fetchedCount / usersToFetch.length) * 100));
        }

        // Deduplicate links (bidirectional could be kept, or just visual)
        const uniqueLinks = new Map<string, GraphLink>();
        links.forEach(l => {
            const id1 = `${l.source}->${l.target}`;
            // If mutual, we can just highlight it as bidir, but react-force-graph handles multiple links fine
            if (!uniqueLinks.has(id1)) uniqueLinks.set(id1, l);
        });

        const newGraphData = {
            nodes: Array.from(nodesMap.values()),
            links: Array.from(uniqueLinks.values())
        };

        setGraphData(newGraphData);
        setLoading(false);

        // Center graph after small delay to let force engine settle
        setTimeout(() => {
            if (fgRef.current) {
                fgRef.current.zoomToFit(400, 50);
            }
        }, 1000);

    }, [mainUser, activeRivals, pat]);

    // Initial load
    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted && graphData.nodes.length === 0 && !loading) {
                void buildGraph();
            }
        }, 100);
        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainUser, activeRivals, pat]);

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex flex-col space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Users className="text-primary" /> Social Circle
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Explore the network graph of you, your rivals, and your mutual connections.
                    </p>
                </div>
                <button
                    onClick={buildGraph}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-foreground bg-accent/30 hover:bg-accent transition-colors disabled:opacity-50 border border-border"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? `Scanning (${progress}%)` : 'Rescan Network'}
                </button>
            </div>

            <div
                className="flex-1 bg-[#0a0a0a] border border-border/60 rounded-xl overflow-hidden relative shadow-inner flex flex-col"
                ref={containerRef}
            >
                {loading && graphData.nodes.length === 0 ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Mapping Social Constellations...</h3>
                        <div className="w-64 h-2 bg-accent rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : null}

                {/* Legend */}
                <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md p-3 rounded-lg border border-border shadow-lg flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs text-foreground font-medium">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                        <span className="text-xs text-foreground font-medium">Rivals</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
                        <span className="text-xs text-foreground font-medium">Mutuals</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-xs text-foreground font-medium">Followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                        <span className="text-xs text-foreground font-medium">Following</span>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                        {graphData.nodes.length} Nodes / {graphData.links.length} Edges
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                    <button
                        onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)}
                        className="p-2 bg-background/80 backdrop-blur-md border border-border rounded-md hover:bg-accent text-foreground transition-colors shadow-lg"
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)}
                        className="p-2 bg-background/80 backdrop-blur-md border border-border rounded-md hover:bg-accent text-foreground transition-colors shadow-lg"
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <button
                        onClick={() => fgRef.current?.zoomToFit(400, 50)}
                        className="p-2 bg-background/80 backdrop-blur-md border border-border rounded-md hover:bg-accent text-foreground transition-colors shadow-lg"
                        title="Fit to Screen"
                    >
                        <Maximize size={18} />
                    </button>
                </div>

                {graphData.nodes.length > 0 && typeof window !== 'undefined' && (
                    <ForceGraph2D
                        ref={fgRef}
                        width={containerSize.width}
                        height={containerSize.height}
                        graphData={graphData}
                        nodeLabel="login"
                        nodeVal="val"
                        nodeColor={(n) => {
                            const node = n as GraphNode;
                            if (node.group === 1) return '#10b981'; // You
                            if (node.group === 2) return '#f43f5e'; // Rivals
                            if (node.connectionType === 'mutual') return '#06b6d4'; // Cyan
                            if (node.connectionType === 'follower') return '#f59e0b'; // Amber
                            if (node.connectionType === 'following') return '#8b5cf6'; // Violet
                            return '#94a3b8'; // Default
                        }}
                        linkColor={() => 'rgba(148, 163, 184, 0.15)'}
                        linkWidth={0.5}
                        linkDirectionalArrowLength={3}
                        linkDirectionalArrowRelPos={1}
                        nodeCanvasObject={(n, ctx, globalScale) => {
                            const node = n as GraphNode;
                            const label = node.login;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;

                            const radius = Math.sqrt(node.val) * 1.5;

                            // Draw node circle
                            ctx.beginPath();
                            ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);

                            // Color logic based on group and connection type
                            let fillColor = '#475569';
                            let glow = false;
                            if (node.group === 1) {
                                fillColor = '#10b981'; glow = true;
                            } else if (node.group === 2) {
                                fillColor = '#f43f5e'; glow = true;
                            } else if (node.connectionType === 'mutual') {
                                fillColor = '#06b6d4'; glow = true;
                            } else if (node.connectionType === 'follower') {
                                fillColor = '#f59e0b';
                            } else if (node.connectionType === 'following') {
                                fillColor = '#8b5cf6';
                            }
                            ctx.fillStyle = fillColor;
                            if (glow) {
                                ctx.shadowColor = fillColor;
                                ctx.shadowBlur = 10;
                            } else {
                                ctx.shadowBlur = 0;
                            }

                            ctx.fill();

                            // Reset shadow for text
                            ctx.shadowBlur = 0;

                            // Only draw labels if zoomed in enough or if it's a main node
                            if (globalScale > 1.5 || node.group === 1 || node.group === 2) {
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = (node.group === 1 || node.group === 2) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)';
                                ctx.fillText(label, node.x || 0, (node.y || 0) + radius + fontSize);
                            }
                        }}
                        onNodeClick={(n) => {
                            const node = n as GraphNode;
                            // Focus on node
                            if (node.x !== undefined && node.y !== undefined && fgRef.current) {
                                fgRef.current.centerAt(node.x, node.y, 1000);
                                fgRef.current.zoom(4, 1000);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
