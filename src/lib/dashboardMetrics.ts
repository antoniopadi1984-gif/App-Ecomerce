export interface DashboardMetric {
    id: string;
    label: string;
    icon?: string;
    unit: '€' | '%' | 'x' | 'number';
    group: 'Ventas' | 'Marketing' | 'Web / Operaciones' | 'Finanzas';
    description?: string;
}

export const DASHBOARD_METRICS: DashboardMetric[] = [
    // Ventas
    { id: 'revenue_total', label: 'Facturación total', unit: '€', group: 'Ventas' },
    { id: 'revenue_net', label: 'Facturación neta', unit: '€', group: 'Ventas' },
    { id: 'avg_order_value', label: 'Ticket medio', unit: '€', group: 'Ventas' },
    { id: 'orders_total', label: 'Pedidos totales', unit: 'number', group: 'Ventas' },
    { id: 'orders_pending', label: 'Pedidos pendientes', unit: 'number', group: 'Ventas' },
    { id: 'orders_cancelled', label: 'Pedidos cancelados', unit: 'number', group: 'Ventas' },
    { id: 'cancellation_rate', label: 'Tasa de cancelación', unit: '%', group: 'Ventas' },
    { id: 'delivery_rate', label: 'Tasa de entrega', unit: '%', group: 'Ventas' },
    { id: 'refunds_amount', label: 'Reembolsos €', unit: '€', group: 'Ventas' },
    { id: 'refund_rate', label: 'Tasa de reembolso', unit: '%', group: 'Ventas' },

    // Marketing
    { id: 'roas_global', label: 'ROAS Global', unit: 'x', group: 'Marketing' },
    { id: 'roas_meta', label: 'ROAS Meta', unit: 'x', group: 'Marketing' },
    { id: 'roas_google', label: 'ROAS Google', unit: 'x', group: 'Marketing' },
    { id: 'cpa_global', label: 'CPA Global', unit: '€', group: 'Marketing' },
    { id: 'cpa_meta', label: 'CPA Meta', unit: '€', group: 'Marketing' },
    { id: 'cpa_google', label: 'CPA Google', unit: '€', group: 'Marketing' },
    { id: 'ad_spend', label: 'Inversión publicitaria', unit: '€', group: 'Marketing' },
    { id: 'impressions', label: 'Impresiones', unit: 'number', group: 'Marketing' },
    { id: 'clicks', label: 'Clics', unit: 'number', group: 'Marketing' },
    { id: 'ctr', label: 'CTR', unit: '%', group: 'Marketing' },
    { id: 'cpm', label: 'CPM', unit: '€', group: 'Marketing' },

    // Web / Operaciones
    { id: 'sessions', label: 'Sesiones', unit: 'number', group: 'Web / Operaciones' },
    { id: 'conv_rate', label: 'Tasa de conversión', unit: '%', group: 'Web / Operaciones' },
    { id: 'new_users', label: 'Usuarios nuevos', unit: 'number', group: 'Web / Operaciones' },
    { id: 'returning_users', label: 'Usuarios recurrentes', unit: 'number', group: 'Web / Operaciones' },
    { id: 'avg_time_on_page', label: 'Tiempo medio en página', unit: 'number', group: 'Web / Operaciones' },

    // Finanzas
    { id: 'net_margin_pct', label: 'Margen neto %', unit: '%', group: 'Finanzas' },
    { id: 'gross_margin_pct', label: 'Margen bruto %', unit: '%', group: 'Finanzas' },
    { id: 'net_profit', label: 'Beneficio €', unit: '€', group: 'Finanzas' },
    { id: 'cogs', label: 'Coste de producto', unit: '€', group: 'Finanzas' },
    { id: 'logistics_cost', label: 'Coste logística', unit: '€', group: 'Finanzas' },
];

export const DEFAULT_METRICS = [
    'revenue_total',
    'roas_global',
    'cpa_global',
    'net_margin_pct',
    'sessions',
    'orders_total'
];
