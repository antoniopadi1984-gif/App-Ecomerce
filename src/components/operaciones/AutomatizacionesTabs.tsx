'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, FileText } from 'lucide-react';

const TABS = [
    { id: 'reglas',     label: 'Reglas',     icon: Zap,      href: '/operaciones/automatizaciones/reglas',     color: '#10B981' },
    { id: 'plantillas', label: 'Plantillas', icon: FileText, href: '/operaciones/automatizaciones/plantillas', color: '#0F8FAD' },
] as const;

export function AutomatizacionesTabs({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Automatizaciones</h1>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Reglas y plantillas de mensajes automáticos
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
                {TABS.map(tab => {
                    const isActive = pathname.includes(tab.id);
                    return (
                        <Link key={tab.id} href={tab.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderBottom: `2px solid ${isActive ? tab.color : 'transparent'}`,
                                color: isActive ? tab.color : 'var(--text-muted)',
                                transition: 'color 0.15s, border-color 0.15s',
                            }}>
                            <tab.icon size={13} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </div>
        </div>
    );
}
