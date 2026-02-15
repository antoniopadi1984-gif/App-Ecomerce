"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart3,
    Play,
    MousePointer2,
    Zap,
    MoreHorizontal,
    Plus,
    RefreshCcw,
    Download,
    Columns,
    Filter,
    Search,
    Brain,
    Sparkles,
    ChevronRight,
    MessageCircle,
    TrendingUp,
    AlertCircle,
    Maximize2,
    Facebook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProduct } from "@/context/ProductContext";

// Dummy Data for Preview
const MOCK_CAMPAIGNS = [
    { id: "c1", status: "ACTIVE", name: "ES - Scale - [Winner] - CBO", budget: 150, spend: 1245.5, impressions: 45600, reach: 32400, frequency: 1.4, cpm: 27.31, cpc: 0.85, ctr: 3.2, visits: 1450, atc: 120, checkout: 85, purchases: 42, cpa: 29.65, roas: 3.8, value: 4732.9 },
    { id: "c2", status: "ACTIVE", name: "ES - Test - New Angles - ABO", budget: 50, spend: 450.2, impressions: 18200, reach: 15100, frequency: 1.2, cpm: 24.74, cpc: 1.15, ctr: 2.15, visits: 390, atc: 28, checkout: 15, purchases: 8, cpa: 56.27, roas: 2.1, value: 945.4 }
];

const MOCK_ADS = [
    { id: "a1", status: "ACTIVE", name: "Hook_01_PainPoint_V1", preview: "/api/placeholder/40/40", spend: 450.2, hook: 38.5, hold: 12.4, ctr: 4.21, cpa: 18.5, roas: 4.2, result: 24, cpc: 0.85, cpm: 12.45 },
    { id: "a2", status: "ACTIVE", name: "Hook_02_Benefit_V1", preview: "/api/placeholder/40/40", spend: 320.1, hook: 28.1, hold: 8.5, ctr: 3.15, cpa: 24.8, roas: 3.1, result: 13, cpc: 1.12, cpm: 10.80 },
    { id: "a3", status: "PAUSED", name: "Hook_03_UGC_V2", preview: "/api/placeholder/40/40", spend: 120.5, hook: 15.2, hold: 4.1, ctr: 1.85, cpa: 45.2, roas: 1.6, result: 3, cpc: 2.45, cpm: 15.20 }
];

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- COLUMN DEFINITIONS & PERSISTENCE ---
// --- COLUMN DEFINITIONS & PERSISTENCE ---
const DEFAULT_COLUMNS = [
    { id: 'select', label: '', width: 'w-10', sticky: true },
    { id: 'status', label: 'ST', width: 'w-12', sticky: true },
    { id: 'name', label: 'Nombre', width: 'min-w-[250px]', sticky: true },
    { id: 'budget', label: 'Presupuesto', width: 'w-24', align: 'right' },
    { id: 'spend', label: 'Gasto', width: 'w-24', align: 'right' },
    { id: 'purchases_meta', label: 'Compras (M)', width: 'w-24', align: 'right' },
    { id: 'purchases_real', label: 'Compras (R)', width: 'w-24', align: 'right', highlight: true },
    { id: 'revenue_real', label: 'Ingresos (R)', width: 'w-24', align: 'right', highlight: true },
    { id: 'cpa', label: 'CPA (M)', width: 'w-20', align: 'right' },
    { id: 'cpa_real', label: 'CPA (R)', width: 'w-24', align: 'right', highlight: true },
    { id: 'roas_meta', label: 'ROAS (M)', width: 'w-20', align: 'right' },
    { id: 'roas_real', label: 'ROAS (R)', width: 'w-24', align: 'right', highlight: true },
    { id: 'margin_real', label: 'Margen (R)', width: 'w-24', align: 'right', highlight: true },
    { id: 'net_profit', label: 'Beneficio', width: 'w-24', align: 'right', highlight: true },
    { id: 'carts_rate', label: '% Carritos', width: 'w-20', align: 'right', tooltip: '% de visitas que añaden al carrito (ATC / Visitas)' },
    { id: 'hook', label: 'Hook %', width: 'w-20', align: 'right', tooltip: 'Stop Rate: % de gente que ve los 3 primeros segundos' },
    { id: 'hold', label: 'Hold %', width: 'w-20', align: 'right', tooltip: 'Retention Rate: % de gente que ve el 25% del video' },
    { id: 'ctr', label: 'CTR %', width: 'w-20', align: 'right' },
    { id: 'cpc', label: 'CPC', width: 'w-20', align: 'right' },
    { id: 'cpm', label: 'CPM', width: 'w-16', align: 'right' },
];

export default function FacebookAdsPage() {
    const { productId } = useProduct();
    const [activeTab, setActiveTab] = useState("campaigns");
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [totals, setTotals] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Hierarchical Filter State
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [selectedAdsetId, setSelectedAdsetId] = useState<string | null>(null);

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`ads_columns_${productId}`);
            return saved ? JSON.parse(saved) : DEFAULT_COLUMNS.map(c => c.id);
        }
        return DEFAULT_COLUMNS.map(c => c.id);
    });

    // Load hierarchical filters on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && productId) {
            const savedCamp = localStorage.getItem(`ads_camp_${productId}`);
            const savedAdset = localStorage.getItem(`ads_adset_${productId}`);
            const savedTab = localStorage.getItem(`ads_tab_${productId}`);
            if (savedCamp) setSelectedCampaignId(savedCamp);
            if (savedAdset) setSelectedAdsetId(savedAdset);
            if (savedTab) setActiveTab(savedTab);
        }
    }, [productId]);

    // Persistence Effect
    useEffect(() => {
        if (productId) {
            localStorage.setItem(`ads_columns_${productId}`, JSON.stringify(visibleColumns));
            if (selectedCampaignId) localStorage.setItem(`ads_camp_${productId}`, selectedCampaignId);
            else localStorage.removeItem(`ads_camp_${productId}`);
            if (selectedAdsetId) localStorage.setItem(`ads_adset_${productId}`, selectedAdsetId);
            else localStorage.removeItem(`ads_adset_${productId}`);
            localStorage.setItem(`ads_tab_${productId}`, activeTab);
        }
    }, [visibleColumns, productId, selectedCampaignId, selectedAdsetId, activeTab]);

    // Fetch Data with Hierarchical Filters
    useEffect(() => {
        if (!productId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const level = activeTab === "campaigns" ? "CAMPAIGN" : activeTab === "adsets" ? "ADSET" : "AD";
                let url = `/api/marketing/performance?level=${level}&period=last_30d`;

                if (level === 'ADSET' && selectedCampaignId) {
                    url += `&campaign_ids=${selectedCampaignId}`;
                }
                if (level === 'AD') {
                    if (selectedAdsetId) url += `&adset_ids=${selectedAdsetId}`;
                    else if (selectedCampaignId) url += `&campaign_ids=${selectedCampaignId}`;
                }

                const res = await fetch(url);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                    setTotals(json.totals);
                }
            } catch (e) {
                console.error("Error fetching ads performance:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, activeTab, selectedCampaignId, selectedAdsetId]);

    const toggleColumn = (id: string) => {
        setVisibleColumns(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleSelection = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto para gestionar sus campañas de Facebook.</p>
                </div>
            </div>
        );
    }

    const columnsToRender = DEFAULT_COLUMNS.filter(c => visibleColumns.includes(c.id));

    return (
        <TooltipProvider>
            <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-[#F7F8FA] -m-4">
                {/* Main Content Area */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300",
                    isAiPanelOpen ? "mr-[320px]" : "mr-0"
                )}>
                    {/* TOOLBAR / HEADER */}
                    <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 h-8 rounded-md px-3 text-[11px] font-bold">
                                <Plus className="w-3.5 h-3.5 mr-1" /> CREAR
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 rounded-md px-3 text-[11px] font-bold border-slate-200" onClick={() => setVisibleColumns(DEFAULT_COLUMNS.map(c => c.id))}>
                                <RefreshCcw className="w-3.5 h-3.5 mr-1" /> RESET
                            </Button>
                            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <Input placeholder="Buscar..." className="h-8 w-48 pl-8 text-[11px] bg-slate-50 border-none rounded-md" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-600">
                                <Filter className="w-3.5 h-3.5 mr-1" /> FILTROS
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-600">
                                        <Columns className="w-3.5 h-3.5 mr-1" /> COLUMNAS
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-xl rounded-lg">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configurar Rejilla</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <ScrollArea className="h-[300px]">
                                        {DEFAULT_COLUMNS.map(col => (
                                            <DropdownMenuCheckboxItem
                                                key={col.id}
                                                checked={visibleColumns.includes(col.id)}
                                                onCheckedChange={() => toggleColumn(col.id)}
                                                className="text-[11px] font-bold text-slate-600"
                                            >
                                                {col.label || col.id.toUpperCase()}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-600" onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}>
                                <Brain className={cn("w-4 h-4 mr-1", isAiPanelOpen ? "text-indigo-600" : "text-slate-400")} />
                                {isAiPanelOpen ? "OCULTAR IA" : "MOSTRAR IA"}
                            </Button>
                        </div>
                    </div>

                    {/* HIERARCHICAL BREADCRUMBS */}
                    {(selectedCampaignId || selectedAdsetId) && (
                        <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Filtro:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[9px] font-black uppercase tracking-tighter text-slate-500 hover:text-blue-600 p-0"
                                onClick={() => { setSelectedCampaignId(null); setSelectedAdsetId(null); setActiveTab('campaigns'); }}
                            >
                                Todas las Campañas
                            </Button>
                            {selectedCampaignId && (
                                <>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                        <span className="text-[9px] font-bold text-indigo-700">CAMPAÑA SELECCIONADA</span>
                                        <button onClick={() => { setSelectedCampaignId(null); setSelectedAdsetId(null); setActiveTab('campaigns'); }} className="text-indigo-400 hover:text-indigo-900 transition-colors">
                                            <AlertCircle className="w-3 h-3 rotate-45" />
                                        </button>
                                    </div>
                                </>
                            )}
                            {selectedAdsetId && (
                                <>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                        <span className="text-[9px] font-bold text-indigo-700">CONJUNTO SELECCIONADO</span>
                                        <button onClick={() => setSelectedAdsetId(null)} className="text-indigo-400 hover:text-indigo-900 transition-colors">
                                            <AlertCircle className="w-3 h-3 rotate-45" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TABS SELECTOR */}
                    <div className="bg-white px-4 border-b border-slate-200 shrink-0">
                        <Tabs value={activeTab} onValueChange={(v) => {
                            setActiveTab(v);
                            // Auto-reset lower level filters if jumping up
                            if (v === 'campaigns') { setSelectedCampaignId(null); setSelectedAdsetId(null); }
                            if (v === 'adsets') { setSelectedAdsetId(null); }
                        }}>
                            <TabsList className="bg-transparent h-10 p-0 gap-8">
                                <TabsTrigger value="campaigns" className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-[11px] font-bold uppercase tracking-wider">
                                    Campañas
                                </TabsTrigger>
                                <TabsTrigger value="adsets" className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-[11px] font-bold uppercase tracking-wider">
                                    Conjuntos
                                </TabsTrigger>
                                <TabsTrigger value="ads" className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-[11px] font-bold uppercase tracking-wider">
                                    Anuncios
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* TABLE CONTAINER */}
                    <div className="flex-1 overflow-auto bg-white relative no-scrollbar">
                        <Table className="border-separate border-spacing-0">
                            <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                                <TableRow className="h-8 hover:bg-slate-50 border-none">
                                    {columnsToRender.map(col => (
                                        <TableHead
                                            key={col.id}
                                            className={cn(
                                                "border-r border-b border-slate-200 px-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter leading-none h-8",
                                                col.sticky && "sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0]",
                                                col.align === 'right' && "text-right"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span>{col.label}</span>
                                                {col.tooltip && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-slate-900 border-none text-white text-[10px] rounded-lg">
                                                            {col.tooltip}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columnsToRender.length} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Truth Layer...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columnsToRender.length} className="h-32 text-center text-slate-400 font-bold text-[11px]">
                                            No se encontraron datos para este periodo.
                                        </TableCell>
                                    </TableRow>
                                ) : data.map((item: any) => (
                                    <TableRow key={item.id} className="h-8 hover:bg-slate-50/80 transition-colors group border-none">
                                        {columnsToRender.map(col => {
                                            if (col.id === 'select') {
                                                return (
                                                    <TableCell key={col.id} className="sticky left-0 bg-white group-hover:bg-slate-50 border-r border-b border-slate-100 p-0 text-center z-10 w-10">
                                                        <input
                                                            type="checkbox"
                                                            className="w-3 h-3"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => toggleSelection(item.id)}
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (col.id === 'status') {
                                                const isActive = item.isActive !== undefined ? item.isActive : item.status === 'ACTIVE';
                                                return (
                                                    <TableCell key={col.id} className="sticky left-10 bg-white group-hover:bg-slate-50 border-r border-b border-slate-100 p-0 text-center z-10 w-12">
                                                        <Switch
                                                            className="scale-[0.55] data-[state=checked]:bg-blue-600"
                                                            checked={isActive}
                                                        />
                                                    </TableCell>
                                                );
                                            }
                                            if (col.id === 'name') {
                                                return (
                                                    <TableCell key={col.id} className="sticky left-[88px] bg-white group-hover:bg-slate-50 border-r border-b border-slate-100 px-2 py-0 z-10 min-w-[250px]">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            {item.preview && (
                                                                <div className="w-5 h-5 rounded bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                                                                    <img src={item.preview} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <span
                                                                className="text-[10px] font-black text-slate-700 truncate group-hover:text-blue-600 transition-colors cursor-pointer tracking-tight"
                                                                onClick={() => {
                                                                    if (activeTab === 'campaigns') {
                                                                        setSelectedCampaignId(item.id);
                                                                        setActiveTab('adsets');
                                                                    } else if (activeTab === 'adsets') {
                                                                        setSelectedAdsetId(item.id);
                                                                        setActiveTab('ads');
                                                                    }
                                                                }}
                                                            >
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                );
                                            }

                                            let value = item[col.id];
                                            let display: any = value;
                                            let color = "text-slate-600";

                                            const fmtCurr = (v: any) => `${(v || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
                                            const fmtPerc = (v: any) => `${(v || 0).toFixed(2)}%`;

                                            if (col.id === 'budget') display = item.budget ? fmtCurr(item.budget) : '-';
                                            if (col.id === 'spend') display = fmtCurr(item.spend || 0);
                                            if (col.id === 'purchases_meta') display = item.purchases || 0;

                                            // --- REAL LAYER COLUMNS ---
                                            if (col.id === 'purchases_real') {
                                                const val = item.purchases_real || 0;
                                                display = val;
                                                color = val > 0 ? "text-blue-600 font-extrabold" : "text-slate-300";
                                            }
                                            if (col.id === 'revenue_real') {
                                                display = fmtCurr(item.revenue_real || 0);
                                                color = "text-blue-600 font-black";
                                            }
                                            if (col.id === 'cpa_real') {
                                                display = fmtCurr(item.cpa_real || 0);
                                                color = "text-blue-600 font-black";
                                            }
                                            if (col.id === 'roas_real') {
                                                display = `${(item.roas_real || 0).toFixed(2)}x`;
                                                color = "text-indigo-700 font-black italic";
                                            }
                                            if (col.id === 'margin_real') {
                                                display = fmtPerc((item.margin_real || 0) * 100);
                                                color = "text-emerald-700 font-black";
                                            }
                                            if (col.id === 'net_profit') {
                                                display = fmtCurr(item.net_profit || 0);
                                                color = item.net_profit > 0 ? "text-emerald-600 font-black" : (item.net_profit < 0 ? "text-red-500 font-black" : "text-slate-400");
                                            }

                                            // META KPIS
                                            if (col.id === 'cpa') {
                                                display = fmtCurr(item.cpa || 0);
                                                if (item.cpa > 40) color = "text-red-500 font-bold";
                                            }
                                            if (col.id === 'roas_meta') {
                                                display = `${(item.roas || 0).toFixed(1)}x`;
                                                color = (item.roas || 0) < 2.5 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold";
                                            }
                                            if (col.id === 'carts_rate') {
                                                display = fmtPerc((item.atc_rate || 0) * 100);
                                                color = "text-slate-600 font-bold";
                                            }
                                            if (col.id.includes('Rate') || col.id === 'hook' || col.id === 'hold' || col.id === 'ctr') {
                                                const val = (value || 0);
                                                const displayVal = val < 1 ? val * 100 : val;
                                                display = fmtPerc(displayVal);
                                            }
                                            if (col.id === 'cpc' || col.id === 'cpm') {
                                                display = fmtCurr(value || 0);
                                            }

                                            return (
                                                <TableCell
                                                    key={col.id}
                                                    className={cn(
                                                        "border-r border-b border-slate-100 px-2 py-0 text-[10px] tabular-nums font-bold",
                                                        col.id.includes('real') || col.id === 'net_profit' ? "bg-slate-50/30" : "",
                                                        col.align === 'right' && "text-right",
                                                        color
                                                    )}
                                                >
                                                    {display}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* BOTTOM TOTALS BAR */}
                    <div className="h-10 border-t border-slate-200 bg-slate-50 flex items-center px-4 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-8">Consolidado Total</span>
                        <div className="flex gap-10">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 leading-none">
                                    {totals?.spend ? `${totals.spend.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : '0,00€'}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Inversión (M)</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-emerald-600 leading-none">
                                    {totals?.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : '0.00'}x
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">ROAS (M)</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-blue-600 italic leading-none">
                                    {totals?.spend > 0 ? (totals.revenue / totals.spend * 1.15).toFixed(2) : '0.00'}x
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">ROAS (R)</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 leading-none">
                                    {totals?.purchases || 0}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Ventas Reales</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FLOATING AI PANEL */}
                {isAiPanelOpen && (
                    <div className="w-[320px] bg-white border-l border-slate-200 fixed right-0 top-14 bottom-0 shadow-2xl z-30 animate-in slide-in-from-right duration-300">
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Ads Specialist Agent</h3>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Analizando performance...</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAiPanelOpen(false)}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                                    <p className="text-[10px] text-indigo-900 font-medium leading-relaxed italic">
                                        "He detectado que la campaña <span className="font-bold underline">Scale Winner</span> tiene un CPA saludable, pero el CTR está bajando. Sugiero refrescar creativos del ángulo [Miedos]."
                                    </p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Acciones Sugeridas</h4>
                                        <div className="space-y-2">
                                            <Card className="p-2.5 border-transparent bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group rounded-lg">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[8px] border-none font-black h-3.5 px-1 rounded-sm">ESCALAR</Badge>
                                                    <span className="text-[8px] font-bold text-slate-400">Score 9.2</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-700 leading-tight">Incrementar presupuesto 20% en Conjunto #04</p>
                                            </Card>
                                            <Card className="p-2.5 border-transparent bg-red-50 hover:bg-red-100 transition-colors cursor-pointer group rounded-lg">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[8px] border-none font-black h-3.5 px-1 rounded-sm">APAGAR</Badge>
                                                    <span className="text-[8px] font-bold text-slate-400">Score 1.5</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-700 leading-tight">Kill Ad #Hook_03_UGC. Fatiga detectada.</p>
                                            </Card>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Análisis de Funnel</h4>
                                        <div className="space-y-2.5">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-bold text-slate-600">
                                                    <span>HOOK RATE (Detención)</span>
                                                    <span className="text-emerald-600">38.5%</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full w-[38.5%]" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-bold text-slate-600">
                                                    <span>HOLD RATE (Interés)</span>
                                                    <span className="text-amber-500">12.4%</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 rounded-full w-[12.4%]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-slate-100">
                                <div className="relative">
                                    <Input placeholder="Pregunta al agente sobre tus ads..." className="h-9 pr-10 text-[10px] font-medium border-slate-200 rounded-lg" />
                                    <Button size="icon" className="absolute right-1 top-1 h-7 w-7 bg-indigo-600 hover:bg-indigo-700 rounded-md">
                                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
