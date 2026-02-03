"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2, AlertTriangle, RefreshCw, Server,
    Activity, MapPin, Database, Cloud
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SystemStatusProps {
    className?: string;
    lastSync?: Date;
    totalOrders?: number;
}

export function SystemStatus({ className, lastSync, totalOrders }: SystemStatusProps) {
    const [syncTime, setSyncTime] = useState<string>("Sync Pending");
    const [statuses, setStatuses] = useState({
        shopify: "checking",
        beeping: "checking",
        google: "checking",
        database: "checking"
    });

    useEffect(() => {
        if (lastSync) {
            setSyncTime(`Sync: ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`);
        }
    }, [lastSync]);

    useEffect(() => {
        // Simulation of health checks (Real checks would ping API endpoints)
        const checkHealth = async () => {
            await new Promise(r => setTimeout(r, 1000));
            setStatuses({
                shopify: "operational",
                beeping: "operational",
                google: "operational",
                database: "operational"
            });
        };
        checkHealth();
    }, []);

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
            <StatusCard
                icon={Cloud}
                label="Shopify API"
                status={statuses.shopify as any}
                detail={syncTime}
            />
            <StatusCard
                icon={Server}
                label="Beeping WMS"
                status={statuses.beeping as any}
                detail="Latency: 120ms"
            />
            <StatusCard
                icon={MapPin}
                label="Google Maps"
                status={statuses.google as any}
                detail="Geocoding: Active"
            />
            <StatusCard
                icon={Database}
                label="Master DB"
                status={statuses.database as any}
                detail={`${totalOrders || 0} Records`}
            />
        </div>
    );
}

function StatusCard({ icon: Icon, label, status, detail }: any) {
    const isOk = status === "operational";
    const isDegraded = status === "degraded";
    const isChecking = status === "checking";

    return (
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isOk ? "bg-emerald-50 text-emerald-600" :
                    isDegraded ? "bg-amber-50 text-amber-600" :
                        "bg-slate-50 text-slate-400"
            )}>
                {isChecking ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{label}</span>
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isOk ? "bg-emerald-500" :
                            isDegraded ? "bg-amber-500" :
                                "bg-slate-300"
                    )} />
                </div>
                <span className="text-xs font-bold truncate text-foreground">{detail}</span>
            </div>
        </div>
    );
}
