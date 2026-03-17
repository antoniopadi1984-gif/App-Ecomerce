'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, Film, CheckCircle2, AlertCircle, RefreshCw, Play, Download } from 'lucide-react';
import { toast } from 'sonner';

interface VideoStudioTabProps {
    storeId: string;
    productId: string;
    voiceId?: string;
    voiceSettings?: any;
    onNeedVoice?: () => void;
}

type Phase = 'config' | 'script' | 'clips' | 'assemble' | 'done';

interface SceneScript {
    id: number;
    duration: number;
    spokenText: string;
    visualPrompt: string;
    sceneType: string;
    cameraAngle: string;
    emotion: string;
    includeProduct: boolean;
}

interface SceneResult {
    sceneId: number;
    clipUrl: string;
    status: 'pending' | 'generating' | 'done' | 'error';
    error?: string;
}

const FORMATS = [
    { id: 'ugc', label: 'UGC', desc: 'Persona real hablando, auténtico' },
    { id: 'vsl', label: 'VSL', desc: 'Video Sales Letter, largo formato' },
    { id: 'broll', label: 'B-Roll', desc: 'Imágenes + voz en off' },
    { id: 'voiceover', label: 'Voz en Off', desc: 'Sin cara, solo voz' },
    { id: 'testimonial', label: 'Testimonial', desc: 'Historia real de cliente' },
    { id: 'problem_solution', label: 'Problema/Solución', desc: 'Antes y después' },
];

const FRAMEWORKS = [
    { id: 'hook_body_cta', label: 'Hook → Body → CTA' },
    { id: 'aida', label: 'AIDA' },
    { id: 'pas', label: 'PAS (Pain-Agitate-Solve)' },
    { id: 'dac', label: 'DIC (Disrupt-Intrigue-Click)' },
    { id: 'bab', label: 'BAB (Before-After-Bridge)' },
    { id: 'storybrand', label: 'StoryBrand' },
    { id: 'hormozi', label: 'Hormozi Offer' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function VideoStudioTab({ storeId, productId, voiceId, voiceSettings, onNeedVoice }: VideoStudioTabProps) {
    const [phase, setPhase] = useState<Phase>('config');
    const [format, setFormat] = useState('ugc');
    const [framework, setFramework] = useState('hook_body_cta');
    const [duration, setDuration] = useState(30);
    const [outputFormat, setOutputFormat] = useState('9:16');
    const [addMusic, setAddMusic] = useState(false);
    const [musicStyle, setMusicStyle] = useState('upbeat energetic background');

    const [script, setScript] = useState<any>(null);
    const [editedScenes, setEditedScenes] = useState<SceneScript[]>([]);
    const [sceneResults, setSceneResults] = useState<SceneResult[]>([]);
    const [finalVideoUrl, setFinalVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    // FASE 1: Generar guion
    const generateScript = async () => {
        if (!voiceId) {
            toast.error('Selecciona una voz primero');
            onNeedVoice?.();
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/creative/generate-scene-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, mode: format, framework, targetDuration: duration, voiceId }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setScript(data.script);
            setEditedScenes(data.script.scenes);
            setPhase('script');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // FASE 2: Generar clips
    const generateClips = async () => {
        setLoading(true);
        setPhase('clips');
        const results: SceneResult[] = editedScenes.map(s => ({ sceneId: s.id, clipUrl: '', status: 'pending' }));
        setSceneResults([...results]);

        for (let i = 0; i < editedScenes.length; i++) {
            setSceneResults(prev => prev.map(r => r.sceneId === editedScenes[i].id ? { ...r, status: 'generating' } : r));
            try {
                const res = await fetch('/api/creative/generate-video-scenes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId,
                        script: { scenes: [editedScenes[i]], title: script?.title, totalDuration: editedScenes[i].duration },
                        avatarImageUrl: script?.avatarImageUrl || '',
                        voiceId,
                        voiceSettings,
                        addMusic: false,
                        outputFormat,
                        saveToLibrary: false,
                    }),
                });
                const data = await res.json();
                if (data.success && data.scenes?.[0]?.clipUrl) {
                    setSceneResults(prev => prev.map(r => r.sceneId === editedScenes[i].id
                        ? { ...r, status: 'done', clipUrl: data.scenes[0].clipUrl }
                        : r
                    ));
                } else {
                    throw new Error(data.error || 'Error generando clip');
                }
            } catch (e: any) {
                setSceneResults(prev => prev.map(r => r.sceneId === editedScenes[i].id
                    ? { ...r, status: 'error', error: e.message }
                    : r
                ));
            }
        }
        setLoading(false);
    };

    // Regenerar clip individual
    const regenerateClip = async (sceneId: number) => {
        const scene = editedScenes.find(s => s.id === sceneId);
        if (!scene) return;
        setSceneResults(prev => prev.map(r => r.sceneId === sceneId ? { ...r, status: 'generating' } : r));
        try {
            const res = await fetch('/api/creative/generate-video-scenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    script: { scenes: [scene], title: script?.title, totalDuration: scene.duration },
                    avatarImageUrl: script?.avatarImageUrl || '',
                    voiceId, voiceSettings, addMusic: false, outputFormat, saveToLibrary: false,
                }),
            });
            const data = await res.json();
            if (data.success && data.scenes?.[0]?.clipUrl) {
                setSceneResults(prev => prev.map(r => r.sceneId === sceneId ? { ...r, status: 'done', clipUrl: data.scenes[0].clipUrl } : r));
                toast.success(`Escena ${sceneId} regenerada`);
            } else throw new Error(data.error);
        } catch (e: any) {
            setSceneResults(prev => prev.map(r => r.sceneId === sceneId ? { ...r, status: 'error', error: e.message } : r));
            toast.error(e.message);
        }
    };

    // FASE 3: Montar video final
    const assembleVideo = async () => {
        const doneScenes = sceneResults.filter(s => s.status === 'done');
        if (doneScenes.length === 0) { toast.error('No hay clips listos para montar'); return; }
        setLoading(true);
        setPhase('assemble');
        try {
            const res = await fetch('/api/creative/generate-video-scenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    script: { scenes: editedScenes.filter(s => doneScenes.find(d => d.sceneId === s.id)), title: script?.title, totalDuration: duration },
                    avatarImageUrl: script?.avatarImageUrl || '',
                    voiceId, voiceSettings,
                    preGeneratedClips: doneScenes.map(s => ({ sceneId: s.sceneId, clipUrl: s.clipUrl })),
                    addMusic, musicStyle, outputFormat, saveToLibrary: true,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFinalVideoUrl(data.videoUrl);
                setPhase('done');
                toast.success('¡Video montado y guardado!');
            } else throw new Error(data.error);
        } catch (e: any) {
            toast.error(e.message);
            setPhase('clips');
        } finally {
            setLoading(false);
        }
    };

    // FASE CONFIG
    if (phase === 'config') return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Film size={16} className="text-[var(--cre)]" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text)]">Estudio de Video</h2>
                {!voiceId && (
                    <button onClick={onNeedVoice} className="ml-auto text-[8px] font-black text-[var(--cre)] uppercase tracking-widest hover:underline">
                        ⚠️ Selecciona una voz primero →
                    </button>
                )}
            </div>

            {/* Formato */}
            <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">Formato de Video</div>
                <div className="grid grid-cols-2 gap-1.5">
                    {FORMATS.map(f => (
                        <button key={f.id} onClick={() => setFormat(f.id)}
                            className={`p-2 rounded-lg text-left transition-all border ${format === f.id ? 'bg-[var(--cre)] border-[var(--cre)] text-white' : 'bg-slate-50 border-[var(--border)] hover:border-[var(--cre)]/30'}`}>
                            <div className={`text-[9px] font-black uppercase ${format === f.id ? 'text-white' : 'text-slate-700'}`}>{f.label}</div>
                            <div className={`text-[7px] ${format === f.id ? 'text-white/70' : 'text-slate-400'}`}>{f.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Framework */}
            <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">Framework de Guion</div>
                <div className="flex flex-col gap-1">
                    {FRAMEWORKS.map(f => (
                        <button key={f.id} onClick={() => setFramework(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-left text-[9px] font-bold transition-all border ${framework === f.id ? 'bg-[var(--cre)] border-[var(--cre)] text-white' : 'bg-slate-50 border-[var(--border)] text-slate-600 hover:border-[var(--cre)]/30'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duración y formato */}
            <div className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-3">
                <div>
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">Duración Total</div>
                    <div className="flex gap-1 flex-wrap">
                        {DURATIONS.map(d => (
                            <button key={d} onClick={() => setDuration(d)}
                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black transition-all ${duration === d ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-500 hover:border-[var(--cre)]/30'}`}>
                                {d}s
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">Formato</div>
                    <div className="flex gap-1">
                        {(['9:16', '16:9', '1:1'] as const).map(f => (
                            <button key={f} onClick={() => setOutputFormat(f)}
                                className={`px-3 py-1 rounded-lg text-[8px] font-black transition-all ${outputFormat === f ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-500'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="music" checked={addMusic} onChange={e => setAddMusic(e.target.checked)} className="accent-[var(--cre)]" />
                    <label htmlFor="music" className="text-[9px] font-bold text-slate-600">Añadir música IA de fondo</label>
                    {addMusic && (
                        <input value={musicStyle} onChange={e => setMusicStyle(e.target.value)}
                            placeholder="Estilo musical..."
                            className="flex-1 px-2 py-1 text-[8px] bg-slate-50 border border-[var(--border)] rounded-lg outline-none" />
                    )}
                </div>
            </div>

            <button onClick={generateScript} disabled={loading || !voiceId}
                className="w-full py-3 rounded-xl bg-[var(--cre)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Generando guion...</> : <><Wand2 size={14} /> Generar Guion por Escenas</>}
            </button>
        </div>
    );

    // FASE SCRIPT — editar escenas
    if (phase === 'script') return (
        <div className="h-full overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-[11px] font-black uppercase text-[var(--text)]">{script?.title}</h2>
                    <p className="text-[9px] text-slate-400">{editedScenes.length} escenas · {duration}s · {format.toUpperCase()} · {framework}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPhase('config')} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[8px] font-black uppercase">← Volver</button>
                    <button onClick={generateClips} className="px-3 py-1.5 rounded-xl bg-[var(--cre)] text-white text-[8px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90">
                        Generar Clips →
                    </button>
                </div>
            </div>

            {editedScenes.map((scene, i) => (
                <div key={scene.id} className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--cre)] text-white text-[8px] font-black flex items-center justify-center flex-shrink-0">{scene.id}</div>
                        <div className="flex gap-1 flex-wrap flex-1">
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-slate-100 text-slate-600 uppercase">{scene.sceneType}</span>
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-slate-100 text-slate-600">{scene.duration}s</span>
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-slate-100 text-slate-600">{scene.cameraAngle}</span>
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-[var(--cre)]/10 text-[var(--cre)]">{scene.emotion}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[7px] font-black uppercase text-slate-400 mb-1">Texto hablado</div>
                        <textarea value={scene.spokenText}
                            onChange={e => setEditedScenes(prev => prev.map(s => s.id === scene.id ? { ...s, spokenText: e.target.value } : s))}
                            className="w-full text-[10px] text-slate-700 bg-slate-50 border border-[var(--border)] rounded-lg p-2 resize-none outline-none focus:border-[var(--cre)]/50"
                            rows={2} />
                    </div>
                    <div>
                        <div className="text-[7px] font-black uppercase text-slate-400 mb-1">Prompt visual (inglés)</div>
                        <textarea value={scene.visualPrompt}
                            onChange={e => setEditedScenes(prev => prev.map(s => s.id === scene.id ? { ...s, visualPrompt: e.target.value } : s))}
                            className="w-full text-[9px] text-slate-500 bg-slate-50 border border-[var(--border)] rounded-lg p-2 resize-none outline-none focus:border-[var(--cre)]/50"
                            rows={2} />
                    </div>
                </div>
            ))}

            <button onClick={generateClips} className="w-full py-3 rounded-xl bg-[var(--cre)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 flex items-center justify-center gap-2">
                <Film size={14} /> Generar {editedScenes.length} Clips
            </button>
        </div>
    );

    // FASE CLIPS — ver y aprobar
    if (phase === 'clips') return (
        <div className="h-full overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-black uppercase text-[var(--text)]">Clips por Escena</h2>
                {!loading && sceneResults.every(s => s.status !== 'generating') && (
                    <button onClick={assembleVideo}
                        className="px-4 py-2 rounded-xl bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest">
                        Montar Video Final →
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {sceneResults.map((result, i) => {
                    const scene = editedScenes.find(s => s.id === result.sceneId);
                    return (
                        <div key={result.sceneId} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
                            <div className="aspect-[9/16] bg-slate-900 relative flex items-center justify-center max-h-40">
                                {result.status === 'done' && result.clipUrl ? (
                                    <video src={result.clipUrl} className="w-full h-full object-cover" controls muted />
                                ) : result.status === 'generating' ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 size={20} className="animate-spin text-[var(--cre)]" />
                                        <span className="text-[8px] text-white/60 uppercase">Generando...</span>
                                    </div>
                                ) : result.status === 'error' ? (
                                    <div className="flex flex-col items-center gap-2 p-2 text-center">
                                        <AlertCircle size={16} className="text-red-400" />
                                        <span className="text-[7px] text-red-300">{result.error?.slice(0, 50)}</span>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <Play size={12} className="text-white/30" />
                                    </div>
                                )}
                                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-[var(--cre)] text-white text-[8px] font-black flex items-center justify-center">
                                    {result.sceneId}
                                </div>
                                {result.status === 'done' && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                    </div>
                                )}
                            </div>
                            <div className="p-2">
                                <p className="text-[8px] text-slate-600 line-clamp-2">{scene?.spokenText}</p>
                                <div className="flex gap-1 mt-1.5">
                                    {(result.status === 'done' || result.status === 'error') && (
                                        <button onClick={() => regenerateClip(result.sceneId)}
                                            className="flex-1 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[7px] font-black uppercase flex items-center justify-center gap-1">
                                            <RefreshCw size={8} /> Regenerar
                                        </button>
                                    )}
                                    {result.status === 'done' && result.clipUrl && (
                                        <a href={result.clipUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 py-1 rounded-md bg-[var(--cre)]/10 text-[var(--cre)] text-[7px] font-black uppercase flex items-center justify-center gap-1">
                                            <Download size={8} /> Ver
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // FASE ASSEMBLE
    if (phase === 'assemble') return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 size={32} className="animate-spin text-[var(--cre)]" />
            <h2 className="text-[12px] font-black uppercase text-[var(--text)]">Montando Video Final</h2>
            <p className="text-[10px] text-slate-400">FFmpeg concatenando clips + música...</p>
        </div>
    );

    // FASE DONE
    if (phase === 'done') return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <h2 className="text-[14px] font-black uppercase text-[var(--text)]">¡Video Listo!</h2>
            <div className="w-full max-w-xs aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden">
                <video src={finalVideoUrl} className="w-full h-full object-cover" controls />
            </div>
            <div className="flex gap-2">
                <a href={finalVideoUrl} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Download size={12} /> Descargar
                </a>
                <button onClick={() => { setPhase('config'); setScript(null); setSceneResults([]); setFinalVideoUrl(''); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                    Nuevo Video
                </button>
            </div>
        </div>
    );

    return null;
}
