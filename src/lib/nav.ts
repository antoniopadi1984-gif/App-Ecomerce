import {
    LayoutDashboard, Users, ShoppingCart, Microscope,
    Clapperboard, Target, ChevronRight
} from 'lucide-react';

export const navigation = [
    {
        id: 'mando',
        label: 'Mando',
        href: '/mando',
        icon: LayoutDashboard,
        color: 'var(--mando)'
    },
    {
        id: 'crm-forense',
        label: 'CRM Forense',
        href: '/crm-forense',
        icon: Users,
        color: 'var(--crm)'
    },
    {
        id: 'operaciones',
        label: 'Operaciones',
        href: '/operaciones',
        icon: ShoppingCart,
        color: 'var(--ops)'
    },
    {
        id: 'investigacion',
        label: 'Investigación',
        href: '/investigacion',
        icon: Microscope,
        color: 'var(--inv)'
    },
    {
        id: 'creativo',
        label: 'Centro Creativo',
        href: '/creativo',
        icon: Clapperboard,
        color: 'var(--cre)'
    },
    {
        id: 'marketing',
        label: 'Marketing',
        href: '/marketing',
        icon: Target,
        color: 'var(--mkt)'
    },
];
