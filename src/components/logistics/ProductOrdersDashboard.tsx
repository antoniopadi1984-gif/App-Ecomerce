"use client";

import React, { useState } from "react";
import {
    Package,
    Truck,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    Filter,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderDetailPanel } from "./OrderDetailPanel";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


interface ProductOrdersDashboardProps {
    orders: any[];
    loading: boolean;
    pagination: any;
    onPageChange: (page: number) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
}

export function ProductOrdersDashboard({
    orders,
    loading,
    pagination,
    onPageChange,
    statusFilter,
    onStatusChange
}: ProductOrdersDashboardProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleRowClick = (order: any) => {
        setSelectedOrder(order);
        setIsPanelOpen(true);
    };

    const statuses = [
        { id: 'ALL', label: 'Todos', icon: Package },
        { id: 'PENDING', label: 'Pendientes', icon: Clock },
        { id: 'SHIPPED', label: 'Enviados', icon: Truck },
        { id: 'DELIVERED', label: 'Entregados', icon: CheckCircle2 },
        { id: 'INCIDENCE', label: 'Incidencias', icon: AlertCircle },
        { id: 'ABANDONED', label: 'Abandonados', icon: AlertCircle },
        { id: 'DRAFT', label: 'Borradores', icon: Clock },
    ];

    return (
        <div className="space-y-4">
            {/* High Density Table - Airtable Style */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table className="min-w-[1200px]">
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="h-8">
                            <TableHead className="w-[80px] border-r border-slate-100 italic">ID</TableHead>
                            <TableHead className="w-[180px] border-r border-slate-100">Cliente</TableHead>
                            <TableHead className="w-[110px] border-r border-slate-100">Contacto</TableHead>
                            <TableHead className="w-[200px] border-r border-slate-100 uppercase">Producto (Offer)</TableHead>
                            <TableHead className="w-[80px] border-r border-slate-100">PVP (€)</TableHead>
                            <TableHead className="w-[120px] border-r border-slate-100">Logística</TableHead>
                            <TableHead className="w-[110px] border-r border-slate-100">Estado</TableHead>
                            <TableHead className="w-[70px] border-r border-slate-100 text-center uppercase tracking-tighter">Semaforo</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 20 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={9} className="h-8 bg-slate-50/10" />
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="py-20 text-center">
                                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">No se encontraron registros activos.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className="group cursor-pointer h-8"
                                    onClick={() => handleRowClick(order)}
                                >
                                    <TableCell className="border-r border-slate-50 font-mono font-black text-slate-900">
                                        #{order.orderNumber || order.id.slice(-4).toUpperCase()}
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50">
                                        <span className="font-black text-slate-800 truncate">{order.customerName}</span>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50 italic text-slate-400">
                                        {order.phone || "---"}
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <Package className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                            <span className="font-bold text-slate-500 truncate">{order.productTitle || "---"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50 font-black text-slate-900 tabular-nums">
                                        {(order.totalPrice || 0).toFixed(2)}€
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            <Truck className="w-3 h-3 text-indigo-400 shrink-0" />
                                            <span className="font-mono text-[9px] text-indigo-600 truncate uppercase font-bold">{order.carrier?.slice(0, 10) || "STD"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50">
                                        <Badge className={cn(
                                            "rounded px-1.5 py-0 h-4 font-black text-[7px] uppercase tracking-tighter border-none shadow-none",
                                            getStatusStyles(order.logisticsStatus)
                                        )}>
                                            {order.logisticsStatus || "PEND"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="border-r border-slate-50 text-center">
                                        <div className={cn(
                                            "inline-block w-2 h-2 rounded-full",
                                            order.riskScore > 7 ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]" : "bg-emerald-500"
                                        )} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>


            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between bg-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Página {pagination.page} / {pagination.totalPages}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                            className="h-7 text-[10px] font-bold hover:bg-slate-50"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => onPageChange(pagination.page + 1)}
                            className="h-7 text-[10px] font-bold hover:bg-slate-50"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
            <OrderDetailPanel
                order={selectedOrder}
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
            />
        </div>
    );
}


function getStatusStyles(status: string) {
    switch (status) {
        case 'DELIVERED': return 'bg-emerald-100 text-emerald-700';
        case 'SHIPPED': return 'bg-blue-100 text-blue-700';
        case 'INCIDENCE': return 'bg-rose-100 text-rose-700';
        case 'PENDING': return 'bg-amber-100 text-amber-700';
        case 'CANCELLED': return 'bg-slate-200 text-slate-600';
        default: return 'bg-slate-100 text-slate-600';
    }
}
