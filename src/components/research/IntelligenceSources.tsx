"use client";

import React from "react";
import {
    Globe,
    Database,
    RefreshCw,
    Plus,
    XCircle,
    ExternalLink,
    Search,
    Info,
    CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { t } from "@/lib/constants/translations";

interface IntelligenceSourcesProps {
    amazonUrl: string;
    setAmazonUrl: (url: string) => void;
    onAddAmazon: () => void;
    competitorLinks: any[];
    newCompetitorUrl: string;
    setNewCompetitorUrl: (url: string) => void;
    onAddCompetitor: () => void;
    onDeleteCompetitor: (id: string) => void;
    onSyncDrive: () => void;
    isSyncing: boolean;
    driveFolderId?: string | null;
}

export function IntelligenceSources({
    amazonUrl,
    setAmazonUrl,
    onAddAmazon,
    competitorLinks,
    newCompetitorUrl,
    setNewCompetitorUrl,
    onAddCompetitor,
    onDeleteCompetitor,
    onSyncDrive,
    isSyncing,
    driveFolderId
}: IntelligenceSourcesProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50/50 rounded-xl border border-slate-200/50">
            {/* Amazon Source */}
            <div className="flex-1 min-w-[240px] flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm group">
                <div className="w-7 h-7 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 flex gap-1.5 items-center">
                    <Input
                        placeholder="Amazon URL..."
                        value={amazonUrl}
                        onChange={(e) => setAmazonUrl(e.target.value)}
                        className="bg-transparent border-none flex-1 focus-visible:ring-0 h-7 text-[10px] px-1 font-bold"
                    />
                    <Button size="sm" onClick={onAddAmazon} className="bg-orange-500 hover:bg-orange-600 h-6 w-6 p-0 rounded-md">
                        <RefreshCw className="w-3 h-3 text-white" />
                    </Button>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block" />

            {/* Google Drive Repository */}
            <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm group">
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Database className="w-3.5 h-3.5" />
                </div>
                <Button
                    variant="ghost"
                    className="flex-1 justify-between h-7 px-1 text-[9px] hover:bg-slate-50 transition-all font-black uppercase tracking-widest rounded-md"
                    onClick={onSyncDrive}
                    disabled={isSyncing}
                >
                    <div className="flex items-center gap-2">
                        {driveFolderId ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Database className="w-3 h-3 text-slate-400" />}
                        <span className={driveFolderId ? "text-slate-800" : "text-slate-500"}>
                            {driveFolderId ? t('drive_linked') : t('link_drive')}
                        </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                </Button>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block" />

            {/* Competitors Feed */}
            <div className="flex-1 min-w-[240px] flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm group">
                <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 flex gap-1.5 items-center">
                    <Input
                        placeholder="Competitor URL..."
                        value={newCompetitorUrl}
                        onChange={(e) => setNewCompetitorUrl(e.target.value)}
                        className="bg-transparent border-none flex-1 focus-visible:ring-0 h-7 text-[10px] px-1 font-bold"
                    />
                    <div className="flex items-center gap-1.5">
                        {competitorLinks?.length > 0 && (
                            <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">{competitorLinks.length}</span>
                        )}
                        <Button size="sm" onClick={onAddCompetitor} className="bg-rose-600 hover:bg-rose-700 h-6 w-6 p-0 rounded-md">
                            <Plus className="w-3 h-3 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronRight(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
}
