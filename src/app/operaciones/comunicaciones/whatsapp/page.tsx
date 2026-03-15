'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import ComunicacionesLayout from '../_layout';

const TRIGGERS = ['CONFIRMATION', 'PREPARATION', 'TRACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'INCIDENCE'];

export default function WhatsAppPage() {
    const { activeStore } = useStore();
    const [templates, setTemplates] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [editing, setEditing] = useState<any | null>(null);
    const [tab, setTab] = useState<'templates' | 'historial'>('templates');

    useEffect(() => {
        if (!activeStore?.id) return;
        fetch(`/api/notifications/templates?storeId=${activeStore.id}`)
            .then(r => r.json()).then(d => setTemplates(d.templates || []));
        fetch(`/api/notifications/history?storeId=${activeStore.id}`)
            .then(r => r.json()).then(d => setMessages(d.messages || []));
    }, [activeStore?.id]);

    const saveTemplate = async (t: any) => {
        await fetch('/api/notifications/templates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...t, storeId: activeStore?.id })
        });
        setEditing(null);
        fetch(`/api/notifications/templates?storeId=${activeStore?.id}`)
            .then(r => r.json()).then(d => setTemplates(d.templates || []));
    };

    return (
        <ComunicacionesLayout activeTab="whatsapp">
            <div className="flex gap-3 mb-6">
                {(['templates', 'historial'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-all ${tab === t
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                            : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-white/5'}`}>
                        {t === 'templates' ? '📝 Plantillas' : '📋 Historial'}
                    </button>
                ))}
            </div>

            {tab === 'templates' && (
                <div className="grid gap-3">
                    {TRIGGERS.map(trigger => {
                        const t = templates.find((x: any) => x.trigger === trigger)
                            || { trigger, body: '', channel: 'WHATSAPP', isEnabled: false };
                        return editing?.trigger === trigger ? (
                            <div key={trigger} className="bg-[#1a1f2e] border border-green-500/20 rounded-xl p-4">
                                <h3 className="text-green-400 font-bold text-sm mb-3">{trigger}</h3>
                                <textarea
                                    value={editing.body}
                                    onChange={e => setEditing({ ...editing, body: e.target.value })}
                                    className="w-full bg-[#111827] text-white rounded-lg p-3 text-sm h-24 mb-3 border border-white/10 resize-none focus:outline-none focus:border-green-500/50"
                                    placeholder="Usa {{name}}, {{order_number}}, {{tracking}}, {{tracking_url}}" />
                                <div className="flex gap-2">
                                    <button onClick={() => saveTemplate(editing)}
                                        className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
                                        Guardar
                                    </button>
                                    <button onClick={() => setEditing(null)}
                                        className="px-4 py-1.5 bg-[#111827] text-gray-400 hover:text-white rounded-lg text-sm border border-white/10 transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div key={trigger} className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 flex items-start justify-between hover:border-white/10 transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <span className="text-green-400 font-bold text-xs uppercase tracking-wide">{trigger}</span>
                                    <p className="text-gray-300 text-sm mt-1 truncate">{t.body || 'Sin configurar'}</p>
                                </div>
                                <button onClick={() => setEditing({ ...t })}
                                    className="px-3 py-1.5 bg-[#111827] hover:bg-green-900/30 text-gray-400 hover:text-green-400 rounded-lg text-xs border border-white/5 hover:border-green-500/30 transition-all shrink-0">
                                    Editar
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === 'historial' && (
                <div className="grid gap-2">
                    {messages.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-8">No hay mensajes en el historial</p>
                    )}
                    {messages.map((m: any) => (
                        <div key={m.id} className="bg-[#1a1f2e] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                            <div>
                                <span className="text-gray-500 text-xs">{new Date(m.timestamp).toLocaleString()}</span>
                                <p className="text-white text-sm mt-0.5">{m.content}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-lg shrink-0 ml-3 ${m.status === 'SENT' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                                {m.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </ComunicacionesLayout>
    );
}
