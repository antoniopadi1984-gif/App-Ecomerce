"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare, Save, Info, BellRing, Smartphone, Mail,
    Settings2, Zap, LayoutGrid, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getTemplates, updateTemplate } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        getTemplates().then(setTemplates);
    }, []);

    const handleSave = async (id: string, body: string, isEnabled: boolean) => {
        setIsSaving(id);
        const res = await updateTemplate(id, body, isEnabled);
        setIsSaving(null);
        if (res.success) {
            toast.success("Plantilla actualizada con éxito");
        } else {
            toast.error(res.message || "Error al guardar");
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Cabecera Ultra-Compacta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-700 text-white shadow-sm">
                            <BellRing className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase italic">
                            Centro de Notificaciones
                        </h2>
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                        Automatizaciones inteligentes post-venta • WhatsApp & Email
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="button-compact border-slate-200 text-slate-600">
                        <LayoutGrid className="h-3.5 w-3.5" /> Vista Grid
                    </Button>
                    <Button variant="outline" className="button-compact border-slate-200 text-slate-600">
                        <Settings2 className="h-3.5 w-3.5" /> Configuración
                    </Button>
                </div>
            </div>

            {/* Grid de Plantillas Compacto */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => (
                    <Card key={tpl.id} className="compact-card group">
                        <CardHeader className="p-4 pb-2 space-y-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "p-1.5 rounded-md",
                                        tpl.isEnabled ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {tpl.channel === 'WHATSAPP' ? <Smartphone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                    </div>
                                    <span className="text-[11px] font-black text-slate-950 uppercase tracking-tight truncate max-w-[120px]">
                                        {tpl.name === 'CONFIRMATION' ? 'Confirmación' :
                                            tpl.name === 'TRACKING' ? 'Seguimiento' :
                                                tpl.name === 'OUT_FOR_DELIVERY' ? 'En Reparto' :
                                                    tpl.name === 'INCIDENCE' ? 'Incidencia' : tpl.name.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <Switch
                                    checked={tpl.isEnabled}
                                    onCheckedChange={(val) => {
                                        const newTpls = templates.map(t => t.id === tpl.id ? { ...t, isEnabled: val } : t);
                                        setTemplates(newTpls);
                                    }}
                                    className="scale-75 data-[state=checked]:bg-blue-700"
                                />
                            </div>
                            <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                Canal: {tpl.channel} Global
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 pt-2 space-y-4">
                            <Textarea
                                className="bg-slate-50 border-slate-200 text-slate-900 font-bold text-[11px] min-h-[100px] rounded-lg p-3 resize-none focus:bg-white transition-colors"
                                value={tpl.body}
                                onChange={(e) => {
                                    const newTpls = templates.map(t => t.id === tpl.id ? { ...t, body: e.target.value } : t);
                                    setTemplates(newTpls);
                                }}
                            />

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {["name", "tracking", "trackingUrl"].map((v) => (
                                        <Badge
                                            key={v}
                                            variant="outline"
                                            className="bg-white border-slate-200 text-[8px] font-black text-slate-500 hover:text-blue-700 cursor-pointer h-6 px-2 rounded-md"
                                            onClick={() => {
                                                const newTpls = templates.map(t => t.id === tpl.id ? { ...t, body: t.body + ` {{${v}}}` } : t);
                                                setTemplates(newTpls);
                                            }}
                                        >
                                            {`{{${v}}}`}
                                        </Badge>
                                    ))}
                                </div>
                                <Button
                                    disabled={isSaving === tpl.id}
                                    onClick={() => handleSave(tpl.id, tpl.body, tpl.isEnabled)}
                                    className="button-compact w-full bg-slate-950 hover:bg-black text-white"
                                >
                                    {isSaving === tpl.id ? <Zap className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Banner Informativo Compacto */}
            <Card className="bg-slate-950 border-none rounded-xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 grayscale brightness-200">
                    <Info className="h-24 w-24 text-white" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-12 w-12 rounded-lg bg-blue-700 flex items-center justify-center shrink-0 shadow-lg">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase italic">Sincronización Inteligente Beeping/Shopify</h4>
                        <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-xl">
                            El sistema detecta automáticamente cada cambio de estado y dispara estas plantillas. Asegúrate de que las variables esten correctamente configuradas.
                        </p>
                    </div>
                    <Button variant="outline" className="ml-auto button-compact border-slate-800 text-white hover:bg-slate-900 border-2">
                        Guía de Uso
                    </Button>
                </div>
            </Card>
        </div>
    );
}
