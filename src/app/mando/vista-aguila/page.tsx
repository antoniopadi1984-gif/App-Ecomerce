'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/context/StoreContext';
import {
    RefreshCw,
    Loader2,
    Pencil,
    Check,
    X,
    Plus
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { StatCard } from '@/components/mando/stat-card';
import { MetricPickerModal } from '@/components/mando/metric-picker-modal';
import { MetricPickerPopover } from '@/components/mando/metric-picker-popover';
import { DASHBOARD_METRICS, DEFAULT_METRICS } from '@/lib/dashboardMetrics';
import { cn } from '@/lib/utils';

// Mapping between dashboardMetrics.ts IDs and API keys
const METRIC_MAP: Record<string, string> = {
    'revenue_total': 'facturacionHoy',
    'roas_global': 'roas',
    'cpa_global': 'cpa',
    'net_margin_pct': 'margenNeto',
    'sessions': 'sesiones',
    'orders_total': 'pedidos',
    'delivery_rate': 'tasaEntrega',
};

// Sortable Wrapper for StatCards
function SortableCard({ id, metric, data, isEditing, onRemove, config, activePopoverId, setActivePopoverId, updateCardMetric }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as const,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <StatCard
                title={metric.label}
                value={data?.value ?? '—'}
                unit={data?.unit ?? metric.unit}
                status={data?.status ?? 'default'}
                isEditing={isEditing}
                onRemove={onRemove}
                onChangeMetric={() => setActivePopoverId(activePopoverId === id ? null : id)}
                // Handle is passed so the entire card is always draggable
                dragHandleProps={{ ...attributes, ...listeners }}
            />
            {isEditing && activePopoverId === id && (
                <MetricPickerPopover
                    isOpen={true}
                    onClose={() => setActivePopoverId(null)}
                    currentMetricId={config?.metricId}
                    onSelect={(mId) => updateCardMetric(id, mId)}
                />
            )}
        </div>
    );
}

// Sortable Wrapper for Large Dashboard Widgets (Placeholders)
function SortableLargeWidget({ id, children, className }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as const,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(className, "cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-slate-300")}
        >
            {children}
        </div>
    );
}

export default function VistaAguila() {
    const { activeStoreId: storeId } = useStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // State for all dashboard items (cards + large placeholders)
    const [layoutIds, setLayoutIds] = useState<string[]>([]);
    const [cardConfig, setCardConfig] = useState<Record<string, { metricId: string }>>({});

    // UI states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedLayout = localStorage.getItem('pulso_layout_order_v2');
        const savedConfig = localStorage.getItem('pulso_card_config');

        let initialLayout: string[] = [];
        let initialConfig: Record<string, { metricId: string }> = {};

        if (savedLayout && savedConfig) {
            initialLayout = JSON.parse(savedLayout);
            initialConfig = JSON.parse(savedConfig);
        } else {
            // Fallback to older format if v2 layout doesn't exist
            const oldOrder = localStorage.getItem('pulso_card_order');
            if (oldOrder && savedConfig) {
                const parsedOldOrder = JSON.parse(oldOrder);
                initialLayout = [...parsedOldOrder, 'actividad_ventas', 'monitor_pedidos'];
                initialConfig = JSON.parse(savedConfig);
            } else {
                // Default setup if no data at all
                const initialIds = DEFAULT_METRICS.map((_, i) => `card_${i}_${Date.now()}`);
                initialLayout = [...initialIds, 'actividad_ventas', 'monitor_pedidos'];
                DEFAULT_METRICS.forEach((mId, i) => {
                    initialConfig[initialIds[i]] = { metricId: mId };
                });
            }
        }

        setLayoutIds(initialLayout);
        setCardConfig(initialConfig);
    }, [storeId]);

    const fetchPulse = useCallback(() => {
        if (!storeId) return;
        setLoading(true);
        fetch(`/api/mando/pulse?storeId=${storeId}`)
            .then(r => r.json())
            .then(d => {
                if (d.ok) setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [storeId]);

    useEffect(() => {
        if (!storeId) return;
        fetchPulse();
        const interval = setInterval(fetchPulse, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [storeId, fetchPulse]);

    // DND Sensors setup
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLayoutIds((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Auto-save the new layout order immediately
                localStorage.setItem('pulso_layout_order_v2', JSON.stringify(newOrder));

                return newOrder;
            });
        }
    };

    // Actions
    const handleSave = () => {
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const removeCard = (id: string) => {
        setLayoutIds(prev => {
            const nextLayout = prev.filter(cid => cid !== id);
            localStorage.setItem('pulso_layout_order_v2', JSON.stringify(nextLayout));
            return nextLayout;
        });
        setCardConfig(prev => {
            const nextConfig = { ...prev };
            delete nextConfig[id];
            localStorage.setItem('pulso_card_config', JSON.stringify(nextConfig));
            return nextConfig;
        });
    };

    const addCard = (metricId: string) => {
        const newId = `card_${Date.now()}`;

        setLayoutIds(prev => {
            const nextLayout = [newId, ...prev];
            localStorage.setItem('pulso_layout_order_v2', JSON.stringify(nextLayout));
            return nextLayout;
        });

        setCardConfig(prev => {
            const nextConfig = { ...prev, [newId]: { metricId } };
            localStorage.setItem('pulso_card_config', JSON.stringify(nextConfig));
            return nextConfig;
        });

        setIsAddModalOpen(false);
    };

    const updateCardMetric = (cardId: string, metricId: string) => {
        setCardConfig(prev => {
            const nextConfig = {
                ...prev,
                [cardId]: { ...prev[cardId], metricId }
            };
            localStorage.setItem('pulso_card_config', JSON.stringify(nextConfig));
            return nextConfig;
        });
    };

    if (!storeId) return null;
    if (loading && !data) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center text-[11px] text-slate-800 font-extrabold ds-card bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-violet-600" />
                Sincronizando Vista de Águila...
            </div>
        );
    }

    const pulseData = data?.metrics || {};
    const timestamp = data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : new Date().toLocaleTimeString();

    return (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            {/* Header / Pulse Control */}
            <div className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase text-slate-900 tracking-widest leading-none">
                            El Pulso (Tiempo Real)
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-800 font-extrabold font-mono uppercase">Update: {timestamp}</span>
                            <button onClick={fetchPulse} disabled={loading} className="text-slate-900 hover:text-indigo-600 transition-colors">
                                <RefreshCw size={10} strokeWidth={3} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="h-7 px-3 flex items-center gap-1.5 rounded-lg text-[10px] font-black uppercase bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Check size={12} strokeWidth={3} />
                                Cerrar Edición
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="h-7 px-3 flex items-center gap-1.5 rounded-lg text-[10px] font-black uppercase bg-white text-slate-900 hover:bg-slate-50 transition-all border border-slate-300 shadow-sm"
                        >
                            <Pencil size={12} strokeWidth={3} />
                            Editar Dashboard
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Master - DndContext Wrapping EVERYTHING */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
                    <SortableContext
                        items={layoutIds}
                        strategy={rectSortingStrategy}
                    >
                        {layoutIds.map((id) => {

                            // WIDGET: Actividad de Ventas
                            if (id === 'actividad_ventas') {
                                return (
                                    <div key={id} className="col-span-2 lg:col-span-4 h-full">
                                        <SortableLargeWidget id={id} className="ds-card bg-white p-4 min-h-[250px] flex flex-col border-slate-200 h-full">
                                            <div className="flex justify-between items-center mb-4 cursor-grab active:cursor-grabbing">
                                                <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest pointer-events-none">Actividad de Ventas (Hourly)</h3>
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 pointer-events-none">Próximamente</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-50/50 rounded-xl pointer-events-none">
                                                <RefreshCw className="w-12 h-12 text-slate-200 animate-spin-slow" />
                                            </div>
                                        </SortableLargeWidget>
                                    </div>
                                );
                            }

                            // WIDGET: Monitor de Pedidos
                            if (id === 'monitor_pedidos') {
                                return (
                                    <div key={id} className="col-span-2 lg:col-span-2 h-full">
                                        <SortableLargeWidget id={id} className="ds-card bg-white p-4 border-slate-200 flex flex-col min-h-[250px] h-full">
                                            <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4 cursor-grab active:cursor-grabbing">Monitor de Pedidos</h3>
                                            <div className="space-y-3 flex-1 pointer-events-none">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="h-2.5 bg-slate-100 rounded-full animate-pulse overflow-hidden">
                                                        <div className="h-full bg-slate-200/50 w-1/2 animate-shimmer" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 pt-4 text-center border-t border-slate-50 cursor-grab active:cursor-grabbing">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Escaneando transacciones...</span>
                                            </div>
                                        </SortableLargeWidget>
                                    </div>
                                );
                            }

                            // STANDARD CARD
                            const config = cardConfig[id];
                            if (!config) return null;
                            const metric = DASHBOARD_METRICS.find(m => m.id === config.metricId) || DASHBOARD_METRICS[0];
                            const apiKey = METRIC_MAP[config.metricId];
                            const metricData = apiKey ? pulseData[apiKey] : null;

                            return (
                                <div key={id} className="col-span-1 lg:col-span-1 h-full">
                                    <SortableCard
                                        id={id}
                                        config={config}
                                        metric={metric}
                                        data={metricData}
                                        isEditing={isEditing}
                                        onRemove={() => removeCard(id)}
                                        activePopoverId={activePopoverId}
                                        setActivePopoverId={setActivePopoverId}
                                        updateCardMetric={updateCardMetric}
                                    />
                                </div>
                            );
                        })}
                    </SortableContext>

                    {/* Botón Añadir (siempre al final de las cards en modo edición) */}
                    {isEditing && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="col-span-1 lg:col-span-1 h-full min-h-[70px] flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-violet-400 hover:bg-violet-50/50 transition-all text-slate-900 hover:text-violet-600 group"
                        >
                            <Plus size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Añadir Tarjeta</span>
                        </button>
                    )}
                </div>
            </DndContext>

            <MetricPickerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSelect={addCard}
                alreadySelected={layoutIds.map(id => cardConfig[id]?.metricId).filter(Boolean)}
            />
        </div>
    );
}
