'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function ValorPercibidoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const [generaciones, setGeneraciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const reqGen = (type: string) => {
        if (!storeId) return;
        setLoading(true);
        fetch('/api/perceived-value/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, productId, type })
        })
            .then(r => r.json())
            .then(() => {
                fetchList();
                setLoading(false);
            });
    };

    const fetchList = () => {
        if (!storeId) return;
        fetch(`/api/perceived-value/generate?storeId=${storeId}${productId !== 'GLOBAL' ? '&productId=' + productId : ''}`)
            .then(r => r.json())
            .then(d => { if (d.success) setGeneraciones(d.items); });
    };

    useEffect(() => { fetchList(); }, [storeId, productId]);

    const BuilderCard = ({ title, desc, type, colorHex }: { title: string, desc: string, type: string, colorHex: string }) => (
        <div className="ds-card-padded border-t-[4px] relative overflow-hidden group hover:shadow-lg transition-all" style={{ borderTopColor: colorHex }}>
            <Sparkles size={60} className="absolute -right-4 -bottom-4 opacity-[0.03] text-black group-hover:scale-125 transition-transform duration-500" />
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 leading-tight">{title}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mb-4 min-h-[30px]">{desc}</p>
            <button
                onClick={() => reqGen(type)}
                disabled={loading}
                className="btn-compact text-white w-full shadow-md hover:brightness-110"
                style={{ backgroundColor: colorHex }}
            >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : 'Generar IA'}
            </button>
        </div>
    );

    if (!storeId) return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BuilderCard title="Ebook Premium" desc="Genera PDF con portada e índice sobre tu producto de manera autónoma." type="EBOOK" colorHex="#8B5CF6" />
                <BuilderCard title="Mini Curso Video" desc="Guioniza y renderiza un mini curso con avatar IA impartiéndolo." type="MINICOURSE" colorHex="#F59E0B" />
                <BuilderCard title="Lista de Bonos" desc="Audita el producto actual y crea 5 bonos satélite de alto valor." type="BONUS" colorHex="#10B981" />
                <BuilderCard title="Estrategia Cupón" desc="Dinámicas de urgencia para email marketing automatizado." type="COUPON" colorHex="#EF4444" />
            </div>

            <h3 className="section-title text-[var(--ops)]!">Biblioteca Generada</h3>
            <div className="flex-1 ds-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ds-table w-full">
                        <thead>
                            <tr>
                                <th className="w-1/4">Tipo / Status</th>
                                <th>Título / Salida Base</th>
                                <th className="text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generaciones.length === 0 ? (
                                <tr><td colSpan={3} className="text-center p-8 text-[11px] text-[var(--text-dim)] font-black uppercase tracking-widest">No hay items generados.</td></tr>
                            ) : generaciones.map(g => (
                                <tr key={g.id} className="hover:bg-[var(--surface2)] group cursor-pointer transition-colors border-b border-[var(--border)] last:border-0">
                                    <td className="p-3">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${g.status === 'READY' ? 'bg-[var(--s-ok)]/10 text-[var(--s-ok)]' : 'bg-[var(--s-wa)]/10 text-[var(--s-wa)] animate-pulse'}`}>
                                            {g.type} • {g.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-[12px] font-bold text-[var(--text)]">
                                        {g.title}
                                    </td>
                                    <td className="p-3 text-right text-[11px] text-[var(--text-dim)] font-mono">
                                        {new Date(g.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
