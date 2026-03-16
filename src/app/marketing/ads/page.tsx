'use client';

import { AgentPanel } from "@/components/AgentPanel";
import React, { useState, useEffect, useMemo } from 'react';
import {
    Layout, BarChart3, Target, Zap,
    Filter, Download, RefreshCcw,
    Search, TrendingUp, AlertCircle,
    CheckCircle2, XCircle, ChevronDown,
    Settings, Eye, EyeOff, Grab,
    Calendar, MoreVertical, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useStore } from '@/lib/store/store-context';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnOrderState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- TYPES ---
type ViewLevel = 'CAMPAIGN' | 'ADSET' | 'AD';

interface AdInsight {
    id: string;
    externalId: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    spend: number;
    impressions: number;
    reach: number;
    frequency: number;
    results: number;
    costPerResult: number;
    cpm: number;
    clicks: number;
    ctr: number;
    cpc: number;
    roas: number;
    // Specifics
    budget?: number;
    objective?: string;
    bidStrategy?: string;
    lastChange?: string;
    hookRate?: number;
    holdRate?: number;
    thumbnail?: string;
    deliveryVerdict?: 'SCALING' | 'KILL' | 'STABLE' | 'TESTING';
}

interface AdAccount {
    id: string;
    accountId: string;
    name: string;
    currency: string;
}

// --- DRAGGABLE HEADER COMPONENT ---
function DraggableHeader({ header }: { header: any }) {
    const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
        useSortable({
            id: header.column.id,
        });

    const style: React.CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition,
        whiteSpace: 'nowrap',
        width: header.column.getSize(),
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={cn(
                "px-4 py-3 bg-gray-50/80 border-b border-[var(--border)] text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-wider relative group",
                header.column.getIsPinned() && "sticky left-0 z-20 bg-gray-100/90"
            )}
        >
            <div className="flex items-center gap-2">
                {flexRender(header.column.columnDef.header, header.getContext())}
                {!header.column.getIsPinned() && (
                    <button {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400">
                        <Grab size={12} />
                    </button>
                )}
            </div>
        </th>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function MarketingAdsPage() {
    const { activeStoreId } = useStore();
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [viewLevel, setViewLevel] = useState<ViewLevel>('CAMPAIGN');
    const [data, setData] = useState<AdInsight[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Table State
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [dateRange, setDateRange] = useState('Last 7 Days');

    // --- PERSISTENCE ---
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const res = await fetch('/api/user-preferences?module=ads');
                const d = await res.json();
                if (d.config) {
                    if (d.config.columnOrder) setColumnOrder(d.config.columnOrder);
                    if (d.config.columnVisibility) {
                        // Ensure sticky columns are always visible
                        const visibility = { ...d.config.columnVisibility };
                        ['name', 'status', 'spend'].forEach(col => {
                            visibility[col] = true;
                        });
                        setColumnVisibility(visibility);
                    }
                }
            } catch (e) {
                console.error("Error loading prefs", e);
            }
        };
        loadPrefs();
    }, []);

    const savePreferences = async (newOrder?: string[], newVisibility?: VisibilityState) => {
        try {
            await fetch('/api/user-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module: 'ads',
                    config: {
                        columnOrder: newOrder || columnOrder,
                        columnVisibility: newVisibility || columnVisibility
                    }
                })
            });
        } catch (e) {
            console.error("Error saving prefs", e);
        }
    };

    // --- FETCH DATA ---
    useEffect(() => {
        if (activeStoreId) {
            fetchAccounts();
        }
    }, [activeStoreId]);

    useEffect(() => {
        if (selectedAccountId && activeStoreId) {
            fetchInsights();
        }
    }, [selectedAccountId, viewLevel, dateRange, activeStoreId]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`/api/marketing/accounts?storeId=${activeStoreId}`);
            const d = await res.json();
            if (d.accounts) {
                setAccounts(d.accounts);
                if (d.accounts.length > 0) setSelectedAccountId(d.accounts[0].accountId);
            }
        } catch (e) {
            console.error("Error fetching accounts", e);
        }
    };

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/marketing/insights?level=${viewLevel}&accountId=${selectedAccountId}&range=${dateRange}&storeId=${activeStoreId}`);
            const d = await res.json();
            setData(d.insights || []);
        } catch (e) {
            toast.error("Error al cargar datos de Meta");
        } finally {
            setIsLoading(false);
        }
    };

    // --- COLUMN DEFINITIONS ---
    const columnHelper = createColumnHelper<AdInsight>();

    // Tooltip Helper
    const hTooltip = (title: string, description: string) => (
        <div className="flex items-center gap-1 group/h">
            <span>{title}</span>
            <div className="hidden group-hover/h:block absolute bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-[9px] lowercase rounded shadow-xl whitespace-normal w-44 z-50 normal-case font-medium leading-relaxed">
                {description}
            </div>
        </div>
    );

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => hTooltip('Nombre', 'Nombre de la entidad en Meta Ads Manager.'),
            cell: info => (
                <div className="flex items-center gap-2 group/cell">
                    {viewLevel === 'AD' && info.row.original.thumbnail && (
                        <div className="w-8 h-8 rounded bg-black shrink-0 overflow-hidden border border-[var(--border)]">
                            <img src={info.row.original.thumbnail} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="font-bold truncate max-w-[200px]" title={info.getValue()}>{info.getValue()}</span>
                    <button className="opacity-0 group-hover/cell:opacity-100 text-[var(--text-tertiary)]"><ExternalLink size={10} /></button>
                </div>
            ),
            size: 250,
            enablePinning: true,
        }),
        columnHelper.accessor('status', {
            header: () => hTooltip('Estado', 'Estado actual de entrega (Activo, Pausado, etc.).'),
            cell: info => (
                <span className={cn(
                    "px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight",
                    info.getValue() === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                )}>
                    {info.getValue() === 'ACTIVE' ? 'Activo' : 'Pausado'}
                </span>
            ),
            size: 100,
            enablePinning: true,
        }),
        columnHelper.accessor('spend', {
            header: () => hTooltip('Gasto', 'Importe total gastado en el periodo seleccionado.'),
            cell: info => <span className="font-mono font-bold">${info.getValue()?.toLocaleString()}</span>,
            size: 100,
            enablePinning: true,
        }),
        // Inherited columns for AdSets and Ads
        ...(viewLevel !== 'CAMPAIGN' ? [
            columnHelper.accessor('budget', {
                header: () => hTooltip('Presupuesto', 'Presupuesto diario o total asignado al conjunto/campaña.'),
                cell: info => <span className="font-bold text-blue-600">${info.getValue()?.toLocaleString()}</span>,
                size: 110,
            }),
            columnHelper.accessor('bidStrategy', {
                header: () => hTooltip('Estrategia de puja', 'Método que Meta usa para pujar en las subastas.'),
                cell: info => <span className="text-[9px] font-bold text-gray-400 border border-gray-100 px-1 rounded">{info.getValue() || 'AUTO'}</span>,
                size: 130,
            }),
        ] : []),
        columnHelper.accessor('results', {
            header: () => hTooltip('Resultados', 'Número de veces que el anuncio logró el objetivo (ej. Compras).'),
            cell: info => <span className="font-black">{info.getValue()?.toLocaleString()}</span>,
            size: 100,
        }),
        columnHelper.accessor('costPerResult', {
            header: () => hTooltip('Costo/Res.', 'Gasto total dividido entre el número de resultados.'),
            cell: info => <span className="font-bold text-[var(--text-secondary)]">${info.getValue()?.toFixed(2)}</span>,
            size: 110,
        }),
        columnHelper.accessor('roas', {
            header: () => hTooltip('ROAS', 'Retorno de la inversión publicitaria (Ingresos / Gasto).'),
            cell: info => (
                <span className={cn("font-black text-xs", info.getValue() > 3 ? "text-emerald-600" : (info.getValue() < 1.5 ? "text-rose-600" : "text-amber-600"))}>
                    {info.getValue()?.toFixed(2)}x
                </span>
            ),
            size: 90,
        }),
        columnHelper.accessor('ctr', {
            header: () => hTooltip('CTR', 'Porcentaje de clics respecto a las impresiones.'),
            cell: info => <span className="text-[var(--text-secondary)] font-black">{info.getValue()?.toFixed(2)}%</span>,
            size: 90,
        }),
        columnHelper.accessor('cpc', {
            header: () => hTooltip('CPC', 'Coste medio por cada clic en el enlace.'),
            cell: info => <span className="text-[var(--text-tertiary)] font-bold">${info.getValue()?.toFixed(2)}</span>,
            size: 90,
        }),
        columnHelper.accessor('cpm', {
            header: () => hTooltip('CPM', 'Coste medio por cada 1.000 impresiones.'),
            cell: info => <span className="text-[var(--text-tertiary)] font-bold">${info.getValue()?.toFixed(2)}</span>,
            size: 100,
        }),
        columnHelper.accessor('reach', {
            header: () => hTooltip('Alcance', 'Número de personas únicas que vieron el anuncio al menos una vez.'),
            cell: info => <span className="text-[var(--text-tertiary)] font-medium">{info.getValue()?.toLocaleString()}</span>,
            size: 100,
        }),
        columnHelper.accessor('impressions', {
            header: () => hTooltip('Impresiones', 'Número total de veces que el anuncio apareció en pantalla.'),
            cell: info => <span className="text-[var(--text-tertiary)] font-medium">{info.getValue()?.toLocaleString()}</span>,
            size: 110,
        }),
        columnHelper.accessor('frequency', {
            header: () => hTooltip('Frecuencia', 'Promedio de veces que cada persona vio el anuncio.'),
            cell: info => <span className="text-[var(--text-tertiary)] font-bold">{info.getValue()?.toFixed(2)}</span>,
            size: 100,
        }),
        columnHelper.accessor('objective', {
            header: () => hTooltip('Objetivo', 'El objetivo de marketing seleccionado para la campaña.'),
            cell: info => <span className="text-[9px] font-black text-indigo-600 uppercase italic">{info.getValue()}</span>,
            size: 100,
        }),
        columnHelper.accessor('lastChange', {
            header: () => hTooltip('Último cambio', 'Fecha de la última modificación importante.'),
            cell: info => <span className="text-gray-400 tabular-nums">{info.getValue()}</span>,
            size: 120,
        }),
        ...(viewLevel === 'AD' ? [
            columnHelper.accessor('hookRate', {
                header: () => hTooltip('Hook Rate', '% de impresiones que se convirtieron en visualizaciones de 3 segundos.'),
                cell: info => <span className="font-bold text-indigo-600">{info.getValue()?.toFixed(1)}%</span>,
                size: 110,
            }),
            columnHelper.accessor('holdRate', {
                header: () => hTooltip('Hold Rate', '% de personas que mantuvieron el interés más allá del hook.'),
                cell: info => <span className="font-bold text-violet-600">{info.getValue()?.toFixed(1)}%</span>,
                size: 110,
            }),
            columnHelper.accessor('deliveryVerdict', {
                header: () => hTooltip('Veredicto IA', 'Clasificación automática basada en el rendimiento y KPIs.'),
                cell: info => {
                    const verdict = info.getValue() || 'STABLE';
                    const configMap = {
                        SCALING: { label: 'ESCALAR', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
                        KILL: { label: 'ELIMINAR', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
                        STABLE: { label: 'ESTABLE', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle },
                        TESTING: { label: 'TESTING', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Zap },
                    };
                    const config = configMap[verdict as keyof typeof configMap];
                    return (
                        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black w-fit uppercase tracking-wider", config.color)}>
                            <config.icon size={11} strokeWidth={3} />
                            {config.label}
                        </div>
                    );
                },
                size: 120,
            })
        ] : [])
    ], [viewLevel]);


    const table = useReactTable({
        data,
        columns,
        state: {
            columnOrder,
            columnVisibility,
        },
        onColumnOrderChange: (updater) => {
            const newOrder = typeof updater === 'function' ? updater(columnOrder) : updater;
            setColumnOrder(newOrder);
            savePreferences(newOrder, undefined);
        },
        onColumnVisibilityChange: (updater) => {
            const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
            // Prevent hiding sticky columns
            const stickyProtected = { ...newVisibility };
            ['name', 'status', 'spend'].forEach(col => {
                stickyProtected[col] = true;
            });
            setColumnVisibility(stickyProtected);
            savePreferences(undefined, stickyProtected);
        },
        getCoreRowModel: getCoreRowModel(),
    });

    // --- DND HANDLERS ---
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setColumnOrder(columnOrder => {
                const oldIndex = columnOrder.indexOf(active.id as string);
                const newIndex = columnOrder.indexOf(over.id as string);
                return arrayMove(columnOrder, oldIndex, newIndex);
            });
        }
    }

    // Initialize Column Order
    useEffect(() => {
        setColumnOrder(columns.map(c => (c as any).accessorKey || (c as any).id));
    }, [columns]);

    return (
        <div className="flex flex-col h-screen max-h-screen bg-[var(--bg)] overflow-hidden">
            {/* NO ACCOUNT BANNER */}
            {accounts.length === 0 && !isLoading && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-600" size={18} />
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">
                            Conecta tu cuenta Meta en <span className="underline">Configuración &gt; Integraciones</span> para ver datos reales.
                        </p>
                    </div>
                    <button className="h-7 px-4 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-700 transition-all">
                        Ir a Integraciones
                    </button>
                </div>
            )}

            {/* Top Bar / Header */}
            <header className="h-16 shrink-0 bg-white border-b border-[var(--border)] px-6 flex items-center justify-between z-30">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-[14px] font-[900] text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                            Ads Manager Replica <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Meta v2026</span>
                        </h1>
                    </div>

                    <div className="h-8 w-px bg-[var(--border)]" />

                    {/* Account Selector */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.1em]">Cuenta:</span>
                        <div className="relative group">
                            <select
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="h-9 min-w-[200px] pl-3 pr-10 bg-white border border-[var(--border)] rounded-xl text-[11px] font-bold uppercase tracking-tight appearance-none focus:border-[var(--cre)] focus:ring-2 focus:ring-[var(--cre)]/10 transition-all cursor-pointer"
                            >
                                {accounts.length > 0 ? accounts.map(acc => (
                                    <option key={acc.accountId} value={acc.accountId}>{acc.name} ({acc.currency})</option>
                                )) : <option>Conecta tu cuenta Meta...</option>}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-9 px-4 bg-white border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:bg-[var(--bg)] transition-all flex items-center gap-2">
                        <Calendar size={14} /> {dateRange}
                    </button>
                    <button onClick={fetchInsights} className="h-9 px-4 bg-white border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:bg-[var(--bg)] transition-all flex items-center gap-2">
                        <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} /> Sincronizar
                    </button>
                    <button className="h-9 px-4 bg-white border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:bg-[var(--bg)] transition-all flex items-center gap-2">
                        <Settings size={14} /> Configuración Col.
                    </button>
                </div>
            </header>

            {/* Level Selector / Filters Bar */}
            <div className="h-14 shrink-0 bg-[var(--bg)] border-b border-[var(--border)] px-6 flex items-center justify-between z-20 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewLevel('CAMPAIGN')}
                        className={cn("h-10 px-6 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2",
                            viewLevel === 'CAMPAIGN' ? "bg-white border-blue-600 text-blue-600" : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]")}
                    >
                        Campañas
                    </button>
                    <button
                        onClick={() => setViewLevel('ADSET')}
                        className={cn("h-10 px-6 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2",
                            viewLevel === 'ADSET' ? "bg-white border-blue-600 text-blue-600" : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]")}
                    >
                        Conjuntos
                    </button>
                    <button
                        onClick={() => setViewLevel('AD')}
                        className={cn("h-10 px-6 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2",
                            viewLevel === 'AD' ? "bg-white border-blue-600 text-blue-600" : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]")}
                    >
                        Anuncios
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                            placeholder="Buscar en esta vista..."
                            className="h-8 pl-9 pr-4 bg-white border border-[var(--border)] rounded-lg text-[10px] uppercase font-bold tracking-tight outline-none focus:border-blue-500 w-[240px]"
                        />
                    </div>
                    <div className="flex gap-1">
                        <button className="h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-100 transition-all">
                            Winners
                        </button>
                        <button className="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-100 transition-all">
                            Scaling
                        </button>
                        <button className="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-100 transition-all">
                            Dying
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 bg-white relative overflow-auto custom-scrollbar">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-40 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCcw size={32} className="text-blue-600 animate-spin" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Calculando Métricas Meta...</span>
                        </div>
                    </div>
                )}

                <div className="min-w-fit">
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        modifiers={[restrictToHorizontalAxis]}
                    >
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="sticky top-0 z-10">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        <SortableContext
                                            items={columnOrder}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            {headerGroup.headers.map(header => (
                                                <DraggableHeader key={header.id} header={header} />
                                            ))}
                                        </SortableContext>
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-[11px]">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
                                        {row.getVisibleCells().map(cell => (
                                            <td
                                                key={cell.id}
                                                className={cn(
                                                    "px-4 py-3 whitespace-nowrap overflow-hidden transition-all",
                                                    cell.column.getIsPinned() && "sticky left-0 z-10 bg-white group-hover:bg-blue-50/90 shadow-[2px_0_5px_rgba(0,0,0,0.02)]"
                                                )}
                                                style={{ width: cell.column.getSize() }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {data.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={columns.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                    <Target size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-[var(--text-primary)] uppercase">No hay datos en esta cuenta</p>
                                                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Asegúrate de tener campañas activas en Meta Ads Manager</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            </div>

            {/* Footer / Summary Bar */}
            <footer className="h-12 shrink-0 bg-gray-50 border-t border-[var(--border)] px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                <div className="flex items-center gap-8">
                    <span>Total {viewLevel}s: {data.length}</span>
                    <div className="h-4 w-px bg-gray-300" />
                    <span className="text-[var(--text-primary)]">Gasto Total: ${data.reduce((acc, curr) => acc + (curr.spend || 0), 0).toLocaleString()}</span>
                    <span className="text-[var(--text-primary)]">ROAS Promedio: {(data.reduce((acc, curr) => acc + (curr.roas || 0), 0) / (data.length || 1)).toFixed(2)}x</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Meta Sync</span>
                </div>
            </footer>
        </div>


    <AgentPanel
        specialistRole="media-buyer"
        specialistLabel="Media Buyer"
        accentColor="#F59E0B"
        storeId={storeId || activeStoreId || "store-main"}
        productId={productId}
        moduleContext={{}}
        specialistActions={[{"label": "Diagnosticar ROAS", "prompt": "¿Por qué puede estar bajando el ROAS esta semana?"}, {"label": "Escalar campaña", "prompt": "¿Cómo debería escalar el presupuesto de la campaña activa?"}, {"label": "Fatiga creativos", "prompt": "¿Qué creativos están en fatiga y debo pausar?"}]}
    />
    );
}
