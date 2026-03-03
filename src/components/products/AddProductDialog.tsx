'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus, Brain, Sparkles, Box, Euro, Globe, Target, UploadCloud,
    Link as LinkIcon, Trash2, ChevronDown, ChevronRight, Loader2,
    ShoppingBag, Microscope, Play, AlertCircle, ExternalLink, FileText
} from 'lucide-react';
import { useProduct } from '@/context/ProductContext';
import { useStore } from '@/lib/store/store-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MARKET_LANGUAGES, countryToLang } from '@/lib/translation';

// ── Benchmark margins by niche ──────────────────────────────
const NICHE_MARGINS: Record<string, number> = {
    'Salud': 0.75, 'Belleza': 0.72, 'Mascotas': 0.65,
    'Hogar': 0.62, 'Fitness': 0.70, 'Cocina': 0.60,
    'Moda': 0.65, 'Tecnología': 0.55, 'Juguetes': 0.60,
    'Alimentación': 0.55, 'Otro': 0.60,
};
const NICHE_CVR: Record<string, number> = {
    'Salud': 2.5, 'Belleza': 2.8, 'Mascotas': 2.2,
    'Hogar': 2.0, 'Fitness': 2.3, 'Cocina': 1.9,
    'Moda': 1.8, 'Tecnología': 1.6, 'Juguetes': 2.0,
    'Alimentación': 1.7, 'Otro': 2.0,
};

// ── Breakeven calculations ────────────────────────────────────
function calcBreakeven(pvp: number, cost: number, niche: string, cvrOverride?: number) {
    const margin = cost > 0 ? (pvp - cost) / pvp : (NICHE_MARGINS[niche] ?? 0.65);
    const cvr = (cvrOverride ?? NICHE_CVR[niche] ?? 2.0) / 100;
    const cpaMax = pvp * margin * 0.4;
    const cpcBE = cpaMax * cvr;
    const roasBE = pvp / cpaMax;
    return { cpaMax, cpcBE, roasBE, margin: margin * 100 };
}

// ── Types ─────────────────────────────────────────────────────
interface CompetitorEntry { url: string; country: string; price: string; analyzing: boolean; done: boolean; }
interface AmazonEntry { url: string; }
interface LandingEntry { url: string; }

const COUNTRIES = ['ES', 'MX', 'CO', 'AR', 'PE', 'FR', 'IT', 'DE', 'US', 'UK', 'GLOBAL', 'LATAM'];
const NICHES = ['Salud', 'Belleza', 'Mascotas', 'Hogar', 'Fitness', 'Cocina', 'Moda', 'Tecnología', 'Juguetes', 'Alimentación', 'Otro'];

const FULFILLMENT_OPTIONS = ['Beeping', 'Dropea', 'Dropi', 'Manual'];
const FAMILIES = ['Suplementos', 'Cosmética', 'Gadgets', 'Ropa', 'Electrodomésticos', 'Alimentos', 'Equipamiento', 'Accesorios', 'Software', 'Servicios', 'Otro'];

// ─── Section wrapper ──────────────────────────────────────────
function Section({ icon, title, children, accent = 'var(--inv)' }: { icon: React.ReactNode; title: string; children: React.ReactNode; accent?: string }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <span style={{ color: accent }}>{icon}</span>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ── Metric tile ───────────────────────────────────────────────
function Tile({ label, value, color = 'var(--text)', note }: { label: string; value: string; color?: string; note?: string }) {
    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-xl text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)]">{label}</p>
            <p className="text-[13px] font-black mt-0.5" style={{ color }}>{value || '—'}</p>
            {note && <p className="text-[8px] text-[var(--text-dim)] mt-0.5">{note}</p>}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export function AddProductDialog() {
    const { refreshAllProducts, setProductId } = useProduct();
    const { activeStoreId } = useStore();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [genDesc, setGenDesc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Form fields ─────────────────────────────────────────
    const [title, setTitle] = useState('');
    const [sku, setSku] = useState('');
    const [country, setCountry] = useState('ES');
    const [niche, setNiche] = useState('Salud');
    const [family, setFamily] = useState('Suplementos');
    const [pvp, setPvp] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    const [handlingCost, setHandlingCost] = useState('');
    const [returnRate, setReturnRate] = useState('5');
    const [fulfillment, setFulfillment] = useState('Manual');
    const [deliveryRate, setDeliveryRate] = useState('70');
    const [cvr, setCvr] = useState('');
    const [landingUrl, setLandingUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [googleDocUrl, setGoogleDocUrl] = useState('');
    const [foreplayUrl, setForeplayUrl] = useState('');
    const [adLibraryUrls, setAdLibraryUrls] = useState<string[]>(['']);

    // ── Dynamic lists ───────────────────────────────────────
    const [competitors, setCompetitors] = useState<CompetitorEntry[]>([
        { url: '', country: 'ES', price: '', analyzing: false, done: false }
    ]);
    const [amazonLinks, setAmazonLinks] = useState<AmazonEntry[]>([{ url: '' }]);
    const [ownLandings, setOwnLandings] = useState<LandingEntry[]>([{ url: '' }]);

    // ── Live breakeven ──────────────────────────────────────
    const pvpNum = parseFloat(pvp) || 0;
    const handleNum = parseFloat(handlingCost) || 0;
    const returnNum = parseFloat(returnRate) || 0;
    const productNum = parseFloat(unitCost) || 0;
    const shippingNum = parseFloat(shippingCost) || 0;

    // costeReal = costeProducto + costeEnvio + costeManipulacion + (% devolucion basado en coste producto/envio)
    const costeReal = productNum + shippingNum + handleNum + ((productNum + shippingNum) * (returnNum / 100));

    const deliveryNum = parseFloat(deliveryRate) || 70;

    // beneficioNeto = (tasaEntrega/100 * precioVenta) - costeReal
    const beneficioNeto = (deliveryNum / 100 * pvpNum) - costeReal;
    const margenBrutoNum = pvpNum - productNum - shippingNum - handleNum;

    const cvrNum = parseFloat(cvr) || 0;
    const cvrTarget = cvrNum || NICHE_CVR[niche] || 2.0;
    const be = pvpNum > 0 ? {
        margin: margenBrutoNum,
        roasBE: beneficioNeto > 0 ? pvpNum / beneficioNeto : 0,
        cpaMax: beneficioNeto > 0 ? beneficioNeto : 0,
        cpcBE: beneficioNeto > 0 ? beneficioNeto * (cvrTarget / 100) : 0
    } : null;

    // ── Image upload ─────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.success) { setImageUrl(d.url); toast.success('Imagen subida'); }
            else toast.error('Error al subir imagen');
        } catch { toast.error('Error de conexión'); }
    };

    // ── Auto-suggest price ───────────────────────────────────
    const handleAutoPrice = () => {
        const totalBaseCost = productNum + shippingNum + handleNum;
        if (totalBaseCost > 0) {
            setPvp((totalBaseCost * 3).toFixed(2));
            toast.success('Precio sugerido: 3× coste');
        } else if (niche) {
            // Benchmark: suggest based on typical AOV by niche
            const benchmarkPVP: Record<string, number> = {
                'Salud': 39.95, 'Belleza': 29.95, 'Fitness': 49.95, 'Tecnología': 59.95,
                'Hogar': 34.95, 'Mascotas': 27.95, 'Cocina': 34.95, 'Moda': 39.95,
                'Juguetes': 24.95, 'Alimentación': 19.95, 'Otro': 34.95,
            };
            setPvp((benchmarkPVP[niche] ?? 34.95).toFixed(2));
            toast.success(`PVP benchmark para ${niche}`);
        }
    };

    // ── Generate AI description ──────────────────────────────
    const handleGenDescription = async () => {
        if (!title) { toast.error('Introduce el nombre del producto primero'); return; }
        setGenDesc(true);
        try {
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Genera una descripción breve y profesional (máx 3 frases) para este producto de ecommerce. Producto: "${title}". Nicho: ${niche}. Familia: ${family}. País: ${country}. Incluye el beneficio principal, el mecanismo de acción y la promesa de resultado. Solo la descripción, sin introducciones.`,
                    storeId: activeStoreId,
                    agentRole: 'COPYWRITING',
                    pageContext: 'Product creation form'
                })
            });
            const d = await res.json();
            if (d.response) setDescription(d.response);
        } catch { toast.error('Error al generar descripción'); }
        finally { setGenDesc(false); }
    };

    // ── Analyze competitor ───────────────────────────────────
    const analyzeCompetitor = async (idx: number) => {
        const comp = competitors[idx];
        if (!comp.url.trim()) return;
        setCompetitors(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], analyzing: true };
            return next;
        });
        try {
            await fetch('/api/investigacion/analyze-competitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: comp.url, country: comp.country, price: parseFloat(comp.price) || null, storeId: activeStoreId })
            });
            setCompetitors(prev => {
                const next = [...prev];
                next[idx] = { ...next[idx], analyzing: false, done: true };
                return next;
            });
            toast.success('Competidor analizado y guardado');
        } catch {
            setCompetitors(prev => {
                const next = [...prev];
                next[idx] = { ...next[idx], analyzing: false };
                return next;
            });
            toast.error('Error al analizar competidor');
        }
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('El nombre del producto es obligatorio'); return; }
        if (!pvpNum) { toast.error('El PVP estimado es obligatorio'); return; }
        setLoading(true);
        try {
            const payload = {
                title,
                sku: sku || ('PROD_' + title.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_01').substring(0, 20),
                fulfillment,
                country,
                niche,
                productFamily: family,
                pvpEstimated: pvpNum,
                price: pvpNum,
                unitCost: parseFloat(unitCost) || 0,
                shippingCost: parseFloat(shippingCost) || 0,
                cvrExpected: cvrNum || null,
                cpaMax: be?.cpaMax ?? null,
                breakevenCPC: be?.cpcBE ?? null,
                breakevenROAS: be?.roasBE ?? null,
                landingUrl,
                description,
                imageUrl,
                googleDocUrl,
                foreplayBoardUrl: foreplayUrl,
                adLibraryUrls: JSON.stringify(adLibraryUrls.filter(u => u.trim())),
                amazonLinks: JSON.stringify(amazonLinks.map(a => a.url).filter(u => u.trim())),
                landingUrls: JSON.stringify(ownLandings.map(l => l.url).filter(u => u.trim())),
                competitorLinks: competitors.filter(c => c.url.trim()).map(c => c.url),
                agentDescription: description,
                marketLanguage: countryToLang(country),
                interfaceLanguage: 'ES',
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStoreId || '' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.error || 'Error al crear producto');

            toast.success('Producto creado. Iniciando Research Pipeline...');
            await refreshAllProducts();
            setProductId(data.product.id);
            setOpen(false);
            resetForm();

            // Auto-launch god tier pipeline in background
            fetch('/api/research/god-tier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: activeStoreId,
                    productId: data.product.id,
                    runId: `run_${Date.now()}`,
                    stepKey: 'P1'
                })
            }).catch(() => { /* silent */ });

        } catch (err) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error('Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setCountry('ES'); setNiche('Salud'); setFamily('Suplementos');
        setPvp(''); setUnitCost(''); setShippingCost(''); setCvr('');
        setHandlingCost(''); setReturnRate('5'); setFulfillment('Manual'); setDeliveryRate('70'); setSku('');
        setLandingUrl(''); setImageUrl(''); setDescription('');
        setGoogleDocUrl(''); setForeplayUrl('');
        setAdLibraryUrls(['']); setCompetitors([{ url: '', country: 'ES', price: '', analyzing: false, done: false }]);
        setAmazonLinks([{ url: '' }]); setOwnLandings([{ url: '' }]);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="h-9 px-4 bg-[var(--inv)] hover:brightness-110 text-white rounded-xl shadow-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest">
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[880px] p-0 overflow-hidden bg-[var(--bg)] border border-[var(--border)] max-h-[92vh] flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-[15px] font-black uppercase tracking-tight text-[var(--text)] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[var(--inv)] flex items-center justify-center text-white">
                                <Box className="w-4 h-4" />
                            </div>
                            Nuevo Producto — Ficha Completa
                        </DialogTitle>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] bg-[var(--surface2)] border border-[var(--border)] px-3 py-1.5 rounded-lg">
                            <Brain className="w-3.5 h-3.5 text-[var(--inv)]" /> Research Auto-Launch
                        </div>
                    </div>
                </DialogHeader>

                {/* Scrollable body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ══ COL 1 ══════════════════════════════════════════ */}
                    <div className="space-y-8">

                        {/* INFORMACIÓN BÁSICA */}
                        <Section icon={<Target className="w-4 h-4" />} title="Información Básica">
                            {/* Image upload */}
                            <div className="cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                {imageUrl ? (
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-[var(--border)] group-hover:opacity-80 transition-opacity">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] text-white font-black uppercase">Cambiar imagen</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-20 w-full rounded-xl border-2 border-dashed border-[var(--border-high)] flex items-center justify-center gap-2 group-hover:border-[var(--inv)] group-hover:bg-[var(--inv)]/5 transition-all">
                                        <UploadCloud className="w-4 h-4 text-[var(--text-dim)]" />
                                        <span className="text-[10px] text-[var(--text-dim)] font-semibold">Subir imagen del producto</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nombre del producto *</label>
                                <Input required value={title} onChange={e => setTitle(e.target.value)}
                                    placeholder="Ej: NeckRelief Pro — Masajeador Cervical" className="h-9 text-[11px] font-medium" />
                            </div>
                            <div className="space-y-1.5 hidden">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">SKU (opcional)</label>
                                <Input value={sku} onChange={e => setSku(e.target.value)}
                                    placeholder="PROD_NOMBRE_01" className="h-9 text-[11px]" />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1"><Globe className="w-3 h-3" /> País *</label>
                                    <Select value={country} onValueChange={setCountry}>
                                        <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nicho *</label>
                                    <Select value={niche} onValueChange={setNiche}>
                                        <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Familia *</label>
                                    <Select value={family} onValueChange={setFamily}>
                                        <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{FAMILIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">URL Tienda / Landing (si existe)</label>
                                <Input value={landingUrl} onChange={e => setLandingUrl(e.target.value)}
                                    placeholder="https://tu-tienda.com/producto" className="h-9 text-[11px]" />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Descripción</label>
                                    <button type="button" onClick={handleGenDescription} disabled={genDesc}
                                        className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[var(--inv)] hover:brightness-110 disabled:opacity-50">
                                        {genDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Generar con IA
                                    </button>
                                </div>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="La IA generará una descripción profesional automáticamente al pulsar 'Generar con IA'..."
                                    className="text-[11px] resize-none" rows={3} />
                            </div>
                        </Section>

                        {/* AMAZON REVIEWS */}
                        <Section icon={<ShoppingBag className="w-4 h-4" />} title="Amazon — Investigación de Mercado" accent="var(--ops)">
                            <p className="text-[9px] text-[var(--text-dim)]">El agente extrae reviews, dolores, lenguaje y objeciones automáticamente.</p>
                            {amazonLinks.map((a, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input value={a.url} onChange={e => {
                                        const next = [...amazonLinks];
                                        next[i] = { url: e.target.value };
                                        setAmazonLinks(next);
                                    }} placeholder="https://amazon.es/dp/..." className="h-8 text-[11px]" />
                                    {amazonLinks.length > 1 && (
                                        <button type="button" onClick={() => setAmazonLinks(amazonLinks.filter((_, j) => j !== i))}
                                            className="p-1.5 text-[var(--text-dim)] hover:text-[var(--s-ko)] transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setAmazonLinks([...amazonLinks, { url: '' }])}
                                className="text-[9px] font-black uppercase tracking-widest text-[var(--ops)] hover:brightness-110 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Añadir URL Amazon
                            </button>
                        </Section>

                        {/* LANDINGS PROPIAS */}
                        <Section icon={<ExternalLink className="w-4 h-4" />} title="Landings Propias (CRO Analysis)" accent="var(--mkt)">
                            {ownLandings.map((l, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input value={l.url} onChange={e => {
                                        const next = [...ownLandings];
                                        next[i] = { url: e.target.value };
                                        setOwnLandings(next);
                                    }} placeholder="https://tu-landing.com" className="h-8 text-[11px]" />
                                    {ownLandings.length > 1 && (
                                        <button type="button" onClick={() => setOwnLandings(ownLandings.filter((_, j) => j !== i))}
                                            className="p-1.5 text-[var(--text-dim)] hover:text-[var(--s-ko)] transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setOwnLandings([...ownLandings, { url: '' }])}
                                className="text-[9px] font-black uppercase tracking-widest text-[var(--mkt)] hover:brightness-110 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Añadir landing
                            </button>
                        </Section>
                    </div>

                    {/* ══ COL 2 ══════════════════════════════════════════ */}
                    <div className="space-y-8">

                        {/* UNIT ECONOMICS + BREAKEVEN */}
                        <Section icon={<Euro className="w-4 h-4" />} title="Unit Economics & Breakeven Auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Coste producto (€)</label>
                                    <Input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="h-9 text-[11px]" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Coste envío (€)</label>
                                    <Input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} className="h-9 text-[11px]" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">C. Manipulación (€)</label>
                                    <Input type="number" step="0.01" value={handlingCost} onChange={e => setHandlingCost(e.target.value)} className="h-9 text-[11px]" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fullfilment</label>
                                    <Select value={fulfillment} onValueChange={setFulfillment}>
                                        <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{FULFILLMENT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tasa Entrega (%)</label>
                                    <Input type="number" step="1" value={deliveryRate} onChange={e => setDeliveryRate(e.target.value)} className="h-9 text-[11px]" placeholder="70" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancel./Dev. (%)</label>
                                    <Input type="number" step="1" value={returnRate} onChange={e => setReturnRate(e.target.value)} className="h-9 text-[11px]" placeholder="5" />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text)]">PVP Estimado (€) *</label>
                                        <button type="button" onClick={handleAutoPrice}
                                            className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[var(--inv)] hover:brightness-110">
                                            <Sparkles className="w-3 h-3" /> Sugerir IA
                                        </button>
                                    </div>
                                    <Input required type="number" step="0.01" value={pvp} onChange={e => setPvp(e.target.value)}
                                        className="h-10 text-[13px] font-black bg-[var(--inv)]/5 border-[var(--inv)]/30 focus-visible:ring-[var(--inv)]/40" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Tasa Conversión % (CVR) — benchmark: {NICHE_CVR[niche] ?? 2.0}%
                                    </label>
                                    <Input type="number" step="0.1" value={cvr} onChange={e => setCvr(e.target.value)}
                                        placeholder={`Dejar vacío para usar benchmark (${NICHE_CVR[niche] ?? 2.0}%)`} className="h-9 text-[11px]" />
                                </div>
                            </div>

                            {/* Live breakeven tiles */}
                            {be && pvpNum > 0 ? (
                                <div className="grid grid-cols-4 gap-2 pt-2">
                                    <Tile label="ROAS BE" value={`${be.roasBE.toFixed(2)}x`} color="var(--inv)" note="mínimo" />
                                    <Tile label="CPC BE" value={`€${be.cpcBE.toFixed(2)}`} color="var(--ops)" note="calculado" />
                                    <Tile label="CPA Máx" value={`€${be.cpaMax.toFixed(2)}`} color="var(--mkt)" note="40% margen" />
                                    <Tile label="CVR Target" value={`${(cvrNum || (NICHE_CVR[niche] ?? 2.0)).toFixed(1)}%`} color="var(--mando)" note={cvrNum ? 'manual' : 'benchmark'} />
                                </div>
                            ) : (
                                <div className="p-3 bg-[var(--surface2)] rounded-xl text-center text-[10px] text-[var(--text-dim)] border border-dashed border-[var(--border-high)]">
                                    Introduce el PVP para calcular ROAS BE, CPC BE, CPA Máx automáticamente
                                </div>
                            )}

                            {be && <p className="text-[8px] text-[var(--text-dim)]">
                                Margen Bruto: €{margenBrutoNum.toFixed(2)} | Beneficio Neto (CPA Máx): €{beneficioNeto.toFixed(2)} — Alertas Facebook Ads se crearán automáticamente al guardar.
                            </p>}
                        </Section>

                        {/* COMPETIDORES */}
                        <Section icon={<Microscope className="w-4 h-4" />} title="Competencia — Análisis Automático" accent="var(--crm)">
                            <p className="text-[9px] text-[var(--text-dim)]">El agente hace scraping de cada landing y extrae estructura, oferta, precio, garantía, CTA.</p>
                            {competitors.map((c, i) => (
                                <div key={i} className="space-y-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Input value={c.url} onChange={e => {
                                            const next = [...competitors];
                                            next[i] = { ...next[i], url: e.target.value };
                                            setCompetitors(next);
                                        }} placeholder="https://competidor.com" className="h-8 text-[11px] flex-1" />
                                        <select value={c.country} onChange={e => {
                                            const next = [...competitors];
                                            next[i] = { ...next[i], country: e.target.value };
                                            setCompetitors(next);
                                        }} className="h-8 text-[10px] border border-[var(--border)] rounded-lg px-2 bg-[var(--surface2)] font-bold">
                                            {COUNTRIES.map(co => <option key={co} value={co}>{co}</option>)}
                                        </select>
                                        <Input value={c.price} onChange={e => {
                                            const next = [...competitors];
                                            next[i] = { ...next[i], price: e.target.value };
                                            setCompetitors(next);
                                        }} placeholder="Precio" className="h-8 text-[11px] w-20" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => analyzeCompetitor(i)} disabled={c.analyzing || !c.url.trim()}
                                            className={cn('flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all',
                                                c.done ? 'bg-[var(--s-ok)]/10 text-[var(--s-ok)]' :
                                                    'bg-[var(--crm)]/10 text-[var(--crm)] hover:bg-[var(--crm)]/20 disabled:opacity-40'
                                            )}>
                                            {c.analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : c.done ? '✓ Analizado' : <><Play className="w-3 h-3" /> Analizar</>}
                                        </button>
                                        {competitors.length > 1 && (
                                            <button type="button" onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))}
                                                className="p-1.5 text-[var(--text-dim)] hover:text-[var(--s-ko)] transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {competitors.length < 10 && (
                                <button type="button" onClick={() => setCompetitors([...competitors, { url: '', country: 'ES', price: '', analyzing: false, done: false }])}
                                    className="text-[9px] font-black uppercase tracking-widest text-[var(--crm)] hover:brightness-110 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Añadir competidor
                                </button>
                            )}
                        </Section>

                        {/* AD LIBRARY */}
                        <Section icon={<Brain className="w-4 h-4" />} title="Biblioteca de Anuncios Competencia" accent="var(--mkt)">
                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foreplay Board URL</label>
                                    <Input value={foreplayUrl} onChange={e => setForeplayUrl(e.target.value)}
                                        placeholder="https://app.foreplay.co/board/..." className="h-8 text-[11px]" />
                                </div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Facebook Ad Library URLs</label>
                                {adLibraryUrls.map((u, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input value={u} onChange={e => {
                                            const next = [...adLibraryUrls];
                                            next[i] = e.target.value;
                                            setAdLibraryUrls(next);
                                        }} placeholder="https://facebook.com/ads/library/..." className="h-8 text-[11px]" />
                                        {adLibraryUrls.length > 1 && (
                                            <button type="button" onClick={() => setAdLibraryUrls(adLibraryUrls.filter((_, j) => j !== i))}
                                                className="p-1.5 text-[var(--text-dim)] hover:text-[var(--s-ko)]">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setAdLibraryUrls([...adLibraryUrls, ''])}
                                    className="text-[9px] font-black uppercase tracking-widest text-[var(--mkt)] hover:brightness-110 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Añadir URL Ad Library
                                </button>
                            </div>
                        </Section>

                        {/* FUENTES ADICIONALES */}
                        <Section icon={<FileText className="w-4 h-4" />} title="Fuentes Adicionales" accent="var(--sis)">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Google Docs URL (brief, research previo)</label>
                                <Input value={googleDocUrl} onChange={e => setGoogleDocUrl(e.target.value)}
                                    placeholder="https://docs.google.com/..." className="h-8 text-[11px]" />
                            </div>
                        </Section>
                    </div>

                    {/* ══ FOOTER ═══════════════════════════════════════════ */}
                    <div className="col-span-full pt-4 border-t border-[var(--border)] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[9px] text-[var(--text-dim)]">
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--inv)]" />
                            Al crear: se lanza el God Tier Pipeline automáticamente + alertas de Facebook Ads se configuran con los breakevens calculados.
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}
                                className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}
                                className="h-10 px-8 bg-[var(--inv)] hover:brightness-110 text-white rounded-xl shadow-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando...</> : <><Microscope className="w-3.5 h-3.5" /> Crear & Launch Research</>}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
