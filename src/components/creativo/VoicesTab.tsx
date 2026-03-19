'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, Loader2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Voice {
    voice_id: string;
    name: string;
    category: string;
    language: string;
    gender: string;
    age: string;
    use_case: string;
    preview_url: string;
}

interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
}

interface VoicesTabProps {
    storeId: string;
    productId: string;
    selectedVoiceId?: string;
    onVoiceSelect?: (voiceId: string, settings: VoiceSettings) => void;
}

export function VoicesTab({ storeId, productId, selectedVoiceId, onVoiceSelect }: VoicesTabProps) {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLang, setFilterLang] = useState<'all' | 'es' | 'en'>('es');
    const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
    const [selected, setSelected] = useState(selectedVoiceId || '');
    const [playing, setPlaying] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);
    const [settings, setSettings] = useState<VoiceSettings>({
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.3,
        speed: 1.0,
    });
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch('/api/elevenlabs/voices')
            .then(r => r.json())
            .then(d => setVoices(d.voices || []))
            .catch(() => toast.error('Error cargando voces'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = voices.filter(v => {
        if (filterLang !== 'all' && v.language !== filterLang) return false;
        if (filterGender !== 'all' && v.gender !== filterGender) return false;
        if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const playPreview = async (voice: Voice) => {
        if (playing === voice.voice_id) {
            audioRef.current?.pause();
            setPlaying(null);
            return;
        }
        if (audioRef.current) audioRef.current.pause();
        if (voice.preview_url) {
            const audio = new Audio(voice.preview_url);
            audioRef.current = audio;
            audio.onended = () => setPlaying(null);
            audio.play();
            setPlaying(voice.voice_id);
        }
    };

    const testVoice = async (voice: Voice) => {
        setTesting(voice.voice_id);
        try {
            const res = await fetch('/api/elevenlabs/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: 'Otra vez parezco un panda. Qué hueva tener que hacer todo este ritual cada mañana.',
                    voiceId: voice.voice_id,
                    settings,
                }),
            });
            if (!res.ok) throw new Error('Error TTS');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (audioRef.current) audioRef.current.pause();
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setPlaying(null);
            audio.play();
            setPlaying(voice.voice_id);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setTesting(null);
        }
    };

    const selectVoice = (voice: Voice) => {
        setSelected(voice.voice_id);
        onVoiceSelect?.(voice.voice_id, settings);
        toast.success(`Voz seleccionada: ${voice.name}`);
    };

    const genderLabel: Record<string, string> = { male: '♂️', female: '♀️', neutral: '⚡' };
    const langLabel: Record<string, string> = { es: '🇪🇸', en: '🇺🇸', it: '🇮🇹', da: '🇩🇰' };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text)]">Voces & Audio</h2>
                    <p className="text-[9px] text-[var(--text-tertiary)] uppercase">{voices.length} voces · ElevenLabs eleven_v3</p>
                </div>
                {selected && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--cre)]/10 border border-[var(--cre)]/20 rounded-lg">
                        <Check size={10} className="text-[var(--cre)]" />
                        <span className="text-[9px] font-black text-[var(--cre)]">
                            {voices.find(v => v.voice_id === selected)?.name || 'Seleccionada'}
                        </span>
                    </div>
                )}
            </div>

            {/* Parámetros */}
            <div className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-3">
                <div className="text-[9px] font-black uppercase text-[var(--text-tertiary)] tracking-widest">Parámetros de Voz</div>
                <div className="grid grid-cols-2 gap-3">
                    {([
                        { key: 'stability', label: 'Estabilidad', min: 0, max: 1, step: 0.05 },
                        { key: 'similarity_boost', label: 'Similitud', min: 0, max: 1, step: 0.05 },
                        { key: 'style', label: 'Estilo/Emoción', min: 0, max: 1, step: 0.05 },
                        { key: 'speed', label: 'Velocidad', min: 0.5, max: 2, step: 0.05 },
                    ] as const).map(({ key, label, min, max, step }) => (
                        <div key={key}>
                            <div className="flex justify-between mb-1">
                                <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{label}</span>
                                <span className="text-[8px] font-black text-[var(--cre)]">{settings[key].toFixed(2)}</span>
                            </div>
                            <input type="range" min={min} max={max} step={step}
                                value={settings[key]}
                                onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                                className="w-full h-1 accent-[var(--cre)]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar voz..."
                        className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--cre)]/50" />
                </div>
                <div className="flex gap-1">
                    {(['all', 'es', 'en'] as const).map(l => (
                        <button key={l} onClick={() => setFilterLang(l)}
                            className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${filterLang === l ? 'bg-[var(--cre)] text-white' : 'bg-white border border-[var(--border)] text-slate-500'}`}>
                            {l === 'all' ? 'Todo' : l === 'es' ? '🇪🇸' : '🇺🇸'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {(['all', 'female', 'male'] as const).map(g => (
                        <button key={g} onClick={() => setFilterGender(g)}
                            className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${filterGender === g ? 'bg-[var(--cre)] text-white' : 'bg-white border border-[var(--border)] text-slate-500'}`}>
                            {g === 'all' ? 'All' : g === 'female' ? '♀️' : '♂️'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={20} className="animate-spin text-[var(--cre)]" />
                    </div>
                ) : filtered.map(voice => (
                    <div key={voice.voice_id}
                        onClick={() => selectVoice(voice)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${selected === voice.voice_id ? 'bg-[var(--cre)]/5 border-[var(--cre)]/30' : 'bg-white border-[var(--border)] hover:border-[var(--cre)]/20'}`}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] ${selected === voice.voice_id ? 'bg-[var(--cre)] text-white' : 'bg-slate-100'}`}>
                                    {genderLabel[voice.gender] || '🎙️'}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-[10px] font-black truncate ${selected === voice.voice_id ? 'text-[var(--cre)]' : 'text-slate-800'}`}>
                                        {voice.name}
                                    </div>
                                    <div className="text-[8px] text-slate-400 uppercase tracking-tight">
                                        {langLabel[voice.language] || voice.language} · {voice.age} · {voice.use_case}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                <button onClick={e => { e.stopPropagation(); playPreview(voice); }}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                                    {playing === voice.voice_id ? <Square size={10} className="text-[var(--cre)]" /> : <Play size={10} className="text-slate-600" />}
                                </button>
                                <button onClick={e => { e.stopPropagation(); testVoice(voice); }}
                                    className="w-7 h-7 rounded-lg bg-[var(--cre)]/10 hover:bg-[var(--cre)]/20 flex items-center justify-center transition-all"
                                    title="Probar con script real">
                                    {testing === voice.voice_id ? <Loader2 size={10} className="animate-spin text-[var(--cre)]" /> : <Mic size={10} className="text-[var(--cre)]" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-400 uppercase">Sin resultados</div>
                )}
            </div>
        </div>
    );
}
