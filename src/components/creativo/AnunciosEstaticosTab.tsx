'use client';

import React, { useState, useEffect } from 'react';
import {
    Sparkles, Image as ImageIcon, Zap, UploadCloud,
    RefreshCcw, Save, Trash2, Copy, Eye, Plus,
    MoreHorizontal, Layout, Type, Palette,
    Link as LinkIcon, HardDrive, ShoppingCart,
    Check, Info, MousePointer2, Settings2,
    Layers, MousePointer, Edit3, Share2,
    Facebook, Video, SplitSquareVertical, AlertCircle,
    ChevronRight, X, Maximize2, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProduct } from '@/context/ProductContext';
import { useStore } from '@/lib/store/store-context';

type AssetOrigin = 'SHOPIFY_URL' | 'MANUAL' | 'DRIVE';
type AdType = 'SINGLE' | 'CAROUSEL' | 'SPLIT_SCREEN';
type Format = '1:1' | '4:5' | '9:16' | '1.91:1';

interface AdVariant {
    id: string;
    headline: string;
    subheadline?: string;
    copy: string;
    imageUrl: string;
    format: Format;
    status: 'READY' | 'GENERATING' | 'FAILED';
    isSelected?: boolean;
    hasPosterVideo?: boolean;
}

export function AnunciosEstaticosTab({ conceptId, conceptName, storeId }: {
    conceptId: string,
    conceptName: string,
    storeId: string
}) {
    const { product } = useProduct();
    const { activeStoreId } = useStore();

    // --- State: Config ---
    const [origin, setOrigin] = useState<AssetOrigin>('SHOPIFY_URL');
    const [shopifyUrl, setShopifyUrl] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [refImages, setRefImages] = useState<string[]>([]);

    const [adType, setAdType] = useState<AdType>('SINGLE');
    const [format, setFormat] = useState<Format>('1:1');
    const [numVariants, setNumVariants] = useState(3);
    const [headline, setHeadline] = useState('');
    const [subheadline, setSubheadline] = useState('');
    const [ctaText, setCtaText] = useState('COMPRAR AHORA');
    const [genCopyVariants, setGenCopyVariants] = useState(false);

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [model, setModel] = useState('flux-kontext-pro');

    // --- State: Meta Integration ---
    const [showMetaModal, setShowMetaModal] = useState(false);
    const [metaAccounts, setMetaAccounts] = useState<{ id: string, name: string }[]>([
        { id: 'act_123', name: 'Primary Creative Ads' },
        { id: 'act_456', name: 'Alpha Testing' }
    ]);
    const [selectedMetaAccount, setSelectedMetaAccount] = useState('');
    const [uploadingToMeta, setUploadingToMeta] = useState(false);
    const [activeAdToMeta, setActiveAdToMeta] = useState<AdVariant | null>(null);

    // --- State: Results ---
    const [generating, setGenerating] = useState(false);
    const [ads, setAds] = useState<AdVariant[]>([
        {
            id: '1',
            headline: "La máscara de colágeno que borra 5 años en 14 días.",
            copy: "No es magia, es biotecnología aplicada a tu piel. Descubre el mecanismo Bio-Collagen.",
            imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=600&fit=crop",
            format: "1:1",
            status: 'READY'
        },
        {
            id: '2',
            headline: "¿Por qué el colágeno oral no funciona?",
            copy: "Tu estómago lo destruye antes de que llegue a tu piel. Pásate al colágeno tópico frío.",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=600&fit=crop",
            format: "4:5",
            status: 'READY'
        }
    ]);

    // --- Handlers ---
    const handleShopifyUrlBlur = async () => {
        if (!shopifyUrl || !shopifyUrl.includes('products/')) return;
        setIsFetchingUrl(true);
        try {
            const response = await fetch('/api/ai/diseno/url-to-everything', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: shopifyUrl, storeId: activeStoreId })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Datos extraídos de Shopify automáticamente.");
                setHeadline(result.data.aiAnalysis?.headlines?.[0] || result.data.title);
                setRefImages(result.data.images?.slice(0, 8) || []);
            }
        } catch (e) {
            toast.error("Error al extraer datos.");
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const handleGenerate = () => {
        setGenerating(true);
        toast.info(`Generando ${numVariants} variantes...`);
        setTimeout(() => {
            const newAds: AdVariant[] = Array.from({ length: numVariants }).map((_, i) => ({
                id: Math.random().toString(36).substr(2, 9),
                headline: headline || "Piel de porcelana sin cirugía.",
                copy: "Descubre el secreto de la cosmética nuclear.",
                imageUrl: `https://images.unsplash.com/photo-${1550000000000 + i * 1000}?w=600&h=600&fit=crop`,
                format,
                status: 'READY'
            }));
            setAds([...newAds, ...ads]);
            setGenerating(false);
            toast.success("Creativos generados.");
        }, 2000);
    };

    const handleTogglePoster = (id: string) => {
        setAds(ads.map(ad => ad.id === id ? { ...ad, hasPosterVideo: !ad.hasPosterVideo } : ad));
        toast.success("Micro-video activado");
    };

    const handleUploadToMeta = async (ad: AdVariant) => {
        setActiveAdToMeta(ad);
        setShowMetaModal(true);
    };

    const confirmMetaUpload = async () => {
        if (!selectedMetaAccount) {
            toast.error("Selecciona una cuenta");
            return;
        }
        setUploadingToMeta(true);
        setTimeout(() => {
            setUploadingToMeta(false);
            setShowMetaModal(false);
            toast.success("Asset enviado a Meta Ads");
        }, 1500);
    };

    return (
        <div className="flex h-[calc(100vh-220px)] gap-4 animate-in fade-in duration-500 overflow-hidden relative">

            {/* PANEL IZQUIERDO */}
            <aside className="w-[280px] flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 shadow-sm">
                <div className="p-4 border-b border-[var(--border)] bg-white space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--cre)] shadow-sm">
                            <Settings2 size={16} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Configuración</h3>
                            <p className="text-[8px] text-[var(--text-tertiary)] font-bold uppercase tracking-tight opacity-60 truncate max-w-[150px]">{conceptName}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Origen Asset</label>
                            <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                                <button onClick={() => setOrigin('SHOPIFY_URL')} className={cn("py-1.5 rounded-md text-[9px] font-bold uppercase transition-all", origin === 'SHOPIFY_URL' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}>Shopify</button>
                                <button onClick={() => setOrigin('MANUAL')} className={cn("py-1.5 rounded-md text-[9px] font-bold uppercase transition-all", origin === 'MANUAL' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}>Manual</button>
                            </div>
                        </div>

                        {origin === 'SHOPIFY_URL' && (
                            <div className="relative group animate-in slide-in-from-top-1">
                                <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--cre)] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="URL del Producto..."
                                    value={shopifyUrl}
                                    onChange={(e) => setShopifyUrl(e.target.value)}
                                    onBlur={handleShopifyUrlBlur}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-[var(--border)] rounded-lg text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40 transition-all"
                                />
                                {isFetchingUrl && <RefreshCcw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cre)] animate-spin" />}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[var(--bg)]/10 custom-scrollbar">
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Fotos Referencia</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {refImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-[var(--border)] relative group shadow-sm">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button onClick={() => setRefImages(refImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-4 w-4 bg-white/90 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-[var(--border)]"><X size={8} /></button>
                                </div>
                            ))}
                            {refImages.length < 8 && (
                                <button className="aspect-square rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--cre-bg)]/20 transition-all bg-white shadow-sm"><Plus size={14} /></button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-[var(--border)]/50">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Formato</label>
                                <select value={format} onChange={(e) => setFormat(e.target.value as Format)} className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-2 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40">
                                    <option value="1:1">1:1 Feed</option>
                                    <option value="4:5">4:5 Vertical</option>
                                    <option value="9:16">9:16 Story</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Lote</label>
                                <select value={numVariants} onChange={(e) => setNumVariants(Number(e.target.value))} className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-2 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40">
                                    <option value={1}>1 Imagen</option>
                                    <option value={3}>3 Imágenes</option>
                                    <option value={5}>5 Imágenes</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Headline Principal</label>
                            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full h-9 px-3 bg-white border border-[var(--border)] rounded-lg text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40" />
                        </div>

                        <div className="p-3 bg-white border border-[var(--border)] rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <Type size={14} className="text-[var(--cre)]" />
                                <span className="text-[9px] font-bold uppercase text-[var(--text-primary)]">Variantes Copy</span>
                            </div>
                            <button onClick={() => setGenCopyVariants(!genCopyVariants)} className={cn("w-8 h-4 rounded-full relative transition-all border", genCopyVariants ? "bg-[var(--cre)] border-[var(--cre)]" : "bg-[var(--bg)] border-[var(--border)]")}>
                                <div className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all", genCopyVariants ? "right-0.5 bg-white" : "left-0.5 bg-white")} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-white">
                    <button onClick={handleGenerate} disabled={generating} className="w-full h-11 bg-[var(--cre)] text-white rounded-lg flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                        {generating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">Generar con IA</span>
                    </button>
                </div>
            </aside>

            {/* PANEL DERECHA */}
            <main className="flex-1 flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
                <div className="h-14 px-5 border-b border-[var(--border)] bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase text-[var(--text-tertiary)]">GPU Turbo Active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-9 px-4 rounded-lg bg-[var(--text-primary)] text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm hover:opacity-90 transition-all">
                            <Share2 size={14} /> Exportar Lote
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg)]/10 custom-scrollbar">
                    {generating ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="aspect-square rounded-xl bg-white border border-[var(--border)] shadow-sm animate-pulse flex items-center justify-center">
                                    <ImageIcon size={24} className="opacity-10" />
                                </div>
                            ))}
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                            <ImageIcon size={48} strokeWidth={1} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Configura y pulsa Generar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                            {ads.map(ad => (
                                <div key={ad.id} className="bg-white border border-[var(--border)] rounded-xl group overflow-hidden shadow-sm hover:border-[var(--cre)]/40 transition-all flex flex-col">
                                    <div className={cn("relative bg-black/95", ad.format === '1:1' ? 'aspect-square' : ad.format === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]')}>
                                        <img src={ad.imageUrl} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" />
                                        <div className="absolute top-2 left-2 flex gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">{ad.format}</span>
                                            {ad.hasPosterVideo && <span className="px-1.5 py-0.5 rounded bg-[var(--cre)] text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">MV READY</span>}
                                        </div>
                                        <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                                            <button onClick={() => handleTogglePoster(ad.id)} className="flex-1 h-7 bg-white/95 text-[8px] font-bold uppercase text-[var(--text-primary)] rounded-lg border border-[var(--border)] flex items-center justify-center gap-1 shadow-sm"><Video size={10} /> Motion</button>
                                            <button className="flex-1 h-7 bg-white/95 text-[8px] font-bold uppercase text-[var(--text-primary)] rounded-lg border border-[var(--border)] flex items-center justify-center gap-1 shadow-sm"><Maximize2 size={10} /> View</button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-bold text-[var(--cre)] uppercase tracking-widest">Headline AI</span>
                                            <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase leading-tight line-clamp-2">{ad.headline}</h4>
                                        </div>
                                        <div className="flex gap-2 border-t border-[var(--border)]/50 pt-3">
                                            <button className="h-8 w-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-all flex items-center justify-center shadow-sm"><Copy size={14} /></button>
                                            <button className="h-8 w-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-all flex items-center justify-center shadow-sm"><Download size={14} /></button>
                                            <button onClick={() => handleUploadToMeta(ad)} className="flex-1 h-8 bg-[var(--text-primary)] text-white text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all"><Facebook size={12} /> Pushear</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL META */}
            {showMetaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="w-full max-w-sm bg-white border border-[var(--border)] rounded-xl shadow-md p-6 space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2"><Facebook size={18} className="text-[#0866FF]" /> Push to Meta</h3>
                            <button onClick={() => setShowMetaModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
                        </div>
                        <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] shrink-0 shadow-sm"><img src={activeAdToMeta?.imageUrl} className="w-full h-full object-cover" /></div>
                            <div className="min-w-0">
                                <p className="text-[8px] font-bold text-[var(--cre)] uppercase tracking-tight">Naming</p>
                                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">[PROD]-STATIC-{conceptName.replace(/\s+/g, '-').toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-0.5">Meta Acct</label>
                            <select value={selectedMetaAccount} onChange={(e) => setSelectedMetaAccount(e.target.value)} className="w-full h-9 bg-white border border-[var(--border)] rounded-lg px-3 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40">
                                <option value="">Selecciona cuenta...</option>
                                {metaAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <button onClick={confirmMetaUpload} disabled={uploadingToMeta} className="w-full h-11 bg-[#0866FF] text-white rounded-lg flex items-center justify-center gap-2 shadow-sm font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all disabled:opacity-50">
                            {uploadingToMeta ? <RefreshCcw size={16} className="animate-spin" /> : <Share2 size={16} />}
                            {uploadingToMeta ? 'Enviando...' : 'Publicar Asset'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
