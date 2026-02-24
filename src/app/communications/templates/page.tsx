"use client";

import { useState, useEffect } from "react";
import {
    Plus, Save, Trash2, MessageSquare, Mail, Zap, CheckCircle2,
    RotateCcw, AlertCircle, Clock, Send, Bot, RefreshCw, X,
    ChevronRight, MoreVertical, LayoutGrid, Smartphone, Target, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getTemplates, upsertTemplate, deleteTemplate } from "./actions";

const PLATFORM_ICONS = {
    WHATSAPP: <Smartphone className="h-4 w-4" />,
    EMAIL: <Mail className="h-4 w-4" />
};

const TRIGGER_LABELS: Record<string, string> = {
    CONFIRMATION: "Confirmación de Pedido",
    PREPARATION: "Preparación del Pedido",
    OUT_FOR_DELIVERY: "Pedido en Reparto",
    DELIVERED: "Pedido Entregado",
    INCIDENCE: "Incidencia en el Pedido"
};

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        trigger: "CONFIRMATION",
        channel: "WHATSAPP",
        body: "",
        isEnabled: true
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const res = await getTemplates();
        if (res.success) setTemplates(res.data || []);
        setLoading(false);
    };

    const handleEdit = (tmpl: any) => {
        setEditingId(tmpl.id);
        setFormData({
            name: tmpl.name,
            trigger: tmpl.trigger,
            channel: tmpl.channel,
            body: tmpl.body,
            isEnabled: tmpl.isEnabled
        });
    };

    const handleNew = () => {
        setEditingId(null);
        setFormData({
            name: "",
            trigger: "CONFIRMATION",
            channel: "WHATSAPP",
            body: "",
            isEnabled: true
        });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.body) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        const res = await upsertTemplate({ id: editingId || undefined, ...formData });
        if (res.success) {
            toast.success("Plantilla guardada correctamente");
            loadTemplates();
            setEditingId(null);
        } else {
            toast.error("Error al guardar la plantilla");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta plantilla?")) return;
        const res = await deleteTemplate(id);
        if (res.success) {
            toast.success("Plantilla eliminada");
            loadTemplates();
        }
    };

    return (
        <div className="p-6 h-full bg-slate-50/50">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <Zap className="h-5 w-5 text-white fill-white" />
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                                GESTIÓN DE <span className="text-rose-600">PLANTILLAS</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Automated Lifecycle Communications</p>
                    </div>
                    <Button
                        onClick={handleNew}
                        className="h-14 px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.5rem] shadow-sm font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex gap-3"
                    >
                        <Plus className="h-5 w-5" /> Nueva Plantilla
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-[calc(100vh-16rem)]">
                    {/* LEFT: LIST */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                            <Input
                                placeholder="BUSCAR PLANTILLA..."
                                className="h-14 pl-12 bg-white border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm focus:ring-4 focus:ring-rose-500/5 transition-all"
                            />
                        </div>

                        <ScrollArea className="flex-1 -mr-4 pr-4">
                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
                                    ))
                                ) : templates.map(tmpl => (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => handleEdit(tmpl)}
                                        className={cn(
                                            "p-6 rounded-[2rem] bg-white border transition-all cursor-pointer group relative overflow-hidden",
                                            editingId === tmpl.id ? "border-rose-600 shadow-sm" : "border-slate-100 hover:border-rose-200 hover:shadow-sm hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                                    tmpl.channel === 'WHATSAPP' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {PLATFORM_ICONS[tmpl.channel as keyof typeof PLATFORM_ICONS]}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xs uppercase text-slate-900 truncate max-w-[180px]">{tmpl.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 italic">{TRIGGER_LABELS[tmpl.trigger] || tmpl.trigger}</p>
                                                </div>
                                            </div>
                                            <Switch checked={tmpl.isEnabled} className="scale-75 data-[state=checked]:bg-rose-600" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400 py-1 px-3">
                                                {tmpl.channel}
                                            </Badge>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400 py-1 px-3">
                                                {tmpl.trigger}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* RIGHT: EDITOR */}
                    <div className="lg:col-span-7 flex flex-col gap-6 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Bot className="h-32 w-32" />
                        </div>

                        <div className="space-y-8 flex-1">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <Target className="h-4 w-4" /> Configuración Básica
                                </Label>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black uppercase text-slate-400 italic">Nombre Identificativo</span>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-xs shadow-sm focus:bg-white transition-all"
                                            placeholder="Ej: Confirmación de Pedido VIP"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black uppercase text-slate-400 italic">Canal de Envío</span>
                                        <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                                            {['WHATSAPP', 'EMAIL'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormData({ ...formData, channel: c })}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                        formData.channel === c ? "bg-white text-rose-600 shadow-sm" : "text-slate-400"
                                                    )}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" /> Trigger del Evento
                                </Label>
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setFormData({ ...formData, trigger: val })}
                                            className={cn(
                                                "p-4 rounded-xl border flex items-center justify-between group transition-all",
                                                formData.trigger === val ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <span className={cn("text-[11px] font-black uppercase tracking-tight", formData.trigger === val ? "text-rose-600" : "text-slate-500")}>{label}</span>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                                formData.trigger === val ? "bg-rose-600 border-rose-600" : "border-slate-200 group-hover:border-slate-300"
                                            )}>
                                                {formData.trigger === val && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 relative">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Cuerpo del Mensaje
                                </Label>
                                <textarea
                                    value={formData.body}
                                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-8 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all resize-none shadow-sm leading-relaxed"
                                    placeholder="Hola {customer_name}, tu pedido #{order_number} está listo..."
                                />
                                <div className="absolute right-6 bottom-6 flex gap-2">
                                    <Badge className="bg-white border border-slate-100 text-[8px] font-black text-slate-400 px-3 uppercase">{'{customer_name}'}</Badge>
                                    <Badge className="bg-white border border-slate-100 text-[8px] font-black text-slate-400 px-3 uppercase">{'{order_number}'}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex gap-4 mt-auto">
                            <Button
                                onClick={handleSave}
                                className="h-16 flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.5rem] shadow-sm font-extrabold text-[11px] uppercase tracking-widest transition-all active:scale-95 flex gap-4"
                            >
                                <Save className="h-6 w-6" /> Guardar Cambios Permanentes
                            </Button>
                            {editingId && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleDelete(editingId)}
                                    className="h-16 px-8 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-[1.5rem] transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
