'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { DASHBOARD_METRICS, DashboardMetric } from '@/lib/dashboardMetrics';
import { cn } from '@/lib/utils';

interface MetricPickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (metricId: string) => void;
    currentMetricId: string;
}

export function MetricPickerPopover({ isOpen, onClose, onSelect, currentMetricId }: MetricPickerPopoverProps) {
    const [search, setSearch] = useState('');
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const groups = Array.from(new Set(DASHBOARD_METRICS.map(m => m.group)));
    const filteredMetrics = DASHBOARD_METRICS.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.group.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            ref={popoverRef}
            className="absolute top-0 left-0 z-[60] w-64 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            style={{
                left: '50%',
                top: '100%',
                transform: 'translateX(-50%) translateY(10px)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cambiar Métrica</span>
                <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} strokeWidth={3} />
                </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-slate-100">
                <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Content list */}
            <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                {groups.map(group => {
                    const metricsInGroup = filteredMetrics.filter(m => m.group === group);
                    if (metricsInGroup.length === 0) return null;

                    return (
                        <div key={group} className="mb-2 last:mb-0">
                            <div className="px-3 py-1 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                {group}
                            </div>
                            <div className="space-y-0.5">
                                {metricsInGroup.map(metric => (
                                    <button
                                        key={metric.id}
                                        onClick={() => {
                                            onSelect(metric.id);
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all group",
                                            currentMetricId === metric.id
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tight truncate">
                                            {metric.label}
                                        </span>
                                        <span className="text-[8px] font-bold opacity-0 group-hover:opacity-40 uppercase shrink-0 ml-2">
                                            {metric.unit}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
