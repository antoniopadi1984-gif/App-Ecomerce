'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Search, Filter, Play, Check, Star, Loader2, Mic, Film, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Avatar {
    id: string;
    avatarId: string;
    name: string;
    gender: string;
    previewUrl: string;
    previewVideoUrl: string;
    isFavorite: boolean;
    tags: string;
}

interface Voice {
    voice_id: string;
    name: string;
    gender: string;
    language: string;
    preview_url: string;
}

export default function AvataresPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();

    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('female');
    const [filterFav, setFilterFav] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 48;

    // Generación
    const [generating, setGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
    const [script, setScript] = useState('Hola, quiero contarte algo que me cambió la vida. Estos parches MicroLift borraron mis ojeras en solo 2 horas. ¡Sin filtros, sin corrector, sin nada!');
    const [emotion, setEmotion] = useState('Friendly');
    const [speed, setSpeed] = useState(1);
    const [addCaptions, setAddCaptions] = useState(true);
    const [videoFormat, setVideoFormat] = useState<'9:16' | '16:9' | '1:1'>('9:16');
    const [showGenerator, setShowGenerator] = useState(false);

    const videoRefs = useRef<Record<string, HTMLVideoElement>>({});

    useEffect(() => {
        Promise.all([
            fetch('/api/heygen/avatars').then(r => r.json()),
            fetch('/api/elevenlabs/voices').then(r => r.json()),
        ]).then(([avData, voData]) => {
            setAvatars(avData.avatars || []);
            setVoices((voData.voices || []).filter((v: Voice) => v.language === 'es'));
        }).finally(() => setLoading(false));
    }, []);

    const filtered = avatars.filter(a => {
        if (filterGender !== 'all' && a.gender !== filterGender) return false;
        if (filterFav && !a.isFavorite) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
            !a.avatarId.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(filtered.length / PER_PAGE);

    const toggleFavorite = async (avatar: Avatar) => {
        await fetch(`/api/heygen/avatars/${avatar.avatarId}/favorite`, { method: 'POST' });
        setAvatars(prev => prev.map(a => a.avatarId === avatar.avatarId ? { ...a, isFavorite: !a.isFavorite } : a));
    };

    const generateVideo = async () => {
        if (!selectedAvatar) return toast.error('Selecciona un avatar');
        if (!script.trim()) return toast.error('Escribe el script');
        setGenerating(true);
        setGeneratedVideoUrl('');
        try {
            const res = await fetch('/api/heygen/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    avatarId: selectedAvatar.avatarId,
                    script,
                    voiceId: selectedVoice,
                    emotion,
                    speed,
                    addCaptions,
                    videoFormat,
                    productId,
                    storeId,
                }),
            });
            const data = await res.json();
            if (data.videoUrl) {
                setGeneratedVideoUrl(data.videoUrl);
                toast.success('¡Video generado!');
            } else throw new Error(data.error || 'Error generando video');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const dimensionMap: Record<string, { w: number; h: number }> = {
        '9:16': { w: 720, h: 1280 },
        '16:9': { w: 1920, h: 1080 },
        '1:1':  { w: 1080, h: 1080 },
    };

    if (!storeId || !productId || productId === 'GLOBAL') return (
        <div className="flex items-center justify-center h-full text-[10px] text-slate-400 uppercase">
            Selecciona tienda y producto
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-140px)] gap-3">
            {/* BIBLIOTECA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 pb-3 flex-wrap">
                    <div className="relative flex-1 min-w-40">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Buscar avatar..."
                            className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--cre)]/50" />
                    </div>
                    <div className="flex gap-1">
                        {(['all', 'female', 'male'] as const).map(g => (
                            <button key={g} onClick={() => { setFilterGender(g); setPage(1); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${filterGender === g ? 'bg-[var(--cre)] text-white' : 'bg-white border border-[var(--border)] text-slate-500'}`}>
                                {g === 'all' ? 'Todos' : g === 'female' ? '♀ Mujer' : '♂ Hombre'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setFilterFav(!filterFav)}
                        className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 transition-all ${filterFav ? 'bg-amber-400 text-white' : 'bg-white border border-[var(--border)] text-slate-500'}`}>
                        <Star size={9} /> Favoritos
                    </button>
                    <span className="text-[8px] text-slate-400 ml-auto">{filtered.length} avatares</span>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 size={20} className="animate-spin text-[var(--cre)]" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 pb-3">
                                {paginated.map(avatar => (
                                    <div key={avatar.avatarId}
                                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${selectedAvatar?.avatarId === avatar.avatarId ? 'border-[var(--cre)] shadow-lg scale-[1.02]' : 'border-transparent hover:border-[var(--cre)]/40'}`}
                                        onClick={() => { setSelectedAvatar(avatar); setShowGenerator(true); }}
                                        onMouseEnter={() => { setHoveredAvatar(avatar.avatarId); videoRefs.current[avatar.avatarId]?.play(); }}
                                        onMouseLeave={() => { setHoveredAvatar(null); const v = videoRefs.current[avatar.avatarId]; if (v) { v.pause(); v.currentTime = 0; } }}>
                                        {/* Preview imagen base */}
                                        <div className="aspect-[9/16] bg-slate-900 relative">
                                            {avatar.previewUrl && (
                                                <img src={avatar.previewUrl} alt={avatar.name}
                                                    className="w-full h-full object-cover" />
                                            )}
                                            {/* Video preview al hover */}
                                            {avatar.previewVideoUrl && (
                                                <video ref={el => { if (el) videoRefs.current[avatar.avatarId] = el; }}
                                                    src={avatar.previewVideoUrl}
                                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hoveredAvatar === avatar.avatarId ? 'opacity-100' : 'opacity-0'}`}
                                                    muted loop playsInline />
                                            )}
                                            {/* Selected badge */}
                                            {selectedAvatar?.avatarId === avatar.avatarId && (
                                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--cre)] flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                            {/* Favorito */}
                                            <button onClick={e => { e.stopPropagation(); toggleFavorite(avatar); }}
                                                className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${avatar.isFavorite ? 'bg-amber-400 text-white opacity-100' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'}`}>
                                                <Star size={8} />
                                            </button>
                                            {/* Play hint */}
                                            {hoveredAvatar !== avatar.avatarId && (
                                                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Play size={7} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-1 bg-white">
                                            <p className="text-[6px] font-black text-slate-700 truncate leading-tight">{avatar.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pb-3">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="px-3 py-1 rounded-lg bg-white border border-[var(--border)] text-[8px] font-black disabled:opacity-40">← Anterior</button>
                                    <span className="text-[8px] text-slate-500">{page} / {totalPages}</span>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                        className="px-3 py-1 rounded-lg bg-white border border-[var(--border)] text-[8px] font-black disabled:opacity-40">Siguiente →</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* PANEL GENERADOR */}
            <div className={`w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto transition-all ${showGenerator ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-[var(--text)]">Generador de Video</h3>
                    {selectedAvatar && (
                        <button onClick={() => { setSelectedAvatar(null); setShowGenerator(false); }}
                            className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <X size={8} className="text-slate-500" />
                        </button>
                    )}
                </div>

                {/* Avatar seleccionado */}
                {selectedAvatar ? (
                    <div className="p-2 rounded-xl bg-white border border-[var(--cre)]/30 flex items-center gap-2">
                        <img src={selectedAvatar.previewUrl} alt={selectedAvatar.name}
                            className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                        <div>
                            <p className="text-[9px] font-black text-[var(--cre)]">{selectedAvatar.name}</p>
                            <p className="text-[7px] text-slate-400 uppercase">{selectedAvatar.gender}</p>
                            <p className="text-[7px] text-slate-400 truncate max-w-[160px]">{selectedAvatar.avatarId}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-[var(--border)] text-center">
                        <p className="text-[9px] text-slate-400">← Selecciona un avatar</p>
                    </div>
                )}

                {/* Voz ElevenLabs */}
                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-1">
                        <Mic size={9} /> Voz ElevenLabs
                    </div>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                        className="w-full text-[9px] bg-slate-50 border border-[var(--border)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--cre)]/50">
                        <option value="">Voz por defecto (HeyGen)</option>
                        {voices.map(v => (
                            <option key={v.voice_id} value={v.voice_id}>{v.name} — {v.gender}</option>
                        ))}
                    </select>
                </div>

                {/* Script */}
                <div className="p-3 rounded-xl bg-white border border-[var(--border)]">
                    <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)] mb-2">Script</div>
                    <textarea value={script} onChange={e => setScript(e.target.value)}
                        className="w-full text-[9px] text-slate-700 bg-slate-50 border border-[var(--border)] rounded-lg p-2 resize-none outline-none focus:border-[var(--cre)]/50 leading-relaxed"
                        rows={6} placeholder="Escribe el script del avatar..." />
                    <div className="text-[7px] text-slate-400 mt-1">{script.length}/5000 caracteres</div>
                </div>

                {/* Configuración */}
                <div className="p-3 rounded-xl bg-white border border-[var(--border)] space-y-3">
                    <div className="text-[8px] font-black uppercase text-[var(--text-tertiary)]">Configuración</div>

                    {/* Emoción */}
                    <div>
                        <div className="text-[7px] text-slate-400 uppercase mb-1">Emoción</div>
                        <div className="flex flex-wrap gap-1">
                            {['Excited', 'Friendly', 'Serious', 'Soothing', 'Broadcaster'].map(e => (
                                <button key={e} onClick={() => setEmotion(e)}
                                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all ${emotion === e ? 'bg-[var(--cre)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formato */}
                    <div>
                        <div className="text-[7px] text-slate-400 uppercase mb-1">Formato</div>
                        <div className="flex gap-1">
                            {(['9:16', '16:9', '1:1'] as const).map(f => (
                                <button key={f} onClick={() => setVideoFormat(f)}
                                    className={`px-2.5 py-1 rounded text-[7px] font-black transition-all ${videoFormat === f ? 'bg-[var(--cre)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Velocidad */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[7px] text-slate-400 uppercase">Velocidad</span>
                            <span className="text-[7px] font-black text-[var(--cre)]">{speed}x</span>
                        </div>
                        <input type="range" min={0.5} max={1.5} step={0.1} value={speed}
                            onChange={e => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-1 accent-[var(--cre)]" />
                    </div>

                    {/* Subtítulos */}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="captions" checked={addCaptions} onChange={e => setAddCaptions(e.target.checked)}
                            className="accent-[var(--cre)]" />
                        <label htmlFor="captions" className="text-[8px] font-bold text-slate-600">Subtítulos automáticos</label>
                    </div>
                </div>

                {/* Botón generar */}
                <button onClick={generateVideo} disabled={generating || !selectedAvatar}
                    className="w-full py-3 rounded-xl bg-[var(--cre)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--cre)]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {generating ? <><Loader2 size={14} className="animate-spin" /> Generando video...</> : <><Film size={14} /> Generar Video</>}
                </button>

                {/* Video resultado */}
                {generatedVideoUrl && (
                    <div className="p-2 rounded-xl bg-white border border-emerald-200">
                        <div className="text-[8px] font-black text-emerald-600 mb-2 uppercase">✅ Video listo</div>
                        <video src={generatedVideoUrl} controls className="w-full rounded-lg" />
                        <a href={generatedVideoUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase flex items-center justify-center gap-1">
                            Descargar
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
