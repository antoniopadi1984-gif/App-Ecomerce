"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ArrowRightLeft,
    TrendingUp,
    BarChart3,
    ShoppingCart,
    RefreshCw,
    ExternalLink,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Calendar as CalendarIcon,
    Settings,
    GripVertical,
    Eye,
    EyeOff,
    Plus,
    Calculator,
    Download,
    Pencil,
    Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { metricsFormatter } from '@/lib/marketing/metrics';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { motion, Reorder } from 'framer-motion';

import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================
// CONFIGURACIÓN DE PERÍODOS
// ============================================
const PERIODS = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'last_3d', label: '3d' },
    { id: 'last_7d', label: '7d' },
    { id: 'last_30d', label: '30d' },
    { id: 'lifetime', label: 'Total' }
];

const LEVELS = [
    { id: 'CAMPAIGN', label: 'Campaña' },
    { id: 'ADSET', label: 'Conjunto' },
    { id: 'AD', label: 'Anuncio' }
];

// ============================================
// DEFINICIÓN DE COLUMNAS COMPLETAS
// ============================================
type ColumnType = 'currency' | 'number' | 'percent' | 'ratio' | 'text' | 'combined';

interface ColumnDef {
    id: string;
    label: string;
    visible: boolean;
    width: number;
    type: ColumnType;
    sortable: boolean;
    formula?: string; // Para métricas calculadas
    description?: string;
}

const ALL_COLUMNS: ColumnDef[] = [
    // === INVERSIÓN ===
    { id: 'spend', label: 'Inversión', visible: true, width: 70, type: 'currency', sortable: true },

    // === COMPRAS ===
    { id: 'real_purchases', label: 'Compras', visible: true, width: 55, type: 'number', sortable: true, description: 'Compras Reales (Shopify)' },
    { id: 'purchases', label: 'Px Compras', visible: true, width: 55, type: 'number', sortable: true, description: 'Compras Meta Pixel' },

    // === CPA ===
    { id: 'real_cpa', label: 'CPA', visible: true, width: 55, type: 'currency', sortable: true, description: 'Coste por Compra Real' },
    { id: 'cpa_pixel', label: 'Px CPA', visible: false, width: 55, type: 'currency', sortable: true, description: 'CPA Pixel' },

    // === VENTAS ===
    { id: 'real_revenue', label: 'Ventas', visible: true, width: 70, type: 'currency', sortable: true, description: 'Ventas Reales (Shopify)' },
    { id: 'revenue', label: 'Px Ventas', visible: true, width: 70, type: 'currency', sortable: true, description: 'Ventas Meta Pixel' },

    // === ROAS ===
    { id: 'real_roas', label: 'ROAS', visible: true, width: 50, type: 'ratio', sortable: true, description: 'ROAS Real' },
    { id: 'roas', label: 'Px ROAS', visible: false, width: 50, type: 'ratio', sortable: true, description: 'ROAS Pixel' },

    // === ENTREGA ===
    { id: 'delivered_orders', label: 'Entreg.', visible: true, width: 50, type: 'number', sortable: true },
    { id: 'delivery_rate', label: '%Entreg', visible: true, width: 50, type: 'percent', sortable: true },

    // === ALCANCE ===
    { id: 'impressions', label: 'Impres.', visible: true, width: 55, type: 'number', sortable: true },
    { id: 'reach', label: 'Alcance', visible: false, width: 55, type: 'number', sortable: true },
    { id: 'frequency', label: 'Frec.', visible: false, width: 40, type: 'ratio', sortable: true },
    { id: 'cpm', label: 'CPM', visible: true, width: 45, type: 'currency', sortable: true },

    // === CLICS ===
    { id: 'clicks', label: 'Clics', visible: true, width: 50, type: 'number', sortable: true },
    { id: 'ctr', label: 'CTR', visible: true, width: 45, type: 'percent', sortable: true },
    { id: 'cpc', label: 'CPC', visible: true, width: 50, type: 'currency', sortable: true },

    // === EMBUDO ===
    { id: 'landing_page_views', label: 'Visitas', visible: true, width: 50, type: 'number', sortable: true },
    { id: 'cost_per_lpv', label: 'C/Visita', visible: false, width: 55, type: 'currency', sortable: true },
    { id: 'add_to_cart', label: 'ATC', visible: false, width: 45, type: 'number', sortable: true },
    { id: 'cost_per_atc', label: 'C/ATC', visible: false, width: 50, type: 'currency', sortable: true },
    { id: 'initiate_checkout', label: 'Checkout', visible: false, width: 55, type: 'number', sortable: true },

    // === VÍDEO ===
    { id: 'video_3s', label: 'V3s', visible: false, width: 45, type: 'number', sortable: true },
    { id: 'hook_rate', label: 'Hook%', visible: true, width: 50, type: 'percent', sortable: true },
    { id: 'hold_rate', label: 'Hold%', visible: true, width: 50, type: 'percent', sortable: true },
    { id: 'video_p50', label: 'V50%', visible: false, width: 45, type: 'number', sortable: true },
    { id: 'video_p100', label: 'V100%', visible: false, width: 45, type: 'number', sortable: true },

    // === CALIDAD ===
    { id: 'quality_ranking', label: 'Calidad', visible: false, width: 60, type: 'text', sortable: true },
    { id: 'engagement_ranking', label: 'Engage', visible: false, width: 60, type: 'text', sortable: true },
    { id: 'conversion_ranking', label: 'Conv.', visible: false, width: 60, type: 'text', sortable: true },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function PerformancePage() {
    // === ESTADO ===
    const [level, setLevel] = useState('CAMPAIGN');
    const [period, setPeriod] = useState('today');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [customDateOpen, setCustomDateOpen] = useState(false);

    // Columnas y ordenamiento
    const [columns, setColumns] = useState<ColumnDef[]>(ALL_COLUMNS);
    const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    // Datos
    const [data, setData] = useState<any[]>([]);
    const [apiTotals, setApiTotals] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [selectedAccount, setSelectedAccount] = useState('ALL');
    const [rowSelection, setRowSelection] = useState<string[]>([]);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Jerarquía
    const [selectedCampaigns, setSelectedCampaigns] = useState<any[]>([]);
    const [selectedAdsets, setSelectedAdsets] = useState<any[]>([]);

    // Métricas personalizadas
    const [customMetrics, setCustomMetrics] = useState<ColumnDef[]>([]);
    const [newMetricName, setNewMetricName] = useState('');
    const [newMetricFormula, setNewMetricFormula] = useState('');

    // Estado para editar nombres de columnas
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingColumnName, setEditingColumnName] = useState('');

    // === FETCH DATA ===
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            let url = `/api/marketing/performance?level=${level}`;

            if (period === 'custom' && dateRange?.from) {
                url += `&from=${dateRange.from.toISOString()}`;
                if (dateRange.to) url += `&to=${dateRange.to.toISOString()}`;
            } else {
                url += `&period=${period}`;
            }

            if (selectedAccount !== 'ALL') {
                url += `&account=${selectedAccount}`;
            }

            if (level === 'ADSET' && selectedCampaigns.length > 0) {
                url += `&campaign_ids=${selectedCampaigns.map(c => c.id).join(',')}`;
            }
            if (level === 'AD') {
                if (selectedAdsets.length > 0) {
                    url += `&adset_ids=${selectedAdsets.map(a => a.id).join(',')}`;
                } else if (selectedCampaigns.length > 0) {
                    url += `&campaign_ids=${selectedCampaigns.map(c => c.id).join(',')}`;
                }
            }

            const response = await fetch(url);
            const res = await response.json();

            if (res.success) {
                setData(res.data || []);
                setApiTotals(res.totals || null);
            } else if (res.rows) {
                setData(res.rows || []);
            }

            if ((!res.data || res.data.length === 0) && !syncing && period === 'today' && !silent) {
                handleDeepSync(true);
            }
        } catch (e) {
            if (!silent) toast.error("Error cargando métricas");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [level, period, dateRange, selectedAccount, selectedCampaigns, selectedAdsets, syncing]);

    const handleDeepSync = async (silent = false) => {
        if (syncing) return;
        setSyncing(true);

        // Determinar días a sincronizar según el período seleccionado
        let daysToSync = 1;
        if (period === 'last_3d' || period === '3d') daysToSync = 3;
        else if (period === 'last_7d' || period === '7d') daysToSync = 7;
        else if (period === 'last_30d' || period === '30d') daysToSync = 30;
        else if (period === 'lifetime') daysToSync = 90; // Max 90 días para lifetime
        else if (period === 'yesterday') daysToSync = 2;

        const t = silent ? null : toast.loading(`Sincronizando ${daysToSync} días de Meta Ads...`);

        try {
            const res = await fetch(`/api/marketing/sync?days=${daysToSync}`, { method: 'POST' });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || "Sync failed");
            }
            setLastSyncTime(new Date());
            if (!silent) toast.success(`Sincronizado: ${result.synced || 0} registros (${daysToSync} días)`, { id: t! });
            fetchData(true);
        } catch (e: any) {
            if (!silent) toast.error(`Error de sync: ${e.message}`, { id: t! });
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            // Sincronizar con Meta cada 30 segundos
            interval = setInterval(() => {
                if (period === 'today') {
                    handleDeepSync(true);
                } else {
                    fetchData(true);
                }
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, period, fetchData]);

    // === CUENTAS ===
    const accounts = useMemo(() => {
        const map = new Map();
        data.forEach(row => {
            if (row.account_id && row.account_name) map.set(row.account_id, row.account_name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [data]);

    // === FILTRADO Y ORDENAMIENTO ===
    const sortedData = useMemo(() => {
        let rows = [...data];

        if (selectedAccount !== 'ALL') {
            rows = rows.filter(row => row.account_id === selectedAccount);
        }

        if (showSelectedOnly && rowSelection.length > 0) {
            rows = rows.filter(r => rowSelection.includes(r.entity_id));
        }

        // Aplicar ordenamiento
        if (sortConfig) {
            rows.sort((a, b) => {
                const aVal = getNestedValue(a, sortConfig.column) || 0;
                const bVal = getNestedValue(b, sortConfig.column) || 0;

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }

                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }

        return rows;
    }, [data, selectedAccount, showSelectedOnly, rowSelection, sortConfig]);

    // === PAGINACIÓN ===
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage]);

    // === TOTALES ===
    const totals = useMemo(() => {
        if (rowSelection.length > 0) {
            const selected = data.filter(r => rowSelection.includes(r.entity_id));
            return selected.reduce((acc, curr) => ({
                spend: acc.spend + (curr.spend || 0),
                revenue: acc.revenue + (curr.real_revenue || 0),
                purchases: acc.purchases + (curr.real_purchases || 0),
                delivered: acc.delivered + (curr.delivered_orders || 0)
            }), { spend: 0, revenue: 0, purchases: 0, delivered: 0 });
        }
        if (apiTotals) return apiTotals;
        return { spend: 0, revenue: 0, purchases: 0, delivered: 0 };
    }, [apiTotals, data, rowSelection]);

    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
    const cpa = totals.purchases > 0 ? totals.spend / totals.purchases : 0;

    // === HANDLERS ===
    const handleSort = (columnId: string) => {
        setSortConfig(prev => {
            if (prev?.column === columnId) {
                return prev.direction === 'asc'
                    ? { column: columnId, direction: 'desc' }
                    : null;
            }
            return { column: columnId, direction: 'desc' };
        });
    };

    const toggleColumn = (id: string) => {
        setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    const renameColumn = (id: string, newLabel: string) => {
        if (!newLabel.trim()) return;
        setColumns(cols => cols.map(c => c.id === id ? { ...c, label: newLabel.trim() } : c));
        setEditingColumnId(null);
        setEditingColumnName('');
        toast.success(`Columna renombrada a "${newLabel.trim()}"`);
    };

    const startEditingColumn = (col: ColumnDef) => {
        setEditingColumnId(col.id);
        setEditingColumnName(col.label);
    };

    const cancelEditingColumn = () => {
        setEditingColumnId(null);
        setEditingColumnName('');
    };

    const addCustomMetric = () => {
        if (!newMetricName || !newMetricFormula) return;
        const newMetric: ColumnDef = {
            id: `custom_${Date.now()}`,
            label: newMetricName,
            visible: true,
            width: 70,
            type: 'number',
            sortable: true,
            formula: newMetricFormula
        };
        setCustomMetrics(prev => [...prev, newMetric]);
        setColumns(prev => [...prev, newMetric]);
        setNewMetricName('');
        setNewMetricFormula('');
        toast.success(`Métrica "${newMetricName}" creada`);
    };

    // === RENDER HELPERS ===
    const visibleColumns = columns.filter(c => c.visible);

    const formatValue = (value: any, type: ColumnType): string => {
        if (value === null || value === undefined || value === '') return '-';
        switch (type) {
            case 'currency': return metricsFormatter.display(value, metricsFormatter.currency);
            case 'percent': return metricsFormatter.display(value, metricsFormatter.percent);
            case 'ratio': return metricsFormatter.display(value, metricsFormatter.ratio);
            case 'number': return typeof value === 'number' ? value.toLocaleString() : value;
            default: return String(value);
        }
    };

    const getCellValue = (row: any, col: ColumnDef): any => {
        if (col.formula) {
            try {
                // Evaluar fórmula personalizada
                const evalFn = new Function('row', `with(row) { return ${col.formula}; }`);
                return evalFn(row);
            } catch {
                return '-';
            }
        }

        const norm = row.metricsNorm || {};

        switch (col.id) {
            case 'spend': return row.spend;
            case 'real_purchases': return row.real_purchases;
            case 'purchases': return norm.compras;
            case 'real_cpa': return row.real_cpa;
            case 'cpa_pixel': return norm.coste_compra;
            case 'real_revenue': return row.real_revenue;
            case 'revenue': return norm.valor_compras;
            case 'real_roas': return row.real_roas;
            case 'roas': return norm.roas_compras || row.roas;
            case 'delivered_orders': return row.delivered_orders;
            case 'delivery_rate': return row.delivery_rate;
            case 'impressions': return norm.impresiones;
            case 'reach': return norm.alcance;
            case 'frequency': return norm.frecuencia;
            case 'cpm': return norm.cpm;
            case 'clicks': return norm.clics;
            // CTR: clics / impresiones (el formateador percent multiplica por 100)
            case 'ctr': {
                const clics = norm.clics || 0;
                const impresiones = norm.impresiones || 0;
                return impresiones > 0 ? clics / impresiones : 0;
            }
            case 'cpc': return norm.cpc;
            case 'landing_page_views': return norm.vistas_landing;
            case 'cost_per_lpv': return norm.coste_landing;
            case 'add_to_cart': return norm.anadir_carrito;
            case 'cost_per_atc': return norm.coste_carrito;
            case 'initiate_checkout': return norm.iniciar_pago;
            case 'video_3s': return norm.vistas_3seg;
            // Hook Rate: vistas_3seg / impresiones
            case 'hook_rate': {
                const v3s = norm.vistas_3seg || 0;
                const impresiones = norm.impresiones || 0;
                return impresiones > 0 ? v3s / impresiones : 0;
            }
            // Hold Rate: vistas_thruplay / vistas_3seg
            case 'hold_rate': {
                const v3s = norm.vistas_3seg || 0;
                const thruplay = norm.vistas_thruplay || norm.vistas_100 || 0;
                return v3s > 0 ? thruplay / v3s : 0;
            }


            case 'video_p50': return norm.vistas_50;
            case 'video_p100': return norm.vistas_100;
            case 'quality_ranking': return norm.ranking_calidad;
            case 'engagement_ranking': return norm.ranking_engagement;
            case 'conversion_ranking': return norm.ranking_conversion;
            default: return row[col.id] || norm[col.id];
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="flex h-[calc(100vh-20px)] bg-slate-50/50 overflow-hidden relative">
            <div className={`flex-1 flex flex-col transition-all duration-500 ${selectedRow ? 'mr-[380px]' : ''}`}>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {/* === HEADER === */}
                    <div className="flex items-center justify-between gap-2 bg-white rounded-lg border border-slate-200 px-2 py-1.5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <ArrowRightLeft className="w-4 h-4 text-primary" />
                                <span className="text-sm font-black tracking-tight text-slate-900">ADS</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-600">LIVE</span>
                                </div>
                            </div>

                            {/* Selector Cuenta */}
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="bg-slate-50 text-[10px] font-bold text-slate-700 px-2 py-1 rounded border border-slate-200 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">Todas las Cuentas</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector Fechas */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                            {PERIODS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setPeriod(p.id); setDateRange(undefined); }}
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${period === p.id ? 'bg-primary text-white shadow-sm' : 'hover:bg-white text-slate-500'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                            <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={() => setPeriod('custom')}
                                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${period === 'custom' ? 'bg-primary text-white' : 'hover:bg-white text-slate-500'}`}
                                    >
                                        <CalendarIcon className="w-3 h-3" />
                                        {dateRange?.from ? format(dateRange.from, 'd/M', { locale: es }) : 'Fecha'}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={(e) => { setDateRange(e); if (e?.from) setPeriod('custom'); }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1.5">
                            {/* Config Columnas */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-bold gap-1">
                                        <Settings className="w-3 h-3" /> Columnas
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[320px]">
                                    <SheetHeader>
                                        <SheetTitle className="text-sm font-black">Configurar Columnas</SheetTitle>
                                    </SheetHeader>
                                    <div className="py-3 space-y-3 h-[calc(100vh-120px)] overflow-y-auto">
                                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-bold text-slate-600">Auto-Refresh</span>
                                            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                                        </div>
                                        <Reorder.Group axis="y" values={columns} onReorder={setColumns} className="space-y-1">
                                            {columns.map((item) => (
                                                <Reorder.Item key={item.id} value={item} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-100 cursor-move text-[11px]">
                                                    <GripVertical className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    {editingColumnId === item.id ? (
                                                        <div className="flex-1 flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                value={editingColumnName}
                                                                onChange={(e) => setEditingColumnName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') renameColumn(item.id, editingColumnName);
                                                                    if (e.key === 'Escape') cancelEditingColumn();
                                                                }}
                                                                className="w-full px-1 py-0.5 text-[11px] border border-primary rounded focus:outline-none"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => renameColumn(item.id, editingColumnName)} className="text-emerald-500 hover:text-emerald-700">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={cancelEditingColumn} className="text-red-400 hover:text-red-600">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span
                                                                className="flex-1 font-semibold text-slate-700 cursor-pointer hover:text-primary"
                                                                onDoubleClick={() => startEditingColumn(item)}
                                                                title="Doble click para renombrar"
                                                            >
                                                                {item.label}
                                                            </span>
                                                            <button
                                                                onClick={() => startEditingColumn(item)}
                                                                className="text-slate-300 hover:text-primary"
                                                                title="Renombrar"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => toggleColumn(item.id)} className="text-slate-400 hover:text-primary flex-shrink-0">
                                                        {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    </button>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Crear Métrica Personalizada */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-bold gap-1">
                                        <Calculator className="w-3 h-3" /> Fórmula
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Crear Métrica Personalizada</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3 py-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 mb-1 block">Nombre</label>
                                            <Input
                                                value={newMetricName}
                                                onChange={(e) => setNewMetricName(e.target.value)}
                                                placeholder="Ej: Margen Neto"
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 mb-1 block">Fórmula</label>
                                            <Input
                                                value={newMetricFormula}
                                                onChange={(e) => setNewMetricFormula(e.target.value)}
                                                placeholder="Ej: real_revenue - spend"
                                                className="text-sm font-mono"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Variables: spend, real_revenue, real_purchases, clicks, impressions, etc.
                                            </p>
                                        </div>
                                        <Button onClick={addCustomMetric} className="w-full">
                                            <Plus className="w-4 h-4 mr-1" /> Crear Métrica
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Sync */}
                            <button
                                onClick={() => handleDeepSync(false)}
                                disabled={syncing}
                                className="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-bold hover:bg-slate-800 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Sync...' : 'Sync'}
                            </button>
                        </div>
                    </div>

                    {/* === KPI CARDS === */}
                    <div className="grid grid-cols-5 gap-1.5">
                        <KPICard label="Inversión" value={formatValue(totals.spend, 'currency')} icon={<TrendingUp className="w-3 h-3" />} />
                        <KPICard label="Ventas" value={formatValue(totals.revenue, 'currency')} icon={<BarChart3 className="w-3 h-3" />} color="emerald" />
                        <KPICard label="ROAS" value={formatValue(roas, 'ratio')} icon={<TrendingUp className="w-3 h-3" />} color="amber" />
                        <KPICard label="CPA" value={formatValue(cpa, 'currency')} icon={<ShoppingCart className="w-3 h-3" />} />
                        <KPICard label="Compras" value={totals.purchases?.toLocaleString() || '0'} icon={<ShoppingCart className="w-3 h-3" />} color="indigo" />
                    </div>

                    {/* === TABLA PRINCIPAL === */}
                    <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                        {/* Toolbar */}
                        <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-slate-200">
                                {LEVELS.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => {
                                            if (level === 'CAMPAIGN' && rowSelection.length > 0) {
                                                setSelectedCampaigns(data.filter(r => rowSelection.includes(r.entity_id)).map(r => ({ id: r.entity_id, name: r.name })));
                                            } else if (level === 'ADSET' && rowSelection.length > 0) {
                                                setSelectedAdsets(data.filter(r => rowSelection.includes(r.entity_id)).map(r => ({ id: r.entity_id, name: r.name })));
                                            }
                                            setRowSelection([]);
                                            setLevel(l.id);
                                        }}
                                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${level === l.id ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>

                            {rowSelection.length > 0 && (
                                <button
                                    onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                                    className={`text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1 ${showSelectedOnly ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    <span className="w-4 h-4 bg-white/20 rounded-full text-[8px] flex items-center justify-center">{rowSelection.length}</span>
                                    {showSelectedOnly ? 'Mostrando Selección' : 'Filtrar Selección'}
                                </button>
                            )}

                            {(selectedCampaigns.length > 0 || selectedAdsets.length > 0) && (
                                <div className="flex items-center gap-1 ml-auto">
                                    <span className="text-[8px] font-bold text-slate-400">FILTROS:</span>
                                    {selectedCampaigns.length > 0 && (
                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            {selectedCampaigns.length} Camp.
                                            <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedCampaigns([])} />
                                        </span>
                                    )}
                                    {selectedAdsets.length > 0 && (
                                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            {selectedAdsets.length} Conj.
                                            <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedAdsets([])} />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-1 px-1 border-b border-slate-200 w-6 sticky left-0 bg-slate-100 z-20">
                                            <input
                                                type="checkbox"
                                                className="w-3 h-3 rounded border-slate-300 accent-primary cursor-pointer"
                                                onChange={(e) => {
                                                    if (e.target.checked) setRowSelection(data.map(r => r.entity_id));
                                                    else setRowSelection([]);
                                                }}
                                                checked={data.length > 0 && rowSelection.length === data.length}
                                            />
                                        </th>
                                        <th className="py-1 px-1 text-[9px] font-black text-slate-500 uppercase border-b border-slate-200 sticky left-6 bg-slate-100 z-20 min-w-[140px]">
                                            Nombre
                                        </th>
                                        {visibleColumns.map((col) => (
                                            <th
                                                key={col.id}
                                                onClick={() => col.sortable && handleSort(col.id)}
                                                className={`py-0.5 px-0.5 text-[8px] font-black text-slate-500 uppercase border-b border-slate-200 text-center whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
                                                style={{ minWidth: col.width }}
                                            >
                                                <div className="flex items-center justify-center gap-0.5">
                                                    {col.label}
                                                    {sortConfig?.column === col.id && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedData.map((row, idx) => (
                                        <tr
                                            key={row.entity_id || idx}
                                            onClick={() => {
                                                if (rowSelection.includes(row.entity_id)) {
                                                    setRowSelection(prev => prev.filter(id => id !== row.entity_id));
                                                } else {
                                                    setRowSelection(prev => [...prev, row.entity_id]);
                                                }
                                            }}
                                            className={`cursor-pointer transition-colors ${rowSelection.includes(row.entity_id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="py-0.5 px-1 sticky left-0 bg-white z-10 border-r border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    checked={rowSelection.includes(row.entity_id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (e.target.checked) setRowSelection(prev => [...prev, row.entity_id]);
                                                        else setRowSelection(prev => prev.filter(id => id !== row.entity_id));
                                                    }}
                                                    className="w-3 h-3 rounded border-slate-300 accent-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-0.5 px-1 sticky left-6 bg-white z-10 border-r border-slate-100">
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (level === 'CAMPAIGN') {
                                                                setSelectedCampaigns([{ id: row.entity_id, name: row.name }]);
                                                                setLevel('ADSET');
                                                                setRowSelection([]);
                                                            } else if (level === 'ADSET') {
                                                                setSelectedAdsets([{ id: row.entity_id, name: row.name }]);
                                                                setLevel('AD');
                                                                setRowSelection([]);
                                                            }
                                                        }}
                                                        className="text-[10px] font-bold text-slate-900 truncate max-w-[130px] text-left hover:text-primary hover:underline"
                                                        disabled={level === 'AD'}
                                                    >
                                                        {row.name || row.entity_id?.slice(-8)}
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-[7px] font-black px-1 rounded ${row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {row.isActive ? 'ACT' : 'OFF'}
                                                        </span>
                                                        <span
                                                            title="Copiar ID"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(row.entity_id);
                                                                toast.success("ID Copiado");
                                                            }}
                                                            className="text-[7px] text-slate-400 hover:text-primary cursor-pointer font-mono"
                                                        >
                                                            {row.entity_id?.slice(-8)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {visibleColumns.map(col => (
                                                <td key={col.id} className="py-0 px-0.5 text-center text-xs font-bold text-slate-800">
                                                    {formatValue(getCellValue(row, col), col.type)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-2 py-1 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[9px]">
                            <span className="text-slate-500 font-bold">
                                {paginatedData.length} de {sortedData.length} registros
                            </span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-slate-700">{currentPage}/{totalPages || 1}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === SIDE PANEL === */}
            {selectedRow && (
                <DetailPanel row={selectedRow} level={level} onClose={() => setSelectedRow(null)} />
            )}
        </div>
    );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================
function KPICard({ label, value, icon, color = 'slate' }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
    const colors: Record<string, string> = {
        slate: 'text-primary',
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
        indigo: 'text-indigo-600'
    };
    return (
        <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 flex items-center justify-between shadow-sm">
            <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-black text-slate-900">{value}</p>
            </div>
            <div className={`p-1 bg-slate-50 rounded ${colors[color]}`}>{icon}</div>
        </div>
    );
}

function DetailPanel({ row, level, onClose }: { row: any; level: string; onClose: () => void }) {
    const norm = row.metricsNorm || {};
    return (
        <div className="w-[380px] bg-white border-l border-slate-200 shadow-lg absolute right-0 top-0 h-full z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase">{level}</span>
                    <h3 className="text-xs font-bold text-slate-900 truncate max-w-[280px]">{row.name}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                    <StatBox label="ROAS Real" value={`${metricsFormatter.display(row.real_roas, metricsFormatter.ratio)}x`} highlight />
                    <StatBox label="CPA Real" value={metricsFormatter.display(row.real_cpa, metricsFormatter.currency)} />
                </div>
                <MetricGroup title="Rendimiento">
                    <MetricRow label="Inversión" value={metricsFormatter.display(row.spend, metricsFormatter.currency)} />
                    <MetricRow label="Compras Reales" value={row.real_purchases || 0} />
                    <MetricRow label="Ventas Reales" value={metricsFormatter.display(row.real_revenue, metricsFormatter.currency)} />
                    <MetricRow label="Entregados" value={row.delivered_orders || 0} />
                    <MetricRow label="% Entrega" value={metricsFormatter.display(row.delivery_rate, metricsFormatter.percent)} />
                </MetricGroup>
                <MetricGroup title="Meta Pixel">
                    <MetricRow label="Compras Pixel" value={norm.compras || 0} />
                    <MetricRow label="Ventas Pixel" value={metricsFormatter.display(norm.valor_compras, metricsFormatter.currency)} />
                    <MetricRow label="ROAS Pixel" value={metricsFormatter.display(norm.roas_compras, metricsFormatter.ratio)} />
                </MetricGroup>
                <MetricGroup title="Tráfico">
                    <MetricRow label="Impresiones" value={norm.impresiones?.toLocaleString()} />
                    <MetricRow label="Clics" value={norm.clics?.toLocaleString()} />
                    <MetricRow label="CTR" value={metricsFormatter.display(norm.ctr, metricsFormatter.percent)} />
                    <MetricRow label="CPC" value={metricsFormatter.display(norm.cpc, metricsFormatter.currency)} />
                    <MetricRow label="CPM" value={metricsFormatter.display(norm.cpm, metricsFormatter.currency)} />
                </MetricGroup>
            </div>
        </div>
    );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`p-2 rounded-lg ${highlight ? 'bg-primary text-white' : 'bg-slate-50'}`}>
            <p className={`text-[8px] font-black uppercase ${highlight ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
            <p className={`text-lg font-black ${highlight ? '' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function MetricGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1">{title}</h4>
            <div className="bg-slate-50 rounded-lg divide-y divide-slate-100">{children}</div>
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between px-2 py-1.5">
            <span className="font-medium text-slate-600">{label}</span>
            <span className="font-bold text-slate-900">{value}</span>
        </div>
    );
}

function getNestedValue(obj: any, path: string): any {
    if (path.includes('.')) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    // Check metricsNorm for normalized values
    const norm = obj.metricsNorm || {};
    return obj[path] ?? norm[path];
}
