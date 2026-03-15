'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { ComunicacionesTabs } from '@/components/operaciones/ComunicacionesTabs';
import { MessageSquare, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppPage() {
    const { activeStore } = useStore();
    const storeId = activeStore?.id;
    const [messages, setMessages]   = useState<any[]>([]);
    const [loading, setLoading]     = useState(false);
    const [subTab, setSubTab]       = useState<'bandeja' | 'config'>('bandeja');
    const [config, setConfig]       = useState({ phoneNumberId: '', accessToken: '', businessId: '' });
    const [saving, setSaving]       = useState(false);

    useEffect(() => {
        if (!storeId) return;
        setLoading(true);
        fetch(`/api/notifications/history?storeId=${storeId}`)
            .then(r => r.json())
            .then(d => setMessages(d.messages || []))
            .finally(() => setLoading(false));
    }, [storeId]);

    const saveConfig = async () => {
        setSaving(true);
        try {
            await fetch('/api/communications/whatsapp/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId, ...config })
            });
            toast.success('Configuración guardada');
        } catch {
            toast.error('Error guardando');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ComunicacionesTabs>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {(['bandeja', 'config'] as const).map(t => (
                    <button key={t} onClick={() => setSubTab(t)}
                        style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                            textTransform: 'uppercase', cursor: 'pointer',
                            border: `1px solid ${subTab === t ? 'var(--mkt)' : 'var(--border)'}`,
                            background: subTab === t ? 'var(--mkt-bg)' : 'transparent',
                            color: subTab === t ? 'var(--mkt)' : 'var(--text-muted)',
                        }}>
                        {t === 'bandeja' ? 'Bandeja' : 'Configuración'}
                    </button>
                ))}
            </div>

            {subTab === 'bandeja' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} color="var(--mkt)" />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cargando mensajes...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <MessageSquare size={24} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>Sin mensajes</div>
                        </div>
                    ) : messages.map((msg: any) => (
                        <div key={msg.id} className="ds-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mkt-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <MessageSquare size={14} color="var(--mkt)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>
                                        {msg.customerContact}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                        {new Date(msg.timestamp).toLocaleString('es')}
                                    </span>
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{msg.content}</p>
                            </div>
                            <span style={{
                                fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
                                background: msg.status === 'SENT' ? 'var(--mkt-bg)' : '#fef2f2',
                                color: msg.status === 'SENT' ? 'var(--mkt)' : 'var(--s-ko)',
                            }}>
                                {msg.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {subTab === 'config' && (
                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="ds-card" style={{ padding: '16px', borderLeft: '3px solid var(--mkt)' }}>
                        <div style={{
                            fontSize: '10px', fontWeight: 800, color: 'var(--mkt)',
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px'
                        }}>
                            WhatsApp Business API — Meta
                        </div>
                        {[
                            { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '214259458320498'  },
                            { key: 'accessToken',   label: 'Access Token',    placeholder: 'EAAxxxx...'        },
                            { key: 'businessId',    label: 'Business ID',     placeholder: 'ID de cuenta Business' },
                        ].map(field => (
                            <div key={field.key} style={{ marginBottom: '10px' }}>
                                <label style={{
                                    fontSize: '10px', fontWeight: 700, color: 'var(--text)',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    display: 'block', marginBottom: '4px'
                                }}>
                                    {field.label}
                                </label>
                                <input
                                    className="ds-input"
                                    placeholder={field.placeholder}
                                    value={(config as any)[field.key]}
                                    onChange={e => setConfig(p => ({ ...p, [field.key]: e.target.value }))}
                                    style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                                />
                            </div>
                        ))}
                        <button onClick={saveConfig} disabled={saving} className="ds-btn"
                            style={{ background: 'var(--mkt)', color: 'white', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {saving
                                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Check size={12} />
                            }
                            Guardar configuración
                        </button>
                    </div>
                </div>
            )}
        </ComunicacionesTabs>
    );
}
