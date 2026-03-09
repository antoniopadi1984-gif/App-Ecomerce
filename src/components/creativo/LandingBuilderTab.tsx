'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutTemplate, Sparkles, FolderOpen, Image as ImageIcon, Code2,
    Loader2, ChevronDown, ChevronRight, Download, Copy, Eye,
    Smartphone, Tablet, Monitor, MousePointer2, Zap, Target,
    Gift, MessageSquare, AlertTriangle, CheckCircle2,
    ArrowRight, Layers, Settings2, Trash2, Plus,
    RefreshCcw, Share2, Facebook, Ghost, Search,
    Flame, BarChart3, Gauge, Rocket, ShieldCheck,
    SmartphoneNfc, Navigation, Palette, Layout,
    Type, Globe, Smartphone as IPhoneIcon, X,
    FileText, UserCheck, ZapOff, Activity, Shield, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';

// --- Types ---
type BuilderMode = 'RAPIDO' | 'EXPERTO';
type Device = 'desktop' | 'tablet' | 'mobile';
type LandingType =
    | 'PDP' | 'ADVERTORIAL' | 'ADVERTORIAL_HYBRID'
    | 'LISTICLE' | 'LISTICLE_EDU' | 'VSL'
    | 'LONG_STORY' | 'MINIMALIST';

interface LandingBlock {
    id: string;
    type: string;
    label: string;
    content: any;
    status?: 'OK' | 'WARNING' | 'ERROR';
    errors?: string[];
}

// --- Constants ---
const LANDING_TYPES: { value: LandingType, label: string }[] = [
    { value: 'PDP', label: 'Product Page (Product Page)' },
    { value: 'ADVERTORIAL', label: 'Advertorial de descubrimiento' },
    { value: 'ADVERTORIAL_HYBRID', label: 'Advertorial híbrido' },
    { value: 'LISTICLE', label: 'Listicle comparativo' },
    { value: 'LISTICLE_EDU', label: 'Listicle educativo' },
    { value: 'VSL', label: 'VSL (Video Sales Letter)' },
    { value: 'LONG_STORY', label: 'Página larga tipo historia' },
    { value: 'MINIMALIST', label: 'Página minimalista de impacto' },
];

const AVAILABLE_BLOCKS = [
    { id: 'hero', label: 'Hero / Titular', icon: Zap, category: 'CONVERSIÓN' },
    { id: 'problem', label: 'Problema / Agitación', icon: AlertTriangle, category: 'CONVERSIÓN' },
    { id: 'mechanism', label: 'Mecanismo / Solución', icon: Target, category: 'CONVERSIÓN' },
    { id: 'benefits', label: 'Beneficios Principales', icon: CheckCircle2, category: 'CONVERSIÓN' },
    { id: 'social', label: 'Prueba Social (Social Proof)', icon: MessageSquare, category: 'CONFIANZA' },
    { id: 'testimonios', label: 'Testimonios / Reviews', icon: UserCheck, category: 'CONVERSIÓN' },
    { id: 'antes_despues', label: 'Antes-Después', icon: Layers, category: 'CONVERSIÓN' },
    { id: 'garantia', label: 'Garantía Trust', icon: Shield, category: 'CONVERSIÓN' },
    { id: 'oferta', label: 'Oferta Irresistible', icon: FileText, category: 'CONVERSIÓN' },
    { id: 'bundle', label: 'Bundle AOV', icon: Layers, category: 'AOV/UPSELL' },
    { id: 'bonus', label: 'Regalo / Bonus', icon: Gift, category: 'AOV/UPSELL' },
    { id: 'faq', label: 'FAQ / Objeciones', icon: Search, category: 'CONVERSIÓN' },
    { id: 'cta', label: 'CTA / Call Action', icon: MousePointer2, category: 'CONVERSIÓN' },
];

export function LandingBuilderTab({ storeId, productId, marketLang }: { storeId: string, productId: string, marketLang?: string }) {
    const { product } = useProduct();

    // --- Global State ---
    const [mode, setMode] = useState<BuilderMode>('RAPIDO');
    const [type, setType] = useState<LandingType>('PDP');
    const [device, setDevice] = useState<Device>('desktop');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [showiPhone, setShowiPhone] = useState(false);
    const [isHeatmapActive, setIsHeatmapActive] = useState(false);

    // --- Config State ---
    const [linkedCreative, setLinkedCreative] = useState('');
    const [includeGift, setIncludeGift] = useState(false);
    const [driveAssets, setDriveAssets] = useState<any[]>([]);
    const [showAssetSidebar, setShowAssetSidebar] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Canvas State ---
    const [blocks, setBlocks] = useState<LandingBlock[]>([
        {
            id: 'b1', type: 'hero', label: 'Hero Section',
            content: {
                h1: "Bio-Collagen Gel Mask: La máscara que borra 5 años en 14 días",
                sub: "Biotecnología nuclear aplicada a tu piel para una regeneración dermo-celular sin precedentes.",
                cta: "COMPRAR AHORA - 50% DTO"
            },
            status: 'OK'
        },
        {
            id: 'idx-12', type: 'mechanism', label: 'Mecanismo Único',
            content: {
                title: "¿Por qué el colágeno convencional falla?",
                body: "El 98% del colágeno oral es destruido por el ácido gástrico. Nuestra tecnología de micro-encapsulado en frío penetra la barrera lipídica."
            },
            status: 'WARNING',
            errors: ["Contraste bajo detectado"]
        }
    ]);

    // --- Agents State (Experto Mode) ---
    const [agentsAnalysis, setAgentsAnalysis] = useState({
        croScore: 88,
        aovPotential: 18.5,
        coherenceScore: 94,
        speedScorePre: 65,
        speedScorePost: 92
    });

    useEffect(() => {
        if (productId && productId !== 'GLOBAL') {
            fetch(`/api/landing-builder/assets?productId=${productId}`)
                .then(r => r.json())
                .then(d => {
                    if (d.assets) setDriveAssets(d.assets);
                })
                .catch(() => { });
        }
    }, [productId]);

    // --- Handlers ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/landing-builder/save', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    storeId,
                    type,
                    version: 1,
                    content: { blocks, agentsAnalysis }
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Landing guardada en Drive (05_LANDINGS)");
            } else {
                toast.error(data.error || "Error al guardar");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        toast.info("Message Match inyectando promesa...");
        setTimeout(() => {
            setIsGenerating(false);
            toast.success("Landing generada con IA.");
        }, 1500);
    };

    const addBlock = (blockType: any) => {
        const newBlock: LandingBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type: blockType.id,
            label: blockType.label,
            content: { title: 'Nueva Sección ' + blockType.label, body: 'Persuasión IA ' + blockType.label },
            status: 'OK'
        };
        setBlocks([...blocks, newBlock]);
        toast.success(`Bloque añadido`);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    return (
        <div className="flex h-[calc(100vh-220px)] gap-4 animate-in fade-in duration-500 overflow-hidden relative">

            {/* PANEL IZQUIERDO */}
            <aside className="w-[280px] flex flex-col bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 shadow-sm">
                <div className="p-4 border-b border-[var(--border)] bg-white space-y-4">
                    <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
                        <button
                            onClick={() => setMode('RAPIDO')}
                            className={cn(
                                "flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                                mode === 'RAPIDO' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            Rápido
                        </button>
                        <button
                            onClick={() => setMode('EXPERTO')}
                            className={cn(
                                "flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                                mode === 'EXPERTO' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            Experto
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Tipo de Landing</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as LandingType)}
                                className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-3 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40"
                            >
                                {LANDING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest ml-1">Message Match</label>
                            <select
                                value={linkedCreative}
                                onChange={(e) => setLinkedCreative(e.target.value)}
                                className="w-full h-8 bg-white border border-[var(--border)] rounded-lg px-3 text-[10px] font-bold uppercase outline-none focus:border-[var(--cre)]/40"
                            >
                                <option value="">Sin vincular</option>
                                <option value="c1">VID_CONC01 (Hook: Botox)</option>
                                <option value="c2">VID_CONC02 (Hook: Collagen)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-[var(--bg)]/10 space-y-1 custom-scrollbar">
                    <h4 className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest m-2">Bloques Modulares</h4>
                    {AVAILABLE_BLOCKS.map(block => (
                        <button
                            key={block.id}
                            onClick={() => addBlock(block)}
                            className="w-full flex items-center gap-3 p-2 bg-white border border-[var(--border)] rounded-xl hover:border-[var(--cre)]/40 hover:bg-[var(--cre-bg)] transition-all group shadow-sm active:scale-[0.98] text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--cre)] transition-colors border border-[var(--border)]">
                                <block.icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate">{block.label}</p>
                                <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase">{block.category}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-[var(--border)] bg-white">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full h-10 bg-[var(--cre)] text-white rounded-lg flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">Generar con IA</span>
                    </button>
                </div>
            </aside>

            {/* PANEL CENTRAL: CANVAS */}
            <main className="flex-1 flex flex-col bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
                <div className="h-14 px-5 border-b border-[var(--border)] bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-[var(--bg)] p-0.5 rounded-lg border border-[var(--border)]">
                            <DeviceButton active={device === 'desktop'} onClick={() => setDevice('desktop')} icon={Monitor} />
                            <DeviceButton active={device === 'tablet'} onClick={() => setDevice('tablet')} icon={Tablet} />
                            <DeviceButton active={device === 'mobile'} onClick={() => setDevice('mobile')} icon={Smartphone} />
                        </div>
                        <button
                            onClick={() => { setDevice('mobile'); setShowiPhone(!showiPhone); }}
                            className={cn(
                                "h-8 px-3 rounded-lg border flex items-center gap-2 text-[10px] font-bold uppercase transition-all",
                                showiPhone ? "bg-[var(--text-primary)] text-white" : "bg-white border-[var(--border)] hover:bg-[var(--bg)]"
                            )}
                        >
                            <IPhoneIcon size={14} /> Simulator
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsHeatmapActive(!isHeatmapActive)}
                            className={cn(
                                "h-8 px-4 rounded-lg border flex items-center gap-2 text-[10px] font-bold uppercase transition-all",
                                isHeatmapActive ? "bg-rose-500 text-white border-rose-500" : "bg-white border-[var(--border)]"
                            )}
                        >
                            <Flame size={14} /> Heatmap
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-8 px-4 rounded-lg bg-[var(--text-primary)] text-white text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            Guardar
                        </button>
                        <button className="h-8 px-4 rounded-lg bg-[var(--cre)] text-white text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm">
                            <Share2 size={14} /> Publicar
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 bg-[var(--bg)]/30 custom-scrollbar flex flex-col items-center relative">
                    {/* Simulator Overlay */}
                    {showiPhone && (
                        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-md flex items-center justify-center p-10 overflow-y-auto">
                            <div className="relative w-[375px] h-[812px] bg-white rounded-3xl border-4 border-[var(--text-primary)] shadow-md overflow-hidden flex flex-col scale-90">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[var(--text-primary)] rounded-b-xl z-50" />
                                <div className="flex-1 overflow-y-auto pt-8">
                                    {blocks.map(b => <LandingPreviewBlock key={b.id} block={b} isMobile={true} />)}
                                </div>
                                <button onClick={() => setShowiPhone(false)} className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white border border-[var(--border)] rounded-full text-[10px] font-bold uppercase shadow-lg">Cerrar</button>
                            </div>
                        </div>
                    )}

                    {/* Canvas Main */}
                    <div className={cn(
                        "bg-white border border-[var(--border)] shadow-lg rounded-xl transition-all duration-500 min-h-full h-fit flex flex-col relative",
                        device === 'desktop' ? "w-full max-w-[900px]" : device === 'tablet' ? "w-[768px]" : "w-[375px]"
                    )}>
                        {blocks.length === 0 ? (
                            <div className="py-40 text-center space-y-4 opacity-30 flex flex-col items-center">
                                <LayoutTemplate size={48} strokeWidth={1} />
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Canvas Vacío</p>
                            </div>
                        ) : (
                            <div className="flex-1 relative">
                                {isHeatmapActive && <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-overlay bg-gradient-to-br from-rose-500 via-orange-400 to-blue-500" />}
                                {blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        onClick={() => setSelectedBlockId(block.id)}
                                        className={cn("relative group border-y border-transparent transition-all", selectedBlockId === block.id ? "bg-[var(--cre-bg)]/10 ring-1 ring-[var(--cre)]/20 shadow-inner" : "hover:bg-[var(--bg)]/5")}
                                    >
                                        <LandingPreviewBlock block={block} isMobile={device === 'mobile'} />
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1.5 rounded-lg bg-white border border-[var(--border)] text-rose-500 hover:bg-rose-50 shadow-sm"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Agent Footer */}
                <div className="h-10 px-5 bg-[var(--text-primary)] text-white border-t border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <AgentStat icon={Gauge} label="CRO" value={`${agentsAnalysis.croScore}`} color="text-emerald-400" />
                        <AgentStat icon={TrendingUp} label="AOV" value={`+${agentsAnalysis.aovPotential}%`} color="text-[var(--cre)]" />
                        <AgentStat icon={ShieldCheck} label="Forense" value="Optimizado" color="text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <Sparkles size={10} className="text-[var(--cre)]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">IA Engine Active</span>
                    </div>
                </div>
            </main>

            {/* PANEL DERECHO: INSPECTOR */}
            <aside className="w-[300px] bg-white border border-[var(--border)] rounded-xl overflow-hidden shrink-0 flex flex-col shadow-sm">
                <div className="h-14 px-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/50">
                    <div className="flex items-center gap-2">
                        <Settings2 size={14} className="text-[var(--cre)]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Inspector Modular</h3>
                    </div>
                    {selectedBlock && <button onClick={() => setSelectedBlockId(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg)] text-[var(--text-tertiary)] transition-all"><X size={14} /></button>}
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={() => setShowAssetSidebar(!showAssetSidebar)}
                            className={cn(
                                "flex-1 h-8 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                                showAssetSidebar ? "bg-[var(--text-primary)] text-white" : "bg-white border-[var(--border)]"
                            )}
                        >
                            <FolderOpen size={12} /> Drive Assets
                        </button>
                    </div>

                    {showAssetSidebar ? (
                        <div className="space-y-4 animate-in slide-in-from-right-2">
                            <h4 className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest pl-1">06_ASSETS/IMAGENES_LANDING</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {driveAssets.map(asset => (
                                    <div key={asset.id} className="aspect-square bg-[var(--bg)] rounded-lg border border-[var(--border)] overflow-hidden group relative cursor-pointer hover:border-[var(--cre)]/40">
                                        <img src={asset.thumbnail || asset.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : selectedBlock ? (
                        <div className="space-y-6 animate-in slide-in-from-right-2">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Título Persuasivo</Label>
                                    <Textarea value={selectedBlock.content.h1 || selectedBlock.content.title} onChange={() => { }} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Cuerpo / Copys</Label>
                                    <Textarea value={selectedBlock.content.sub || selectedBlock.content.body} onChange={() => { }} />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--border)] space-y-4">
                                <h4 className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] flex items-center gap-2"><Palette size={12} className="text-[var(--cre)]" /> Diseño Visual</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1"><span className="text-[9px] font-bold text-[var(--text-tertiary)]">Alineación</span></div>
                                    <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                                        {['Izquierda', 'Centro', 'Derecha'].map(a => (
                                            <button key={a} className={cn("py-1 text-[8px] font-bold uppercase rounded-lg transition-all", a === 'Centro' ? "bg-white text-[var(--cre)] shadow-sm" : "text-gray-400 hover:text-gray-600")}>{a}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selectedBlock.status === 'WARNING' && (
                                <div className="p-4 bg-[var(--cre-bg)] border border-[var(--cre)]/10 rounded-xl space-y-3 scale-95 shadow-sm">
                                    <div className="flex items-center gap-2 text-[var(--cre)]"><AlertTriangle size={14} /><span className="text-[10px] font-bold uppercase">Corrección CRO</span></div>
                                    <p className="text-[11px] font-medium text-[var(--text-primary)] leading-tight italic opacity-80">"Contraste insuficiente en mobile. Se recomienda subir 2 ptos de peso visual."</p>
                                    <button className="w-full h-8 bg-[var(--cre)] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">Autofix Engine</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4 py-20">
                            <MousePointer2 size={32} strokeWidth={1} />
                            <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-primary)] leading-tight max-w-[150px]">Selecciona bloque para desplegar controles</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-white">
                    <button className="w-full h-10 bg-[var(--bg)] border border-[var(--border)] border-dashed rounded-xl text-[var(--cre)] text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-[var(--cre-bg)]/20 transition-all">
                        <Activity size={14} /> Analítica Predictiva
                    </button>
                </div>
            </aside>
        </div>
    );
}

// --- Helper Components ---

function DeviceButton({ active, onClick, icon: Icon }: any) {
    return (
        <button onClick={onClick} className={cn("w-9 h-9 flex items-center justify-center rounded-lg transition-all", active ? "bg-white text-[var(--cre)] shadow-sm border border-[var(--border)]" : "text-[var(--text-tertiary)] hover:bg-white hover:text-[var(--text-primary)]")}>
            <Icon size={16} />
        </button>
    );
}

function AgentStat({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex items-center gap-2">
            <Icon size={14} className={color} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}: <span className={color}>{value}</span></span>
        </div>
    );
}

function Label({ children }: any) {
    return <label className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest pl-1">{children}</label>;
}

function Textarea({ ...props }: any) {
    return <textarea {...props} className="w-full h-20 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 text-[11px] font-bold uppercase outline-none focus:border-[var(--cre)]/40 transition-all resize-none text-[var(--text-primary)]" />;
}

function LandingPreviewBlock({ block, isMobile }: { block: LandingBlock, isMobile: boolean }) {
    switch (block.type) {
        case 'hero':
            return (
                <div className={cn("p-12 text-center flex flex-col items-center gap-6", isMobile ? "px-6 py-10" : "p-20")}>
                    <h1 className={cn("font-bold text-[var(--text-primary)] leading-tight uppercase tracking-tight", isMobile ? "text-xl" : "text-4xl")}>{block.content.h1}</h1>
                    <p className={cn("text-[var(--text-tertiary)] font-medium leading-relaxed max-w-2xl", isMobile ? "text-xs" : "text-sm")}>{block.content.sub}</p>
                    <button className={cn("h-12 px-10 bg-[var(--text-primary)] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-md", isMobile && "w-full")}>{block.content.cta}</button>
                </div>
            );
        case 'mechanism':
            return (
                <div className={cn("bg-[var(--bg)]/30 p-12 flex flex-col items-center gap-6 text-center border-y border-[var(--border)]/50", isMobile ? "px-6 py-10" : "p-20")}>
                    <div className="w-8 h-1 bg-[var(--cre)] rounded-full mb-2" />
                    <h2 className={cn("font-bold text-[var(--text-primary)] uppercase tracking-tight", isMobile ? "text-lg" : "text-2xl")}>{block.content.title}</h2>
                    <p className={cn("text-[var(--text-tertiary)] font-medium leading-relaxed max-w-xl", isMobile ? "text-[11px]" : "text-sm")}>{block.content.body}</p>
                    <div className={cn("grid grid-cols-2 gap-4 w-full max-w-xl mt-6", isMobile && "grid-cols-1")}>
                        <div className="p-6 bg-white border border-[var(--border)] rounded-xl text-center space-y-1 shadow-sm">
                            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tighter">98%</p>
                            <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)]">Sin Absorción</p>
                        </div>
                        <div className="p-6 bg-[var(--cre)] text-white rounded-xl text-center space-y-1 shadow-sm">
                            <p className="text-2xl font-bold tracking-tighter">100%</p>
                            <p className="text-[9px] font-bold uppercase opacity-80">Bio-Disponible</p>
                        </div>
                    </div>
                </div>
            );
        default:
            return (
                <div className="p-20 border-b border-dashed border-[var(--border)] flex flex-col items-center justify-center bg-white text-[var(--text-tertiary)] group relative">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{block.label}</span>
                </div>
            );
    }
}
