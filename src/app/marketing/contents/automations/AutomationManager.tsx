"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, ArrowRight, BookOpen, Video, Ticket, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getContentCampaigns, saveContentCampaign, getContentAssets } from "../actions";

const triggers = [
    { value: "ORDER_CREATED", label: "Pedido Creado" },
    { value: "CONFIRMED", label: "Pedido Confirmado" },
    { value: "SHIPPED", label: "Enviado / En Tránsito" },
    { value: "DELIVERED", label: "Entregado" },
    { value: "RETURNED", label: "Devuelto / Incidencia" }
];

export default function AutomationManager({ storeId }: { storeId: string }) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newCampaign, setNewCampaign] = useState<any>({ name: '', triggerEvent: 'SHIPPED', assetId: '', isActive: true, requireApproval: false });

    useEffect(() => {
        loadData();
    }, [storeId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, a] = await Promise.all([
                getContentCampaigns(storeId),
                getContentAssets(storeId)
            ]);
            setCampaigns(c);
            setAssets(a);
        } catch (e) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCampaign.name || !newCampaign.assetId) {
            toast.error("Completa los campos obligatorios");
            return;
        }
        setLoading(true);
        try {
            await saveContentCampaign(storeId, newCampaign);
            toast.success("Automatización activada");
            setIsAdding(false);
            loadData();
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-emerald-500" /> REGLAS DE ENVÍO AUTOMÁTICO
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Configura cuándo Clowdbot debe enviar cada regalo digital.</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-2" /> NUEVA REGLA
                    </Button>
                )}
            </header>

            {isAdding && (
                <Card className="rounded-[32px] border-emerald-200 bg-emerald-50/20 border-2 overflow-hidden shadow-xl">
                    <CardHeader className="bg-white border-b border-emerald-50 p-6">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Crear Automatización</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre de la Regla</label>
                                <input
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Ej: Regalo Bienvenida"
                                    value={newCampaign.name}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Disparador (Trigger)</label>
                                <Select value={newCampaign.triggerEvent} onValueChange={(v) => setNewCampaign({ ...newCampaign, triggerEvent: v })}>
                                    <SelectTrigger className="rounded-2xl border-slate-200 py-6 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {triggers.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Activo a Enviar</label>
                            <Select value={newCampaign.assetId} onValueChange={(v) => setNewCampaign({ ...newCampaign, assetId: v })}>
                                <SelectTrigger className="rounded-2xl border-slate-200 py-6 bg-white">
                                    <SelectValue placeholder="Selecciona un eBook o Vídeo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <div className="flex items-center gap-2">
                                                {a.type === 'PDF' ? <BookOpen className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                                {a.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-emerald-100">
                            <div>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">Requiere aprobación manual</p>
                                <p className="text-xs text-slate-500">Si se activa, el regalo se encolará para que un humano lo autorice antes de enviarlo.</p>
                            </div>
                            <Switch checked={newCampaign.requireApproval} onCheckedChange={(c) => setNewCampaign({ ...newCampaign, requireApproval: c })} />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">CANCELAR</Button>
                            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black px-8">
                                ACTIVAR REGLA
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {campaigns.length === 0 && !isAdding && (
                    <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                        <p className="text-slate-400 font-medium italic">No hay reglas de envío configuradas.</p>
                    </div>
                )}
                {campaigns.map((c) => (
                    <Card key={c.id} className="rounded-[28px] border-slate-200/60 overflow-hidden hover:border-emerald-200 transition-all group bg-white">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <div className={`p-3 rounded-2xl font-black ${c.asset?.type === 'PDF' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {c.asset?.type === 'PDF' ? <BookOpen className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{c.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-[9px] font-black">{c.triggerEvent}</Badge>
                                        <span className="text-slate-400 text-xs font-bold">→ enviará:</span>
                                        <span className="text-slate-600 text-xs font-bold underline italic">{c.asset?.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aprobación</p>
                                        <Badge variant="outline" className={`mt-1 font-bold border-slate-100 ${c.requireApproval ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {c.requireApproval ? 'MANUAL' : 'AUTO'}
                                        </Badge>
                                    </div>
                                    <Switch checked={c.isActive} onCheckedChange={() => { }} className="scale-75" />
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-rose-50 text-rose-500 hover:text-rose-600">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
