'use client';

import React from 'react';
import { GripVertical, X, Settings2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number | string;
    unit: string;
    status: 'green' | 'yellow' | 'red' | 'default';
    isEditing?: boolean;
    onRemove?: () => void;
    onChangeMetric?: () => void;
    dragHandleProps?: any; // For dnd-kit later
}

export function StatCard({
    title,
    value,
    unit,
    status = 'default',
    isEditing = false,
    onRemove,
    onChangeMetric,
    dragHandleProps
}: StatCardProps) {

    const statusColors = {
        green: 'var(--s-ok)',
        yellow: 'var(--s-wa)',
        red: 'var(--s-ko)',
        default: 'var(--text-dim)',
    };

    const color = statusColors[status as keyof typeof statusColors];

    const formatValue = (v: any) => {
        if (typeof v === 'number' && v >= 1000 && !title.toLowerCase().includes('roas') && !title.toLowerCase().includes('margen') && !title.toLowerCase().includes('tasa')) {
            return (v / 1000).toFixed(1) + 'k';
        }
        return v;
    };

    return (
        <div
            {...dragHandleProps}
            className={cn(
                "relative group transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md",
                "bg-white border p-3 rounded-xl shadow-sm overflow-hidden",
                isEditing ? "border-dashed border-2 border-violet-400 hover:bg-violet-50/30" : "border-slate-100 hover:border-slate-200 hover:-translate-y-0.5"
            )}>
            {/* Status Bar */}
            <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: color, opacity: 0.8 }}
            />

            {/* Editing Controls */}
            {isEditing && (
                <>

                    <button
                        onClick={onRemove}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                    <button
                        onClick={onChangeMetric}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 p-1.5 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors shadow-sm"
                    >
                        <Settings2 size={14} />
                    </button>
                </>
            )}

            <div className={cn(
                "flex flex-col h-full select-none",
                isEditing && "px-6" // Space for icons
            )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block truncate leading-none">
                    {title}
                </span>

                <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-black text-black font-mono leading-none tracking-tighter">
                        {formatValue(value)}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {unit}
                    </span>
                </div>
            </div>
        </div>
    );
}
