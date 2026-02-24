"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, Server, Video, ShoppingCart, Globe, HardDrive, ShieldAlert, Activity, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModuleHealth {
    status: 'operational' | 'degraded' | 'offline' | 'disabled' | 'reviving';
    latency?: number;
    details?: string;
    lastChecked: string;
}

import { t } from "@/lib/constants/translations";

export function HealthDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const refreshHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/system/health');
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshHealth();
        const interval = setInterval(refreshHealth, 60000); // 1 min auto-refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return (
            <div className="w-full h-24 flex items-center justify-center animate-pulse border rounded-lg border-dashed">
                <Activity className="text-slate-300 h-6 w-6 animate-spin" />
                <span className="ml-2 text-xs text-slate-400 font-medium">{t('syncing')}</span>
            </div>
        );
    }

    const StatusCard = ({ title, icon: Icon, health }: { title: string, icon: any, health: ModuleHealth | undefined }) => {
        if (!health) return null;

        const isOperational = health.status === 'operational';
        const isOffline = health.status === 'offline';
        const isDegraded = health.status === 'degraded';

        const getStatusLabel = (status: string) => {
            if (status === 'operational') return t('synced');
            return t(status as any) || status;
        };

        return (
            <div className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-300",
                "bg-white/40 border-slate-100/40 hover:bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]",
                isOffline && "border-rose-100 bg-rose-50/20",
                isDegraded && "border-amber-100 bg-amber-50/20"
            )}>
                {/* Visual indicator - Minimalist pulse */}
                <div className="relative shrink-0 flex items-center justify-center">
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isOperational ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    {isOperational && <div className="absolute h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping opacity-40" />}
                </div>

                <div className="flex-shrink-0">
                    <Icon className={cn(
                        "h-3 w-3 transition-colors duration-300",
                        isOperational ? "text-slate-400 group-hover:text-emerald-500" : "text-slate-300"
                    )} />
                </div>

                <div className="flex flex-col min-w-0 pr-1 text-left">
                    <h4 className="text-[8px] font-black uppercase text-slate-850 tracking-tight leading-none whitespace-nowrap group-hover:text-slate-950 transition-colors">
                        {title}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn(
                            "text-[6px] font-bold uppercase tracking-[0.1em] leading-none",
                            isOperational ? "text-slate-400" : isDegraded ? "text-amber-600" : "text-rose-600"
                        )}>
                            {getStatusLabel(health.status)}
                        </span>
                        {health.latency && isOperational && (
                            <span className="text-[6px] font-medium text-slate-300 leading-none">
                                • {health.latency}ms
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 text-left">
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-gradient-to-r from-blue-600 to-transparent rounded-full" />
                    <h2 className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase italic">{t('global_infrastructure')}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{t('active_nodes')}: 8/8</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={refreshHealth} className={cn("h-4 w-4 hover:bg-slate-100 rounded", loading && "animate-spin")}>
                        <RefreshCw className="h-2.5 w-2.5 text-slate-300" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <StatusCard title="Worker Instance" icon={Server} health={health?.worker} />
                <StatusCard title="Engine Render" icon={Video} health={health?.engine} />
                <StatusCard title="Shopify API" icon={ShoppingCart} health={health?.shopify} />
                <StatusCard title="Meta Marketing" icon={Globe} health={health?.meta} />
                <StatusCard title="Logistics OS" icon={ShieldAlert} health={health?.beeping} />
                <StatusCard title="Storage Cloud" icon={FileSpreadsheet} health={health?.google} />
                <StatusCard title="Database Core" icon={Database} health={health?.database} />
                <StatusCard title="Local SSD" icon={HardDrive} health={health?.storage} />
            </div>
        </div>
    );
}
