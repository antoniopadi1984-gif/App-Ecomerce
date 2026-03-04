'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus, Brain, Sparkles, Box, Euro, Globe, Target, UploadCloud,
    Link as LinkIcon, Trash2, ChevronDown, ChevronRight, Loader2, X,
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
interface CompetitorEntry { name: string; url: string; urlAmazon?: string; urlMetaLibrary?: string; urlTikTokLibrary?: string; country: string; price: string; analyzing: boolean; done: boolean; }
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
    const [step, setStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        document.addEventListener('open-create-product-modal', handleOpen);
        return () => document.removeEventListener('open-create-product-modal', handleOpen);
    }, []);

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

    // ── Google Doc Import ───────────────────────────────────
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [docExtracted, setDocExtracted] = useState<any>(null);

    // ── Dynamic lists ───────────────────────────────────────
    const [competitors, setCompetitors] = useState<CompetitorEntry[]>([
        { name: '', url: '', urlAmazon: '', urlMetaLibrary: '', urlTikTokLibrary: '', country: 'ES', price: '', analyzing: false, done: false }
    ]);
    const [amazonLinks, setAmazonLinks] = useState<AmazonEntry[]>([{ url: '' }]);
    const [ownLandings, setOwnLandings] = useState<LandingEntry[]>([{ url: '' }]);

    const pvpNum = parseFloat(pvp) || 0;
    const productNum = parseFloat(unitCost) || 0;
    const shippingNum = parseFloat(shippingCost) || 0;
    const handleNum = parseFloat(handlingCost) || 0;
    const returnRateNum = parseFloat(returnRate) || 0;
    const deliveryRateNum = parseFloat(deliveryRate) || 70;
    const cvrNum = parseFloat(cvr) || NICHE_CVR[niche] || 2.0;

    const be = React.useMemo(() => {
        const costeTotal = productNum + shippingNum + handleNum;
        const margenBrutoNum = pvpNum - costeTotal;
        const costeReal = costeTotal + (returnRateNum / 100 * (productNum + shippingNum));
        const beneficioNeto = (deliveryRateNum / 100 * pvpNum) - costeReal;

        const roasBR = beneficioNeto > 0 ? pvpNum / beneficioNeto : 0;
        const cpaMax = beneficioNeto > 0 ? beneficioNeto : 0;
        const cpcMax = (cvrNum / 100) * cpaMax;

        return pvpNum > 0 ? {
            margenBrutoNum,
            costeReal,
            beneficioNeto,
            roasBE: roasBR,
            cpaMax: cpaMax,
            cpcBE: cpcMax
        } : null;
    }, [pvpNum, productNum, shippingNum, handleNum, returnRateNum, deliveryRateNum, cvrNum, niche]);

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

    // ── Import Google Doc ────────────────────────────────────
    const triggerImport = async (url: string) => {
        if (!url || !url.includes('docs.google.com')) return;
        setImporting(true);
        setImported(false);
        try {
            const res = await fetch('/api/research/extract-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, storeId: activeStoreId })
            });
            const { data, success } = await res.json();
            if (success && data) {
                setDocExtracted(data);
                let count = 0;
                const missing: string[] = [];

                if (data.nombre) { setTitle(data.nombre); count++; } else missing.push('Nombre');
                if (data.categoria) { setFamily(data.categoria); count++; } else missing.push('Categoría');
                if (data.pais) { setCountry(data.pais); count++; } else missing.push('País');

                if (data.precioVenta) { setPvp(String(data.precioVenta)); count++; } else missing.push('PVP');
                if (data.costeProducto) { setUnitCost(String(data.costeProducto)); count++; } else missing.push('Coste Unitario');
                if (data.costeEnvio) { setShippingCost(String(data.costeEnvio)); count++; } else missing.push('Coste Envío');
                if (data.costeManipulacion) { setHandlingCost(String(data.costeManipulacion)); count++; }
                if (data.tasaEntregaEsperada) { setDeliveryRate(String(data.tasaEntregaEsperada)); count++; }
                if (data.tasaConversionEsperada) { setCvr(String(data.tasaConversionEsperada)); count++; }

                if (data.competidores && Array.isArray(data.competidores)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setCompetitors(data.competidores.map((c: any) => ({
                        name: c.nombre || '', url: c.urlWeb || '', urlAmazon: c.urlAmazon || '',
                        urlMetaLibrary: '', urlTikTokLibrary: '', country: data.pais || 'ES',
                        price: c.precioVenta ? String(c.precioVenta) : '', analyzing: false, done: false
                    })));
                    count++;
                }

                if (!data.avatares?.length) missing.push('Avatares');
                if (!data.angulos?.length) missing.push('Ángulos');

                setImportedCount(count);
                setMissingFields(missing);
                setImported(true);
            }
        } catch (e) {
            console.error(e);
            toast.error('Error al importar Doc');
        } finally {
            setImporting(false);
        }
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
                docExtracted: docExtracted ? JSON.stringify(docExtracted) : null,
                foreplayBoardUrl: foreplayUrl,
                adLibraryUrls: JSON.stringify(adLibraryUrls.filter(u => u.trim())),
                amazonLinks: JSON.stringify(amazonLinks.map(a => a.url).filter(u => u.trim())),
                landingUrls: JSON.stringify(ownLandings.map(l => l.url).filter(u => u.trim())),
                competitorLinks: competitors.filter(c => c.url.trim()).map(c => c.url),
                competitors: competitors.filter(c => c.name.trim() || c.url.trim()),
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
        setAdLibraryUrls(['']); setCompetitors([{ name: '', url: '', country: 'ES', price: '', analyzing: false, done: false }]);
        setAmazonLinks([{ url: '' }]); setOwnLandings([{ url: '' }]);
        setStep(1);
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
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-8">
                    {/* Stepper Header */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`flex-1 h-1.5 rounded-full ${step === 1 ? 'bg-[var(--inv)]' : 'bg-[var(--border)] transition-colors'}`}></div>
                        <div className={`flex-1 h-1.5 rounded-full ${step === 2 ? 'bg-[var(--inv)]' : 'bg-[var(--border)] transition-colors'}`}></div>
                        <div className="text-[10px] font-black tracking-widest uppercase text-[var(--text-dim)] shrink-0">
                            Paso {step} de 2
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* COL 1: IDENTIDAD */}
                            <div className="space-y-8">
                                <Section icon={<Target className="w-4 h-4" />} title="Identidad">
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
                                        <Input required value={title} onChange={e => {
                                            setTitle(e.target.value);
                                            if (!sku) setSku(('PROD_' + e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_01').substring(0, 20));
                                        }} placeholder="Ej: NeckRelief Pro" className="h-9 text-[11px] font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">SKU (Gen. Automática)</label>
                                        <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="PROD_NOMBRE_01" className="h-9 text-[11px]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1"><Globe className="w-3 h-3" /> País *</label>
                                            <Select value={country} onValueChange={setCountry}>
                                                <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Categoría / Nicho *</label>
                                            <Select value={niche} onValueChange={setNiche}>
                                                <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Section>
                            </div>

                            {/* COL 2: FINANCIERO */}
                            <div className="space-y-8">
                                <Section icon={<Euro className="w-4 h-4" />} title="Financiero & Unit Economics" accent="var(--mkt)">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text)]">Precio de Venta (€) *</label>
                                            </div>
                                            <Input required type="number" step="0.01" value={pvp} onChange={e => setPvp(e.target.value)}
                                                className="h-10 text-[13px] font-black bg-[var(--inv)]/5 border-[var(--inv)]/30 focus-visible:ring-[var(--inv)]/40 text-[var(--inv)]" placeholder="0.00" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Coste Producto (€)</label>
                                            <Input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="h-10 text-[11px]" placeholder="0.00" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Coste Envío (€)</label>
                                            <Input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} className="h-9 text-[11px]" placeholder="0.00" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">C. Manipulación (€)</label>
                                            <Input type="number" step="0.01" value={handlingCost} onChange={e => setHandlingCost(e.target.value)} className="h-9 text-[11px]" placeholder="0.00" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tasa Dev./Cancel. (%)</label>
                                            <Input type="number" step="1" value={returnRate} onChange={e => setReturnRate(e.target.value)} className="h-9 text-[11px]" placeholder="5" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fulfillment</label>
                                            <Select value={fulfillment} onValueChange={setFulfillment}>
                                                <SelectTrigger className="h-9 text-[11px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>{FULFILLMENT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Entrega Esperada (%)</label>
                                            <Input type="number" step="1" value={deliveryRate} onChange={e => setDeliveryRate(e.target.value)} className="h-9 text-[11px]" placeholder="70" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Conversión CVR (%) default {NICHE_CVR[niche] ?? 2.0}%</label>
                                            <Input type="number" step="0.1" value={cvr} onChange={e => setCvr(e.target.value)} placeholder={`(Aprox ${NICHE_CVR[niche] ?? 2.0}%)`} className="h-9 text-[11px]" />
                                        </div>
                                    </div>

                                    {be && pvpNum > 0 ? (
                                        <div className="mt-6 flex flex-col gap-2 p-3 border border-[var(--border)] rounded-xl bg-[var(--surface2)]">
                                            <div className="grid grid-cols-3 gap-2">
                                                <Tile label="ROAS BE" value={`${be.roasBE.toFixed(2)}x`} color="var(--inv)" />
                                                <Tile label="CPA Máx" value={`€${be.cpaMax.toFixed(2)}`} color="var(--s-ko)" />
                                                <Tile label="CPC BE" value={`€${be.cpcBE.toFixed(2)}`} color="var(--ops)" />
                                            </div>
                                            <div className="flex items-center gap-2 justify-between px-2 pt-2 border-t border-[var(--border)]">
                                                <div className="text-[10px] text-[var(--text-dim)] uppercase font-black">
                                                    Margen Bruto: <span className="text-[var(--text)]">€{be.margenBrutoNum.toFixed(2)}</span>
                                                </div>
                                                <div className="text-[10px] text-[var(--text-dim)] uppercase font-black">
                                                    Neto (CPA Máx): <span className="text-[var(--text)]">€{be.beneficioNeto.toFixed(2)}</span>
                                                </div>
                                                <div className="text-[10px] text-[var(--text-dim)] uppercase font-black">
                                                    Coste Real: <span className="text-[var(--text)]">€{be.costeReal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-4 text-center rounded-xl border border-dashed border-[var(--border-high)] text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                                            <Euro className="w-4 h-4 mx-auto mb-2 opacity-30" />
                                            Introduce PVP para Live Metrics
                                        </div>
                                    )}
                                </Section>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* COL 1: COMPETENCIA */}
                            <div className="space-y-8">
                                <Section icon={<Microscope className="w-4 h-4" />} title="Competidores" accent="var(--crm)">
                                    <p className="text-[9px] text-[var(--text-dim)] leading-relaxed">
                                        Se crearán directorios SPY y pipelines de scraping automático de copy y diseño para cada competidor.
                                    </p>
                                    <div className="space-y-3">
                                        {competitors.map((c, i) => (
                                            <div key={i} className="space-y-2 p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl relative group">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input className="h-8 text-[11px]" placeholder="Nombre competidor" value={c.name} onChange={e => {
                                                        const next = [...competitors]; next[i].name = e.target.value; setCompetitors(next);
                                                    }} />
                                                    <Input className="h-8 text-[11px]" placeholder="URL Tienda Web" value={c.url} onChange={e => {
                                                        const next = [...competitors]; next[i].url = e.target.value; setCompetitors(next);
                                                    }} />
                                                    <Input className="h-8 text-[11px]" placeholder="URL Amazon (opc)" value={c.urlAmazon || ''} onChange={e => {
                                                        const next = [...competitors]; next[i].urlAmazon = e.target.value; setCompetitors(next);
                                                    }} />
                                                    <Input className="h-8 text-[11px]" placeholder="URL Meta Ad Library (opc)" value={c.urlMetaLibrary || ''} onChange={e => {
                                                        const next = [...competitors]; next[i].urlMetaLibrary = e.target.value; setCompetitors(next);
                                                    }} />
                                                    <Input className="h-8 text-[11px]" placeholder="URL TikTok Ad Library (opc)" value={c.urlTikTokLibrary || ''} onChange={e => {
                                                        const next = [...competitors]; next[i].urlTikTokLibrary = e.target.value; setCompetitors(next);
                                                    }} />
                                                    <div className="flex gap-2">
                                                        <Input className="h-8 text-[11px] w-20" placeholder="PVP" value={c.price || ''} onChange={e => {
                                                            const next = [...competitors]; next[i].price = e.target.value; setCompetitors(next);
                                                        }} />
                                                    </div>
                                                </div>
                                                {competitors.length > 1 && (
                                                    <button type="button" onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--text-dim)] hover:bg-[var(--s-ko)]/10 hover:text-[var(--s-ko)] hover:border-[var(--s-ko)] transition-all z-10 opacity-0 group-hover:opacity-100">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setCompetitors([...competitors, { name: '', url: '', urlAmazon: '', urlMetaLibrary: '', urlTikTokLibrary: '', country: 'ES', price: '', analyzing: false, done: false }])}
                                        className="text-[9px] font-black uppercase tracking-widest text-[var(--crm)] hover:brightness-110 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Añadir competidor
                                    </button>
                                </Section>
                            </div>

                            {/* COL 2: FUENTES */}
                            <div className="space-y-8">
                                <Section icon={<FileText className="w-4 h-4" />} title="Fuentes Adicionales" accent="var(--mando)">
                                    <div className="space-y-1.5 p-4 border border-[var(--mando)]/20 bg-[var(--mando)]/5 rounded-xl">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--mando)]">Google Doc (Investigación Privada)</label>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-2">
                                            Pega la URL de tu Google Doc. Nuestro pipeline extraerá el contenido automáticamente y enriquecerá tu Avatar / Angle Builder con tus notas sin indexarlas a la IA global.
                                        </p>
                                        <div className="relative">
                                            <Input value={googleDocUrl} onChange={e => setGoogleDocUrl(e.target.value)} onBlur={() => googleDocUrl && triggerImport(googleDocUrl)}
                                                placeholder="https://docs.google.com/document/d/..." className="h-10 text-[11px] border-[var(--mando)]/30 focus-visible:ring-[var(--mando)]/20 pr-32" />
                                            {importing && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--inv)] font-bold flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Extrayendo...
                                                </span>
                                            )}
                                            {imported && !importing && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--s-ok)] font-bold flex items-center gap-1">
                                                    ✓ {importedCount} campos
                                                </span>
                                            )}
                                        </div>
                                        {imported && docExtracted && (
                                            <div className="text-[10px] text-[var(--text-dim)] mt-2 p-2 bg-[var(--s-ok)]/5 border border-[var(--s-ok)]/20 rounded-lg leading-relaxed">
                                                <span className="text-[var(--s-ok)] font-bold">Resumen extraído:</span> Identidad · Financiero · {docExtracted.avatares?.length || 0} avatares · {docExtracted.angulos?.length || 0} ángulos · {docExtracted.languageBank ? "Language bank" : ""} · {docExtracted.mecanismos?.length || 0} mecanismos.
                                                {missingFields.length > 0 && (
                                                    <div className="text-[var(--s-ko)] mt-1">
                                                        ⚠️ Faltan: {missingFields.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 mt-6">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Landings Existentes
                                        </label>
                                        <div className="p-4 border border-dashed border-[var(--border-high)] rounded-xl bg-[var(--surface2)] items-center justify-center text-center flex">
                                            <p className="text-[10px] text-[var(--text-dim)] font-medium">Podrás asignar landings después</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-6 hidden">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                            <Brain className="w-3 h-3" /> IA Description Override
                                        </label>
                                        <Textarea value={description} onChange={e => setDescription(e.target.value)} className="h-20 text-[11px]"></Textarea>
                                    </div>
                                </Section>
                            </div>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="col-span-full pt-4 border-t border-[var(--border)] flex items-center justify-between gap-4 sticky bottom-0 bg-[var(--bg)] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2 text-[9px] text-[var(--text-dim)]">
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--inv)]" />
                            {step === 1 ? 'Completa la Identidad y Setup Financiero' : 'Al crear se descargará el SPY de competidores y el Research Pipeline.'}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {step === 1 ? (
                                <>
                                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}
                                        className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                        Cancelar
                                    </Button>
                                    <Button type="button" onClick={() => {
                                        if (!title.trim() || !pvpNum) return toast.error('Rellena nombre y PVP primero');
                                        setStep(2);
                                    }}
                                        className="h-10 px-8 bg-[var(--surface2)] hover:bg-[var(--border)] text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                                        Siguiente Paso <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)}
                                        className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                        Volver Atrás
                                    </Button>
                                    <Button type="submit" disabled={loading}
                                        className="h-10 px-8 bg-[var(--inv)] hover:brightness-110 text-white rounded-xl shadow-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                                        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando...</> : <><Microscope className="w-3.5 h-3.5" /> Crear & Lanzar Operación</>}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
