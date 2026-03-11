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
        children: []
    },
    {
        id: 'operaciones',
        label: 'Operaciones',
        emoji: '⚙️',
        color: '#10B981',
        colorMuted: 'rgba(16,185,129,0.12)',
        href: '/operaciones/pedidos',
        children: [
            { label: 'Productos', emoji: '🛍️', href: '/operaciones/productos' },
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
        href: '/centro-creativo/video-lab',
        children: [
            { label: 'Laboratorio IA', emoji: '🎬', href: '/centro-creativo/video-lab' },
            { label: 'Diseño y Conversión', emoji: '🎯', href: '/centro-creativo/diseno' },
            { label: 'Avatares y Voces', emoji: '🤖', href: '/centro-creativo/avatares' },
            { label: 'Biblioteca IA', emoji: '📚', href: '/centro-creativo/biblioteca' },
            { label: 'Rendimiento Creativo', emoji: '📈', href: '/centro-creativo/rendimiento' },
        ]
    },
    {
        id: 'marketing',
        label: 'Marketing & Ads',
        emoji: '📡',
        color: '#EF4444',
        colorMuted: 'rgba(239,68,68,0.12)',
        href: '/marketing/ads',
        children: [
            { label: 'Ads & Rendimiento', emoji: '📊', href: '/marketing/ads' },
            { label: 'Moderación', emoji: '🛡️', href: '/marketing/moderacion' },
            { label: 'Ad Spy (Extensión)', emoji: '👁️', href: '/marketing/ad-spy' },
            { label: 'MVP Wizard', emoji: '🚀', href: '/marketing/mvp-wizard' },
        ]
    },
    {
        id: 'sistema',
        label: 'Sistema',
        emoji: '⚙️',
        color: '#64748B',
        colorMuted: 'rgba(100,116,139,0.12)',
        href: '/sistema/settings',
        children: [
            { label: 'Sistema & Conexiones', emoji: '⚙️', href: '/sistema/settings' }
        ]
    }
];
