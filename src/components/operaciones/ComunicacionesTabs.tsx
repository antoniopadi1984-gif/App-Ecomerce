'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Mail, Building2 } from 'lucide-react';
import { useStore } from '@/lib/store/store-context';
import { STORES_CONFIG } from '@/lib/config/stores.config';

const TABS = [
    { id: 'whatsapp', label: 'WhatsApp API', icon: MessageSquare, href: '/operaciones/comunicaciones/whatsapp', color: '#0F9E6B' },
    { id: 'gmail',    label: 'Gmail',         icon: Mail,          href: '/operaciones/comunicaciones/gmail',    color: '#0F8FAD' },
    { id: 'business', label: 'Business',      icon: Building2,     href: '/operaciones/comunicaciones/business', color: '#8B5CF6' },
] as const;

export function ComunicacionesTabs({ children }: { children: React.ReactNode }) {
    const pathname  = usePathname();
    const { activeStore } = useStore();
    const storeId   = activeStore?.id || '';
    const storeEmail = STORES_CONFIG[storeId]?.supportEmail || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                        Comunicaciones
                    </h1>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {[storeEmail, activeStore?.name].filter(Boolean).join(' · ')}
                    </p>
                </div>
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
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );
}
