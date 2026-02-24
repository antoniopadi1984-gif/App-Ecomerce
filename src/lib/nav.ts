import {
    LayoutDashboard,
    ShoppingCart,
    Truck,
    Wallet,
    BarChart3,
    Users,
    Sparkles,
    Video,
    MessageSquare,
    FolderOpen,
    Target,
    Laptop,
    Microscope,
    FileText,
    Globe,
    TrendingUp,
    Search,
    Eye,
    Bot,
    Settings,
    Activity,
    LinkIcon,
    Sliders,
    UserCog,
    Package,
    Brain,
    ShieldCheck
} from 'lucide-react';

export const navigation = [
    {
        id: 'central',
        label: 'Dashboards Maestros',
        items: [
            { href: '/', icon: LayoutDashboard, label: 'Control Central' },
            { href: '/rendimiento', icon: TrendingUp, label: 'Profit & ROAS' },
            { href: '/inventario', icon: Package, label: 'Stock & COGS' },
        ]
    },
    {
        id: 'operaciones',
        label: 'Ventas & Logística',
        items: [
            { href: '/pedidos', icon: ShoppingCart, label: 'Pedidos Hub' },
            { href: '/logistica', icon: Truck, label: 'Logística Pro' },
            { href: '/customers', icon: Users, label: 'CRM Forense' },
        ]
    },
    {
        id: 'investigacion',
        label: 'Intelligence Lab',
        items: [
            { href: '/research', icon: Microscope, label: 'Research Lab' },
            { href: '/marketing/ad-spy', icon: Eye, label: 'Ad Spy Deep' },
            { href: '/creative/brain', icon: Brain, label: 'Knowledge Base' },
        ]
    },
    {
        id: 'marketing',
        label: 'Fábrica de Activos',
        items: [
            { href: '/centro-creativo', icon: Laptop, label: 'Centro Creativo' },
            { href: '/marketing', icon: Target, label: 'Ads Manager' },
            { href: '/marketing/ads-moderator', icon: ShieldCheck, label: 'Static Ads QA' },
        ]
    },
    {
        id: 'ia',
        label: 'God-Tier AI',
        items: [
            { href: '/agentes-ia', icon: Bot, label: 'Escuadrón IA' },
        ]
    },
    {
        id: 'ajustes',
        label: 'Sistema',
        items: [
            { href: '/team', icon: Users, label: 'Equipo' },
        ]
    }
];
