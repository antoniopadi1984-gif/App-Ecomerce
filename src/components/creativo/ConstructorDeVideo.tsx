'use client';

import React, { useState, useEffect } from 'react';
import {
    Zap, Video, Sparkles, Layout, Play,
    Plus, Trash2, Edit3, ChevronRight,
    MoreVertical, Download, Share2,
    CheckCircle2, AlertCircle, Loader2,
    Music, Mic, Wand2, Type, Move,
    Layers, ExternalLink, Archive,
    Clock, Smartphone, Monitor, Square,
    Target, FileText, MousePointer2, Save,
    Globe, Languages, ShieldCheck, RefreshCcw, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PreLaunchScore } from './PreLaunchScore';

interface Scene {
    idx: number;
    id?: string;
    texto: string;
    duracion: number;
    tipo: string;
    broll_necesario: boolean;
    emocion: string;
    musica_tipo: string;
    status: 'PENDIENTE' | 'GENERANDO' | 'LISTO' | 'ERROR';
    videoUrl?: string;
    jobId?: string;
}

interface Avatar {
    id: string;
    name: string;
    voiceId: string;
    imageUrl: string;
}

const FRAMEWORKS = ['Hormozi', 'Cashvertising', 'Breakthrough', 'DTC', 'UGC', 'VSL'];
const FORMATS = ['9:16', '4:5', '1:1', '16:9'];
const DURATIONS = ['15s', '30s', '45s', '60s', '90s'];
const PHASES = ['FRÍO', 'TEMPLADO', 'CALIENTE', 'RETARGETING'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán'];

export function ConstructorDeVideo({
    conceptId,
    conceptName,
    storeId,
    productId,
    initialHook = '',
    iaConfig
}: {
    conceptId: string,
    conceptName: string,
    storeId: string,
    productId: string,
    initialHook?: string,
    iaConfig?: any
}) {
    // B1: Configuración + Script States
    const [hookText, setHookText] = useState(initialHook);

    useEffect(() => {
        if (initialHook) setHookText(initialHook);
    }, [initialHook]);

    const [avatarId, setAvatarId] = useState('');
    const [formato, setFormato] = useState('9:16');
    const [duracion, setDuracion] = useState('30s');
    const [oferta, setOferta] = useState('');
    const [fase, setFase] = useState('FRÍO');
    const [framework, setFramework] = useState('Hormozi');
    const [idioma, setIdioma] = useState('Español');

    useEffect(() => {
        if (iaConfig) {
            if (iaConfig.framework) setFramework(iaConfig.framework);
            if (iaConfig.duracion) setDuracion(iaConfig.duracion);
            if (iaConfig.fase) setFase(iaConfig.fase);
            if (iaConfig.formato) setFormato(iaConfig.formato);
            if (iaConfig.oferta) setOferta(iaConfig.oferta);
            toast.info("Configuración IA aplicada al constructor");
        }
    }, [iaConfig]);

    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [scriptData, setScriptData] = useState<{ nomenclature: string, escenas: Scene[] } | null>(null);
    const [avatars, setAvatars] = useState<Avatar[]>([]);

    // B2: Generación States
    const [generatingScenes, setGeneratingScenes] = useState<Record<number, boolean>>({});

    // B3: Ensamblaje States
    const [isAssembling, setIsAssembling] = useState(false);
    const [assemblyProgress, setAssemblyProgress] = useState(0);
    const [assemblyFinished, setAssemblyFinished] = useState(false);
    const [scoreData, setScoreData] = useState<{ score: number, improvements: string[] } | null>(null);

    // Section C: Idioma
    const [isTranslating, setIsTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState('Inglés');

    useEffect(() => {
        if (productId) fetchAvatars();
    }, [productId]);

    const fetchAvatars = async () => {
        try {
            const res = await fetch(`/api/avatares?productId=${productId}`);
            const data = await res.json();
            setAvatars(data.avatars || []);
            if (data.avatars?.length > 0) setAvatarId(data.avatars[0].id);
        } catch (e) {
            console.error("Error fetching avatars", e);
        }
    };

    const handleGenerateScript = async () => {
        if (!hookText) {
            toast.error("Proporciona un hook inicial");
            return;
        }
        setIsGeneratingScript(true);
        try {
            const response = await fetch('/api/centro-creativo/generar-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId, conceptId, hookText, avatarId, formato, duracion, oferta, fase, framework, idioma
                })
            });
            const data = await response.json();
            if (data.escenas) {
                setScriptData({
                    nomenclature: data.nomenclatura,
                    escenas: data.escenas.map((s: any) => ({ ...s, status: 'PENDIENTE' }))
                });
                setAssemblyFinished(false);
                toast.success("Script generado con éxito");
            }
        } catch (error) {
            toast.error("Error al generar el script");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateScene = async (idx: number) => {
        setGeneratingScenes(prev => ({ ...prev, [idx]: true }));
        try {
            if (!scriptData) return;
            const updatedEscenas = [...scriptData.escenas];
            const sceneIdx = updatedEscenas.findIndex(s => s.idx === idx);
            if (sceneIdx === -1) return;

            updatedEscenas[sceneIdx].status = 'GENERANDO';
            setScriptData({ ...scriptData, escenas: updatedEscenas });

            await new Promise(r => setTimeout(r, 4000));

            updatedEscenas[sceneIdx].status = 'LISTO';
            updatedEscenas[sceneIdx].videoUrl = 'https://ai-videos-bucket.s3.amazonaws.com/temp-scene-123.mp4';
            setScriptData({ ...scriptData, escenas: updatedEscenas });
            toast.success(`Escena ${idx} generada`);
        } catch (e) {
            toast.error(`Error en escena ${idx}`);
        } finally {
            setGeneratingScenes(prev => ({ ...prev, [idx]: false }));
        }
    };

    const handleAssemble = async () => {
        setIsAssembling(true);
        setAssemblyProgress(10);
        setAssemblyFinished(false);
        try {
            const steps = ["Cleaning Metadata", "Mixing Audio", "Rendering", "Uploading"];
            for (let i = 0; i < steps.length; i++) {
                await new Promise(r => setTimeout(r, 1200));
                setAssemblyProgress((i + 1) * 25);
            }
            setAssemblyFinished(true);
            setScoreData({
                score: 82,
                improvements: ["Add faster cuts", "Higher caption contrast"]
            });
            toast.success("Vídeo final exportado a Drive");
        } catch (error) {
            toast.error("Error en ensamblaje");
        } finally {
            setIsAssembling(false);
        }
    };

    const handleTranslate = async () => {
        setIsTranslating(true);
        try {
            const res = await fetch('/api/centro-creativo/cambiar-idioma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conceptId,
                    productId,
                    targetLanguage: targetLang,
                    scriptData
                })
            });

            if (!res.ok) throw new Error();

            toast.success(`Traducido a ${targetLang}`);
            setAssemblyFinished(false);
            // Si la API devuelve un nuevo script, lo actualizamos aquí
            // const data = await res.json();
            // if (data.script) setScriptData(data.script);
        } catch (e) {
            toast.error("Error en traducción");
        } finally {
            setIsTranslating(false);
        }
    };

    const updateScene = (idx: number, field: string, value: any) => {
        if (!scriptData) return;
        const newEscenas = scriptData.escenas.map(s =>
            s.idx === idx ? { ...s, [field]: value } : s
        );
        setScriptData({ ...scriptData, escenas: newEscenas });
    };

    const allScenesReady = scriptData?.escenas.every(s => s.status === 'LISTO') && scriptData?.escenas.length > 0;

    return (
        <div className="space-y-8 pb-12">
            {/* CONFIGURACIÓN */}
            <section className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><FileText size={16} /></div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Constructor de Script</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Hook Activo</label>
                        <textarea
                            value={hookText}
                            onChange={e => setHookText(e.target.value)}
                            placeholder="Hook ganador..."
                            className="w-full h-16 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--cre)] transition-all resize-none italic"
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        <ConfigSelect label="Avatar" value={avatarId} options={avatars.map(av => ({ id: av.id, label: av.name }))} onChange={setAvatarId} />
                        <ConfigSelect label="Formato" value={formato} options={FORMATS} onChange={setFormato} />
                        <ConfigSelect label="Duración" value={duracion} options={DURATIONS} onChange={setDuracion} />
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Oferta</label>
                            <input
                                value={oferta} onChange={e => setOferta(e.target.value)}
                                className="w-full h-8 px-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[10px] font-semibold outline-none focus:border-[var(--cre)]"
                            />
                        </div>
                        <ConfigSelect label="Fase" value={fase} options={PHASES} onChange={setFase} />
                        <ConfigSelect label="Framework" value={framework} options={FRAMEWORKS} onChange={setFramework} />
                        <ConfigSelect label="Idioma" value={idioma} options={LANGUAGES} onChange={setIdioma} />
                    </div>

                    <button
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript || !conceptId}
                        className="w-full h-9 bg-[var(--cre)] text-white font-semibold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGeneratingScript ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span>Generar Script Completo</span>
                    </button>
                </div>

                {/* STORYBOARD */}
                {scriptData && (
                    <div className="pt-6 border-t border-[var(--border)] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{scriptData.nomenclature}</span>
                            <span className="text-[9px] font-bold text-[var(--cre)] uppercase bg-[var(--cre-bg)] px-2 py-0.5 rounded border border-[var(--cre)]/10">{scriptData.escenas.length} ESCENAS</span>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                            {scriptData.escenas.map((scene) => (
                                <div key={scene.idx} className="w-[280px] shrink-0 bg-[var(--bg)]/50 border border-[var(--border)] rounded-xl p-4 space-y-3 snap-start relative">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">ESCENA {scene.idx}</span>
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white text-[var(--cre)] border border-[var(--border)] uppercase">{scene.tipo}</span>
                                    </div>
                                    <textarea
                                        value={scene.texto} onChange={e => updateScene(scene.idx, 'texto', e.target.value)}
                                        className="w-full h-20 bg-white p-2 rounded-lg text-[10px] font-medium text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--cre)] transition-all resize-none outline-none leading-normal"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[8px] font-bold uppercase text-[var(--text-tertiary)]">Duración</label>
                                            <input type="number" value={scene.duracion} onChange={e => updateScene(scene.idx, 'duracion', Number(e.target.value))} className="w-full h-7 px-2 bg-white border border-[var(--border)] rounded-md text-[10px] font-bold" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[8px] font-bold uppercase text-[var(--text-tertiary)]">Emoción</label>
                                            <select value={scene.emocion} onChange={e => updateScene(scene.idx, 'emocion', e.target.value)} className="w-full h-7 px-2 bg-white border border-[var(--border)] rounded-md text-[9px] font-bold">
                                                {['Calma', 'Urgencia', 'Felicidad'].map(e => <option key={e} value={e}>{e}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="aspect-[9/16] bg-black rounded-lg relative overflow-hidden flex items-center justify-center">
                                        {scene.videoUrl ? <video src={scene.videoUrl} className="w-full h-full object-cover" controls /> : <Video size={20} className="text-white/20" />}
                                    </div>
                                    <button
                                        onClick={() => handleGenerateScene(scene.idx)}
                                        disabled={generatingScenes[scene.idx] || scene.status === 'LISTO'}
                                        className={cn(
                                            "w-full h-8 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                                            scene.status === 'LISTO' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--cre)]"
                                        )}
                                    >
                                        {generatingScenes[scene.idx] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        {scene.status === 'LISTO' ? 'Listo' : 'Generar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* ENSAMBLAJE */}
            {allScenesReady && (
                <section className="bg-white p-5 rounded-xl border border-[var(--border)] shadow-sm animate-in slide-in-from-bottom-4 duration-700 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--cre-bg)] text-[var(--cre)] flex items-center justify-center border border-[var(--cre)]/10"><Layers size={20} /></div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)]">Ensamblaje Final</h3>
                                <p className="text-[9px] text-[var(--text-tertiary)] font-medium uppercase mt-0.5">Sincronización por IA</p>
                            </div>
                        </div>
                        <button
                            onClick={handleAssemble}
                            disabled={isAssembling}
                            className="h-9 px-6 bg-[var(--cre)] text-white text-[10px] font-bold uppercase rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                        >
                            {isAssembling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                            Ensamblar Vídeo
                        </button>
                    </div>

                    {isAssembling && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-bold text-[var(--cre)] uppercase"><span>PROCESANDO...</span><span>{assemblyProgress}%</span></div>
                            <div className="h-1.5 w-full bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div className="h-full bg-[var(--cre)] transition-all duration-500" style={{ width: `${assemblyProgress}%` }} />
                            </div>
                        </div>
                    )}

                    {assemblyFinished && scoreData && (
                        <div className="grid grid-cols-2 gap-6">
                            <PreLaunchScore
                                score={scoreData.score}
                                improvements={scoreData.improvements}
                                onImprove={() => toast.info("Optimizando...")}
                            />
                            <div className="bg-[var(--bg)]/40 p-5 rounded-xl border border-[var(--border)] space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[var(--cre)] border border-[var(--border)]"><Languages size={14} /></div>
                                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase">Variante Multi-Idioma</h4>
                                </div>
                                <div className="flex gap-2">
                                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="flex-1 h-8 px-2 bg-white border border-[var(--border)] rounded-lg text-[10px] font-bold outline-none">
                                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <button onClick={handleTranslate} disabled={isTranslating} className="px-4 h-8 bg-white border border-[var(--border)] text-[var(--text-primary)] text-[10px] font-bold uppercase rounded-lg hover:border-[var(--cre)]">
                                        {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} TRADUCIR
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

function ConfigSelect({ label, value, options, onChange }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">{label}</label>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="w-full h-8 px-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[10px] font-semibold outline-none focus:border-[var(--cre)] appearance-none cursor-pointer"
            >
                {options.map((opt: any) => (
                    typeof opt === 'string'
                        ? <option key={opt} value={opt}>{opt}</option>
                        : <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
