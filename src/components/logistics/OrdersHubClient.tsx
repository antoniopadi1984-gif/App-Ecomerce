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
    Loader2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesModule } from "./SalesModule";
import { FraudModule } from "./FraudModule";
import { ds } from "@/lib/styles/design-system";
import { t } from "@/lib/constants/translations";

interface OrdersHubClientProps {
    productId: string;
    productTitle?: string;
}

export function OrdersHubClient({ productId, productTitle }: OrdersHubClientProps) {
    const [activeTab, setActiveTab] = useState("ALL");

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 py-2 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <TabsList className="bg-transparent p-0 h-10 w-full justify-start gap-6 rounded-none border-none">
                        <TabsTrigger value="ALL" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Todos
                        </TabsTrigger>
                        <TabsTrigger value="PENDING" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Pendientes
                        </TabsTrigger>
                        <TabsTrigger value="SHIPPED" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Enviados
                        </TabsTrigger>
                        <TabsTrigger value="DELIVERED" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Entregados
                        </TabsTrigger>
                        <TabsTrigger value="INCIDENCE" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Incidencias
                        </TabsTrigger>
                        <TabsTrigger value="ABANDONED" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Abandonados
                        </TabsTrigger>
                        <TabsTrigger value="DRAFT" className="px-0 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-bold text-xs shadow-none transition-all">
                            Borradores
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full bg-[#f6f7f9] overflow-y-auto">
                        <div className="max-w-[1700px] mx-auto p-4">
                            <SalesModule productId={productId} forcedStatus={activeTab} />
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
