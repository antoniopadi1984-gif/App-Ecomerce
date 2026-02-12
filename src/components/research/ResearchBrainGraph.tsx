"use client";

import React from "react";
import { GitBranch, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumCard } from "@/components/ui/premium-card";
import { t } from "@/lib/constants/translations";
import { cn } from "@/lib/utils";

interface KnowledgeLink {
    sourceId: string;
    targetId: string;
    relationType: string;
    explanation: string | null;
}

interface ResearchBrainGraphProps {
    links: KnowledgeLink[];
}

export function ResearchBrainGraph({ links }: ResearchBrainGraphProps) {
    return (
        <PremiumCard className="overflow-hidden">
            <div className="p-2 space-y-6">
                <div className="flex flex-row justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <GitBranch className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('brain_graph_connections')}</h3>
                    </div>
                    <Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase text-slate-400 border-slate-200">
                        {links.length} {t('connections_count')}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {links.map((link, i) => (
                        <div
                            key={i}
                            className="group p-5 bg-slate-50/50 hover:bg-slate-900 transition-all duration-300 rounded-3xl border border-slate-100 hover:border-slate-800 space-y-3 cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <Badge className="bg-blue-100 text-blue-600 border-0 text-[8px] font-black group-hover:bg-blue-500 group-hover:text-white uppercase tracking-wider">
                                    {link.relationType}
                                </Badge>
                                <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 group-hover:text-white leading-relaxed">
                                {link.explanation || 'Conexión estratégica detectada'}
                            </p>
                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase pt-2 transition-colors">
                                <span className="group-hover:text-slate-500">{link.sourceId}</span>
                                <GitBranch className="w-3 h-3 text-slate-300" />
                                <span className="group-hover:text-slate-500">{link.targetId}</span>
                            </div>
                        </div>
                    ))}
                    {links.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-30 italic font-black text-slate-400 uppercase tracking-widest">
                            {t('no_connections')}
                        </div>
                    )}
                </div>
            </div>
        </PremiumCard>
    );
}
