'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
    { id: 'whatsapp', label: 'WhatsApp',   icon: '💬', href: '/operaciones/comunicaciones/whatsapp' },
    { id: 'gmail',    label: 'Gmail',       icon: '📧', href: '/operaciones/comunicaciones/gmail'    },
    { id: 'business', label: 'Business',   icon: '💼', href: '/operaciones/comunicaciones/business' },
] as const;

type TabId = typeof TABS[number]['id'];

interface Props {
    activeTab: TabId;
    children: React.ReactNode;
}

export default function ComunicacionesLayout({ activeTab, children }: Props) {
    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Comunicaciones</h1>
                <p className="text-gray-500 text-sm mt-1">Gestión multicanal de mensajes con clientes</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-[#111827] rounded-xl p-1 w-fit border border-white/5">
                {TABS.map(tab => (
                    <Link key={tab.id} href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#1a1f2e] text-white shadow-sm border border-white/10'
                            : 'text-gray-500 hover:text-gray-300'}`}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </Link>
                ))}
            </div>

            {/* Page content */}
            <div>
                {children}
            </div>
        </div>
    );
}
