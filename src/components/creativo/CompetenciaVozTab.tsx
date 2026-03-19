'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Mic, Globe, Brain, Play, Download, RefreshCw, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Voice {
    voice_id: string;
    name: string;
    gender: string;
    language: string;
    preview_url: string;
}

interface ProcessResult {
    transcription: string;
    translation: string;
    analysis: any;
    audioUrl: string;
    finalVideoUrl: string;
}

interface CompetenciaVozTabProps {
    storeId: string;
    productId: string;
}

type Step = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'translating' | 'generating_audio' | 'lipsync' | 'done' | 'error';

const STEP_LABELS: Record<Step, string> = {
    idle: 'Listo',
    uploading: 'Subiendo video...',
    transcribing: 'Transcribiendo con Scribe...',
    analyzing: 'Analizando con Gemini...',
    translating: 'Traduciendo al español...',
    generating_audio: 'Generando voz con ElevenLabs...',
    lipsync: 'Sincronizando labios...',
    done: '✅ Completado',
    error: '❌ Error',
};

export function CompetenciaVozTab({ storeId, productId }: CompetenciaVozTabProps) {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [voiceSettings, setVoiceSettings] = useState({ stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 1.0 });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
    const [step, setStep] = useState<Step>('idle');
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [targetLang, setTargetLang] = useState<'es-mx' | 'es-es' | 'es-neutral'>('es-mx');
    const [addLipsync, setAddLipsync] = useState(true);
    const [addSubtitles, setAddSubtitles] = useState(true);
    const [scriptEs, setScriptEs] = useState('');
    const [jobId, setJobId] = useState('');

    useEffect(() => {
        fetch('/api/elevenlabs/voices')
            .then(r => r.json())
            .then(d => {
                const all = d.voices || [];
                setVoices(all.filter((v: Voice) => v.language === 'es'));
            });
    }, []);

    const handleFileSelect = (file: File) => {
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setStep('idle');
    };

    const handleProcess = async () => {
        if (!videoFile || !selectedVoice) {
            toast.error('Selecciona un video y una voz');
            return;
        }

        setStep('uploading');
        setResult(null);

        try {
            // Subir video y lanzar pipeline
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('voiceId', selectedVoice);
            formData.append('voiceSettings', JSON.stringify(voiceSettings));
            formData.append('targetLang', targetLang);
            formData.append('addLipsync', String(addLipsync));
            formData.append('addSubtitles', String(addSubtitles));
            formData.append('productId', productId);
            formData.append('storeId', storeId);
            if (scriptEs.trim()) formData.append('scriptEs', scriptEs.trim());

            setStep('transcribing');
            const res = await fetch('/api/creative/translate-voice', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error en el pipeline');

            setJobId(data.jobId);
            // Polling del estado
            await pollJobStatus(data.jobId);

        } catch (e: any) {
            setStep('error');
            toast.error(e.message);
        }
    };

    const pollJobStatus = async (id: string) => {
        const start = Date.now();
        while (Date.now() - start < 300000) {
            await new Promise(r => setTimeout(r, 4000));
            try {
                const res = await fetch(`/api/creative/translate-voice?jobId=${id}`);
                const data = await res.json();

                if (data.step) setStep(data.step as Step);

                if (data.status === 'done') {
                    setResult(data.videoUrl || data.result);
                    setStep('done');
                    toast.success('¡Video procesado con tu voz!');
                    return;
                }
                if (data.status === 'error') {
                    throw new Error(data.error);
                }
            } catch (e: any) {
                setStep('error');
                toast.error(e.message);
                return;
            }
        }
        setStep('error');
        toast.error('Timeout — el proceso tardó demasiado');
    };

    const langLabels: Record<string, string> = {
        'es-mx': '🇲🇽 Español México',
        'es-es': '🇪🇸 Español España',
        'es-neutral': '🌎 Español Neutro',
    };

    return (
        <div className="flex h-full gap-4 overflow-hidden">
            {/* IZQUIERDA — Config */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">1. Video de competencia</div>
                    <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) handleFileSelect(f); }}
                        className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 text-center cursor-pointer hover:border-[var(--cre)]/40 transition-all"
                        onClick={() => document.getElementById('video-input')?.click()}>
                        <input id="video-input" type="file" accept="video/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                        {videoFile ? (
                            <div className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                <span className="text-[9px] font-bold text-slate-600 truncate">{videoFile.name}</span>
                            </div>
                        ) : (
                            <>
                                <Upload size={20} className="text-slate-300 mx-auto mb-1" />
                                <p className="text-[8px] text-slate-400">Arrastra o haz clic para subir MP4</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">2. Idioma destino</div>
                    <div className="flex flex-col gap-1">
                        {Object.entries(langLabels).map(([k, v]) => (
                            <button key={k} onClick={() => setTargetLang(k as any)}
                                className={`px-3 py-1.5 rounded-lg text-left text-[9px] font-bold transition-all ${targetLang === k ? 'bg-[var(--cre)] text-white' : 'bg-slate-50 border border-[var(--border)] text-slate-600'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">3. Voz ElevenLabs</div>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                        className="w-full text-[9px] bg-slate-50 border border-[var(--border)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--cre)]/50 mb-2">
                        <option value="">Selecciona una voz...</option>
                        {voices.map(v => (
                            <option key={v.voice_id} value={v.voice_id}>{v.name} — {v.gender}</option>
                        ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { key: 'stability', label: 'Estabilidad' },
                            { key: 'similarity_boost', label: 'Similitud' },
                            { key: 'style', label: 'Estilo' },
                            { key: 'speed', label: 'Velocidad' },
                        ] as const).map(({ key, label }) => (
                            <div key={key}>
                                <div className="flex justify-between mb-0.5">
                                    <span className="text-[7px] text-slate-400 uppercase">{label}</span>
                                    <span className="text-[7px] font-black text-[var(--cre)]">{voiceSettings[key].toFixed(1)}</span>
                                </div>
                                <input type="range" min={key === 'speed' ? 0.5 : 0} max={key === 'speed' ? 2 : 1} step={0.1}
                                    value={voiceSettings[key]}
                                    onChange={e => setVoiceSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                                    className="w-full h-1 accent-[var(--cre)]" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">4. Script en español (opcional)</div>
                    <textarea
                        value={scriptEs}
                        onChange={e => setScriptEs(e.target.value)}
                        placeholder="Pega aquí el script en español del DOC de análisis para saltar la transcripción automática..."
                        className="w-full text-[9px] bg-slate-50 border border-[var(--border)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--cre)]/50 resize-none h-24"
                    />
                </div>

                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">5. Opciones</div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={addLipsync} onChange={e => setAddLipsync(e.target.checked)} className="accent-[var(--cre)]" />
                            <span className="text-[9px] text-slate-600 font-bold">LipSync (sincronizar labios)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={addSubtitles} onChange={e => setAddSubtitles(e.target.checked)} className="accent-[var(--cre)]" />
                            <span className="text-[9px] text-slate-600 font-bold">Subtítulos automáticos</span>
                        </label>
                    </div>
                </div>

                <button onClick={handleProcess}
                    disabled={!videoFile || !selectedVoice || step !== 'idle' && step !== 'done' && step !== 'error'}
                    className="w-full py-3 rounded-xl bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {step !== 'idle' && step !== 'done' && step !== 'error'
                        ? <><Loader2 size={14} className="animate-spin" /> {STEP_LABELS[step]}</>
                        : <><Mic size={14} /> Procesar con mi Voz</>
                    }
                </button>
            </div>

            {/* DERECHA — Resultado */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {/* Preview original */}
                {videoPreviewUrl && (
                    <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                        <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">Video Original</div>
                        <video src={videoPreviewUrl} controls className="w-full max-h-48 rounded-lg object-contain bg-black" muted />
                    </div>
                )}

                {/* Progress */}
                {step !== 'idle' && step !== 'done' && step !== 'error' && (
                    <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-3">
                            <Loader2 size={16} className="animate-spin text-[var(--cre)]" />
                            <span className="text-[10px] font-black text-[var(--text)]">{STEP_LABELS[step]}</span>
                        </div>
                        <div className="space-y-1.5">
                            {(['transcribing', 'analyzing', 'translating', 'generating_audio', 'lipsync'] as Step[]).map((s, i) => {
                                const steps: Step[] = ['transcribing', 'analyzing', 'translating', 'generating_audio', 'lipsync'];
                                const currentIdx = steps.indexOf(step);
                                const thisIdx = steps.indexOf(s);
                                const isDone = thisIdx < currentIdx;
                                const isActive = thisIdx === currentIdx;
                                return (
                                    <div key={s} className={`flex items-center gap-2 text-[8px] ${isDone ? 'text-emerald-500' : isActive ? 'text-[var(--cre)] font-black' : 'text-slate-300'}`}>
                                        {isDone ? <Check size={10} /> : isActive ? <Loader2 size={10} className="animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full border border-current" />}
                                        {STEP_LABELS[s]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Resultado */}
                {result && step === 'done' && (
                    <>
                        {/* Video final */}
                        <div className="p-3 rounded-xl bg-white border border-emerald-200">
                            <div className="text-[9px] font-black uppercase text-emerald-600 mb-2">✅ Video con tu voz</div>
                            <video src={result.finalVideoUrl} controls className="w-full max-h-64 rounded-lg object-contain bg-black" />
                            <a href={result.finalVideoUrl} target="_blank" rel="noopener noreferrer"
                                className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase flex items-center justify-center gap-1">
                                <Download size={10} /> Descargar
                            </a>
                        </div>

                        {/* Transcripción */}
                        <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                            <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">📝 Transcripción original</div>
                            <p className="text-[9px] text-slate-600 leading-relaxed">{result.transcription}</p>
                        </div>

                        {/* Traducción */}
                        <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                            <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] mb-2">🌎 Traducción {langLabels[targetLang]}</div>
                            <p className="text-[9px] text-slate-600 leading-relaxed">{result.translation}</p>
                        </div>

                        {/* Análisis Gemini */}
                        {result.analysis && (
                            <div className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-2">
                                <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)]">🧠 Análisis de Marketing</div>
                                {[
                                    { label: 'Hook', value: result.analysis.hook },
                                    { label: 'Framework', value: result.analysis.framework },
                                    { label: 'Ángulo', value: result.analysis.angle },
                                    { label: 'Fase del embudo', value: result.analysis.funnel_stage },
                                    { label: 'Avatar objetivo', value: result.analysis.target_avatar },
                                    { label: 'Por qué funciona', value: result.analysis.why_it_works },
                                    { label: 'Concepto creativo', value: result.analysis.creative_concept },
                                    { label: 'CTR estimado', value: result.analysis.ctr_estimate },
                                ].filter(i => i.value).map(item => (
                                    <div key={item.label}>
                                        <span className="text-[7px] font-black uppercase text-slate-400">{item.label}</span>
                                        <p className="text-[9px] text-slate-700">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
