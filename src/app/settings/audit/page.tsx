"use client";

import { useState, useEffect } from "react";
import { Clock, Filter, Search, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";

interface AuditEntry {
    id: string;
    storeId: string;
    userId: string | null;
    action: string;
    entity: string;
    entityId: string;
    oldValue: string | null;
    newValue: string | null;
    actorType: string;
    createdAt: string;
}

const ENTITY_COLORS: Record<string, string> = {
    CONNECTION: "bg-blue-50 text-blue-600",
    PRODUCT: "bg-emerald-50 text-emerald-600",
    ORDER: "bg-amber-50 text-amber-600",
    SYSTEM: "bg-purple-50 text-purple-600",
    DIAGNOSTICO: "bg-pink-50 text-pink-600",
    AGENT_ACTION: "bg-orange-50 text-orange-600",
};

const ACTION_ICONS: Record<string, string> = {
    CONNECTION_TEST: "🔌",
    CONNECTION_CREATED: "✅",
    CONNECTION_UPDATED: "📝",
    CONNECTION_DELETED: "🗑️",
    SEED_EXECUTED: "🌱",
    DIAG_LINKS_SAVED: "🔗",
    DIAG_NOMENCLATURE: "📋",
    DIAG_DRIVE_FOLDER: "📁",
    DIAG_ASSET_UPLOAD: "📤",
    PRODUCT_CREATED: "📦",
    PRODUCT_UPDATED: "📝",
};

export default function AuditPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [entityFilter, setEntityFilter] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (entityFilter !== "ALL") params.set("entity", entityFilter);
            if (searchTerm) params.set("search", searchTerm);
            const res = await fetch(`/api/settings/audit?${params}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (e) {
            console.error("Error fetching audit:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAudit();
    }, [entityFilter]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString("es-ES", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    };

    const formatValue = (val: string | null) => {
        if (!val) return "—";
        try {
            const parsed = JSON.parse(val);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return val;
        }
    };

    return (
        <PageShell>
            <ModuleHeader
                title="Historial de Auditoría"
                subtitle="LOG DE ACCIONES AGÉNTICAS & SISTEMA"
                icon={Database}
                actions={
                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest" onClick={fetchAudit}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" /> RECARGAR
                    </Button>
                }
            />

            <main className="p-4 space-y-4">
                <Card className="border-slate-100 shadow-sm rounded-xl">
                    <CardContent className="p-3">
                        <div className="flex gap-3 items-center flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                <Select value={entityFilter} onValueChange={setEntityFilter}>
                                    <SelectTrigger className="w-[150px] h-8 text-[11px] font-bold uppercase rounded-lg">
                                        <SelectValue placeholder="Entidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">TODAS</SelectItem>
                                        <SelectItem value="CONNECTION">CONEXIONES</SelectItem>
                                        <SelectItem value="PRODUCT">PRODUCTOS</SelectItem>
                                        <SelectItem value="ORDER">PEDIDOS</SelectItem>
                                        <SelectItem value="DIAGNOSTICO">DIAGNÓSTICO</SelectItem>
                                        <SelectItem value="SYSTEM">SISTEMA</SelectItem>
                                        <SelectItem value="AGENT_ACTION">AGENTES IA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && fetchAudit()}
                                    className="h-8 text-[11px] font-bold uppercase rounded-lg max-w-xs"
                                />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-6 px-3 bg-slate-50 border-none">
                                {entries.length} LOGS
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse italic">
                                Sincronizando logs...
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="p-12 text-center text-slate-300">
                                <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">No hay registros</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b bg-slate-50/50">
                                            <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                                            <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</th>
                                            <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Entidad</th>
                                            <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Actor</th>
                                            <th className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="p-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-500">{formatDate(entry.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs">{ACTION_ICONS[entry.action] || "📋"}</span>
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{entry.action}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tight border-none", ENTITY_COLORS[entry.entity] || "bg-slate-50")}>
                                                        {entry.entity}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    {entry.actorType}
                                                </td>
                                                <td className="p-3">
                                                    {entry.newValue && (
                                                        <details className="cursor-pointer group">
                                                            <summary className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
                                                                DATA
                                                            </summary>
                                                            <pre className="text-[9px] mt-2 bg-slate-950 text-slate-300 p-3 rounded-lg overflow-auto max-h-32 shadow-xl border border-white/10">
                                                                {formatValue(entry.newValue)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </PageShell>
    );
}
