"use client";

import React, { useState } from "react";
import {
    Bot,
    Sparkles,
    ChevronRight,
    Users,
    Video,
    Layout,
    MessageSquare,
    Target,
    Zap,
    ShieldCheck,
    Search,
    Fingerprint,
    Mic2,
    Palette,
    TrendingUp,
    Globe,
    Shield, // Added Shield
    ScrollText, // Added ScrollText
    FileText, // Added FileText
    BookOpen, // Added BookOpen
    Clapperboard // Added Clapperboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Agent {
    id: string;
    name: string;
    role: string;
    icon: any;
    status: 'ONLINE' | 'THINKING' | 'IDLE';
    color: string;
}

const AGENTS: Agent[] = [
    { id: 'landing', name: 'Landing Expert', role: 'Conversion Architect', icon: Layout, status: 'ONLINE', color: 'rose' },
    { id: 'designer', name: 'Pro Designer', role: 'Visual Identity', icon: Palette, status: 'ONLINE', color: 'pink' },
    { id: 'video', name: 'Video Editor Pro', role: 'Motion & FX', icon: Video, status: 'IDLE', color: 'purple' },
    { id: 'spencer', name: 'Spencer Strategist', role: 'Growth Method', icon: Target, status: 'THINKING', color: 'slate' },
    { id: 'cro', name: 'CRO Specialist', role: 'Funnel Optimizer', icon: TrendingUp, status: 'ONLINE', color: 'emerald' },
    { id: 'aov', name: 'AOV Architect', role: 'Offer Engineering', icon: Zap, status: 'ONLINE', color: 'amber' },
    { id: 'replicator', name: 'Replicator Elite', role: 'Asset Cloning', icon: Globe, status: 'IDLE', color: 'blue' },
    { id: 'metadata', name: 'Metadata Stripper', role: 'Asset Safety', icon: Fingerprint, status: 'ONLINE', color: 'rose' },
    { id: 'lipsync', name: 'Lip-Sync Artist', role: 'Avatar Animation', icon: Mic2, status: 'ONLINE', color: 'cyan' },
    { id: 'hunter', name: 'Competitor Hunter', role: 'Ad Spy Expert', icon: Search, status: 'THINKING', color: 'violet' },
];

export function AgencyControlPanel({ productId }: { productId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

    return (
        <div className={cn(
            "fixed right-0 top-[80px] bottom-0 transition-all duration-500 z-50 flex",
            isOpen ? "w-[320px]" : "w-[3px] hover:w-6 group/sidebar"
        )}>
            {/* Toggle Trigger Area - Now more subtle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-900 border border-slate-700/50 rounded-l-md flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors group-hover/sidebar:opacity-100 opacity-0",
                    isOpen && "opacity-100 left-[-20px] w-5 h-10 rounded-full"
                )}
            >
                <ChevronRight className={cn("w-3 h-3 text-white transition-transform duration-500", isOpen && "rotate-180")} />
            </div>

            {/* Sidebar Content */}
            <div className="w-full h-full bg-slate-900 border-l border-slate-800 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500 rounded-lg">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        {isOpen && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Agency Intelligence</h2>
                                <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Unified Hub V4</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Agents List */}
                <ScrollArea className="flex-1">
                    <div className={cn("p-2 space-y-1 transition-opacity duration-300", !isOpen && "opacity-0 pointer-events-none")}>
                        {AGENTS.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent.id)}
                                className={cn(
                                    "w-full rounded-xl flex items-center gap-3 transition-all duration-300 p-2.5",
                                    selectedAgent === agent.id ? "bg-white/10 text-white shadow-sm" : "hover:bg-white/5 text-slate-400"
                                )}
                            >
                                <div className={cn(
                                    "relative shrink-0 p-1.5 rounded-lg transition-colors",
                                    selectedAgent === agent.id ? "bg-rose-500 text-white" : "bg-white/5 group-hover:bg-white/10"
                                )}>
                                    <agent.icon className="w-3.5 h-3.5" />
                                    <div className={cn(
                                        "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-slate-900 shadow-sm",
                                        agent.status === 'ONLINE' ? "bg-emerald-500 animate-pulse" :
                                            agent.status === 'THINKING' ? "bg-rose-500 animate-bounce" : "bg-slate-400"
                                    )} />
                                </div>

                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase tracking-tight leading-none">{agent.name}</p>
                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">{agent.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                {isOpen && (
                    <div className="p-4 bg-black/40 border-t border-slate-800">
                        <Button className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-sm">
                            Command Center
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
