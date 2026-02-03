"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Sparkles, Loader2, ArrowRight, Trash2, FileText, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { generateAdvertorial, getAdvertorialProjects } from "./actions";

export default function ArticleLab({ storeId, products }: { storeId: string, products: any[] }) {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ productId: '', targetAvatar: 'Mujeres 30-45 años', angle: 'Curiosidad y Descubrimiento' });

    useEffect(() => {
        loadArticles();
    }, [storeId]);

    const loadArticles = async () => {
        try {
            const data = await getAdvertorialProjects(storeId);
            setArticles(data);
        } catch (e) {
            toast.error("Error al cargar artículos");
        }
    };

    const handleGenerate = async () => {
        if (!formData.productId) return;
        setLoading(true);
        try {
            await generateAdvertorial(storeId, formData.productId, formData.targetAvatar, formData.angle);
            toast.success("Advertorial generado con éxito");
            loadArticles();
        } catch (e: any) {
            toast.error(e.message || "Error al generar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-emerald-600" /> ADVERTORIAL ENGINE
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Crea artículos de preventa que calientan el tráfico y disparan el CTR.</p>
                </div>
            </header>

            <Card className="rounded-[32px] border-emerald-100 bg-emerald-50/20 border-2 overflow-hidden shadow-xl shadow-emerald-500/5">
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Producto</label>
                            <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                                <SelectTrigger className="rounded-2xl border-slate-200 py-6 bg-white">
                                    <SelectValue placeholder="Selecciona producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Avatar</label>
                            <Input
                                value={formData.targetAvatar}
                                onChange={(e) => setFormData({ ...formData, targetAvatar: e.target.value })}
                                className="rounded-2xl border-slate-200 py-6"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ángulo de Venta</label>
                            <Input
                                value={formData.angle}
                                onChange={(e) => setFormData({ ...formData, angle: e.target.value })}
                                className="rounded-2xl border-slate-200 py-6"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !formData.productId}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-8 font-black text-lg shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />}
                        GENERAR ADVERTORIAL GANADOR
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.length === 0 && !loading && (
                    <Card className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                        <p className="text-slate-400 font-medium italic">No hay artículos generados todavía.</p>
                    </Card>
                )}
                {articles.map((a) => (
                    <Card key={a.id} className="rounded-[40px] border-slate-200 overflow-hidden hover:border-emerald-200 transition-all group bg-white shadow-sm hover:shadow-xl">
                        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex justify-between items-start">
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-[10px] font-black uppercase tracking-tight">ADVERTORIAL</Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString()}</span>
                            </div>
                            <CardTitle className="text-xl font-black text-slate-800 mt-4 leading-tight">{a.name}</CardTitle>
                            <CardDescription className="text-slate-500 font-bold italic mt-1">Prod: {a.product?.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                {JSON.parse(a.blocksJson || '[]').slice(0, 3).map((b: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                        <span className="line-clamp-1">{b.title || b.content || 'Bloque de texto'}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <Button variant="outline" className="flex-1 rounded-xl font-black text-xs border-slate-200 hover:bg-emerald-50 hover:text-emerald-600">
                                    VER ARTÍCULO COMPLETO
                                </Button>
                                <Button variant="ghost" className="rounded-xl font-black text-xs text-rose-500 hover:bg-rose-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
