export const MAIN_NAV = {
    // NIVEL GLOBAL (sin producto seleccionado)
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
                { label: 'Dashboard', href: '/logistics/dashboard', icon: 'Truck' },
                { label: 'Pedidos', href: '/logistics/orders', icon: 'ShoppingCart' },
                { label: 'Costos', href: '/logistics/costs', icon: 'DollarSign' },
            ]
        },
        {
            section: 'Sistema IA',
            items: [
                { label: 'Agentes IA', href: '/agentes', icon: 'Bot', badge: 'NUEVO' },
                { label: 'Conversaciones', href: '/conversaciones', icon: 'MessageSquare' },
                { label: 'Plantillas', href: '/plantillas', icon: 'FileText' },
                { label: 'Costos API', href: '/costos', icon: 'CreditCard' },
            ]
        },
        {
            section: 'Configuración',
            items: [
                { label: 'Integraciones', href: '/connections', icon: 'Plug' },
                { label: 'Uso de API', href: '/settings/api-usage', icon: 'Activity' },
                { label: 'Notificaciones', href: '/settings/notifications', icon: 'Bell' },
                { label: 'Equipo', href: '/team', icon: 'Users' },
            ]
        }
    ],

    ],

// NIVEL PRODUCTO (OBSOLETO - Consolidation Refactor)
// El contexto de producto ahora es global y no cambia las rutas del sidebar
product: (productId: string) => []
};
