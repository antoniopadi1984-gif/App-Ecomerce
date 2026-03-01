'use client';

import React, { useState } from 'react';
import { X, Search, Check, Plus } from 'lucide-react';
import { DASHBOARD_METRICS, DashboardMetric } from '@/lib/dashboardMetrics';
import { cn } from '@/lib/utils';

interface MetricPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (metricId: string) => void;
    alreadySelected: string[];
}

export function MetricPickerModal({ isOpen, onClose, onSelect, alreadySelected }: MetricPickerModalProps) {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filteredMetrics = DASHBOARD_METRICS.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.group.toLowerCase().includes(search.toLowerCase())
    );

    const groups = Array.from(new Set(DASHBOARD_METRICS.map(m => m.group)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Seleccionar Métrica</h2>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none mt-1">
                            Añade un nuevo pulso a tu dashboard
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-900 hover:text-red-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="BUSCAR MÉTRICA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-black text-slate-900 uppercase tracking-tight placeholder:text-slate-400 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {groups.map(group => {
                        const metricsInGroup = filteredMetrics.filter(m => m.group === group);
                        if (metricsInGroup.length === 0) return null;

                        return (
                            <div key={group} className="mb-6 last:mb-0">
                                <h3 className="px-2 text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-3">
                                    {group}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {metricsInGroup.map(metric => {
                                        const isSelected = alreadySelected.includes(metric.id);
                                        return (
                                            <button
                                                key={metric.id}
                                                disabled={isSelected}
                                                onClick={() => onSelect(metric.id)}
                                                className={cn(
                                                    "group flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                                                    isSelected
                                                        ? "bg-slate-50 border-transparent opacity-50 cursor-not-allowed"
                                                        : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                                                )}
                                            >
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="text-xs font-black text-slate-900 uppercase truncate">
                                                        {metric.label}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                        Unidad: {metric.unit}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all",
                                                    isSelected
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                                        : "bg-slate-50 border-slate-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 text-slate-300 group-hover:text-indigo-600"
                                                )}>
                                                    {isSelected ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={4} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
