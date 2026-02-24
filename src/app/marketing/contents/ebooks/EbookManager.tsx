"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Zap, Download, FileText, Trash2, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { saveContentTemplate, getContentTemplates, generateEbook } from "../actions";

export default function EbookManager({ storeId }: { storeId: string }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({ name: '', type: 'EBOOK', description: '', config: { tone: 'Profesional' } });

    useEffect(() => {
        loadTemplates();
    }, [storeId]);

    const loadTemplates = async () => {
        try {
            const data = await getContentTemplates(storeId);
            setTemplates(data);
        } catch (e) {
            toast.error("Error al cargar plantillas");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveContentTemplate(storeId, editData);
            toast.success("Plantilla guardada");
            setIsEditing(false);
            loadTemplates();
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (id: string) => {
        setGeneratingId(id);
        try {
            const asset = await generateEbook(id);
            toast.success("eBook generado con éxito");
            loadTemplates();
        } catch (e: any) {
            toast.error(e.message || "Error al generar");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" /> GENERADOR DE EBOOKS
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Crea guías, manuales y contenido educativo automáticamente.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-2" /> NUEVA PLANTILLA
                    </Button>
                )}
            </header>

            {isEditing && (
                <Card className="rounded-[32px] border-blue-200 bg-blue-50/30 overflow-hidden border-2 shadow-xl shadow-blue-500/5 transition-all">
                    <CardHeader className="bg-white border-b border-blue-100 p-6">
                        <CardTitle className="text-xl font-black text-slate-800">CONFIGURAR NUEVA GUIA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre de la Plantilla</label>
                                <Input
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    placeholder="Ej: Guía de Uso Rápido - Serum"
                                    className="rounded-2xl border-slate-200 py-6"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tono del Contenido</label>
                                <Select value={editData.config.tone} onValueChange={(v) => setEditData({ ...editData, config: { ...editData.config, tone: v } })}>
                                    <SelectTrigger className="rounded-2xl border-slate-200 py-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Profesional">Profesional y Autoritativo</SelectItem>
                                        <SelectItem value="Cercano">Cercano y Amigable</SelectItem>
                                        <SelectItem value="Ventas">Persuasivo y de Ventas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Objetivo del eBook</label>
                            <Textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                placeholder="¿Qué quieres conseguir con este libro? Ej: Que el cliente sepa aplicarse el producto sin errores y reducir devoluciones."
                                className="rounded-2xl border-slate-200 min-h-[120px]"
                            />
                        </div>
                        <div className="flex gap-4 justify-end">
                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">CANCELAR</Button>
                            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 font-black shadow-lg shadow-blue-200">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GUARDAR PLANTILLA"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {templates.map((t) => (
                    <Card key={t.id} className="rounded-[28px] border-slate-200/60 overflow-hidden hover:shadow-lg transition-all group bg-white/80">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{t.name}</h3>
                                    <p className="text-slate-500 text-sm font-medium line-clamp-1">{t.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                        <Badge variant="outline" className="mt-1 bg-white border-slate-100 text-slate-500 font-bold">READY</Badge>
                                    </div>
                                    <Button
                                        onClick={() => handleGenerate(t.id)}
                                        disabled={generatingId === t.id}
                                        className="bg-slate-900 group-hover:bg-blue-600 text-white font-black rounded-xl px-6 py-5 transition-all"
                                    >
                                        {generatingId === t.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                        GENERAR VERSIÓN ACTUAL
                                    </Button>
                                </div>
                            </div>
                            {/* List of Versions */}
                            <div className="bg-slate-50/50 border-t border-slate-100 p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 px-2 mb-3 tracking-widest uppercase">
                                    <Plus className="w-3 h-3" /> ÚLTIMAS VERSIONES GENERADAS
                                </div>
                                <div className="space-y-2">
                                    {(t.assets || []).length === 0 ? (
                                        <p className="text-xs text-slate-400 italic px-2">No se han generado archivos todavía para esta plantilla.</p>
                                    ) : (
                                        t.assets.map((asset: any) => (
                                            <div key={asset.id} className="flex justify-between items-center bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-blue-100 text-blue-700 border-0 rounded-lg text-[9px] font-black">V{asset.metadataJson ? JSON.parse(asset.metadataJson).pages : '1'}PGS</Badge>
                                                    <span className="text-xs font-bold text-slate-600">{new Date(asset.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-black hover:bg-slate-100">
                                                            <Download className="w-3.5 h-3.5 mr-1" /> DESCARGAR
                                                        </Button>
                                                    </a>
                                                    <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-black text-rose-500 hover:bg-rose-50">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
