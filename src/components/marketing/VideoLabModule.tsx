"use client";

import React, { useState, useCallback } from "react";
import MaestroWorkspace from "@/app/marketing/video-lab/MaestroWorkspace";
import { CreativeAgentPanel } from "@/components/creative/CreativeAgentPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Film, Upload, Brain, Scissors, Tags, RefreshCcw, Sparkles,
    Loader2, Check, AlertCircle, FileVideo, Image as ImageIcon
} from "lucide-react";
import { CREATIVE_CONCEPTS, AUDIENCE_TYPES } from "@/lib/creative/spencer-knowledge";

interface VideoLabModuleProps {
    productId: string;
    productTitle?: string;
    allProducts?: any[];
    storeId?: string;
}

type VideoLabTab = 'maestro' | 'upload' | 'processing' | 'classify' | 'extension' | 'agent';

export function VideoLabModule({ productId, productTitle, allProducts = [], storeId = '' }: VideoLabModuleProps) {
    const [activeTab, setActiveTab] = useState<VideoLabTab>('maestro');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number; results: any[] }>({ total: 0, done: 0, results: [] });
    const [captures, setCaptures] = useState<any[]>([]);
    const [loadingCaptures, setLoadingCaptures] = useState(false);

    // Bulk upload handler
    const handleBulkUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress({ total: files.length, done: 0, results: [] });

        const results: any[] = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('productId', productId);
                formData.append('storeId', storeId);

                const res = await fetch('/api/video/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                results.push({ fileName: file.name, ...data });
            } catch (err: any) {
                results.push({ fileName: files[i].name, success: false, error: err.message });
            }
            setUploadProgress(prev => ({ ...prev, done: i + 1, results: [...results] }));
        }

        setUploading(false);
    }, [productId, storeId]);

    // Load extension captures
    const loadCaptures = useCallback(async () => {
        setLoadingCaptures(true);
        try {
            const res = await fetch('/api/extension/capture');
            const data = await res.json();
            setCaptures(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load captures:', e);
        }
        setLoadingCaptures(false);
    }, []);

    const tabs: { id: VideoLabTab; label: string; icon: React.ReactNode }[] = [
        { id: 'maestro', label: 'Maestro', icon: <Film className="h-3.5 w-3.5" /> },
        { id: 'upload', label: 'Upload Masivo', icon: <Upload className="h-3.5 w-3.5" /> },
        { id: 'processing', label: 'Processing', icon: <Scissors className="h-3.5 w-3.5" /> },
        { id: 'classify', label: 'AI Classify', icon: <Tags className="h-3.5 w-3.5" /> },
        { id: 'extension', label: 'Extensión', icon: <RefreshCcw className="h-3.5 w-3.5" /> },
        { id: 'agent', label: 'Agente IA', icon: <Brain className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="bg-slate-50/30 -m-3 p-3 min-h-[800px] overflow-hidden space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id === 'extension') loadCaptures();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: Maestro */}
            {activeTab === 'maestro' && (
                <MaestroWorkspace initialProducts={allProducts} />
            )}

            {/* TAB: Upload Masivo */}
            {activeTab === 'upload' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <Upload className="h-4 w-4 text-blue-600" />
                            Upload Masivo — Pipeline Automático
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Arrastra videos/imágenes → Strip metadata → STT → Classify C1-C7 → Clips → Nomenclatura → Drive → Sheets
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Drop zone */}
                        <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                            <span className="text-sm font-bold text-slate-600">Arrastra o haz clic para subir</span>
                            <span className="text-[10px] text-slate-400 mt-1">MP4, MOV, AVI, PNG, JPG, WebP — Múltiples archivos</span>
                            <input
                                type="file"
                                multiple
                                accept="video/*,image/*"
                                onChange={handleBulkUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                        </label>

                        {/* Progress */}
                        {uploading && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-xs font-bold text-blue-700">
                                        Procesando {uploadProgress.done}/{uploadProgress.total} archivos...
                                    </span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {uploadProgress.results.length > 0 && (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {uploadProgress.results.map((r, i) => (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${r.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                                        }`}>
                                        {r.success ? <Check className="h-3.5 w-3.5 text-green-600" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                        <span className="font-bold">{r.fileName}</span>
                                        {r.nomenclatura && <Badge className="text-[8px] bg-purple-50 text-purple-600">{r.nomenclatura}</Badge>}
                                        {r.conceptName && <Badge className="text-[8px] bg-blue-50 text-blue-600">C{r.concept} {r.conceptName}</Badge>}
                                        {r.error && <span className="text-red-500 text-[10px]">{r.error}</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pipeline explanation */}
                        <div className="grid grid-cols-7 gap-1">
                            {['Strip', 'STT', 'Classify', 'Clips', 'Nomencl.', 'Drive', 'Sheets'].map((step, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{i + 1}</div>
                                    <div className="text-[9px] font-bold text-slate-600 bg-slate-50 rounded-lg py-1 px-0.5">{step}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: Processing */}
            {activeTab === 'processing' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-orange-600" />
                            Video Processing
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Strip metadata, scene detection, clip extraction, audio replace
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <ProcessingAction
                                icon={<Scissors className="h-5 w-5" />}
                                label="Strip Metadata"
                                description="Eliminar metadata + subtítulos FFmpeg"
                                color="orange"
                            />
                            <ProcessingAction
                                icon={<FileVideo className="h-5 w-5" />}
                                label="Detect Scenes"
                                description="Detección automática de escenas"
                                color="blue"
                            />
                            <ProcessingAction
                                icon={<Scissors className="h-5 w-5" />}
                                label="Extract Clips"
                                description="Cortar clips de mejores escenas"
                                color="purple"
                            />
                            <ProcessingAction
                                icon={<Sparkles className="h-5 w-5" />}
                                label="Replace Audio"
                                description="Reemplazar audio/voz del video"
                                color="green"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: AI Classify */}
            {activeTab === 'classify' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <Tags className="h-4 w-4 text-purple-600" />
                            AI Classifier — C1-C7 × Audiencia × Consciencia
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Clasificación automática por concepto, audiencia, consciencia Schwartz y posición en embudo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-7 gap-2">
                            {CREATIVE_CONCEPTS.map(c => (
                                <div key={c.id} className="text-center bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <div className="text-lg font-black text-purple-600">{c.code}</div>
                                    <div className="text-[9px] font-bold text-slate-600">{c.name}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {AUDIENCE_TYPES.map(a => (
                                <div key={a.id} className="text-center bg-slate-50 rounded-xl p-2 border border-slate-100">
                                    <div className="text-sm font-black">{a.label}</div>
                                    <div className="text-[9px] text-slate-500">{a.description}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB: Extension Captures */}
            {activeTab === 'extension' && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4 text-green-600" />
                            Extensión Chrome — Capturas
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                            Videos e imágenes capturados desde Facebook Ad Library, TikTok, YouTube (tipo Foreplay + ImageEye)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <Button
                            onClick={loadCaptures}
                            disabled={loadingCaptures}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            {loadingCaptures ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCcw className="h-3 w-3 mr-1" />}
                            Actualizar Capturas
                        </Button>

                        {captures.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <RefreshCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs font-bold">No hay capturas aún</p>
                                <p className="text-[10px]">Usa la extensión Chrome para capturar anuncios de la competencia</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                                {captures.map((c: any) => (
                                    <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            {c.type === 'VIDEO' ? <FileVideo className="h-3.5 w-3.5 text-blue-500" /> : <ImageIcon className="h-3.5 w-3.5 text-green-500" />}
                                            <Badge className="text-[8px]">{c.platform}</Badge>
                                            <Badge variant="outline" className="text-[8px]">{c.status}</Badge>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-700 truncate">{c.title}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{c.url}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB: Agent IA */}
            {activeTab === 'agent' && storeId && (
                <CreativeAgentPanel
                    storeId={storeId}
                    productId={productId}
                    productTitle={productTitle}
                    agentRole="VIDEO_AGENT"
                    agentName="Video Director IA"
                    defaultOpen={true}
                    onGenerate={(text) => console.log('[VideoLab] Agent generated:', text.slice(0, 100))}
                />
            )}
        </div>
    );
}

// Sub-component for processing actions
function ProcessingAction({ icon, label, description, color }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        orange: 'bg-orange-50 border-orange-100 text-orange-600',
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        purple: 'bg-purple-50 border-purple-100 text-purple-600',
        green: 'bg-green-50 border-green-100 text-green-600',
    };

    return (
        <button className={`${colorMap[color]} border rounded-xl p-3 text-left hover:shadow-sm transition-all`}>
            <div className="mb-1">{icon}</div>
            <div className="text-[10px] font-black uppercase tracking-wide">{label}</div>
            <div className="text-[9px] opacity-70">{description}</div>
        </button>
    );
}
