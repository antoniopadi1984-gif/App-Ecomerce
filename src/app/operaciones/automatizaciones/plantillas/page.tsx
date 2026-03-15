'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { AutomatizacionesTabs } from '@/components/operaciones/AutomatizacionesTabs';
import { FileText } from 'lucide-react';

const TRIGGERS = ['CONFIRMATION', 'PREPARATION', 'TRACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'INCIDENCE'];

export default function PlantillasPage() {
    const { activeStore } = useStore();
    const [templates, setTemplates] = useState<any[]>([]);
    const [editing, setEditing]     = useState<any | null>(null);

    useEffect(() => {
        if (!activeStore?.id) return;
        fetch(`/api/notifications/templates?storeId=${activeStore.id}`)
            .then(r => r.json())
            .then(d => setTemplates(d.templates || []));
    }, [activeStore?.id]);

    const saveTemplate = async (t: any) => {
        await fetch('/api/notifications/templates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...t, storeId: activeStore?.id })
        });
        setEditing(null);
        fetch(`/api/notifications/templates?storeId=${activeStore?.id}`)
            .then(r => r.json())
            .then(d => setTemplates(d.templates || []));
    };

    return (
        <AutomatizacionesTabs>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TRIGGERS.map(trigger => {
                    const t = templates.find((x: any) => x.trigger === trigger)
                        || { trigger, body: '', channel: 'WHATSAPP', isEnabled: false };

                    return editing?.trigger === trigger ? (
                        <div key={trigger} className="ds-card"
                            style={{ padding: '14px 16px', borderLeft: '3px solid var(--ops)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <FileText size={13} color="var(--ops)" />
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ops)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {trigger}
                                </span>
                            </div>
                            <textarea
                                value={editing.body}
                                onChange={e => setEditing({ ...editing, body: e.target.value })}
                                className="ds-input"
                                style={{ width: '100%', height: '80px', resize: 'none', fontFamily: 'monospace', fontSize: '12px', marginBottom: '10px' }}
                                placeholder="Usa {{name}}, {{order_number}}, {{tracking}}, {{tracking_url}}"
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => saveTemplate(editing)} className="ds-btn"
                                    style={{ background: 'var(--ops)', color: 'white', fontSize: '11px' }}>
                                    Guardar
                                </button>
                                <button onClick={() => setEditing(null)} className="ds-btn"
                                    style={{ fontSize: '11px' }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div key={trigger} className="ds-card"
                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    <FileText size={12} color="var(--ops)" />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ops)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {trigger}
                                    </span>
                                </div>
                                <p style={{ fontSize: '11px', color: t.body ? 'var(--text-secondary)' : 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.body || 'Sin configurar'}
                                </p>
                            </div>
                            <button onClick={() => setEditing({ ...t })} className="ds-btn"
                                style={{ fontSize: '10px', flexShrink: 0 }}>
                                Editar
                            </button>
                        </div>
                    );
                })}
            </div>
        </AutomatizacionesTabs>
    );
}
