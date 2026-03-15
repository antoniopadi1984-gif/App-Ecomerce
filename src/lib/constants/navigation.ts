export const MAIN_NAV = {
    global: [
        {
            section: 'Principal',
            items: [
                { label: 'Panel', href: '/', icon: 'LayoutDashboard' },
                { label: 'Productos', href: '/dashboard/productos', icon: 'Package' },
                { label: 'Investigación', href: '/research', icon: 'Search' },
            ]
        },
        {
            section: 'Marketing',
            items: [
                { label: 'Creative Hub', href: '/marketing', icon: 'Sparkles' },
            ]
        },
        {
            section: 'Finanzas',
            items: [
                { label: 'Panel Financiero', href: '/finances', icon: 'DollarSign' },
                { label: 'Contabilidad', href: '/finances/accounting', icon: 'Calculator' },
                { label: 'Libro Mayor', href: '/finances/ledger', icon: 'BookOpen' },
                { label: 'Rentabilidad', href: '/finances/profits', icon: 'TrendingUp' },
            ]
        },
        {
            section: 'Logística',
            items: [
                { label: 'Pedidos', href: '/logistics/orders', icon: 'ShoppingCart' },
                { label: 'Costos', href: '/logistics/costs', icon: 'DollarSign' },
            ]
        },
        {
            section: 'Sistema IA',
            items: [
                { label: 'Agentes IA', href: '/agentes-ia', icon: 'Bot' },
                { label: 'Salud Sistema', href: '/system/health', icon: 'Activity' },
            ]
        },
        {
            section: 'Configuración',
            items: [
                { label: 'Integraciones', href: '/connections', icon: 'Plug' },
                { label: 'Uso de API', href: '/settings/api-usage', icon: 'Activity' },
                { label: 'Equipo', href: '/team', icon: 'Users' },
            ]
        }
    ],
    product: (productId: string) => []
};
