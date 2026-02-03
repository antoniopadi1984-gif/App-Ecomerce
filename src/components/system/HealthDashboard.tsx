
"use client";

import React, { useEffect, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Database,
    Globe,
    Lock,
    Package,
    Power,
    RefreshCcw,
    ShieldAlert,
    Video
} from 'lucide-react';

interface ModuleHealth {
    status: 'REAL' | 'PARCIAL' | 'OFF';
    message: string;
}

interface SystemHealth {
    database: ModuleHealth;
    worker: ModuleHealth;
    engine: ModuleHealth;
    shopify: ModuleHealth;
    meta: ModuleHealth;
    beeping: ModuleHealth;
}

export const HealthDashboard: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = async () => {
        try {
            const res = await fetch('/api/system/health');
            if (!res.ok) throw new Error('Failed to fetch health');
            const data = await res.json();
            setHealth(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 15000); // Check every 15s
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <RefreshCcw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-500 font-medium">Escaneando salud del sistema...</span>
            </div>
        );
    }

    const modules = [
        { id: 'database', label: 'Base de Datos', icon: Database, data: health?.database },
        { id: 'worker', label: 'Worker Process', icon: Activity, data: health?.worker },
        { id: 'engine', label: 'Video Engine', icon: Video, data: health?.engine },
        { id: 'shopify', label: 'Shopify Store', icon: Package, data: health?.shopify },
        { id: 'meta', label: 'Meta Ads API', icon: Globe, data: health?.meta },
        { id: 'beeping', label: 'Beeping Logística', icon: ShieldAlert, data: health?.beeping },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Salud de Infraestructura</h2>
                    <p className="text-sm text-gray-500">Estado en tiempo real de los servicios y conexiones del sistema.</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchHealth(); }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Actualizar ahora"
                >
                    <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} text-gray-600`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((m) => {
                    const status = m.data?.status || 'OFF';
                    const isReal = status === 'REAL';
                    const isPartial = status === 'PARCIAL';

                    return (
                        <div
                            key={m.id}
                            className={`p-4 rounded-2xl border transition-all duration-300 ${isReal ? 'bg-emerald-50/50 border-emerald-200' :
                                    isPartial ? 'bg-amber-50/50 border-amber-200' :
                                        'bg-rose-50/50 border-rose-200 opacity-90'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${isReal ? 'bg-emerald-100/80 text-emerald-700' :
                                        isPartial ? 'bg-amber-100/80 text-amber-700' :
                                            'bg-rose-100/80 text-rose-700'
                                    }`}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isReal ? 'bg-emerald-200/50 text-emerald-800' :
                                        isPartial ? 'bg-amber-200/50 text-amber-800' :
                                            'bg-rose-200/50 text-rose-800'
                                    }`}>
                                    {isReal && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {isPartial && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    {status === 'OFF' && <Power className="w-3 h-3 mr-1" />}
                                    {status}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-900 transition-colors">
                                    {m.label}
                                </h3>
                                <p className={`text-xs mt-1 font-medium ${isReal ? 'text-emerald-700' :
                                        isPartial ? 'text-amber-700' :
                                            'text-rose-700'
                                    }`}>
                                    {m.data?.message || 'Sin respuesta del servicio'}
                                </p>
                            </div>

                            {status === 'OFF' && (
                                <div className="mt-3 pt-3 border-t border-rose-100 flex items-center text-[10px] text-rose-600 font-bold">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Módulo bloqueado para proteger integridad
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {health?.worker.status === 'OFF' && (
                <div className="p-4 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-200 flex items-center gap-4 animate-pulse">
                    <ShieldAlert className="w-8 h-8 shrink-0" />
                    <div>
                        <h4 className="font-bold text-lg">Worker Desconectado</h4>
                        <p className="text-sm text-rose-100 leading-tight">
                            El procesador de tareas no está respondiendo. Los informes de Meta Ads y los pedidos de Shopify no se actualizarán hasta que el worker esté activo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
