'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { ComunicacionesTabs } from '@/components/operaciones/ComunicacionesTabs';
import { BarChart3, Mail, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { STORES_CONFIG } from '@/lib/config/stores.config';

export default function BusinessPage() {
    const { activeStore } = useStore();
    const storeId    = activeStore?.id || '';
    const storeConfig = STORES_CONFIG[storeId];
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        if (!storeId) return;
        setLoading(true);
        fetch(`/api/communications/analytics?storeId=${storeId}`)
            .then(r => r.json())
            .then(d => setAnalytics(d))
            .catch(() => setAnalytics(null))
            .finally(() => setLoading(false));
    }, [storeId]);

    const kpis = [
        { label: 'Correos recibidos',  value: analytics?.received      || 0,    icon: Mail,          color: 'var(--ops)'   },
        { label: 'WhatsApp enviados',  value: analytics?.whatsappSent  || 0,    icon: MessageSquare, color: 'var(--mkt)'   },
        { label: 'Respondidos IA',     value: analytics?.aiReplied     || 0,    icon: TrendingUp,    color: 'var(--inv)'   },
        { label: 'Respondidos humano', value: analytics?.humanReplied  || 0,    icon: BarChart3,     color: 'var(--mando)' },
        { label: 'Tasa respuesta',     value: (analytics?.responseRate || 0) + '%', icon: TrendingUp, color: 'var(--mkt)' },
        { label: 'T. resp. medio',     value: analytics?.avgResponseTime || '—',    icon: BarChart3,  color: 'var(--ops)'  },
    ];

    return (
        <ComunicacionesTabs>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Identidad de la tienda */}
                <div className="ds-card" style={{ padding: '16px' }}>
                    <div style={{
                        fontSize: '10px', fontWeight: 800, color: 'var(--ops)',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px'
                    }}>
                        Identidad de comunicación — {activeStore?.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Email soporte', value: storeConfig?.supportEmail },
                            { label: 'Dominio',       value: storeConfig?.domain       },
                            { label: 'Moneda',        value: storeConfig?.currency     },
                            { label: 'Store ID',      value: storeId                   },
                        ].map((item, i) => (
                            <div key={i}>
                                <div style={{
                                    fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
                                    textTransform: 'uppercase', letterSpacing: '0.06em'
                                }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>
                                    {item.value || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Métricas 30 días */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} color="var(--ops)" />
                        </div>
                    ) : kpis.map((kpi, i) => (
                        <div key={i} className="ds-card" style={{ padding: '14px', textAlign: 'center' }}>
                            <kpi.icon size={18} color={kpi.color} style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '20px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            <div style={{
                                fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px',
                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em'
                            }}>
                                {kpi.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón conectar Gmail OAuth */}
                <div className="ds-card" style={{ padding: '16px', borderLeft: '3px solid var(--ops)' }}>
                    <div style={{
                        fontSize: '10px', fontWeight: 800, color: 'var(--ops)',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
                    }}>
                        Conexión Gmail OAuth
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Autoriza el acceso a <strong style={{ color: 'var(--text)' }}>{storeConfig?.supportEmail}</strong> para
                        que la app pueda leer y responder correos de clientes automáticamente.
                    </p>
                    <a
                        href={`/api/auth/google?storeId=${storeId}`}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '8px', background: 'var(--ops)',
                            color: 'white', fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                        }}>
                        <Mail size={14} />
                        Conectar {storeConfig?.supportEmail}
                    </a>
                </div>
            </div>
        </ComunicacionesTabs>
    );
}
