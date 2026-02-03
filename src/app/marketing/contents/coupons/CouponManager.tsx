"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Tag, Gift, Download, Sparkles, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { getContentTemplates, saveContentTemplate } from "../actions";

export default function CouponManager({ storeId }: { storeId: string }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [storeId]);

    const loadTemplates = async () => {
        try {
            const all = await getContentTemplates(storeId);
            setTemplates(all.filter((t: any) => t.type === 'COUPON' || t.type === 'CARD'));
        } catch (e) {
            toast.error("Error al cargar cupones");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-amber-500" /> TARJETAS & CUPONES QR
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Crea incentivos visuales para fomentar la recompra y fidelidad.</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" /> NUEVO CUPÓN
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.length === 0 && (
                    <Card className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                        <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">No hay cupones digitales configurados.</p>
                    </Card>
                )}
                {templates.map((t) => (
                    <Card key={t.id} className="rounded-[32px] border-slate-200/60 overflow-hidden hover:border-amber-200 transition-all bg-white group">
                        <CardHeader className="p-6 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white text-amber-500 rounded-xl shadow-sm">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 border-0 rounded-lg text-[10px] font-black">{t.type}</Badge>
                            </div>
                            <CardTitle className="text-xl font-black text-slate-800 mt-4 uppercase tracking-tight">{t.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                <p className="text-xs font-bold text-amber-800 line-clamp-2 italic">"{t.description}"</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full bg-slate-900 group-hover:bg-amber-500 text-white font-black py-6 rounded-2xl transition-all">
                                    <Sparkles className="w-4 h-4 mr-2" /> GENERAR PARA CAMPAÑA
                                </Button>
                                <Button variant="ghost" className="text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
                                    VER PLANTILLA DISEÑO
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
