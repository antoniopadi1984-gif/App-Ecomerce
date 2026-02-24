"use client";

import React, { useState } from "react";
import {
    ShoppingCart,
    ShieldCheck,
    Truck,
    MessageSquare,
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    RefreshCw,
    MapPin,
    Upload,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import {
    syncRecentShopifyOrders,
    syncBeepingStatuses,
    autoGeocodeAllPending,
    importCRMFile
} from "@/app/pedidos/actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesModule } from "./SalesModule";
import { FraudModule } from "./FraudModule";
import { cn } from "@/lib/utils";
import { ds } from "@/lib/styles/design-system";
import { t } from "@/lib/constants/translations";

interface OrdersHubClientProps {
    storeId: string;
    productId: string;
    productTitle?: string;
}

export function OrdersHubClient({ storeId, productId, productTitle }: OrdersHubClientProps) {
    const [activeTab, setActiveTab] = useState("ALL");
    const [isSyncing, setIsSyncing] = useState(false);

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        setIsSyncing(true);
        try {
            const res = await action();
            if (res.success) {
                toast.success(successMsg);
            } else {
                toast.error(res.message || "Error al procesar acción");
            }
        } catch (e) {
            toast.error("Error crítico de conexión");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-white/95 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                    <TabsList className="bg-slate-100/50 p-0.5 h-8 justify-start gap-1 rounded-lg border border-slate-200/50 overflow-x-auto no-scrollbar">
                        {[
                            { v: "ALL", t: "Todos" },
                            { v: "PENDING", t: "Pendientes" },
                            { v: "PROCESSING", t: "Preparación" },
                            { v: "IN_TRANSIT", t: "En Tránsito" },
                            { v: "OUT_FOR_DELIVERY", t: "En Reparto" },
                            { v: "DELIVERED", t: "Entregados" },
                            { v: "INCIDENCE", t: "Incidencias" },
                            { v: "RETURNED", t: "Devueltos" },
                            { v: "CANCELLED", t: "Cancelados" },
                            { v: "FRAUD", t: "Fraude" },
                            { v: "DRAFT", t: "Borradores" }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.v}
                                value={tab.v}
                                className="px-3 h-7 rounded-md data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-xs font-black text-[8px] uppercase tracking-widest text-slate-500 transition-all whitespace-nowrap"
                            >
                                {tab.t}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[8px] font-black uppercase tracking-widest gap-1.5 border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-xs"
                            onClick={() => handleAction(() => syncRecentShopifyOrders(storeId), "Shopify sincronizado")}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={cn("w-3 h-3 text-slate-400", isSyncing && "animate-spin")} />
                            Shopify
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[8px] font-black uppercase tracking-widest gap-1.5 border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-xs"
                            onClick={() => handleAction(() => syncBeepingStatuses(storeId, 0), "Logística Beeping actualizada")}
                            disabled={isSyncing}
                        >
                            <Zap className="w-3 h-3 text-slate-400" />
                            Beeping
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[8px] font-black uppercase tracking-widest gap-1.5 border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-xs"
                            onClick={() => handleAction(() => autoGeocodeAllPending(storeId), "Geocodificación completada")}
                            disabled={isSyncing}
                        >
                            <MapPin className="w-3 h-3 text-slate-400" />
                            Maps
                        </Button>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                accept=".csv"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        formData.append("storeId", storeId);
                                        handleAction(() => importCRMFile(formData), "CRM Importado correctamente");
                                    }
                                }}
                            />
                            <div className="h-7 px-3 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-xs">
                                <Upload className="w-3 h-3 text-slate-400" />
                                Import
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full bg-[#f6f7f9] overflow-y-auto">
                        <div className="max-w-[1700px] mx-auto p-4">
                            <SalesModule storeId={storeId} productId={productId} forcedStatus={activeTab} />
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
