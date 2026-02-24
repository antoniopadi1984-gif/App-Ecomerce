"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles, Play, Plus, Loader2, FileVideo, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getContentTemplates, generateMiniCourse } from "../actions";

export default function CourseManager({ storeId }: { storeId: string }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, [storeId]);

    const loadTemplates = async () => {
        try {
            const all = await getContentTemplates(storeId);
            setTemplates(all.filter((t: any) => t.type === 'MINI_COURSE'));
        } catch (e) {
            toast.error("Error al cargar cursos");
        }
    };

    const handleGenerate = async (id: string) => {
        setGeneratingId(id);
        try {
            await generateMiniCourse(id);
            toast.success("Mini-Curso generado con éxito");
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
                        <Video className="w-6 h-6 text-purple-600" /> LABORATORIO DE MINI-CURSOS
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Crea series de vídeos educativos automáticos (Modo B - FFmpeg).</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" /> NUEVO CURSO
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((t) => (
                    <Card key={t.id} className="rounded-[32px] border-slate-200/60 overflow-hidden hover:border-purple-200 hover:shadow-sm hover:shadow-sm transition-all group bg-white">
                        <CardHeader className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
                                    <Video className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold border-0">MODO B</Badge>
                            </div>
                            <CardTitle className="text-xl font-black text-slate-800 mt-4 uppercase tracking-tight">{t.name}</CardTitle>
                            <CardDescription className="text-slate-500 font-medium leading-relaxed">{t.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Última Versión Generada</p>
                                {t.assets?.length > 0 ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileVideo className="w-5 h-5 text-purple-500" />
                                            <span className="text-xs font-bold text-slate-700">curso_v1.mp4</span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[11px] font-black text-purple-600 hover:bg-purple-50">
                                            <Play className="w-3 h-3 mr-1 mt-0.5" /> REPRODUCIR
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No hay assets generados.</p>
                                )}
                            </div>
                            <Button
                                onClick={() => handleGenerate(t.id)}
                                disabled={generatingId === t.id}
                                className="w-full bg-slate-900 group-hover:bg-purple-600 text-white font-black py-6 rounded-2xl transition-all shadow-sm"
                            >
                                {generatingId === t.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {generatingId === t.id ? "GENERANDO VÍDEO..." : "RE-GENERAR MINI-CURSO"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
