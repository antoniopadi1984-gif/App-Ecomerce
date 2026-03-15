'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { AutomatizacionesTabs } from '@/components/operaciones/AutomatizacionesTabs';
import { Zap, Loader2 } from 'lucide-react';

const AUTOMATION_RULES = [
    { id: 'auto_confirmation', label: 'Confirmación automática al crear pedido',         trigger: 'ORDER_CREATED',   action: 'SEND_WHATSAPP_CONFIRMATION', defaultOn: true  },
    { id: 'auto_tracking',     label: 'Tracking automático al añadir código de envío',   trigger: 'TRACKING_ADDED',  action: 'SEND_WHATSAPP_TRACKING',     defaultOn: true  },
    { id: 'auto_delivery',     label: 'Notificación de reparto (Out for delivery)',      trigger: 'OUT_FOR_DELIVERY',action: 'SEND_WHATSAPP_OFD',          defaultOn: true  },
    { id: 'postv_d3',          label: 'Envío de Ebook en D+3 post-entrega',              trigger: 'DELIVERED_D3',    action: 'SEND_EBOOK',                 defaultOn: false },
    { id: 'postv_d7',          label: 'Solicitud de review en D+7 post-entrega',         trigger: 'DELIVERED_D7',    action: 'SEND_REVIEW_REQUEST',        defaultOn: true  },
    { id: 'postv_d14',         label: 'Oferta upsell en D+14 post-entrega',              trigger: 'DELIVERED_D14',   action: 'SEND_UPSELL',                defaultOn: false },
];

export default function ReglaPage() {
    const { activeStore } = useStore();
    const [rules, setRules]   = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!activeStore?.id) return;
        fetch(`/api/automations?storeId=${activeStore.id}`)
            .then(r => r.json())
            .then(d => {
                const map: Record<string, boolean> = {};
                AUTOMATION_RULES.forEach(r => {
                    const saved = d.rules?.find((x: any) => x.ruleId === r.id);
                    map[r.id] = saved ? saved.isEnabled : r.defaultOn;
                });
                setRules(map);
            });
    }, [activeStore?.id]);

    const toggle = async (ruleId: string) => {
        setSaving(ruleId);
        const newVal = !rules[ruleId];
        setRules(prev => ({ ...prev, [ruleId]: newVal }));
        await fetch('/api/automations', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId: activeStore?.id, ruleId, isEnabled: newVal })
        });
        setSaving(null);
    };

    return (
        <AutomatizacionesTabs>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AUTOMATION_RULES.map(rule => (
                    <div key={rule.id} className="ds-card"
                        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <Zap size={13} color="var(--ops)" />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{rule.label}</span>
                            </div>
                            <span style={{
                                fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace',
                                background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px'
                            }}>
                                {rule.trigger} → {rule.action}
                            </span>
                        </div>

                        {/* Toggle */}
                        <button
                            onClick={() => toggle(rule.id)}
                            disabled={saving === rule.id}
                            style={{
                                position: 'relative', width: '40px', height: '22px',
                                borderRadius: '11px', border: 'none', cursor: 'pointer',
                                background: rules[rule.id] ? 'var(--ops)' : 'var(--border)',
                                transition: 'background 0.2s', flexShrink: 0,
                            }}>
                            {saving === rule.id
                                ? <Loader2 size={12} style={{ position: 'absolute', top: '5px', left: '14px', animation: 'spin 1s linear infinite' }} color="white" />
                                : <span style={{
                                    position: 'absolute', top: '3px',
                                    left: rules[rule.id] ? '21px' : '3px',
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    background: 'white', transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }} />
                            }
                        </button>
                    </div>
                ))}
            </div>
        </AutomatizacionesTabs>
    );
}
