"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function HealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/system/health?storeId=store-main');
            const data = await res.json();
            setHealth(data.health);
        } catch (e) {
            console.error("Health check failed", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        checkHealth();
    }, []);

    if (!health && loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">SALUD DEL SISTEMA</h1>
                <button
                    onClick={checkHealth}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm hover:bg-gray-50 transition-all font-medium text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthCard
                    title="Base de Datos"
                    status={health?.database}
                    content={`Uptime: ${Math.floor(health?.system?.uptime / 60)} min`}
                />
                <HealthCard
                    title="Shopify"
                    status={health?.connections?.SHOPIFY || "INACTIVE"}
                    content={`Último Sync: ${new Date(health?.lastOrderSync).toLocaleString('es-ES')}`}
                />
                <HealthCard
                    title="Meta Ads"
                    status={health?.connections?.META || "INACTIVE"}
                    content={`Último Sync: ${new Date(health?.lastMetaSync).toLocaleString('es-ES')}`}
                />
                <HealthCard
                    title="Memoria"
                    status="OK"
                    content={`${Math.round(health?.system?.memory?.rss / 1024 / 1024)} MB usados`}
                />
            </div>

            <Card className="rounded-2xl border-none shadow-xl bg-white/60 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50">
                    <CardTitle className="text-lg font-bold">Conexiones Detalladas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left">Proveedor</th>
                                <th className="px-6 py-3 text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {health && Object.entries(health.connections).map(([provider, status]) => (
                                <tr key={provider} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold">{String(provider)}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={(status as string) === 'ACTIVE' ? 'default' : 'destructive'} className="rounded-md">
                                            {String(status)}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function HealthCard({ title, status, content }: { title: string, status: string, content: string }) {
    const isOk = status === 'OK' || status === 'ACTIVE';
    return (
        <Card className="rounded-2xl border-none shadow-lg">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">{title}</h3>
                    {isOk ? <CheckCircle className="text-green-500 w-5 h-5" /> : <AlertCircle className="text-red-500 w-5 h-5" />}
                </div>
                <div className="space-y-1">
                    <p className={`text-2xl font-black ${isOk ? 'text-gray-900' : 'text-red-600'}`}>{status}</p>
                    <p className="text-xs text-gray-400 font-medium">{content}</p>
                </div>
            </CardContent>
        </Card>
    );
}
