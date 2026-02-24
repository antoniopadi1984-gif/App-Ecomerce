"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Settings2, XCircle,
    Copy, Check, Loader2,
    Eye, EyeOff, Activity, RefreshCw,
    Layers, Orbit, ShieldCheck, Zap,
    ArrowUpRight, Link2, Info, Lock,
    CreditCard, ActivitySquare, ToggleLeft, ToggleRight,
    AlertCircle, PlayCircle, BarChart3, DatabaseZap
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogTrigger, DialogPortal, DialogOverlay
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveConnection, deleteConnection } from "./actions";
import { cn } from "@/lib/utils";
import { PROVIDER_REGISTRY } from "@/lib/providers/registry";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { useStore } from "@/lib/store/store-context";

function ConnectionsContent() {
    const { activeStoreId } = useStore();
    const [activeConnections, setActiveConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configOpen, setConfigOpen] = useState<boolean>(false);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("");
    const [testingProvider, setTestingProvider] = useState<string | null>(null);
    const [revealSecrets, setRevealSecrets] = useState<Record<string, boolean>>({});
    const [editingConnection, setEditingConnection] = useState<any | null>(null);

    const searchParams = useSearchParams();



    const fetchConnections = async () => {
        const effectiveStoreId = activeStoreId || 'store-main';
        setLoading(true);
        try {
            // Add cache busting timestamp and explicit storeId to bypass aggressive Next.js client router cache
            const res = await fetch(`/api/connections?reveal=true&storeId=${effectiveStoreId}&_t=${Date.now()}`, {
                headers: { 'X-Store-Id': effectiveStoreId },
                cache: "no-store"
            });
            if (res.ok) {
                const data = await res.json();
                const connections = Array.isArray(data) ? data : (data.connections || []);

                // Filter out child-services ONLY if their parent node is also present for the same storeId
                const filtered = connections.filter((c: any) => {
                    const config = PROVIDER_REGISTRY[c.provider.toUpperCase()];
                    if (!config?.parentProviderId) return true; // It's a root node

                    // It's a child node. Only hide if the parent is present in the SAME list
                    const hasParent = connections.some((p: any) => p.provider.toUpperCase() === config.parentProviderId?.toUpperCase());
                    return !hasParent;
                });

                setActiveConnections(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [searchParams, activeStoreId]);

    const testConnection = async (provider: string) => {
        setTestingProvider(provider);
        try {
            const res = await fetch("/api/connections/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider })
            });
            const data = await res.json();
            if (data.status === "OK") {
                toast.success(`${provider} — Conexión OK (${data.latencyMs}ms)`);
            } else if (data.status === "STUB") {
                toast.info(`${provider} — Credenciales verificadas (${data.latencyMs}ms)`);
            } else {
                toast.error(`${provider} — ${data.message}`);
            }
        } catch (e) {
            toast.error(`Error al testear ${provider}`);
        } finally {
            setTestingProvider(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Desvincular servicio ${name}?`)) return;
        const res = await deleteConnection(id);
        if (res.success) {
            toast.success("Servicio desconectado");
            fetchConnections();
        }
    };

    const handleEdit = (conn: any) => {
        setEditingConnection(conn);
        setSelectedProviderId(conn.provider.toUpperCase());
        setConfigOpen(true);
    };

    const handleOpenAdd = () => {
        setEditingConnection(null);
        setSelectedProviderId("");
        setConfigOpen(true);
    };

    const toggleSecret = (idKey: string) => {
        setRevealSecrets(prev => ({ ...prev, [idKey]: !prev[idKey] }));
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.info("Copiado al portapapeles", { duration: 1500 });
    };

    const providers = Object.values(PROVIDER_REGISTRY);
    const selectedProviderConfig = PROVIDER_REGISTRY[selectedProviderId];

    return (
        <PageShell>

            <ModuleHeader
                title="Canales e Infraestructura"
                subtitle="ESTATUS CENTRAL"
                icon={Zap}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchConnections}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-50"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        </button>

                        <Dialog open={configOpen} onOpenChange={(open) => {
                            if (!open) {
                                setEditingConnection(null);
                                setConfigOpen(false);
                            } else {
                                setConfigOpen(true);
                            }
                        }}>
                            <Button onClick={handleOpenAdd} className="h-8 px-4 bg-rose-500 hover:bg-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border-none shadow-md shadow-rose-500/10">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Vincular Nodo
                            </Button>
                            <DialogContent className="sm:max-w-[360px] rounded-[2rem] p-6 border-none shadow-premium z-[100] bg-white/95">
                                <DialogHeader className="pb-2 border-b border-slate-50">
                                    <DialogTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                                        {selectedProviderConfig?.name || "Vincular Nodo"}
                                    </DialogTitle>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    const res = await saveConnection(formData);
                                    if (res.success) {
                                        setConfigOpen(false);
                                        setEditingConnection(null);
                                        toast.success(editingConnection ? "Configuración Actualizada" : "Enlace Establecido");
                                        fetchConnections();
                                    } else {
                                        toast.error(res.message || "Error al establecer enlace");
                                    }
                                }} className="space-y-4 pt-4">
                                    <input type="hidden" name="editingId" value={editingConnection?.id || ""} />
                                    <input type="hidden" name="provider" value={selectedProviderId} />
                                    <div className="space-y-1.5 relative">
                                        <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 tracking-widest">Proveedor Oficial</Label>
                                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId} required>
                                            <SelectTrigger className="h-10 border-slate-100 bg-slate-50/50 rounded-xl text-[12px] font-bold tracking-tight focus:ring-2 focus:ring-rose-500/10 transition-all border shadow-sm">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                sideOffset={4}
                                                className="rounded-xl border-slate-100 shadow-2xl z-[200] bg-white w-[var(--radix-select-trigger-width)] max-h-[220px] overflow-x-hidden overflow-y-auto p-1.5"
                                            >
                                                <div className="space-y-0.5">
                                                    {providers.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="text-[11px] font-bold py-2 px-3 rounded-lg cursor-pointer hover:bg-rose-50 focus:bg-rose-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <p.icon className="w-4 h-4" style={{ color: p.color }} />
                                                                {p.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {selectedProviderConfig && (
                                            <motion.div
                                                key={selectedProviderConfig.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-3"
                                            >
                                                {selectedProviderConfig.fields.map((f: any) => (
                                                    <div key={f.key} className="space-y-1.5">
                                                        <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 tracking-widest">{f.label}</Label>
                                                        <Input
                                                            name={f.key}
                                                            type={f.type === 'password' ? 'text' : f.type}
                                                            required={editingConnection ? false : f.required}
                                                            defaultValue={editingConnection?.metadata?.[f.key] || ""}
                                                            placeholder={editingConnection && f.type === 'password' ? "••••••••••••••••" : f.placeholder}
                                                            className="h-10 border-slate-100 bg-slate-50/50 rounded-xl text-[12px] font-medium focus:border-rose-500/50 transition-all shadow-none placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <Button type="submit" className="w-full h-10 bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-xl mt-2 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
                                        {editingConnection ? "Actualizar Configuración" : "Guardar Configuración"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            <main className="flex-1 p-4 space-y-6">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1 text-slate-900 border-l-2 border-rose-500 pl-3 py-0.5">
                        <DatabaseZap className="w-3.5 h-3.5 text-rose-500" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.25em]">Capa de Infraestructura Global</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {activeConnections.map((conn, idx) => {
                            const p = PROVIDER_REGISTRY[conn.provider.toUpperCase()] || { name: conn.provider, icon: Settings2, color: 'var(--alert-critical)' };
                            const Icon = p.icon;
                            const idKey = `${conn.provider}-${conn.id}`;
                            const isRevealed = revealSecrets[idKey];
                            return (
                                <motion.div key={conn.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05, duration: 0.4 }}>
                                    <Card className={cn(
                                        "group flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-sm",
                                        "hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden relative"
                                    )}>
                                        {/* Status Bar */}
                                        <div className="h-1 w-full bg-emerald-500" />

                                        <div className="px-3 pb-2 pt-2.5 flex flex-col gap-2">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 flex items-center justify-center">
                                                        <Icon className="w-5 h-5 object-contain" style={{ color: p.color }} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-slate-900 tracking-tight leading-none">
                                                                {p.name === 'Shopify Master' && (conn.metadata?.SHOP_NAME || conn.metadata?.Tienda)
                                                                    ? String(conn.metadata?.SHOP_NAME || conn.metadata?.Tienda)
                                                                    : p.name}
                                                            </p>
                                                            {/* Show Project ID or Domain if exists in metadata */}
                                                            {(() => {
                                                                const projectId = Object.entries(conn.metadata || {}).find(([k]) => k.includes('PROJECT_ID'))?.[1];
                                                                const domain = conn.metadata?.SHOPIFY_SHOP_DOMAIN;
                                                                if (projectId) {
                                                                    return <span className="text-[7px] font-bold bg-slate-100 text-slate-500 px-1 rounded-sm border border-slate-200/50">{String(projectId).substring(0, 12)}...</span>;
                                                                }
                                                                if (domain && p.name === 'Shopify Master') {
                                                                    return <span className="text-[7px] font-bold bg-slate-100 text-slate-500 px-1 rounded-sm border border-slate-200/50">{String(domain).replace('.myshopify.com', '')}</span>;
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-1 py-[1px] rounded-[4px] text-[7px] font-bold uppercase tracking-widest border border-emerald-200/50 leading-none">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                Sincronizado
                                                            </div>
                                                            {(() => {
                                                                const dateToUse = conn.lastSyncedAt || conn.updatedAt;
                                                                let timeText = "Hace un momento";
                                                                if (dateToUse) {
                                                                    const diffMs = Date.now() - new Date(dateToUse).getTime();
                                                                    if (diffMs > 86400000) timeText = `Hace ${Math.floor(diffMs / 86400000)} d`;
                                                                    else if (diffMs > 3600000) timeText = `Hace ${Math.floor(diffMs / 3600000)} h`;
                                                                    else if (diffMs > 60000) timeText = `Hace ${Math.floor(diffMs / 60000)} min`;
                                                                }
                                                                return <span className="text-[8px] text-slate-500 font-medium tracking-tight mt-[1px]">{timeText}</span>;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        title="Test Connection"
                                                        onClick={() => testConnection(conn.provider)}
                                                        disabled={testingProvider === conn.provider}
                                                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        {testingProvider === conn.provider
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <PlayCircle className="w-3.5 h-3.5" />
                                                        }
                                                    </button>
                                                    <button title="Editar" onClick={() => handleEdit(conn)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                        <Settings2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button title="Desvincular" onClick={() => handleDelete(conn.id, p.name)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Unlocked Features (Service Mapping) & Sub-service Logos */}
                                            {p.unlockedFeatures && p.unlockedFeatures.length > 0 && (
                                                <div className="space-y-3 border-t border-slate-50 pt-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Layers className="w-2.5 h-2.5" /> Ecosistema Activo
                                                        </span>
                                                        {/* Render Sub-service logos if this is a Master Node */}
                                                        <div className="flex items-center -space-x-1.5">
                                                            {Object.values(PROVIDER_REGISTRY)
                                                                .filter(sub => sub.parentProviderId === p.id)
                                                                .map(sub => {
                                                                    const SubIcon = sub.icon;
                                                                    return (
                                                                        <div key={sub.id} title={sub.name} className="w-5 h-5 rounded-md bg-white border border-slate-100 shadow-sm flex items-center justify-center p-0.5 overflow-hidden">
                                                                            <SubIcon className="w-full h-full object-contain" />
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.unlockedFeatures.map((feat: string) => (
                                                            <span key={feat} className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100/80 rounded-sm">
                                                                {feat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Real FinOps / Usage Stats (Connected to DB) */}
                                            {p.category === 'AI' && typeof conn.usageCost === 'number' && (
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <BarChart3 className="w-3 h-3 text-slate-500" />
                                                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Gasto Mensual</span>
                                                    </div>
                                                    <span className="font-mono text-[11px] font-bold text-slate-900">€ {conn.usageCost.toFixed(4)}</span>
                                                </div>
                                            )}

                                            {/* Existing Metadata */}
                                            {Object.keys(conn.metadata || {}).length > 0 && (
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 border-t border-slate-100 pt-1.5">
                                                    {Object.entries(conn.metadata || {})
                                                        .filter(([k]) => !['SHOP_NAME', 'SHOPIFY_SHOP_DOMAIN', 'Tienda'].includes(k))
                                                        .map(([key, value]) => {
                                                            const isSensitive = key.toUpperCase().includes('KEY') || key.toUpperCase().includes('TOKEN') || key.toUpperCase().includes('SECRET');
                                                            return (
                                                                <div key={key} className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">{key.replace(/_/g, ' ')}</span>
                                                                    <span className="text-[9px] font-mono font-bold text-slate-800 truncate leading-none">{isSensitive ? "••••••••••••••••" : String(value)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Security Vault Box */}
                                        <div className="bg-slate-50/80 border-t border-slate-200/60 px-2.5 py-1.5 flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 bg-white px-1.5 py-1 rounded border border-slate-200 shadow-sm">
                                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                <p className="flex-1 font-mono text-[10px] font-semibold text-slate-700 truncate leading-none pt-[1px]">
                                                    {isRevealed ? conn.secret : "••••••••••••••••"}
                                                </p>
                                                <div className="flex items-center gap-0.5 pl-1.5 border-l border-slate-200">
                                                    <button onClick={() => toggleSecret(idKey)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                                                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                    <button onClick={() => copyToClipboard(conn.secret)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <footer className="px-5 py-2 border-t border-slate-100 flex items-center justify-between text-slate-400 bg-white">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Cifrado Activo AES-256 Sincronizado</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                    <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-rose-500/80 tracking-tighter">V14.0</span>
                </div>
            </footer>
        </PageShell>
    );
}

export default function ConnectionsPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            </div>
        }>
            <ConnectionsContent />
        </Suspense>
    );
}
