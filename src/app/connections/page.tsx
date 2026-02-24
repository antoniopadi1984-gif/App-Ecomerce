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
    ArrowUpRight, Link2, Info, Lock
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

function ConnectionsContent() {
    const [activeConnections, setActiveConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configOpen, setConfigOpen] = useState<boolean>(false);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("");
    const [testingProvider, setTestingProvider] = useState<string | null>(null);
    const [revealSecrets, setRevealSecrets] = useState<Record<string, boolean>>({});

    const searchParams = useSearchParams();

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/connections?reveal=true");
            if (res.ok) {
                const data = await res.json();
                setActiveConnections(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [searchParams]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Desvincular servicio ${name}?`)) return;
        const res = await deleteConnection(id);
        if (res.success) {
            toast.success("Servicio desconectado");
            fetchConnections();
        }
    };

    const toggleSecret = (idKey: string) => {
        setRevealSecrets(prev => ({ ...prev, [idKey]: !prev[idKey] }));
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.info("Copiado al portapapeles", { duration: 1500 });
    };

    const testConnection = async (providerId: string) => {
        setTestingProvider(providerId);
        try {
            const res = await fetch("/api/connections/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: providerId }),
            });
            const result = await res.json();
            if (result.status === "OK") toast.success("Enlace Óptimo");
            else toast.error(result.message || "Fallo de respuesta");
        } catch (e) {
            toast.error("Error de conexión");
        }
        setTestingProvider(null);
    };

    const providers = Object.values(PROVIDER_REGISTRY);
    const selectedProviderConfig = PROVIDER_REGISTRY[selectedProviderId];

    return (
        <div className="flex flex-col w-full h-full min-h-screen bg-white font-sans selection:bg-rose-100 selection:text-rose-900">

            {/* ── HEADER ZERO-WASTE V10.0 ── */}
            <header className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-[60]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                        <Zap className="w-4 h-4 text-white fill-white" />
                    </div>
                    <div>
                        <h1 className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none">Canales e Infraestructura</h1>
                        <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mt-0.5">ESTATUS CENTRAL V10.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={fetchConnections}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    </button>

                    <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-8 px-4 bg-rose-500 hover:bg-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border-none shadow-md shadow-rose-500/10">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Vincular Nodo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[360px] rounded-[2.5rem] p-7 border-none shadow-[0_32px_80px_-16px_rgba(0,0,0,0.18)] z-[100] !overflow-visible bg-white/95 backdrop-blur-xl">
                            <DialogHeader className="pb-2 border-b border-slate-50">
                                <DialogTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                                    {selectedProviderConfig?.name || "Vincular Nodo"}
                                </DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => {
                                const res = await saveConnection(formData);
                                if (res.success) {
                                    setConfigOpen(false);
                                    toast.success("Enlace Establecido");
                                    fetchConnections();
                                } else {
                                    toast.error(res.message || "Error al establecer enlace");
                                }
                            }} className="space-y-4 pt-4">
                                <div className="space-y-1.5 relative">
                                    <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 tracking-widest">Proveedor Oficial</Label>
                                    <Select name="provider" value={selectedProviderId} onValueChange={setSelectedProviderId} required>
                                        <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 rounded-2xl text-[13px] font-bold tracking-tight focus:ring-2 focus:ring-rose-500/10 transition-all border shadow-sm">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            sideOffset={4}
                                            className="rounded-2xl border-slate-100 shadow-2xl z-[200] bg-white w-[var(--radix-select-trigger-width)] max-h-[220px] overflow-x-hidden overflow-y-auto p-1.5"
                                        >
                                            <div className="space-y-0.5">
                                                {providers.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="text-[11px] font-bold py-2.5 px-3 rounded-xl cursor-pointer hover:bg-rose-50 focus:bg-rose-50 transition-colors">
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
                                            {selectedProviderConfig.fields.map(f => (
                                                <div key={f.key} className="space-y-1.5">
                                                    <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 tracking-widest">{f.label}</Label>
                                                    <Input name={f.key} type={f.type === 'password' ? 'text' : f.type} required={f.required} className="h-12 border-slate-100 bg-slate-50/50 rounded-2xl text-[12px] font-medium focus:border-rose-500/50 transition-all shadow-none placeholder:text-slate-300" />
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <Button type="submit" className="w-full h-12 bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl mt-2 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
                                    Guardar Configuración
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* ── CORE GRID V10.0 (ZERO WASTE) ── */}
            <main className="flex-1 p-4 space-y-6">

                {/* ── NODOS EN LÍNEA ── */}
                <section className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1 text-slate-900 border-l-2 border-rose-500 pl-3 py-0.5">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.25em]">Nodos Operativos</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {activeConnections.map((conn, idx) => {
                            const p = PROVIDER_REGISTRY[conn.provider.toUpperCase()] || { name: conn.provider, icon: Settings2, color: '#e11d48' };
                            const Icon = p.icon;
                            const idKey = `${conn.provider}-${conn.id}`;
                            const isRevealed = revealSecrets[idKey];
                            return (
                                <motion.div key={conn.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                                    <Card className="group p-3.5 rounded-xl border border-slate-100 bg-white hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 relative overflow-hidden flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100/50">
                                                    <Icon className="w-8 h-8" style={{ color: p.color }} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                        <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest leading-none">Sincronizado</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDelete(conn.id, p.name)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(conn.metadata || {}).map(([key, value]) => (
                                                <div key={key} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/20">
                                                    <span className="block text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{key}</span>
                                                    <p className="text-[9px] font-black text-slate-700 truncate">{value as string}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-1">
                                            <div className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-lg border border-white/5 shadow-inner">
                                                <Lock className="w-2.5 h-2.5 text-rose-500/50" />
                                                <p className="flex-1 font-mono text-[8px] font-bold text-rose-500/60 truncate tracking-tight">{isRevealed ? conn.secret : "••••••••••••••••"}</p>
                                                <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                                                    <button onClick={() => toggleSecret(idKey)} className="p-0.5 text-white/40 hover:text-white transition-colors">
                                                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                    <button onClick={() => copyToClipboard(conn.secret)} className="p-0.5 text-white/40 hover:text-white transition-colors">
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

            {/* ── FOOTER SEGURO ── */}
            <footer className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-slate-400 bg-white z-[60]">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Cifrado Activo AES-256 Sincronizado</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                    <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                    <span className="text-[10px] font-bold text-rose-500/80 tracking-tighter">ABSOLUTE ZERO V14.0</span>
                </div>
            </footer>
        </div>
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
