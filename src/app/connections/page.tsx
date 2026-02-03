"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Plus, Settings2, CheckCircle2, XCircle, RefreshCw,
    ExternalLink, ShieldCheck, Zap, Globe, Gauge,
    Table as TableIcon, HardDrive, Layout, ChevronRight,
    ArrowUpRight, Copy, Check
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
    const [isCopied, setIsCopied] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>("");

    const searchParams = useSearchParams();

    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");
        if (success === "google_connected") {
            toast.success("Google conectado correctamente", { description: "Ahora puedes sincronizar Sheets y Analytics." });
        }
        if (error) {
            toast.error("Error al conectar con Google", { description: "Por favor, inténtalo de nuevo." });
        }

        const fetchConnections = async () => {
            const res = await fetch("/api/connections");
            if (res.ok) {
                const data = await res.json();
                setActiveConnections(data);
            }
        };
        fetchConnections();
    }, [searchParams]);

    const copyToClipboard = () => {
        const url = "https://app.nanobanana.com/api/webhooks/master";
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleGoogleConnect = () => {
        window.location.href = "/api/auth/google";
    };

    const openConfig = (providerId: string) => {
        setSelectedProvider(providerId);
        setIsDialogOpen(true);
    };

    const getFieldLabels = (pid: string) => {
        if (pid === 'DROPI') return { user: 'Email de Usuario', secret: 'Contraseña de Dropi', desc: 'Conectaremos como un usuario real para extraer toda la info.' };
        if (pid === 'DROPEA') return { user: 'ID de Cliente', secret: 'API Key', desc: 'Usa las credenciales de API de Dropea.' };
        if (pid === 'SHOPIFY') return { user: 'Dominio (myshopify.com)', secret: 'Admin API Access Token', desc: 'Token de acceso de Admin API.' };
        return { user: 'URL o Identificador', secret: 'API Token / Credencial', desc: 'Configuración estándar.' };
    };

    const labels = getFieldLabels(selectedProvider);

    return (
        <div className="space-y-10 max-w-[1400px] mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white rounded-md font-black text-[9px] uppercase tracking-widest px-2 py-0.5">Vía API Secure</Badge>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">Canales & Conexiones</h1>
                    <p className="text-slate-500 font-medium">Gestiona el flujo de datos entre Shopify y tus herramientas de Growth.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openConfig("")} className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 gap-2 text-base transition-all active:scale-95">
                            <Plus className="h-5 w-5" /> NUEVA INTEGRACIÓN
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-3xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight">
                                {selectedProvider ? `Configurar ${providers.find(p => p.id === selectedProvider)?.name}` : "Vincular Servicio"}
                            </DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                {selectedProvider ? labels.desc : "Conecta tus cuentas para habilitar la sincronización automática."}
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            await saveConnection(formData);
                            setIsDialogOpen(false);
                            toast.success("Conexión guardada. Recarga para ver cambios.");
                        }} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Proveedor</Label>
                                    <Select name="provider" value={selectedProvider} onValueChange={setSelectedProvider} required>
                                        <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 rounded-xl font-bold">
                                            <SelectValue placeholder="Seleccionar canal..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-100 rounded-xl shadow-xl">
                                            {providers.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="font-bold py-3">{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">{labels.user}</Label>
                                    <Input name="extraConfig" placeholder={selectedProvider === 'DROPI' ? 'usuario@email.com' : 'ej: store.myshopify.com'} className="h-12 border-slate-100 bg-slate-50/50 rounded-xl font-bold" required />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">{labels.secret}</Label>
                                    <Input name="apiKey" type="password" placeholder="••••••••••••••••" className="h-12 border-slate-100 bg-slate-50/50 rounded-xl font-bold" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all">ESTABLECER CONEXIÓN</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {providers.map((p) => {
                    const conn = activeConnections.find(c => c.provider === p.id);
                    const isActive = !!conn;

                    return (
                        <Card key={p.id} className={cn(
                            "premium-card border-none overflow-hidden group transition-all duration-500",
                            isActive ? "ring-2 ring-emerald-500/20" : ""
                        )}>
                            <div className={cn("h-2 w-full", isActive ? "bg-emerald-500" : "bg-slate-100")} />
                            <CardHeader className="p-8 pb-4 flex flex-row items-center gap-5">
                                <div className={cn("h-16 w-16 rounded-2xl p-3 flex items-center justify-center border border-white shadow-sm ring-4 ring-white transition-transform group-hover:scale-110 duration-500 bg-white", p.color)}>
                                    <img src={p.icon} alt={p.name} className="h-full w-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl font-black tracking-tight text-slate-800">{p.name}</CardTitle>
                                    <div className="mt-1">
                                        {isActive ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[9px] font-black uppercase py-0.5 px-2">
                                                Online & Syncing
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[9px] font-bold text-slate-300 border-slate-100 rounded-lg py-0.5 px-2">
                                                Off-line
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    {isActive ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-300 uppercase">Última Sync</span>
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                    <RefreshCw className="h-3 w-3 text-emerald-500 animate-[spin_3s_linear_infinite]" /> Real-time
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" onClick={() => openConfig(p.id)}>
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline" size="icon"
                                                    className="h-10 w-10 rounded-xl border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    onClick={() => deleteConnection(conn.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        p.id.startsWith("GOOGLE") ? (
                                            <Button
                                                onClick={handleGoogleConnect}
                                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl gap-2 tracking-tight transition-all active:scale-95"
                                            >
                                                AUTORIZAR EN GOOGLE <ArrowUpRight className="h-3 w-3" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 border-slate-100 text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-50 tracking-tight transition-all"
                                                onClick={() => openConfig(p.id)}
                                            >
                                                CONFIGURAR CREDENCIALES
                                            </Button>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="premium-card bg-indigo-600 text-white border-none overflow-hidden p-0">
                <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-8 md:p-10 flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Master Webhook Gateway</h3>
                                <p className="text-indigo-100/70 text-sm font-medium">Recibe pedidos de Dropi o Beeping instantáneamente.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-700/50 backdrop-blur-md border border-white/10 rounded-xl p-3 pl-4">
                            <code className="flex-1 text-indigo-50 font-mono text-[11px] truncate">
                                https://app.nanobanana.com/api/webhooks/master
                            </code>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={copyToClipboard}>
                                {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="p-10 w-full md:w-[350px] bg-white/5 backdrop-blur-lg flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-100">Instrucciones</span>
                        </div>
                        <p className="text-sm font-medium text-indigo-100/80 leading-relaxed">
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
