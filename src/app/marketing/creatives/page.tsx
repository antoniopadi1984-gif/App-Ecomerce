"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Video,
    Image as ImageIcon,
    FileText,
    MoreHorizontal,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    DollarSign,
    Target,
    RefreshCw,
    Copy, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    getCreativeAssets, createCreativeAsset, getAvailableProducts,
    syncCreativeMetricsFromOrders, syncMetaAdsMetrics,
    generateSmartNomenclature
} from "./actions";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CreativeControlPage() {
    const [creatives, setCreatives] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // New Creative Form State
    const [newCreative, setNewCreative] = useState({
        name: "",
        type: "VIDEO",
        productId: "",
        nomenclatura: "",
        editor: "",
        angulo: "",
        driveUrl: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [creativesRes, productsRes] = await Promise.all([
            getCreativeAssets(),
            getAvailableProducts()
        ]);

        if (creativesRes.success) setCreatives(creativesRes.data || []);
        if (productsRes.success) setProducts(productsRes.data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newCreative.name || !newCreative.productId) return;

        await createCreativeAsset(newCreative);
        setIsCreateOpen(false);
        setNewCreative({
            name: "",
            type: "VIDEO",
            productId: "",
            nomenclatura: "",
            editor: "",
            angulo: "",
            driveUrl: ""
        });
        loadData(); // Reload list
    };

    const getVerdictBadge = (verdict: string | null) => {
        switch (verdict) {
            case "ESCALAR":
                return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none gap-1"><TrendingUp className="h-3 w-3" /> ESCALAR</Badge>;
            case "APAGAR":
                return <Badge className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-none gap-1"><XCircle className="h-3 w-3" /> APAGAR</Badge>;
            case "MANTENER":
                return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-none gap-1"><AlertCircle className="h-3 w-3" /> MANTENER</Badge>;
            default:
                return <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1">TESTING</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "VIDEO": return <Video className="h-4 w-4 text-purple-400" />;
            case "IMAGE": return <ImageIcon className="h-4 w-4 text-blue-400" />;
            case "SCRIPT": return <FileText className="h-4 w-4 text-orange-400" />;
            default: return <Video className="h-4 w-4" />;
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando datos del búnker creativo...</div>;

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* COMPACT STICKY HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                            CREATIVE <span className="text-primary not-italic">COMMAND</span>
                        </h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Control de Assets • Hook & ROAS Analysis
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={async () => {
                        const res = await syncCreativeMetricsFromOrders();
                        if (res.success) toast.success(res.message);
                        else toast.error("Error al sincronizar pedidos");
                        loadData();
                    }} className="h-9 px-4 border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hidden md:flex">
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync Pedidos
                    </Button>

                    <Button variant="outline" size="sm" onClick={async () => {
                        const res = await syncMetaAdsMetrics();
                        if (res.success) toast.success(res.message);
                        else toast.error("Error Meta: " + res.message);
                        loadData();
                    }} className="h-9 px-4 border-indigo-200 bg-indigo-50/50 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        <Target className="mr-2 h-3.5 w-3.5" /> Sync Ads
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 px-6 bg-slate-900 text-primary hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-slate-100 rounded-2xl shadow-2xl sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black tracking-tighter italic uppercase italic">Registrar <span className="text-primary not-italic">Asset</span></DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Seguimiento de UTMs y Métricas de Alto Impacto.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Concepto</Label>
                                        <Input
                                            placeholder="Ej: UGC Gancho 3 seg"
                                            className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                            value={newCreative.name}
                                            onChange={(e) => setNewCreative({ ...newCreative, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nomenclatura</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-1.5 text-[8px] text-primary hover:bg-primary/5 gap-1 font-black uppercase"
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    if (!newCreative.productId) return toast.error("Selecciona un producto primero");
                                                    const nom = await generateSmartNomenclature(newCreative.productId, newCreative.angulo);
                                                    setNewCreative({ ...newCreative, nomenclatura: nom });
                                                }}
                                            >
                                                <Sparkles className="h-2.5 w-2.5" /> AUTO-GEN
                                            </Button>
                                        </div>
                                        <Input
                                            placeholder="UGC_001_HOOK_A"
                                            className="h-10 bg-slate-50 border-none rounded-xl text-[10px] font-mono font-bold focus:ring-4 focus:ring-primary/5"
                                            value={(newCreative as any).nomenclatura}
                                            onChange={(e) => setNewCreative({ ...newCreative, nomenclatura: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Producto</Label>
                                        <Select
                                            onValueChange={(val) => setNewCreative({ ...newCreative, productId: val })}
                                            value={newCreative.productId}
                                        >
                                            <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-0">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-100 rounded-xl">
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo Asset</Label>
                                        <Select
                                            onValueChange={(val) => setNewCreative({ ...newCreative, type: val })}
                                            value={newCreative.type}
                                        >
                                            <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-100 rounded-xl">
                                                <SelectItem value="VIDEO" className="text-xs font-bold uppercase">Video (Vertical)</SelectItem>
                                                <SelectItem value="IMAGE" className="text-xs font-bold uppercase">Imagen Estática</SelectItem>
                                                <SelectItem value="SCRIPT" className="text-xs font-bold uppercase">Copy / Script</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Editor / Creator</Label>
                                        <Input
                                            placeholder="Ej: Marketing Team"
                                            className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                            value={newCreative.editor}
                                            onChange={(e) => setNewCreative({ ...newCreative, editor: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ángulo Master</Label>
                                        <Input
                                            placeholder="Ej: Social Proof"
                                            className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5"
                                            value={newCreative.angulo}
                                            onChange={(e) => setNewCreative({ ...newCreative, angulo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} className="w-full h-12 bg-slate-900 text-primary hover:bg-slate-800 font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-xl">
                                    Desplegar en Base de Datos
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="px-6 pb-20 space-y-6">
                {/* 1. METRICS OVERVIEW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Inversión Total', value: `€${creatives.reduce((acc, c) => acc + c.spend, 0).toLocaleString()}`, icon: DollarSign, color: 'indigo' },
                        { label: 'Retorno (Revenue)', value: `€${creatives.reduce((acc, c) => acc + c.revenue, 0).toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
                        {
                            label: 'ROAS Global', value: (() => {
                                const spend = creatives.reduce((acc, c) => acc + (c.spend || 0), 0);
                                const rev = creatives.reduce((acc, c) => acc + (c.revenue || 0), 0);
                                return spend > 0 ? (rev / spend).toFixed(2) + "x" : "0.00x";
                            })(), icon: Zap, color: 'primary'
                        },
                        { label: 'Assets Activos', value: creatives.length, icon: Video, color: 'rose' },
                    ].map((s, i) => (
                        <Card key={i} className="premium-card overflow-hidden group">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                                    <p className="text-xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{s.value}</p>
                                </div>
                                <div className={cn("p-2.5 rounded-xl", `bg-${s.color}/10`, `text-${s.color}`)}>
                                    <s.icon className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 2. CREATIVES LIST TABLE */}
                <Card className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50/50">
                                    <TableHead className="px-6 h-12 text-[9px] font-black uppercase tracking-widest text-slate-400">Asset / Concepto</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400">UTM ID</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400">Gasto</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Compras</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">CPA</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">ROAS</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Hook/CTR</TableHead>
                                    <TableHead className="h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Veredicto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {creatives.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-20 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                            No se han detectado assets en el búnker...
                                        </TableCell>
                                    </TableRow>
                                ) : creatives.map((creative) => (
                                    <TableRow key={creative.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors group">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                                                    {getTypeIcon(creative.type)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">{creative.name}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{(creative.product as any)?.title || "Global"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 group/nom">
                                                <code className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-500 font-mono font-bold border border-slate-100">
                                                    {creative.nomenclatura || "-"}
                                                </code>
                                                {creative.nomenclatura && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 opacity-0 group-hover/nom:opacity-100 transition-opacity text-primary hover:bg-primary/5"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(creative.nomenclatura);
                                                            toast.success("UTM Copiada al búnker");
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-xs">€{creative.spend.toFixed(1)}</TableCell>
                                        <TableCell className="text-right text-xs font-black">{creative.purchases}</TableCell>
                                        <TableCell className="text-right text-xs font-black text-rose-500">
                                            €{creative.purchases > 0 ? (creative.spend / creative.purchases).toFixed(2) : "--"}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black">€{creative.revenue.toFixed(1)}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={cn(
                                                "font-black text-xs",
                                                (creative.revenue / (creative.spend || 1)) > 2.5 ? "text-emerald-500" :
                                                    (creative.revenue / (creative.spend || 1)) < 1.2 ? "text-rose-500" : "text-amber-500"
                                            )}>
                                                {(creative.spend > 0 ? (creative.revenue / creative.spend).toFixed(2) : "0.00")}x
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-slate-400">H: <span className="text-indigo-500">{creative.hookRate || 0}%</span></span>
                                                <span className="text-[9px] font-black text-slate-400">C: <span className="text-slate-600">{creative.ctr || 0}%</span></span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {getVerdictBadge(creative.verdict)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
