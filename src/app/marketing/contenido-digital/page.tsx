"use client";

import { AgentPanel } from "@/components/AgentPanel";
import React, { useState } from "react";
import { useProduct } from "@/context/ProductContext";
import { useStore } from "@/lib/store/store-context";
import { toast } from "sonner";
import {
    BookOpen, Headphones, Mail, Video, Loader2,
    Sparkles, Play, Download, ChevronRight, Music,
    FileText, Mic, Globe, Plus, Check
} from "lucide-react";

const CONTENT_TYPES = [
    { id: "audiobook", label: "Audiolibro", icon: Headphones, color: "#8B5CF6", description: "Libro completo narrado con voz IA + música" },
    { id: "audio_course", label: "Mini Curso Audio", icon: Mic, color: "#0EA5E9", description: "5-10 lecciones en audio, descargable" },
    { id: "ebook", label: "Ebook PDF", icon: BookOpen, color: "#10B981", description: "Guía premium con diseño profesional" },
    { id: "email_sequence", label: "Secuencia Emails", icon: Mail, color: "#F59E0B", description: "Serie de emails automáticos de nurturing" },
    { id: "video_course", label: "Video Curso", icon: Video, color: "#EF4444", description: "Slides + voz IA + música de fondo" },
];

const VOICE_OPTIONS = [
    { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah — Femenina profesional" },
    { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — Masculino cálido" },
    { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — Narradora clara" },
    { id: "AZnzlk1XvdvUeBnXmlld", label: "Domi — Energética" },
];

export default function ContenidoDigitalPage() {
    const { productId, product } = useProduct();
    const { activeStoreId } = useStore();
    const [selectedType, setSelectedType] = useState("audiobook");
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("inspirador y práctico");
    const [chapters, setChapters] = useState(5);
    const [language, setLanguage] = useState("es");
    const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
    const [includeMusic, setIncludeMusic] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!productId || !topic.trim()) {
            toast.error("Selecciona un producto e introduce el tema");
            return;
        }
        setGenerating(true);
        setResult(null);
        try {
            const res = await fetch("/api/content/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Store-Id": activeStoreId || "store-main" },
                body: JSON.stringify({
                    productId, type: selectedType,
                    topic, tone, language, chapters,
                    voiceId, includeMusic,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
            toast.success(`✅ ${data.title} generado — ${data.chapters_generated} archivos`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const selectedTypeData = CONTENT_TYPES.find(t => t.id === selectedType);

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contenido Digital</h1>
                <p className="text-slate-500 text-sm mt-1">Genera audiolibros, mini cursos, ebooks y secuencias de email con IA</p>
            </div>

            {/* Tipo de contenido */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CONTENT_TYPES.map(type => {
                    const Icon = type.icon;
                    const active = selectedType === type.id;
                    return (
                        <button key={type.id} onClick={() => setSelectedType(type.id)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${active ? "border-current bg-opacity-10" : "border-slate-200 hover:border-slate-300"}`}
                            style={active ? { borderColor: type.color, backgroundColor: type.color + "15", color: type.color } : {}}>
                            <Icon size={20} className="mb-2" />
                            <div className="text-[11px] font-black uppercase tracking-tight">{type.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Config */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    {selectedTypeData && React.createElement(selectedTypeData.icon, { size: 18, style: { color: selectedTypeData?.color } })}
                    <span className="font-bold text-sm">{selectedTypeData?.description}</span>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tema / Título</label>
                    <input value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder={`Ej: "Cómo eliminar las ojeras en 7 días con ${product?.title || 'el producto'}"`}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Capítulos</label>
                        <select value={chapters} onChange={e => setChapters(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                            {[3,5,7,10].map(n => <option key={n} value={n}>{n} capítulos</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Idioma</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                            <option value="es">Español</option>
                            <option value="en">English</option>
                            <option value="pt">Português</option>
                            <option value="fr">Français</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Voz IA</label>
                        <select value={voiceId} onChange={e => setVoiceId(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                            {VOICE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tono</label>
                        <select value={tone} onChange={e => setTone(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                            <option value="inspirador y práctico">Inspirador y práctico</option>
                            <option value="científico y autoridad">Científico y autoridad</option>
                            <option value="conversacional y cercano">Conversacional y cercano</option>
                            <option value="urgente y motivador">Urgente y motivador</option>
                        </select>
                    </div>
                </div>

                {(selectedType === "audiobook" || selectedType === "audio_course") && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={includeMusic} onChange={e => setIncludeMusic(e.target.checked)} className="rounded" />
                        <Music size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600">Incluir música de fondo (ElevenLabs)</span>
                    </label>
                )}

                <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                    {generating ? <><Loader2 size={16} className="animate-spin" /> Generando con IA...</> : <><Sparkles size={16} /> Generar {selectedTypeData?.label}</>}
                </button>
            </div>

            {/* Resultado */}
            {result && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-black text-slate-900">{result.title}</h2>
                            <p className="text-sm text-slate-500">{result.chapters_generated} archivos generados • {result.language?.toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-bold">
                            <Check size={12} /> Listo
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(result.structure?.items || []).map((item: any, i: number) => {
                            const audio = result.audio_files?.[i];
                            return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black">{i+1}</div>
                                        <div>
                                            <div className="text-[12px] font-bold text-slate-900">{item.title}</div>
                                            <div className="text-[10px] text-slate-400">{item.summary}</div>
                                        </div>
                                    </div>
                                    {audio?.driveUrl && (
                                        <a href={audio.driveUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold">
                                            <Download size={12} /> Drive
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {result.music_url && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
                            <Music size={14} className="text-purple-600" />
                            <span className="text-xs text-purple-700 font-bold">Música de fondo generada</span>
                            <a href={result.music_url} target="_blank" className="ml-auto text-xs text-purple-600 hover:underline">Ver en Drive</a>
                        </div>
                    )}
                </div>
            )}
        <AgentPanel
        specialistRole="script-writer"
        specialistLabel="Script Writer"
        accentColor="#EC4899"
        storeId={activeStoreId || "store-main"}
        productId={productId || undefined}
        moduleContext={{}}
        specialistActions={[{"label": "Audiolibro rápido", "prompt": "Genera el índice de un audiolibro sobre el beneficio principal del producto"}, {"label": "Email secuencia", "prompt": "Crea una secuencia de 5 emails post-compra para fidelizar"}, {"label": "Curso audio", "prompt": "Diseña un mini curso en audio de 5 lecciones"}]}
    />
        </div>
    );
}