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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Consumo de APIs
                    </h1>
                    <p className="text-gray-600">
                        Tracking de uso y costos de Vertex AI, Replicate, ElevenLabs
                    </p>
                </div>

                {/* Period Selector */}
                <div className="mb-6 flex gap-2">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${days === d
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {d} días
                        </button>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Costo Total</h3>
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            ${summary?.totalCost.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{summary?.period}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Total Llamadas</h3>
                            <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {summary?.totalCalls.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">API calls</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Promedio/Llamada</h3>
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            ${((summary?.totalCost || 0) / (summary?.totalCalls || 1)).toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Por request</p>
                    </div>
                </div>

                {/* Usage by Model */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-gray-700" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Uso por Modelo/API
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {summary && Object.entries(summary.byModel).map(([model, data]) => {
                            const percentage = (data.totalCost / summary.totalCost) * 100;

                            return (
                                <div key={model} className="border-b border-gray-100 pb-4 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{model}</h3>
                                            <p className="text-sm text-gray-500">
                                                {data.count} llamadas
                                                {data.totalTokens > 0 && ` · ${data.totalTokens.toLocaleString()} tokens`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ${data.totalCost.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {(!summary || Object.keys(summary.byModel).length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                                No hay datos de uso en este período
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Usage Chart */}
                {summary && Object.keys(summary.byDay).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Uso Diario
                        </h2>

                        <div className="space-y-2">
                            {Object.entries(summary.byDay)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .slice(0, 14)
                                .map(([date, cost]) => {
                                    const maxCost = Math.max(...Object.values(summary.byDay));
                                    const width = (cost / maxCost) * 100;

                                    return (
                                        <div key={date} className="flex items-center gap-4">
                                            <span className="text-sm text-gray-600 w-28">
                                                {new Date(date).toLocaleDateString('es-ES', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-green-400 to-blue-500 h-8 rounded-full flex items-center justify-end pr-3"
                                                    style={{ width: `${width}%`, minWidth: '60px' }}
                                                >
                                                    <span className="text-sm font-medium text-white">
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
