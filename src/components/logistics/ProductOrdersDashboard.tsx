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
    Phone,
    Download,
    RotateCcw
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
            {/* STANDARD TOOLBAR (Filters Left | Actions Right) */}
            <div className="sticky top-0 z-40 bg-white border border-slate-200 rounded-lg shadow-sm px-4 flex items-center justify-between h-12">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] w-56 focus:ring-1 focus:ring-slate-950 focus:bg-white outline-none transition-all" placeholder="Buscar por cliente, SKU o #ID..." />
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50">
                        <Filter className="h-3 w-3 mr-2" /> Filtros
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50">
                        <Download className="h-3 w-3 mr-2" /> Exportar
                    </Button>
                    <Button className="h-8 text-[10px] font-bold uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-white rounded-md shadow-sm">
                        Procesar Masivo
                    </Button>
                </div>
            </div>

            <div className="data-table-container">
                <Table className="data-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Canal & Entidad</TableHead>
                            <TableHead className="w-[100px] text-right">PVP Total</TableHead>
                            <TableHead className="w-[150px]">Flujo Shopify</TableHead>
                            <TableHead className="w-[130px]">Estado Nodo</TableHead>
                            <TableHead className="w-[120px]">Alertas</TableHead>
                            <TableHead className="w-[140px]">SKU Ref</TableHead>
                            <TableHead className="w-[180px]">Logistics Track</TableHead>
                            <TableHead className="w-[60px] text-center">Riesgo</TableHead>
                            <TableHead className="w-[100px] text-right">Cost COGS</TableHead>
                            <TableHead className="w-[100px] text-right">Net Profit</TableHead>
                            <TableHead className="w-[80px] text-center">...</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={11}>
                                        <div className="h-2 bg-slate-100 rounded w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center">
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">No se encontraron pedidos.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const statusInfo = getStatusInfo(order.logisticsStatus);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <TableRow
                                        key={order.id}
                                        onClick={() => handleRowClick(order)}
                                        className="cursor-pointer"
                                    >
                                        {/* Order & Entity */}
                                        <TableCell>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[10px] text-slate-900 leading-none">
                                                    #{order.orderNumber || order.shopifyId?.split('/').pop() || order.id.slice(-6).toUpperCase()}
                                                </span>
                                                <span className="font-bold text-[8px] text-slate-400 uppercase tracking-widest truncate mt-0.5">{order.customerName}</span>
                                            </div>
                                        </TableCell>

                                        {/* PVP Cluster */}
                                        <TableCell className="text-right">
                                            <div className="flex flex-col">
                                                <span className="font-black text-[11px] text-slate-900 tabular-nums italic leading-none">€{(order.totalPrice || 0).toFixed(2)}</span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.paymentMethod}</span>
                                            </div>
                                        </TableCell>

                                        {/* Shopify Flow */}
                                        <TableCell>
                                            <div className="flex items-center gap-1 shrink-0 overflow-hidden">
                                                <Badge variant="outline" className="h-4 px-1 text-[7px] font-bold uppercase rounded-[3px] border-slate-200 text-slate-400 bg-slate-50">
                                                    {order.financialStatus?.slice(0, 1) || 'U'}
                                                </Badge>
                                                <div className="h-3 w-px bg-slate-100" />
                                                <Badge variant="outline" className="h-4 px-1 text-[7px] font-bold uppercase rounded-[3px] border-slate-200 text-slate-500 bg-white">
                                                    {order.fulfillmentStatus || 'PENDING'}
                                                </Badge>
                                            </div>
                                        </TableCell>

                                        {/* Status Node */}
                                        <TableCell>
                                            <div className={cn(
                                                "h-6 px-2 font-black text-[8px] uppercase tracking-widest rounded-md flex items-center gap-2 w-fit border shadow-none",
                                                statusInfo.className
                                            )}>
                                                <StatusIcon className="h-3 w-3 shrink-0" />
                                                <span>{order.logisticsStatus || "MANUAL"}</span>
                                            </div>
                                        </TableCell>

                                        {/* Alertas */}
                                        <TableCell>
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
                                        <TableCell>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-bold text-slate-600 truncate leading-none uppercase tracking-widest group-hover:text-slate-950">
                                                    {order.items?.[0]?.productTitle || "ITEM_NOT_LINKED"}
                                                </span>
                                                {order.items?.[0]?.variantTitle && (
                                                    <span className="text-[7px] font-bold text-slate-400 truncate leading-none mt-1 uppercase tracking-tighter opacity-70">
                                                        {order.items[0].variantTitle}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Logistics Track */}
                                        <TableCell>
                                            <div className="flex items-center gap-2 group/link min-w-0">
                                                <Truck className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-950 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[8px] font-bold text-slate-900 truncate leading-none uppercase tracking-widest">{order.carrier || "---"}</span>
                                                    {order.trackingCode && (
                                                        <span className="text-[7.5px] font-bold text-slate-400 group-hover:text-slate-600 truncate leading-none mt-1 uppercase italic tabular-nums">
                                                            {order.trackingCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Riesgo */}
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-block w-2.5 h-2.5 rounded-full",
                                                (order.riskLevel === 'HIGH' || order.riskScore > 80) ? "bg-slate-950 ring-2 ring-slate-100 animate-pulse" :
                                                    (order.riskLevel === 'MEDIUM' || order.riskScore > 45) ? "bg-slate-400 shadow-sm" : "bg-slate-100 border border-slate-200"
                                            )} />
                                        </TableCell>

                                        {/* Cost Matrix */}
                                        <TableCell className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums italic">
                                                €{(order.fulfillmentCost || 0).toFixed(2)}
                                            </span>
                                        </TableCell>

                                        {/* Net Profit */}
                                        <TableCell className="text-right">
                                            <span className="text-[11px] font-black tabular-nums italic text-slate-900 underline decoration-slate-200 underline-offset-2">
                                                €{(order.netProfit || 0).toFixed(2)}
                                            </span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-950">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Refined */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {pagination.page} de {pagination.totalPages} • Total {pagination.total}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => onPageChange(pagination.page - 1)} className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border-slate-200 rounded-md">
                            Prev
                        </Button>
                        <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border-slate-200 rounded-md">
                            Next
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

function getStatusInfo(status: string) {
    const normalized = status?.toUpperCase();
    switch (normalized) {
        case 'DELIVERED':
        case 'ENTREGADO':
            return { icon: CheckCircle2, className: "bg-slate-950 text-white border-slate-950" };
        case 'SHIPPED':
        case 'EN TRANSITO':
        case 'ENVIADO':
            return { icon: Truck, className: "bg-slate-100 text-slate-900 border-slate-200 shadow-xs" };
        case 'INCIDENCE':
        case 'ERROR':
        case 'INCIDENCIA':
            return { icon: AlertCircle, className: "bg-white text-slate-950 border-slate-950 decoration-slate-200 underline underline-offset-2" };
        case 'RETURNED':
        case 'DEVUELTO':
            return { icon: RotateCcw, className: "bg-slate-50 text-slate-400 border-slate-100 line-through" };
        case 'CANCELLED':
        case 'CANCELADO':
            return { icon: MoreHorizontal, className: "bg-white text-slate-200 border-slate-100" };
        default:
            return { icon: Clock, className: "bg-slate-50 text-slate-400 border-slate-200" };
    }
}
