
"use client";

import React from "react";
import { Package, Plus, Search, Filter, AlertTriangle, Layers, AlertCircle, Link2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { KpiCard } from "@/components/ui/StandardCards";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store/store-context";
import Link from "next/link";

export default function InventarioPage() {
    const { activeStoreId } = useStore();
    const [isConnected, setIsConnected] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        if (activeStoreId) {
            fetch(`/api/connections/status?storeId=${activeStoreId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [activeStoreId]);

    if (isConnected === false) {
        return (
            <PageShell>
                <ModuleHeader title="Gestión de Inventario" subtitle="Control de stock, variantes y logística de entrada" icon={Package} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Shopify No Conectado</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Debes vincular tu tienda oficial de Shopify para ver el inventario.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-sm">
                            <Link2 className="w-4 h-4 mr-2" />
                            Ir a Conexiones
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell loading={isConnected === null} loadingMessage="VERIFICANDO CONEXIÓN...">
            <ModuleHeader
                title="Gestión de Inventario"
                subtitle="Control de stock, variantes y logística de entrada"
                icon={Package}
                actions={
                    <Button className="bg-rose-600 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                    </Button>
                }
            />

            <div className="space-y-6 max-w-7xl mx-auto p-6">

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="BUSCAR PRODUCTO POR SKU O NOMBRE..." className="glass-input pl-10 h-10 rounded-xl" />
                    </div>
                    <Button variant="outline" className="glass-card h-10 px-4 rounded-xl text-[10px] font-black uppercase border-none">
                        <Filter className="w-4 h-4 mr-2" /> Filtros
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "STOCK TOTAL", value: "1.420", unit: "unidades", status: "OK", color: "emerald" },
                        { label: "BAJO STOCK", value: "3", unit: "SKUs", status: "CRÍTICO", color: "rose" },
                        { label: "VALOR ALMACÉN", value: "42.500€", unit: "PVP", status: "Nominal", color: "rose" },
                    ].map((stat, i) => (
                        <KpiCard
                            key={i}
                            label={stat.label}
                            value={
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black italic tracking-tight text-slate-900">{stat.value}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{stat.unit}</span>
                                </div>
                            }
                            status={stat.status === "OK" ? "OK" : stat.status === "CRÍTICO" ? "CRITICAL" : undefined}
                        />
                    ))}
                </div>

                <Card className="bg-white border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center p-12 mt-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Módulo de Inventario en Propagación</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mt-2">Estamos migrando los datos de almacén central a la nueva interfaz Glass.</p>
                    <div className="flex gap-4 mt-8">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                            <AlertTriangle className="w-3.5 h-3.5" /> Alertas Listas
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                            <Layers className="w-3.5 h-3.5" /> Sincronización 80%
                        </div>
                    </div>
                </Card>
            </div >
        </PageShell >
    );
}
