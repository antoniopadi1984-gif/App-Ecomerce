import {
    LayoutDashboard,
    ShoppingCart,
    Truck,
    Wallet,
    BarChart3,
    Users,
    MessageSquare,
    FolderOpen,
    Target,
    Laptop,
    Microscope,
    FileText,
    TrendingUp,
    Search,
    Eye,
    Bot,
    Settings,
    Activity,
    LinkIcon,
    Package,
    ShieldCheck,
    Calculator,
    Compass,
    Rocket
} from 'lucide-react';

export const navigation = [
    {
        id: 'central',
        label: 'Dashboards Maestros',
        items: [
            { href: '/', icon: LayoutDashboard, label: 'Control Central' },
            { href: '/rendimiento', icon: TrendingUp, label: 'Profit & ROAS' },
            { href: '/inventario', icon: Package, label: 'Stock & COGS' },
            { href: '/eagle-eye', icon: Compass, label: 'Eagle Eye' },
        ]
    },
    {
        id: 'operaciones',
        label: 'Ventas & Logística',
        items: [
            { href: '/pedidos', icon: ShoppingCart, label: 'Pedidos Hub' },
            { href: '/logistica', icon: Truck, label: 'Logística Pro' },
            { href: '/logistics/costs', icon: Calculator, label: 'Costes & COGS' },
            { href: '/customers', icon: Users, label: 'CRM Forense' },
        ]
    },
    {
        id: 'finanzas',
        label: 'Finanzas',
        items: [
            { href: '/finances', icon: Wallet, label: 'Finanzas Command' },
        ]
    },
    {
        id: 'investigacion',
        label: 'Intelligence Lab',
        items: [
            { href: '/research', icon: Microscope, label: 'Research Lab' },
            { href: '/marketing/ad-spy', icon: Eye, label: 'Ad Spy Deep' },
            { href: '/research/competencia', icon: Search, label: 'Competencia' },
        ]
    },
    {
        id: 'creativo',
        label: 'Fábrica Creativa',
        items: [
            { href: '/centro-creativo', icon: Laptop, label: 'Centro Creativo' },
            { href: '/marketing/contents', icon: FolderOpen, label: 'Contenidos' },
        ]
    },
    {
        id: 'publicidad',
        label: 'Publicidad',
        items: [
            { href: '/marketing', icon: Target, label: 'Ads Manager' },
            { href: '/marketing/performance', icon: BarChart3, label: 'Performance' },
            { href: '/marketing/ads-moderator', icon: ShieldCheck, label: 'Ads QA' },
        ]
    },
    {
        id: 'comunicaciones',
        label: 'Comunicaciones',
        items: [
            { href: '/communications/inbox', icon: MessageSquare, label: 'Inbox' },
            { href: '/communications/templates', icon: FileText, label: 'Templates' },
        ]
    },
    {
        id: 'ia',
        label: 'God-Tier AI',
        items: [
            { href: '/agentes-ia', icon: Bot, label: 'Escuadrón IA' },
            { href: '/marketing/mvp-wizard', icon: Rocket, label: 'MVP Wizard' },
        ]
    },
    {
        id: 'ajustes',
        label: 'Sistema',
        items: [
            { href: '/settings', icon: Settings, label: 'Ajustes' },
            { href: '/connections', icon: LinkIcon, label: 'Conexiones' },
            { href: '/system/health', icon: Activity, label: 'Salud' },
            { href: '/team', icon: Users, label: 'Equipo' },
        ]
    }
];
