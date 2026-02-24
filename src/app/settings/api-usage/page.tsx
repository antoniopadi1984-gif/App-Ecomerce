'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Zap, BarChart3 } from 'lucide-react';

interface UsageSummary {
    totalCost: number;
    totalCalls: number;
    period: string;
    byModel: Record<string, {
        count: number;
        totalTokens: number;
        totalCost: number;
    }>;
    byDay: Record<string, number>;
}

export default function APIUsagePage() {
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchUsage();
    }, [days]);

    const fetchUsage = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/usage/summary?days=${days}`);
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error fetching usage:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Cargando datos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-0 bg-white p-4 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-slate-900 rounded-lg p-4 text-white flex items-center justify-between shadow-lg shadow-slate-100 italic">
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tighter leading-none">
                            Consumo de APIs <span className="text-indigo-400 not-italic ml-1">v4</span>
                        </h1>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5 opacity-80">
                            Tracking de uso y costos de Vertex AI, Replicate, ElevenLabs
                        </p>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg w-fit">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${days === d
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {d} DÍAS
                        </button>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg shadow-sm p-3.5 border border-slate-100 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Costo Total</h3>
                            <DollarSign className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter italic">
                            ${summary?.totalCost.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">{summary?.period}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-3.5 border border-slate-100 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Total Llamadas</h3>
                            <Zap className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter italic">
                            {summary?.totalCalls.toLocaleString() || '0'}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">API entries</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-3.5 border border-slate-100 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Promedio/Req</h3>
                            <TrendingUp className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter italic">
                            ${((summary?.totalCost || 0) / (summary?.totalCalls || 1)).toFixed(4)}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Unit cost avg</p>
                    </div>
                </div>

                {/* Usage by Model */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <h2 className="text-xs font-black uppercase text-slate-900 italic tracking-tight">
                            Uso por Modelo/API <span className="text-slate-300 not-italic ml-1">· Distribution Matrix</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {summary && Object.entries(summary.byModel).map(([model, data]) => {
                            const percentage = (data.totalCost / summary.totalCost) * 100;

                            return (
                                <div key={model} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 group hover:border-indigo-100 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="overflow-hidden">
                                            <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight truncate leading-none">{model}</h3>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {data.count} calls · {data.totalTokens > 0 && `${data.totalTokens.toLocaleString()} tokens`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-xs font-black text-slate-900 italic leading-none">
                                                ${data.totalCost.toFixed(2)}
                                            </p>
                                            <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-70">
                                                {percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {(!summary || Object.keys(summary.byModel).length === 0) && (
                            <div className="col-span-full text-center py-8 text-[9px] font-black uppercase tracking-widest text-slate-300 italic">
                                No hay datos de consumo registrados
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Usage Chart */}
                {summary && Object.keys(summary.byDay).length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <h2 className="text-xs font-black uppercase text-slate-900 italic tracking-tight">
                                Cronología de Gasto <span className="text-slate-300 not-italic ml-1">· Daily burn rate</span>
                            </h2>
                        </div>

                        <div className="space-y-1.5">
                            {Object.entries(summary.byDay)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .slice(0, 10)
                                .map(([date, cost]) => {
                                    const maxCost = Math.max(...Object.values(summary.byDay));
                                    const width = (cost / maxCost) * 100;

                                    return (
                                        <div key={date} className="flex items-center gap-3 group">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter w-20 italic">
                                                {new Date(date).toLocaleDateString('es-ES', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <div className="flex-1 bg-slate-50 rounded-lg h-7 relative overflow-hidden border border-slate-100 shadow-inner group-hover:border-emerald-100 transition-all">
                                                <div
                                                    className="bg-emerald-600 h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-1000 shadow-inner"
                                                    style={{ width: `${width}%`, minWidth: '40px' }}
                                                >
                                                    <span className="text-[10px] font-black text-white italic tracking-tighter shadow-sm">
                                                        ${cost.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
