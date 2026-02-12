"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Plus, Settings2, CheckCircle2, XCircle, RefreshCw,
    ExternalLink, ShieldCheck, Zap, Globe, Gauge,
    Table as TableIcon, HardDrive, Layout, ChevronRight,
    ArrowUpRight, Copy, Check, Key
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

    const openConfig = (providerId: string) => {
        setSelectedProvider(providerId);
        setConfigOpen(providerId); // Use setConfigOpen here
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

                <Dialog open={!!configOpen} onOpenChange={(open) => setConfigOpen(open ? selectedProvider : null)}>
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
                            setConfigOpen(null);
                            toast.success("Conexión guardada", { description: "Recarga para ver cambios." });
                            fetchConnections();
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

            <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
                <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tight">Conectar Cuenta de Servicio (Robot)</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Pega aquí el contenido completo del archivo JSON que descargaste de Google Cloud Console.
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
                        <Card key={p.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${isActive ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {/* Original icon rendering was an img tag, now it's just p.icon which is a URL.
                                            Assuming p.icon should be rendered as an img tag inside this div. */}
                                        <img src={p.icon} alt={p.name} className="h-6 w-6 object-contain" />
                                    </div>
                                    {isActive && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100/50 border border-green-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[11px] font-bold text-green-700 tracking-wide">ACTIVO</span>
                                        </div>
                                    )}
                                    {isActive && (
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-6 w-6 -mr-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                            onClick={() => deleteConnection(conn.id)}
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1 flex items-center gap-2">
                                        {p.name}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                                        {p.description}
                                    </p>
                                </div>

                                <div className="pt-2 mt-auto">
                                    {isActive ? (
                                        <Button variant="outline" size="sm" className="w-full h-10 text-xs font-bold border-slate-200 bg-slate-50 hover:bg-white text-slate-600" onClick={() => openConfig(p.id)}>
                                            <Settings2 className="h-4 w-4 mr-2" /> Configurar
                                        </Button>
                                    ) : (
                                        p.id.startsWith("GOOGLE") ? (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={handleGoogleConnect}
                                                    className="w-full h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-sm"
                                                >
                                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" /> Login Usuario
                                                </Button>
                                                <Button
                                                    onClick={() => setServiceModalOpen(true)}
                                                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
                                                >
                                                    <Key className="w-4 h-4 mr-2" /> Cuenta de Servicio (JSON)
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="w-full h-10 border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm"
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
