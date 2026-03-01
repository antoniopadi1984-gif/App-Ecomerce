'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    FolderOpen, FileVideo, FileText, Image, File, ChevronRight,
    ChevronDown, RefreshCw, UploadCloud, Search, Filter,
    Play, ExternalLink, Grid, List, Tag, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    path: string;
    thumbnailUrl?: string;
    children?: DriveItem[];
    isFolder?: boolean;
}

const FUNNEL_STRUCTURE = [
    { key: '00_RESEARCH', label: 'Research', emoji: '🧠', color: '#8B5CF6' },
    { key: '01_SPY', label: 'Spy / Competencia', emoji: '🔍', color: '#F59E0B' },
    { key: '02_CONCEPTS', label: 'Conceptos Spencer', emoji: '🎬', color: '#10B981' },
    { key: '03_LANDINGS', label: 'Landings', emoji: '🌐', color: '#3B82F6' },
    { key: '04_ASSETS', label: 'Assets (Imágenes, Tema)', emoji: '🗂', color: '#6B7280' },
];

const FUNNEL_STAGES = ['TOF', 'MOF', 'BOF', 'RT-CART', 'RT-VIEW', 'RT-BUYER'];
const VERDICT_COLORS: Record<string, string> = {
    WINNER: 'var(--s-ok)', LOSER: 'var(--s-ko)',
    TESTING: 'var(--s-wa)', PAUSED: 'var(--text-dim)',
};
const FUNNEL_COLORS: Record<string, string> = {
    TOF: '#8B5CF6', MOF: '#3B82F6', BOF: '#10B981', 'RT-CART': '#F59E0B', 'RT-VIEW': '#F59E0B', 'RT-BUYER': '#10B981'
};

function FileIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.includes('video')) return <FileVideo className="w-4 h-4 text-[var(--cre)]" />;
    if (mimeType.includes('image')) return <Image className="w-4 h-4 text-[var(--mkt)]" />;
    if (mimeType.includes('text') || mimeType.includes('json')) return <FileText className="w-4 h-4 text-[var(--inv)]" />;
    return <File className="w-4 h-4 text-[var(--text-dim)]" />;
}

function FolderRow({
    label, emoji, color, productId, storeId, folderKey
}: {
    label: string; emoji: string; color: string;
    productId: string; storeId: string; folderKey: string;
}) {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<DriveItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadFiles = async () => {
        if (files.length > 0 || loading) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/drive/list?productId=${productId}&subPath=${folderKey}`,
                { headers: { 'X-Store-Id': storeId } }
            );
            const data = await res.json();
            setFiles(data.files ?? []);
        } catch { setFiles([]); }
        finally { setLoading(false); }
    };

    const toggle = () => {
        setOpen(p => !p);
        if (!open) loadFiles();
    };

    return (
        <div>
            <button onClick={toggle}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-[var(--surface2)] transition-colors text-left group">
                <span className="text-base">{emoji}</span>
                <span className="text-[11px] font-black text-[var(--text)]">{label}</span>
                <span className="ml-auto flex items-center gap-1">
                    {loading && <RefreshCw className="w-3 h-3 animate-spin text-[var(--text-dim)]" />}
                    {open ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-dim)]" /> :
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-dim)]" />}
                </span>
            </button>

            {open && (
                <div className="ml-6 mt-1 space-y-1 border-l border-[var(--border)] pl-3 mb-2">
                    {files.length === 0 && !loading ? (
                        <p className="text-[9px] text-[var(--text-dim)] py-2">Carpeta vacía</p>
                    ) : files.map(f => (
                        <div key={f.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface2)] group">
                            {f.isFolder ?
                                <FolderOpen className="w-4 h-4 text-[var(--s-warn)]" /> :
                                <FileIcon mimeType={f.mimeType} />
                            }
                            <span className="text-[10px] font-mono text-[var(--text)] truncate flex-1">{f.name}</span>
                            {f.mimeType?.includes('video') && (
                                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--inv)]/10 transition-all">
                                    <Play className="w-3 h-3 text-[var(--inv)]" />
                                </button>
                            )}
                            <a href={`https://drive.google.com/file/d/${f.id}/view`} target="_blank" rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--surface2)] transition-all">
                                <ExternalLink className="w-3 h-3 text-[var(--text-dim)]" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function BibliotecaTab({ storeId, productId }: { storeId: string; productId: string }) {
    const [assets, setAssets] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'folder' | 'grid' | 'list'>('folder');
    const [filterStage, setFilterStage] = useState('');
    const [filterVerdict, setFilterVerdict] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') return;
        setLoading(true);
        fetch(`/api/creatives?productId=${productId}`, { headers: { 'X-Store-Id': storeId } })
            .then(r => r.json())
            .then(d => setAssets(d.assets ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [productId, storeId]);

    const filtered = assets.filter(a => {
        if (filterStage && a.funnelStage !== filterStage) return false;
        if (filterVerdict && a.verdict !== filterVerdict) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const uploadToPath = async (files: FileList, subPath: string) => {
        toast.info(`Subiendo ${files.length} archivo(s) a ${subPath}…`);
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('files', f));
        fd.append('productId', productId);
        fd.append('subPath', subPath);
        try {
            const res = await fetch('/api/drive/upload', {
                method: 'POST', body: fd, headers: { 'X-Store-Id': storeId }
            });
            const d = await res.json();
            if (d.ok) toast.success(`${files.length} archivo(s) subidos a Drive`);
        } catch { toast.error('Error al subir'); }
    };

    if (!productId || productId === 'GLOBAL') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="w-12 h-12 text-[var(--text-dim)] opacity-30 mb-3" />
                <p className="text-[12px] font-bold text-[var(--text-muted)]">Selecciona un producto para ver la Biblioteca</p>
                <p className="text-[10px] text-[var(--text-dim)] mt-1">El contenido se organiza por producto</p>
            </div>
        );
    }

    return (
        <div className="flex gap-4 min-h-[600px]">
            {/* Left: Folder structure */}
            <div className="w-56 shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Drive / Producto</p>
                    <button onClick={() => fileInputRef.current?.click()}
                        className="p-1 rounded hover:bg-[var(--surface2)] transition-colors">
                        <UploadCloud className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden"
                        onChange={e => e.target.files && uploadToPath(e.target.files, '04_ASSETS/imagenes')} />
                </div>
                {FUNNEL_STRUCTURE.map(({ key, ...rest }) => (
                    <FolderRow key={key} {...rest} productId={productId} storeId={storeId} folderKey={key} />
                ))}
            </div>

            {/* Right: Asset grid */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-dim)]" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre…"
                            className="w-full h-8 pl-8 pr-3 text-[11px] bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--cre)]/40" />
                    </div>
                    <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
                        className="h-8 text-[10px] border border-[var(--border)] rounded-lg px-2 bg-[var(--surface)] font-bold">
                        <option value="">Todas las fases</option>
                        {FUNNEL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterVerdict} onChange={e => setFilterVerdict(e.target.value)}
                        className="h-8 text-[10px] border border-[var(--border)] rounded-lg px-2 bg-[var(--surface)] font-bold">
                        <option value="">Todos los estados</option>
                        {['WINNER', 'TESTING', 'LOSER', 'PAUSED'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                        {(['folder', 'grid', 'list'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={cn('p-1.5 transition-colors', viewMode === m ? 'bg-[var(--cre)]/15 text-[var(--cre)]' : 'text-[var(--text-dim)] hover:bg-[var(--surface2)]')}>
                                {m === 'grid' ? <Grid className="w-3.5 h-3.5" /> : m === 'list' ? <List className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bulk actions */}
                {selected.size > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-[var(--inv)]/8 rounded-xl border border-[var(--inv)]/20">
                        <span className="text-[10px] font-black text-[var(--inv)]">{selected.size} seleccionados</span>
                        <button className="text-[9px] font-black uppercase tracking-wide px-2 py-1 bg-[var(--inv)] text-white rounded-lg">
                            Generar variantes
                        </button>
                        <button className="text-[9px] font-black uppercase tracking-wide px-2 py-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg">
                            Cambiar fase
                        </button>
                        <button onClick={() => setSelected(new Set())}
                            className="ml-auto text-[9px] text-[var(--text-dim)] hover:text-[var(--text)]">Deseleccionar</button>
                    </div>
                )}

                {/* Assets */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--text-dim)]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileVideo className="w-10 h-10 text-[var(--text-dim)] opacity-30 mb-2" />
                        <p className="text-[11px] text-[var(--text-muted)] font-bold">Sin creativos todavía</p>
                        <p className="text-[10px] text-[var(--text-dim)] mt-1">Sube vídeos en el Video Lab para que aparezcan aquí</p>
                    </div>
                ) : (
                    <div className={cn(
                        'grid gap-3',
                        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
                    )}>
                        {filtered.map(asset => (
                            <div key={asset.id}
                                onClick={() => setSelected(prev => {
                                    const n = new Set(prev);
                                    n.has(asset.id) ? n.delete(asset.id) : n.add(asset.id);
                                    return n;
                                })}
                                className={cn(
                                    'bg-[var(--surface)] border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-[var(--cre)]/40',
                                    selected.has(asset.id) ? 'border-[var(--inv)] ring-1 ring-[var(--inv)]/20' : 'border-[var(--border)]'
                                )}>
                                {/* Thumbnail */}
                                {viewMode === 'grid' && (
                                    <div className="relative h-24 bg-[var(--surface2)]">
                                        {asset.thumbnailUrl ?
                                            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" /> :
                                            <div className="h-full flex items-center justify-center">
                                                <FileVideo className="w-8 h-8 text-[var(--text-dim)] opacity-40" />
                                            </div>
                                        }
                                        {asset.funnelStage && (
                                            <span className="absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white"
                                                style={{ backgroundColor: FUNNEL_COLORS[asset.funnelStage] ?? '#6B7280' }}>
                                                {asset.funnelStage}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className={cn('p-2.5', viewMode === 'list' && 'flex items-center gap-3')}>
                                    {viewMode === 'list' && <FileIcon mimeType="video/mp4" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-mono font-bold text-[var(--text)] truncate">
                                            {asset.nomenclatura ?? asset.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {asset.conceptCode && (
                                                <span className="text-[8px] font-black text-[var(--cre)] bg-[var(--cre)]/10 px-1.5 py-0.5 rounded-full">
                                                    {asset.conceptCode}
                                                </span>
                                            )}
                                            {asset.verdict && (
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                                    style={{ color: VERDICT_COLORS[asset.verdict], backgroundColor: `${VERDICT_COLORS[asset.verdict]}15` }}>
                                                    {asset.verdict}
                                                </span>
                                            )}
                                        </div>
                                        {asset.ctr && (
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[8px] text-[var(--text-dim)]">CTR: <b className="text-[var(--text)]">{asset.ctr}%</b></span>
                                                {asset.revenue > 0 && <span className="text-[8px] text-[var(--text-dim)]">ROAS: <b className="text-[var(--s-ok)]">{(asset.revenue / asset.spend).toFixed(1)}×</b></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
