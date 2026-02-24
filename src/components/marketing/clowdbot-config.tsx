"use client";

import React, { useState, useEffect } from "react";
import {
    Bot, Shield, Zap, MessageSquare, Mail,
    Save, RefreshCw, BookOpen, UserCircle,
    CheckCircle2, XCircle, Power, Settings2,
    Database, GraduationCap, AlertCircle, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateClowdbotConfig, getClowdbotConfig, getWhatsAppAccounts, addWhatsAppAccount, deleteWhatsAppAccount } from "@/app/marketing/clowdbot-lab/actions";
import { Plus, Trash2, Smartphone } from "lucide-react";

export function ClowdbotConfig() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({
        agentName: "Clowdbot",
        agentRole: "Mando Omnicanal",
        isActive: false,
        knowledgeBase: "",
        roleKnowledge: "{}",
        isFinancialExpert: false,
        targetProfitMargin: 30.0,
        channels: "WHATSAPP,EMAIL,INSTAGRAM,FACEBOOK"
    });

    const [accounts, setAccounts] = useState<any[]>([]);
    const [newAccount, setNewAccount] = useState({ name: "", type: "API", phoneNumber: "" });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadConfig();
        loadAccounts();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const res = await getClowdbotConfig();
        if (res?.success && res.data) {
            setConfig(res.data);
        }
        setLoading(false);
    };

    const loadAccounts = async () => {
        const res = await getWhatsAppAccounts();
        if (res.success) {
            setAccounts(res.data || []);
        }
    };

    const handleAddAccount = async () => {
        if (!newAccount.name || !newAccount.phoneNumber) {
            toast.error("Nombre y teléfono requeridos");
            return;
        }
        const res = await addWhatsAppAccount(newAccount);
        if (res.success) {
            toast.success("Cuenta vinculada");
            setShowAddForm(false);
            setNewAccount({ name: "", type: "API", phoneNumber: "" });
            loadAccounts();
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("¿Eliminar esta cuenta?")) return;
        const res = await deleteWhatsAppAccount(id);
        if (res.success) {
            toast.success("Cuenta eliminada");
            loadAccounts();
        }
    };

    const toggleChannel = (channel: string) => {
        const currentChannels = config.channels?.split(',') || [];
        const newChannels = currentChannels.includes(channel)
            ? currentChannels.filter((c: string) => c !== channel)
            : [...currentChannels, channel];
        setConfig({ ...config, channels: newChannels.join(',') });
    };

    const handleSave = async () => {
        setSaving(true);
        // Ensure roleKnowledge is stringified
        const res = await updateClowdbotConfig(config);
        if (res.success) {
            toast.success(`${config.agentName} Desplegado con Éxito`, {
                description: "La red de inteligencia está operativa en todos los canales seleccionados."
            });
        } else {
            toast.error("Error al desplegar");
        }
        setSaving(false);
    };

    const getRoleKnowledge = () => {
        try {
            return JSON.parse(config.roleKnowledge || "{}");
        } catch (e) {
            return {};
        }
    };

    const updateRoleKnowledge = (content: string) => {
        const currentRole = config.agentRole;
        const kw = getRoleKnowledge();
        kw[currentRole] = content;
        setConfig({ ...config, roleKnowledge: JSON.stringify(kw) });
    };

    const currentRoleKnowledge = getRoleKnowledge()[config.agentRole] || "";

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Cognición...</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* AGENT PERSONALIZATION */}
            <Card className="xl:col-span-5 rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
                <div className="p-6 bg-slate-900 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-10 -mt-10" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Bot className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", config.isActive ? "text-emerald-400" : "text-rose-400")}>
                                {config.isActive ? "ONLINE" : "OFFLINE"}
                            </span>
                            <Switch
                                checked={config.isActive}
                                onCheckedChange={(val) => setConfig({ ...config, isActive: val })}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-1 relative z-10">Clowdbot Elite</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 relative z-10">Arquitectura de Mando Neuronal</p>
                </div>

                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                                <UserCircle className="h-3 w-3 text-primary" /> Identidad del Agente
                            </Label>
                            <Input
                                value={config.agentName}
                                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                                className="h-12 bg-slate-50 border-none rounded-xl font-bold text-base focus:ring-4 focus:ring-primary/5 transition-all"
                                placeholder="Ej: Sofía"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                                <Settings2 className="h-3 w-3 text-primary" /> Rol & Protocolo
                            </Label>
                            <Select
                                value={config.agentRole}
                                onValueChange={(val) => setConfig({ ...config, agentRole: val })}
                            >
                                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold text-[13px] focus:ring-4 focus:ring-primary/5 transition-all">
                                    <SelectValue placeholder="Seleccionar Rol" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-100 rounded-xl shadow-2xl">
                                    <SelectItem value="Especialista en Atención al Cliente" className="text-xs font-bold">Soporte & Post-Venta</SelectItem>
                                    <SelectItem value="Asistente de Ventas & Upselling" className="text-xs font-bold font-primary">Comercial & Conversión</SelectItem>
                                    <SelectItem value="Recuperador de Carritos & Ofertas" className="text-xs font-bold">Recuperación de Abandonos</SelectItem>
                                    <SelectItem value="Concierge de Tracking & Entrega" className="text-xs font-bold font-emerald">Gestión Logística</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                                <Zap className="h-3 w-3 text-primary" /> Canales de Despliegue
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'WHATSAPP', icon: MessageSquare, label: 'WhatsApp', color: 'emerald' },
                                    { id: 'EMAIL', icon: Mail, label: 'Email', color: 'indigo' },
                                    { id: 'INSTAGRAM', icon: MessageSquare, label: 'Instagram', color: 'rose' },
                                    { id: 'FACEBOOK', icon: MessageSquare, label: 'Messenger', color: 'blue' },
                                ].map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => toggleChannel(ch.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                                            config.channels?.includes(ch.id)
                                                ? `bg-white border-primary shadow-lg shadow-primary/5 text-primary`
                                                : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                                        )}
                                    >
                                        <ch.icon className={cn("h-4 w-4", config.channels?.includes(ch.id) ? "text-primary" : "text-slate-300 group-hover:text-primary")} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{ch.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 space-y-4">
                        <div className="space-y-4 p-5 bg-indigo-50/30 rounded-[1.5rem] border border-indigo-100/50">
                            <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest pl-1 flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" /> Configuración de Email
                            </Label>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold uppercase text-slate-400 pl-1">Email del Agente</Label>
                                <Input
                                    value={config.agentEmail || ""}
                                    onChange={(e) => setConfig({ ...config, agentEmail: e.target.value })}
                                    className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                    placeholder="ej: soporte@tienda.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400 pl-1">Host SMTP</Label>
                                    <Input
                                        value={config.smtpHost || ""}
                                        onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                                        className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400 pl-1">Puerto</Label>
                                    <Input
                                        type="number"
                                        value={config.smtpPort || ""}
                                        onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                                        className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="587"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400 pl-1">Usuario SMTP</Label>
                                    <Input
                                        value={config.smtpUser || ""}
                                        onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                                        className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="user@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400 pl-1">Contraseña SMTP</Label>
                                    <Input
                                        type="password"
                                        value={config.smtpPass || ""}
                                        onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                                        className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-100/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-1 flex items-center gap-2">
                                    <TrendingUp className="h-3.5 w-3.5" /> Inteligencia & Profit
                                </Label>
                                <Switch
                                    checked={config.isFinancialExpert}
                                    onCheckedChange={(val) => setConfig({ ...config, isFinancialExpert: val })}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>

                            {config.isFinancialExpert && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-[9px] font-bold uppercase text-slate-400">Objetivo de Beneficio</Label>
                                            <span className="text-[10px] font-black text-emerald-600">{config.targetProfitMargin}%</span>
                                        </div>
                                        <Input
                                            type="number"
                                            value={config.targetProfitMargin}
                                            onChange={(e) => setConfig({ ...config, targetProfitMargin: parseFloat(e.target.value) })}
                                            className="h-10 bg-white border-slate-200 rounded-xl text-xs font-bold"
                                            placeholder="30"
                                        />
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-500 italic px-1 leading-tight">
                                        Clowdbot analizará el AdSpend vs Ventas Reales y te alertará si no alcanzas este margen.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                            <div className="flex gap-3">
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Intervención Humana</p>
                                    <p className="text-[9px] font-bold text-slate-500 leading-tight">Alertar si el cliente requiere un humano.</p>
                                </div>
                            </div>
                            <Switch
                                checked={config.humanInterventionAlert}
                                onCheckedChange={(val) => setConfig({ ...config, humanInterventionAlert: val })}
                                className="data-[state=checked]:bg-rose-500"
                            />
                        </div>

                        {config.humanInterventionAlert && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1">Webhook de Alerta (Slack/Discord)</Label>
                                <Input
                                    value={config.notificationWebhook || ""}
                                    onChange={(e) => setConfig({ ...config, notificationWebhook: e.target.value })}
                                    className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                    placeholder="https://hooks.slack.com/services/..."
                                />
                            </div>
                        )}

                        <div className="space-y-4 p-5 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-100/50">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-1 flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Accounts
                                </Label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-[9px] font-bold uppercase"
                                    onClick={() => setShowAddForm(!showAddForm)}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Vincular
                                </Button>
                            </div>

                            {showAddForm && (
                                <div className="space-y-3 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-top-2">
                                    <Input
                                        placeholder="Nombre de la línea (Ejem: Soporte)"
                                        className="h-9 text-xs"
                                        value={newAccount.name}
                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <Select
                                            value={newAccount.type}
                                            onValueChange={val => setNewAccount({ ...newAccount, type: val })}
                                        >
                                            <SelectTrigger className="h-9 text-xs w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="API">WhatsApp API</SelectItem>
                                                <SelectItem value="BUSINESS">Business App</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="+34..."
                                            className="h-9 text-xs flex-1"
                                            value={newAccount.phoneNumber}
                                            onChange={e => setNewAccount({ ...newAccount, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                    <Button onClick={handleAddAccount} className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-emerald-600">Vincular Número</Button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                <Smartphone className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight text-slate-800">{acc.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400">{acc.phoneNumber} • <span className="text-emerald-500 italic">{acc.type}</span></p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                            onClick={() => handleDeleteAccount(acc.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {accounts.length === 0 && !showAddForm && (
                                    <p className="text-center py-4 text-[9px] font-bold text-slate-400 uppercase italic">Ningún número registrado</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-primary tracking-widest">Núcleo Dinámico</p>
                                <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                    Conexión nativa con Shopify, Beeping y Dropea habilitada.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KNOWLEDGE BASE SECTION */}
            <Card className="xl:col-span-7 rounded-[2rem] border-none shadow-xl bg-card overflow-hidden flex flex-col">
                <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-primary">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tighter uppercase italic text-slate-900">Sabiduría de Marca</CardTitle>
                                <CardDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Brain Inject & Training</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-600 font-black text-[8px] uppercase px-3 py-1 rounded-full">{config.agentRole}</Badge>
                            <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-600 font-black text-[8px] uppercase px-3 py-1 rounded-full">RT-Sync</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 space-y-6 flex flex-col">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 flex items-center gap-2">
                            <Database className="h-3 w-3 text-primary" /> Sabiduría Global (Base)
                        </Label>
                        <Textarea
                            value={config.knowledgeBase || ""}
                            onChange={(e) => setConfig({ ...config, knowledgeBase: e.target.value })}
                            placeholder="Políticas generales, valores de marca, FAQs comunes..."
                            className="min-h-[120px] bg-slate-50/50 border-none rounded-2xl p-4 text-[12px] font-medium leading-relaxed resize-none focus:ring-4 focus:ring-primary/5 transition-all font-mono"
                        />
                    </div>

                    <div className="flex-1 flex flex-col space-y-3">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-1 flex items-center gap-2">
                            <Zap className="h-3 w-3 text-primary" /> Especialización para: {config.agentRole}
                        </Label>
                        <Textarea
                            value={currentRoleKnowledge}
                            onChange={(e) => updateRoleKnowledge(e.target.value)}
                            placeholder={`Instrucciones específicas para el rol de ${config.agentRole}...`}
                            className="flex-1 min-h-[250px] bg-indigo-50/30 border border-indigo-100/50 border-none rounded-2xl p-6 text-[13px] font-medium leading-relaxed resize-none focus:ring-4 focus:ring-primary/5 transition-all font-mono placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Integrado con Equipo Humano</span>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-10 bg-primary text-primary-foreground font-black rounded-xl gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all text-[11px] uppercase tracking-widest w-full sm:w-auto"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            {saving ? "Integrando..." : "Desplegar Clowbot"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

