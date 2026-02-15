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
    ExternalLink,
    Globe,
    MessageSquare,
    Phone
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
import { TableAlert } from "@/components/ui/table-alert";
import { useStore } from "@/lib/store/store-context";
import { getAlertRules } from "@/app/settings/alerts/actions";
import { evaluateAlerts, AlertRule } from "@/lib/alerts";

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
    const { activeStoreId } = useStore();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

    React.useEffect(() => {
        if (activeStoreId) {
            getAlertRules(activeStoreId).then(rules => setAlertRules(rules as AlertRule[]));
        }
    }, [activeStoreId]);

    const handleRowClick = (order: any) => {
        setSelectedOrder(order);
        setIsPanelOpen(true);
    };

    return (
        <div className="space-y-3">
            {/* ENTERPRISE MODULE TOOLBAR (48px) */}
            <div className="sticky top-0 z-40 bg-white border border-slate-200 rounded-lg shadow-none px-4 flex items-center justify-between h-12">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-md border border-slate-100">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-sm bg-white border border-slate-200 shadow-xs">Todos</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-sm text-slate-500">Pendientes</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-sm text-slate-500">En Tránsito</Button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] w-48 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Buscar pedidos..." />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider px-3 border-slate-200 hover:bg-slate-50">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filtros
                    </Button>
                    <Button className="h-8 text-[10px] font-bold uppercase tracking-wider px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md shadow-sm">
                        Exportar
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-none overflow-hidden">
                <Table className="min-w-[1400px] border-separate border-spacing-0">
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="h-7 hover:bg-transparent border-b border-slate-100">
                            <TableHead className="w-[180px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Order & Entity</TableHead>
                            <TableHead className="w-[100px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">PVP Cluster</TableHead>
                            <TableHead className="w-[150px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Shopify Flow</TableHead>
                            <TableHead className="w-[130px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Status Node</TableHead>
                            <TableHead className="w-[120px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Alertas</TableHead>
                            <TableHead className="w-[120px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">SKU Ref</TableHead>
                            <TableHead className="w-[180px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Logistics Track</TableHead>
                            <TableHead className="w-[60px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">Risk</TableHead>
                            <TableHead className="w-[100px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Cost Matrix</TableHead>
                            <TableHead className="w-[100px] border-r border-slate-100 px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400">Net Profit</TableHead>
                            <TableHead className="w-[120px] px-3 py-0 text-[8px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 15 }).map((_, i) => (
                                <TableRow key={i} className="h-8 animate-pulse">
                                    <TableCell colSpan={8} className="p-0 border-b border-slate-50">
                                        <div className="h-2 w-3/4 bg-slate-100 rounded mx-3" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-20 text-center border-b border-slate-100">
                                    <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest text-[#64748b]">No hay pedidos registrados en este segmento.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className="group cursor-pointer h-8 hover:bg-slate-50 transition-colors"
                                    onClick={() => handleRowClick(order)}
                                >
                                    {/* Order & Entity */}
                                    <TableCell className="border-r border-slate-50 px-3 py-0 h-9">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-mono font-black text-[10px] text-slate-900 leading-none">
                                                #{order.orderNumber || order.shopifyId?.split('/').pop() || order.id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className="font-black text-[7px] text-slate-400 uppercase tracking-widest truncate mt-1 opacity-70">{order.customerName}</span>
                                        </div>
                                    </TableCell>

                                    {/* PVP Cluster */}
                                    <TableCell className="border-r border-slate-50 px-3 py-0 h-9">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[10px] text-slate-900 tabular-nums italic leading-none">€{(order.totalPrice || 0).toFixed(2)}</span>
                                            <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest mt-1">{order.paymentMethod}</span>
                                        </div>
                                    </TableCell>

                                    {/* Shopify Flow */}
                                    <TableCell className="border-r border-slate-50 px-2 py-0 h-9">
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Badge variant="outline" className="h-3.5 px-1.5 text-[6.5px] font-black uppercase rounded-[4px] border-slate-200 text-slate-600 bg-slate-50">
                                                {order.financialStatus || 'UNPAID'}
                                            </Badge>
                                            <Badge variant="outline" className="h-3.5 px-1.5 text-[6.5px] font-black uppercase rounded-[4px] border-slate-200 text-slate-600 bg-slate-50">
                                                {order.fulfillmentStatus || 'PENDING'}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    {/* Status Node */}
                                    <TableCell className="border-r border-slate-50 px-2 py-0 h-9">
                                        <Badge variant="outline" className={cn(
                                            "h-5 px-2 font-black text-[7px] uppercase tracking-[0.1em] rounded-lg flex items-center justify-center w-full italic",
                                            getStatusStyles(order.logisticsStatus)
                                        )}>
                                            {order.logisticsStatus || "MANUAL"}
                                        </Badge>
                                    </TableCell>

                                    {/* Alertas (Monochrome) */}
                                    <TableCell className="border-r border-slate-50 px-2 py-0 h-9">
                                        <div className="flex flex-wrap gap-1">
                                            {evaluateAlerts(
                                                {
                                                    totalPrice: order.totalPrice,
                                                    netProfit: order.netProfit,
                                                    status: order.logisticsStatus,
                                                    shipping: order.shippingCost
                                                },
                                                alertRules
                                            ).map((alert, idx) => (
                                                <TableAlert
                                                    key={idx}
                                                    type={alert.type}
                                                    label={alert.label}
                                                    description={alert.description}
                                                />
                                            ))}
                                        </div>
                                    </TableCell>

                                    {/* SKU Ref */}
                                    <TableCell className="border-r border-slate-50 px-3 py-0 h-9">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[7.5px] font-black text-slate-800 truncate leading-none uppercase tracking-widest italic group-hover:text-slate-950 transition-colors">
                                                {order.items?.[0]?.productTitle || "ITEM_NULL"}
                                            </span>
                                            {order.items?.[0]?.variantTitle && (
                                                <span className="text-[6px] font-black text-slate-400 truncate leading-none mt-1 uppercase tracking-widest opacity-60">
                                                    {order.items[0].variantTitle}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Logistics Track */}
                                    <TableCell className="border-r border-slate-50 px-3 py-0 h-9">
                                        <div className="flex items-center gap-2 group/link min-w-0">
                                            <div className="h-6 w-6 bg-slate-50 rounded-md flex items-center justify-center border border-slate-100 shadow-xs shrink-0 group-hover:bg-slate-100 transition-colors">
                                                <Truck className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black text-slate-900 truncate leading-none uppercase tracking-[0.05em]">{order.carrier || "PENDING"}</span>
                                                {order.trackingCode && (
                                                    <a
                                                        href={order.trackingUrl || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[7.5px] font-black text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-2 truncate leading-none mt-1.5 uppercase italic"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {order.trackingCode}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Risk */}
                                    <TableCell className="border-r border-slate-50 px-3 py-0 h-9 text-center">
                                        <div className={cn(
                                            "inline-block w-2 w-2 rounded-full",
                                            (order.riskLevel === 'HIGH' || order.riskScore > 80) ? "bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.1)] animate-pulse" :
                                                (order.riskLevel === 'MEDIUM' || order.riskScore > 45) ? "bg-slate-400 shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "bg-slate-200"
                                        )} title={`Score: ${order.riskScore}`} />
                                    </TableCell>

                                    {/* Cost Matrix */}
                                    <TableCell className="border-r border-slate-50 px-4 py-0 h-9 text-right">
                                        <span className="text-[9px] font-black text-slate-400 tabular-nums italic">
                                            €{(order.fulfillmentCost || 0).toFixed(2)}
                                        </span>
                                    </TableCell>

                                    {/* Net Profit */}
                                    <TableCell className="border-r border-slate-50 px-4 py-0 h-9 bg-slate-50/50 text-right">
                                        <span className="text-[11px] font-black tabular-nums italic text-slate-900">
                                            €{(order.netProfit || 0).toFixed(2)}
                                        </span>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="border-b border-slate-50 px-3 py-0 h-9 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-slate-100 rounded-md" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}`, '_blank'); }}>
                                                <MessageSquare className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:bg-slate-100 rounded-md" onClick={(e) => { e.stopPropagation(); handleRowClick(order); }}>
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Refined */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-[#64748b]">Página {pagination.page} de {pagination.totalPages} (Total: {pagination.total})</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                            className="h-8 rounded-md px-3 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-[#64748b]"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => onPageChange(pagination.page + 1)}
                            className="h-8 rounded-md px-3 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-[#64748b]"
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
    const normalized = status?.toUpperCase();
    switch (normalized) {
        case 'DELIVERED':
        case 'ENTREGADO':
            return 'bg-slate-900 text-white border-slate-900';
        case 'SHIPPED':
        case 'EN TRANSITO':
        case 'ENVIADO':
            return 'bg-slate-200 text-slate-900 border-slate-300';
        case 'OUT_FOR_DELIVERY':
        case 'EN REPARTO':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'INCIDENCE':
        case 'ERROR':
        case 'INCIDENCIA':
        case 'SINIESTRO':
            return 'bg-white text-slate-900 border-slate-900 underline decoration-2 underline-offset-2';
        case 'PENDING':
        case 'PROCESSING':
        case 'PREPARACION':
            return 'bg-slate-50 text-slate-400 border-slate-100';
        case 'CANCELLED':
        case 'CANCELADO':
        case 'RETURNED':
        case 'DEVUELTO':
            return 'bg-white text-slate-300 border-slate-200 line-through';
        default:
            return 'bg-slate-50 text-slate-400 border-slate-200';
    }
}
