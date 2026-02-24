"use client";

import { useState, useEffect } from "react";
import { Clock, Filter, Search, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    CONNECTION: "bg-blue-100 text-blue-800",
    PRODUCT: "bg-emerald-100 text-emerald-800",
    ORDER: "bg-amber-100 text-amber-800",
    SYSTEM: "bg-purple-100 text-purple-800",
    DIAGNOSTICO: "bg-pink-100 text-pink-800",
    AGENT_ACTION: "bg-orange-100 text-orange-800",
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
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="w-6 h-6" />
                        Historial de Auditoría
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Registro de todas las acciones críticas del sistema
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAudit}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <Select value={entityFilter} onValueChange={setEntityFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por entidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas las entidades</SelectItem>
                                    <SelectItem value="CONNECTION">Conexiones</SelectItem>
                                    <SelectItem value="PRODUCT">Productos</SelectItem>
                                    <SelectItem value="ORDER">Pedidos</SelectItem>
                                    <SelectItem value="DIAGNOSTICO">Diagnóstico</SelectItem>
                                    <SelectItem value="SYSTEM">Sistema</SelectItem>
                                    <SelectItem value="AGENT_ACTION">Agentes IA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por acción o entidad..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && fetchAudit()}
                                className="max-w-xs"
                            />
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {entries.length} registros
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Cargando registros...
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No hay registros de auditoría.{" "}
                            {entityFilter !== "ALL" && (
                                <button
                                    className="text-primary underline"
                                    onClick={() => setEntityFilter("ALL")}
                                >
                                    Quitar filtro
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">Fecha</th>
                                        <th className="text-left p-3 font-medium">Acción</th>
                                        <th className="text-left p-3 font-medium">Entidad</th>
                                        <th className="text-left p-3 font-medium">ID Entidad</th>
                                        <th className="text-left p-3 font-medium">Actor</th>
                                        <th className="text-left p-3 font-medium">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 whitespace-nowrap flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs">{formatDate(entry.createdAt)}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm">
                                                    {ACTION_ICONS[entry.action] || "📋"}{" "}
                                                    {entry.action}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${ENTITY_COLORS[entry.entity] || "bg-gray-100"}`}
                                                >
                                                    {entry.entity}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {entry.entityId}
                                                </code>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {entry.actorType}
                                                </Badge>
                                            </td>
                                            <td className="p-3 max-w-xs">
                                                {entry.newValue && (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-xs text-muted-foreground hover:text-foreground">
                                                            Ver detalles
                                                        </summary>
                                                        <pre className="text-[10px] mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
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
        </div>
    );
}
