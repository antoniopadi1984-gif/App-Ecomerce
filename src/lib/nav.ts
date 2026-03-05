export const navigation = [
    {
        id: 'mando',
        label: 'Centro de Mando',
        emoji: '⚡',
        color: '#6366F1',
        colorMuted: 'rgba(99,102,241,0.12)',
        href: '/mando/vista-aguila',
        children: [
            { label: 'Vista de Águila', emoji: '🦅', href: '/mando/vista-aguila' },
            { label: 'Scorecard', emoji: '📊', href: '/mando/scorecard' },
        ]
    },
    {
        id: 'crm-forense',
        label: 'CRM Forense',
        emoji: '🔍',
        color: '#0EA5E9',
        colorMuted: 'rgba(14,165,233,0.12)',
        href: '/crm-forense',
        children: [] // tabs internos, no submenús sidebar
    },
    {
        id: 'operaciones',
        label: 'Operaciones',
        emoji: '⚙️',
        color: '#10B981',
        colorMuted: 'rgba(16,185,129,0.12)',
        href: '/operaciones/pedidos',
        children: [
            { label: 'Pedidos', emoji: '📦', href: '/operaciones/pedidos' },
            { label: 'Finanzas', emoji: '💰', href: '/finanzas' },
            { label: 'Comunicaciones', emoji: '💬', href: '/operaciones/comunicaciones' },
            { label: 'Automatizaciones', emoji: '🤖', href: '/operaciones/automatizaciones' },
            { label: 'Agentes IA', emoji: '🧠', href: '/operaciones/agentes' },
            { label: 'Valor Percibido', emoji: '👑', href: '/operaciones/valor-percibido' },
        ]
    },
    {
        id: 'investigacion',
        label: 'Investigación',
        emoji: '🔬',
        color: '#8B5CF6',
        colorMuted: 'rgba(139,92,246,0.12)',
        href: '/investigacion/research',
        children: [
            { label: 'Research Core', emoji: '🧬', href: '/investigacion/research' },
            { label: 'Avatar Engine', emoji: '🎭', href: '/investigacion/avatares' },
            { label: 'Angle Engine', emoji: '🎯', href: '/investigacion/angulos' },
            { label: 'Combo Matrix', emoji: '⚡', href: '/investigacion/combos' },
            { label: 'Analizador Creativos', emoji: '🎬', href: '/investigacion/creativos' },
            { label: 'Analizador Landings', emoji: '📄', href: '/investigacion/landings' },
            { label: 'Competencia', emoji: '🕵️', href: '/investigacion/competencia' },
        ]
    },
    {
        id: 'creativo',
        label: 'Centro Creativo',
        emoji: '🎨',
        color: '#F59E0B',
        colorMuted: 'rgba(245,158,11,0.12)',
        href: '/creativo/video-lab',
        children: [
            { label: 'Video Lab', emoji: '🎥', href: '/creativo/video-lab' },
            { label: 'Static Ads', emoji: '🖼️', href: '/creativo/static-ads' },
            { label: 'Landing Builder', emoji: '🏗️', href: '/creativo/landing-builder' },
            { label: 'Avatares IA', emoji: '🤖', href: '/creativo/avatares' },
            { label: 'Biblioteca', emoji: '📚', href: '/creativo/biblioteca' },
        ]
    },
    {
        id: 'marketing',
        label: 'Marketing',
        emoji: '📡',
        color: '#EF4444',
        colorMuted: 'rgba(239,68,68,0.12)',
        href: '/marketing/facebook-ads',
        children: [
            { label: 'Facebook Ads', emoji: '📘', href: '/marketing/facebook-ads' },
            { label: 'Performance', emoji: '📈', href: '/marketing/performance' },
            { label: 'Moderación', emoji: '🛡️', href: '/marketing/moderacion' },
            { label: 'Ad Spy', emoji: '👁️', href: '/marketing/ad-spy' },
            { label: 'MVP Wizard', emoji: '🚀', href: '/marketing/mvp-wizard' },
        ]
    },
]
