'use client';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Mic, Play, CheckCircle2, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Avatar {
    id: string;
    name: string;
    gender?: string;
    language?: string;
    imageUrl?: string;
    voiceId?: string;
    voiceName?: string;
}

interface ElevenLabsVoice { voice_id: string; name: string; labels?: any; }

export function AvataresIATab({ storeId, productId }: { storeId: string; productId: string }) {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '', gender: 'F', language: 'es', voiceId: '', imageUrl: '',
    });
    const [uploadingImg, setUploadingImg] = useState(false);

    useEffect(() => {
        loadAvatars();
        loadVoices();
    }, [storeId]);

    const loadAvatars = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/avatars?storeId=${storeId}`);
            const d = await res.json();
            setAvatars(d.avatars ?? []);
        } catch { }
        finally { setLoading(false); }
    };

    const loadVoices = async () => {
        try {
            const res = await fetch('/api/elevenlabs/voices');
            const d = await res.json();
            setVoices(d.voices ?? []);
        } catch { }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImg(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.success) setForm(p => ({ ...p, imageUrl: d.url }));
        } catch { toast.error('Error al subir imagen'); }
        finally { setUploadingImg(false); }
    };

    const createAvatar = async () => {
        if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
        setCreating(true);
        try {
            const res = await fetch('/api/avatars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, storeId, productId }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success(`Avatar "${form.name}" creado`);
                setAvatars(prev => [d.avatar, ...prev]);
                setShowForm(false);
                setForm({ name: '', gender: 'F', language: 'es', voiceId: '', imageUrl: '' });
            } else throw new Error(d.error);
        } catch (e: any) {
            toast.error(e.message);
        } finally { setCreating(false); }
    };

    const applyToVideo = async (avatarId: string) => {
        if (!productId || productId === 'GLOBAL') {
            toast.error('Selecciona un vídeo en el Video Lab primero'); return;
        }
        toast.info('Avatar enviado al Video Lab — selecciona el vídeo al que aplicarlo');
    };

    const GENDER_COLORS = { F: '#EC4899', M: '#3B82F6', N: '#8B5CF6' };
    const GENDER_EMOJI = { F: '👩', M: '👨', N: '🧑' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[13px] font-black text-[var(--text)]">Avatares IA</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Crea avatares con imagen + voz ElevenLabs + lip sync Replicate
                    </p>
                </div>
                <button onClick={() => setShowForm(p => !p)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--cre)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Crear Avatar
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        Nuevo Avatar
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nombre</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Ej: María, John, Sofia…"
                                className="w-full h-9 px-3 text-[11px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--cre)]/40" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Género</label>
                                <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                                    className="w-full h-9 px-2 text-[11px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg font-bold">
                                    <option value="F">Mujer (F)</option>
                                    <option value="M">Hombre (M)</option>
                                    <option value="N">Neutro (N)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Idioma</label>
                                <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                                    className="w-full h-9 px-2 text-[11px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg font-bold">
                                    <option value="es">ES</option>
                                    <option value="en">EN</option>
                                    <option value="fr">FR</option>
                                    <option value="de">DE</option>
                                    <option value="it">IT</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foto base (para Replicate)</label>
                        <div className="flex items-center gap-3">
                            {form.imageUrl ? (
                                <img src={form.imageUrl} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-[var(--border)]" />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-[var(--surface2)] border-2 border-dashed border-[var(--border-high)] flex items-center justify-center">
                                    <User className="w-6 h-6 text-[var(--text-dim)]" />
                                </div>
                            )}
                            <label className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[9px] font-black uppercase cursor-pointer hover:border-[var(--cre)]/40 transition-colors">
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                {uploadingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Subir foto'}
                            </label>
                        </div>
                    </div>

                    {/* Voice selector */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Voz ElevenLabs
                        </label>
                        <select value={form.voiceId} onChange={e => setForm(p => ({ ...p, voiceId: e.target.value }))}
                            className="w-full h-9 px-3 text-[11px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg">
                            <option value="">Sin voz asignada</option>
                            {voices.map(v => (
                                <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                            ))}
                        </select>
                        {voices.length === 0 && (
                            <p className="text-[8px] text-[var(--text-dim)]">Configura ELEVENLABS_API_KEY para cargar voces</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                        <button onClick={() => setShowForm(false)}
                            className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                            Cancelar
                        </button>
                        <button onClick={createAvatar} disabled={creating}
                            className="flex-1 h-9 bg-[var(--cre)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                            {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando…</> : 'Crear Avatar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Avatars grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--text-dim)]" />
                </div>
            ) : avatars.length === 0 ? (
                <div className="text-center py-16">
                    <Users className="w-10 h-10 mx-auto mb-3 text-[var(--text-dim)] opacity-30" />
                    <p className="text-[11px] font-bold text-[var(--text-muted)]">No hay avatares todavía</p>
                    <p className="text-[10px] text-[var(--text-dim)] mt-1">Crea el primero con el botón de arriba</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {avatars.map(av => (
                        <div key={av.id}
                            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--cre)]/30 transition-all group">
                            {/* Avatar image */}
                            <div className="relative h-32 bg-[var(--surface2)]">
                                {av.imageUrl ? (
                                    <img src={av.imageUrl} alt={av.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-1">
                                        <span className="text-3xl">
                                            {(GENDER_EMOJI as any)[av.gender ?? 'N'] ?? '🧑'}
                                        </span>
                                    </div>
                                )}
                                {av.gender && (
                                    <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white"
                                        style={{ backgroundColor: (GENDER_COLORS as any)[av.gender] ?? '#6B7280' }}>
                                        {av.gender}
                                    </span>
                                )}
                            </div>

                            <div className="p-3 space-y-2">
                                <div>
                                    <p className="text-[11px] font-black text-[var(--text)]">{av.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[8px] font-bold text-[var(--text-dim)] uppercase bg-[var(--surface2)] px-1.5 py-0.5 rounded">
                                            {av.language?.toUpperCase() ?? 'ES'}
                                        </span>
                                        {av.voiceName && (
                                            <span className="text-[8px] text-[var(--text-dim)] flex items-center gap-0.5">
                                                <Mic className="w-2.5 h-2.5" />{av.voiceName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => applyToVideo(av.id)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[var(--cre)]/10 border border-[var(--cre)]/20 text-[var(--cre)] rounded-lg text-[9px] font-black uppercase hover:bg-[var(--cre)]/20 transition-colors">
                                    <Play className="w-3 h-3" /> Aplicar a vídeo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
