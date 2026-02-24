"use client";

import React from "react";
import {
    Play,
    MoreVertical,
    BarChart3,
    Eye,
    CheckCircle2,
    AlertCircle,
    Info,
    Clapperboard,
    TrendingUp,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AssetGridProps {
    assets: any[];
    onAssetClick: (asset: any) => void;
}

export function AssetGrid({ assets, onAssetClick }: AssetGridProps) {
    if (!assets || assets.length === 0) {
        return (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                    <BarChart3 className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold text-base">Sin creativos aún</h3>
                <p className="text-slate-500 text-xs max-w-xs mt-1">Usa el botón de generar para crear tus primeros videos UGC con IA.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onClick={() => onAssetClick(asset)} />
            ))}
        </div>
    );
}

function AssetCard({ asset, onClick }: { asset: any, onClick: () => void }) {
    const isReady = asset.verdict === "STABLE" || asset.verdict === "READY";
    const isWinner = asset.hookRate > 30 || asset.ctr > 2;

    return (
        <div
            onClick={onClick}
            className="group glass-panel rounded-xl overflow-hidden shadow-sm hover:shadow-sm hover:shadow-sm hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
        >
            {/* Visual Preview Container */}
            <div className="relative aspect-[9/11] bg-slate-900 group-hover:scale-[1.01] transition-transform duration-500">
                {asset.driveUrl ? (
                    <video
                        src={asset.driveUrl}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        muted
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900">
                        <Clapperboard className="w-8 h-8 text-slate-700" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Previsualización no disp.</span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <Badge className={cn(
                        "font-black text-[8px] uppercase tracking-widest border-none px-1.5 py-0.5 shadow-sm",
                        isReady ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                        {asset.verdict || "Testing"}
                    </Badge>
                    {isWinner && (
                        <Badge className="bg-rose-600 text-white font-black text-[8px] uppercase tracking-widest border-none px-1.5 py-0.5 shadow-sm flex items-center gap-1">
                            <Sparkles className="w-2 h-2" />
                            Winner
                        </Badge>
                    )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest truncate">{asset.nomenclatura || "UGC_GEN_01"}</span>
                        <h3 className="text-white font-bold text-xs truncate leading-tight mt-0.5">{asset.name}</h3>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                </div>
            </div>

            {/* Metrics Info */}
            <div className="p-3.5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CTR</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs font-black text-slate-900">{(asset.ctr || 0).toFixed(2)}%</span>
                            {(asset.ctr || 0) > 1.5 && <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spend</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5">${(asset.spend || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer Tag */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-slate-400">
                        <Info className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold uppercase tracking-tight">{asset.angulo?.slice(0, 12) || "Direct Angle"}...</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}


