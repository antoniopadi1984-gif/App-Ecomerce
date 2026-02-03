export const kpiData = {
    totalRevenue: 125430.00,
    netProfit: 45200.50,
    ordersCount: 1450,
    avgTicket: 86.50,
    incidences: 12,
    recoveryRate: 68.5
};

export const recentOrders = [
    {
        id: "ORD-001",
        customer: "Juan Pérez",
        amount: 120.50,
        status: "DELIVERED",
        payment: "COD",
        agent: "Ana G.",
        addressStatus: "VALIDIFIED",
        date: "Hace 2 min"
    },
    {
        id: "ORD-002",
        customer: "Maria López",
        amount: 45.00,
        status: "PENDING",
        payment: "CARD",
        agent: "System",
        addressStatus: "PENDING",
        date: "Hace 15 min"
    },
    {
        id: "ORD-003",
        customer: "Carlos Ruiz",
        amount: 89.99,
        status: "INCIDENCE",
        incidenceType: "Dirección Incorrecta",
        payment: "COD",
        agent: "Luis M.",
        addressStatus: "INVALID",
        date: "Hace 45 min"
    },
    {
        id: "ORD-004",
        customer: "Lucia S.",
        amount: 210.00,
        status: "CONFIRMED",
        payment: "COD",
        agent: "Ana G.",
        addressStatus: "VALIDIFIED",
        date: "Hace 1 hora"
    },
];

export const marketingCampaigns = [
    { name: "Nano Banana Launch", roas: 4.5, spend: 1200, revenue: 5400 },
    { name: "Retargeting Cart", roas: 6.2, spend: 400, revenue: 2480 },
    { name: "Cold Traffic - Angle 1", roas: 1.8, spend: 800, revenue: 1440 },
];
