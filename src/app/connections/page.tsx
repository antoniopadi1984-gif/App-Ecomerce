"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Plus, Settings2, CheckCircle2, XCircle, RefreshCw,
    ExternalLink, ShieldCheck, Zap, Globe, Gauge,
    Table as TableIcon, HardDrive, Layout, ChevronRight,
    ArrowUpRight, Copy, Check, Key, Play, Loader2
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveConnection, deleteConnection } from "./actions";
import { cn } from "@/lib/utils";

const providers = [
    { id: "SHOPIFY", name: "Shopify", icon: "https://cdn.worldvectorlogo.com/logos/shopify.svg", description: "Pedidos, productos y clientes.", color: "bg-emerald-50" },
    { id: "GOOGLE_SHEETS", name: "Google Sheets", icon: "https://cdn.worldvectorlogo.com/logos/google-sheets-1.svg", description: "Importación de inventario y CRM.", color: "bg-green-50" },
    { id: "GOOGLE_ANALYTICS", name: "GA4 Analytics", icon: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Analytics_Logo.svg", description: "Tráfico y ROI en tiempo real.", color: "bg-orange-50" },
    { id: "META", name: "Meta / Facebook", icon: "https://cdn.worldvectorlogo.com/logos/facebook-icon.svg", description: "Ads, ROAS y CTR.", color: "bg-blue-50" },
    { id: "DROPI", name: "Dropi Latam", icon: "https://dropi.co/images/logo_dropi_b.png", description: "Sincronización total (Usuario/Pass).", color: "bg-blue-100" },
    { id: "DROPEA", name: "Dropea", icon: "https://app.dropea.com/images/logo-dropea.png", description: "Logística vía API.", color: "bg-orange-100" },
    { id: "WHATSAPP", name: "WhatsApp Cloud", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg", description: "Notificaciones y Chatbot.", color: "bg-emerald-50" },
    { id: "ZADARMA", name: "Zadarma VoIP", icon: "https://zadarma.com/favicon.ico", description: "Telefonía IP y Calidad.", color: "bg-indigo-50" },
    { id: "BEEPING", name: "Beeping Logistics", icon: "https://beeping.io/favicon.ico", description: "Estados de envío en tiempo real.", color: "bg-purple-50" },
];

function ConnectionsContent() {
    const [activeConnections, setActiveConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configOpen, setConfigOpen] = useState<string | null>(null);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceKeyJson, setServiceKeyJson] = useState("");
    const [verifyingService, setVerifyingService] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [testingProvider, setTestingProvider] = useState<string | null>(null);

    const searchParams = useSearchParams();

    const fetchConnections = async () => {
        setLoading(true);
        const res = await fetch("/api/connections");
        if (res.ok) {
            const data = await res.json();
            setActiveConnections(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");
        if (success === "google_connected") {
            toast.success("Google conectado correctamente", { description: "Ahora puedes sincronizar Sheets y Analytics." });
        }
        if (error) {
            toast.error("Error al conectar con Google", { description: "Por favor, inténtalo de nuevo." });
        }

        fetchConnections();
    }, [searchParams]);

    const deleteConnection = async (id: string) => {
        if (!confirm("¿Seguro que quieres desconectar esta integración?")) return;
        try {
            await fetch(`/api/connections/${id}`, { method: 'DELETE' });
            toast.success("Desconectado", { description: "La conexión ha sido eliminada." });
            fetchConnections();
        } catch (error) {
            toast.error("Error", { description: "No se pudo desconectar." });
        }
    };

    const handleServiceConnect = async () => {
        if (!serviceKeyJson) return;
        setVerifyingService(true);
        try {
            const res = await fetch("/api/connections/service-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviceAccountJson: serviceKeyJson })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Conectado", { description: `Cuenta de Servicio ${data.email} conectada.` });
                setServiceModalOpen(false);
                setServiceKeyJson("");
                fetchConnections();
            } else {
                toast.error("Error", { description: data.error || "JSON Inválido" });
            }
        } catch (error) {
            toast.error("Error Fatal", { description: "Fallo al guardar credenciales." });
        } finally {
            setVerifyingService(false);
        }
    };

    const copyToClipboard = () => {
        const url = "https://app.nanobanana.com/api/webhooks/master";
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success("Webhook copiado", { description: "URL lista para usar." });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleGoogleConnect = () => {
        window.location.href = "/api/auth/google";
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
            if (result.status === "OK") {
                toast.success(`✅ ${providerId}`, { description: result.message });
            } else if (result.status === "STUB") {
                toast.info(`⚠️ ${providerId}: STUB`, { description: result.message });
            } else {
                toast.error(`❌ ${providerId}`, { description: result.message });
            }
        } catch (e: any) {
            toast.error(`Error testing ${providerId}`, { description: e.message });
        }
        setTestingProvider(null);
    };

    const openConfig = (providerId: string) => {
        setSelectedProvider(providerId);
        setConfigOpen(providerId);
    };

    const getFieldLabels = (pid: string) => {
        if (pid === 'DROPI') return { user: 'Email de Usuario', secret: 'Contraseña de Dropi', desc: 'Conectaremos como un usuario real para extraer toda la info.' };
        if (pid === 'DROPEA') return { user: 'ID de Cliente', secret: 'API Key', desc: 'Usa las credenciales de API de Dropea.' };
        if (pid === 'SHOPIFY') return { user: 'Dominio (myshopify.com)', secret: 'Admin API Access Token', desc: 'Token de acceso de Admin API.' };
        return { user: 'URL o Identificador', secret: 'API Token / Credencial', desc: 'Configuración estándar.' };
    };

    const labels = getFieldLabels(selectedProvider);

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto p-4 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white rounded-lg font-black text-[8px] uppercase tracking-widest px-2 py-0.5">Vía API Secure</Badge>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-tight italic uppercase">Canales <span className="text-indigo-600">& Conexiones</span></h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestiona el flujo de datos entre Shopify y tus herramientas de Growth.</p>
                </div>

                <Dialog open={!!configOpen} onOpenChange={(open) => setConfigOpen(open ? selectedProvider : null)}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openConfig("")} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg shadow-lg shadow-indigo-100 gap-2 text-[10px] uppercase tracking-widest transition-all active:scale-95">
                            <Plus className="h-3.5 w-3.5" /> NUEVA INTEGRACIÓN
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] bg-white border-none shadow-2xl rounded-lg p-5">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black tracking-tighter italic uppercase text-slate-900">
                                {selectedProvider ? `Configurar ${providers.find(p => p.id === selectedProvider)?.name}` : "Vincular Servicio"}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {selectedProvider ? labels.desc : "Conecta tus cuentas para habilitar la sincronización automática."}
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            await saveConnection(formData);
                            setConfigOpen(null);
                            toast.success("Conexión guardada", { description: "Recarga para ver cambios." });
                            fetchConnections();
                        }} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">Proveedor</Label>
                                    <Select name="provider" value={selectedProvider} onValueChange={setSelectedProvider} required>
                                        <SelectTrigger className="h-9 border-slate-100 bg-slate-50 font-bold rounded-lg text-[11px]">
                                            <SelectValue placeholder="Seleccionar canal..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                            {providers.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="font-bold text-[11px]">{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">{labels.user}</Label>
                                    <Input name="extraConfig" placeholder={selectedProvider === 'DROPI' ? 'usuario@email.com' : 'ej: store.myshopify.com'} className="h-9 border-slate-100 bg-slate-50 rounded-lg font-bold text-[11px]" required />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">{labels.secret}</Label>
                                    <Input name="apiKey" type="password" placeholder="••••••••••••••••" className="h-9 border-slate-100 bg-slate-50 rounded-lg font-bold text-[11px]" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-10 bg-slate-900 text-white font-black rounded-lg hover:bg-black transition-all text-[10px] uppercase tracking-widest">ESTABLECER CONEXIÓN</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
                <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tighter italic uppercase text-slate-900">Conectar Cuenta de Servicio</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                            Pega aquí el contenido completo del archivo JSON de Google Cloud.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <textarea
                            className="w-full h-40 p-3 text-[10px] font-mono border rounded-md bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder='{ "type": "service_account", ... }'
                            value={serviceKeyJson}
                            onChange={(e) => setServiceKeyJson(e.target.value)}
                        />
                        <p className="mt-2 text-[10px] text-slate-400">
                            * Tus credenciales se guardan cifradas. Asegúrate de compartir tus carpetas de Drive con el <code>client_email</code> del JSON.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleServiceConnect} disabled={verifyingService} className="bg-indigo-600 hover:bg-indigo-700">
                            {verifyingService ? "Verificando..." : "Conectar Cuenta"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((p) => {
                    const conn = activeConnections.find(c => c.provider === p.id);
                    const isActive = !!conn;

                    return (
                        <Card key={p.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden rounded-lg bg-white">
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={cn("p-2.5 rounded-lg border", isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400')}>
                                        <img src={p.icon} alt={p.name} className="h-5 w-5 object-contain" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isActive && (
                                            <div className="flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-100/50 border border-emerald-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] font-black text-emerald-700 tracking-widest uppercase">ACTIVO</span>
                                            </div>
                                        )}
                                        {isActive && (
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-6 w-6 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                                onClick={() => deleteConnection(conn.id)}
                                            >
                                                <XCircle className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-black text-xs text-slate-800 uppercase italic tracking-tight mb-1">
                                        {p.name}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                                        {p.description}
                                    </p>
                                </div>

                                <div className="pt-2 mt-auto">
                                    {isActive ? (
                                        <div className="flex gap-1.5">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest border-slate-100 bg-slate-50 hover:bg-white text-slate-500 rounded-lg" onClick={() => openConfig(p.id)}>
                                                <Settings2 className="h-3.5 w-3.5 mr-1" /> Config
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2 text-[9px] font-black uppercase tracking-widest border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg"
                                                onClick={() => testConnection(p.id)}
                                                disabled={testingProvider === p.id}
                                            >
                                                {testingProvider === p.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Play className="h-3 w-3" />
                                                )}
                                                <span className="ml-1">Test</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        p.id.startsWith("GOOGLE") ? (
                                            <div className="flex flex-col gap-1.5">
                                                <Button
                                                    onClick={handleGoogleConnect}
                                                    className="w-full h-8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[9px] uppercase tracking-widest rounded-lg shadow-sm"
                                                >
                                                    <img src="https://www.google.com/favicon.ico" className="w-3 h-3 mr-1.5" /> Login Usuario
                                                </Button>
                                                <Button
                                                    onClick={() => setServiceModalOpen(true)}
                                                    className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-lg shadow-sm"
                                                >
                                                    <Key className="w-3 h-3 mr-1.5" /> Cuenta Servicio
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="w-full h-8 border-slate-200 text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 shadow-sm"
                                                onClick={() => openConfig(p.id)}
                                            >
                                                CONECTAR
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card className="bg-indigo-600 text-white border-none overflow-hidden p-0 rounded-lg shadow-xl shadow-indigo-100">
                <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight italic uppercase">Master Webhook Gateway</h3>
                                <p className="text-indigo-100/70 text-[9px] font-black uppercase tracking-widest">Recibe pedidos de Dropi o Beeping instantáneamente.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-700/50 backdrop-blur-md border border-white/10 rounded-lg p-2.5 px-4 shadow-inner">
                            <code className="flex-1 text-indigo-50 font-mono text-[10px] truncate opacity-80">
                                https://app.nanobanana.com/api/webhooks/master
                            </code>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10 rounded-md" onClick={copyToClipboard}>
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="p-6 md:w-[300px] bg-white/5 backdrop-blur-lg flex flex-col justify-center gap-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Instrucciones</span>
                        </div>
                        <p className="text-[11px] font-medium text-indigo-100/80 leading-relaxed">
                            Copia la URL y pégala en los ajustes de Webhook de tu plataforma logística. Recibirás todos los eventos en tiempo real.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function ConnectionsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-black animate-pulse">CARGANDO CANALES...</div>}>
            <ConnectionsContent />
        </Suspense>
    );
}
