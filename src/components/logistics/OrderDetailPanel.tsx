"use client";

import React from "react";
import {
    X,
    MessageSquare,
    Phone,
    Truck,
    ShieldAlert,
    BarChart3,
    History,
    ExternalLink,
    Copy,
    Send,
    MapPin,
    User,
    CreditCard,
    Calendar,
    Globe,
    Package,
    ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface OrderDetailPanelProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailPanel({ order, isOpen, onClose }: OrderDetailPanelProps) {
    if (!order) return null;

    const Field = ({ label, value, copyable = false }: { label: string, value: any, copyable?: boolean }) => (
        <div className="flex flex-col gap-1 py-1.5 border-b border-slate-50 last:border-0 group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">{label}</span>
            <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                <span className="text-[11px] font-bold text-slate-700 break-all leading-tight">{value || '---'}</span>
                {copyable && value && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                            navigator.clipboard.writeText(String(value));
                            // Optional: add a tiny toast or success state
                        }}
                    >
                        <Copy className="h-3 w-3 text-slate-300" />
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div
            className={cn(
                "fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Header - Super Compact */}
            <div className="px-5 h-14 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">Pedido {order.orderNumber || order.shopifyId?.split('/').pop()}</span>
                            <Badge className={cn(
                                "h-4 px-1.5 font-black text-[8px] uppercase tracking-wider border-none rounded-md",
                                getStatusStyles(order.status || order.logisticsStatus)
                            )}>
                                {order.status || order.logisticsStatus || "PENDIENTE"}
                            </Badge>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{order.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-slate-100">
                        <X className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="cliente" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 border-b border-slate-200 bg-slate-50/30 py-1.5 shadow-inner">
                    <TabsList className="bg-slate-200/50 p-0.5 h-8 justify-start gap-1 rounded-lg border border-slate-200/50 overflow-x-auto no-scrollbar w-full">
                        {[
                            { v: "ident", t: "REF" },
                            { v: "cliente", t: "CLIENTE" },
                            { v: "pago", t: "FINANCE" },
                            { v: "productos", t: "ITEMS" },
                            { v: "logistica", t: "OPS" },
                            { v: "riesgo", t: "MATRIX" },
                            { v: "com", t: "COMMS" },
                            { v: "ads", t: "ADS" },
                            { v: "eventos", t: "LOG" }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.v}
                                value={tab.v}
                                className="flex-1 min-w-[50px] px-2 h-7 rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs font-black text-[7.5px] uppercase tracking-widest text-slate-500 transition-all whitespace-nowrap"
                            >
                                {tab.t}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-4 pb-20">
                            {/* SECTION: Identificación */}
                            <TabsContent value="ident" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Identificación del Registro</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6">
                                        <Field label="Shopify ID" value={order.shopifyId} copyable />
                                        <Field label="Order Number" value={order.orderNumber} />
                                        <Field label="Tipo Pedido" value={order.orderType} />
                                        <Field label="Origin" value={order.source || 'Online Store'} />
                                        <Field label="Fecha Creación" value={order.createdAt ? format(new Date(order.createdAt), 'PPP HH:mm', { locale: es }) : '---'} />
                                        <Field label="Última Actualización" value={order.updatedAt ? format(new Date(order.updatedAt), 'PPP HH:mm', { locale: es }) : '---'} />
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Cliente */}
                            <TabsContent value="cliente" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Información del Cliente</h3>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-900 mb-0.5 italic">{order.customerName}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 mb-3">{order.customerEmail} | {order.customerPhone}</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-7 px-3 text-[8px] font-black uppercase border-slate-200 rounded-lg hover:bg-white shadow-xs">View Graph</Button>
                                            <Button variant="outline" size="sm" className="h-7 px-3 text-[8px] font-black uppercase border-slate-200 rounded-lg hover:bg-white shadow-xs">Edit Node</Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 mt-6">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Dirección de Entrega</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        <Field label="Dirección 1" value={order.addressLine1} copyable />
                                        <Field label="Dirección 2" value={order.addressLine2} />
                                        <div className="grid grid-cols-2 gap-x-6">
                                            <Field label="Ciudad" value={order.city} />
                                            <Field label="Provincia" value={order.province} />
                                            <Field label="Código Postal" value={order.zip} />
                                            <Field label="País" value={order.country} />
                                        </div>
                                        <Field label="Validación Geocoding" value={order.addressStatus} />
                                        <div className="grid grid-cols-2 gap-x-6">
                                            <Field label="Latitud" value={order.lat} />
                                            <Field label="Longitud" value={order.lng} />
                                        </div>
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Pago */}
                            <TabsContent value="pago" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3 text-slate-400" />
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Resumen Financiero</h3>
                                        </div>
                                        <Badge className={order.financialStatus === 'paid' ? "bg-emerald-500" : "bg-amber-500"}>
                                            {(order.financialStatus || 'PENDING').toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6">
                                        <Field label="Precio Total" value={`${(order.totalPrice || 0).toFixed(2)} ${order.currency || 'EUR'}`} />
                                        <Field label="Impuestos" value={`${(order.totalTax || 0).toFixed(2)} ${order.currency || 'EUR'}`} />
                                        <Field label="Gastos Envío" value={`${(order.shippingCost || 0).toFixed(2)} ${order.currency || 'EUR'}`} />
                                        <Field label="Descuentos" value={`${(order.discounts || 0).toFixed(2)} ${order.currency || 'EUR'}`} />
                                        <Field label="Método Pago" value={order.paymentMethod} />
                                        <Field label="Cód. Descuento" value={order.discountCode} />
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Productos */}
                            <TabsContent value="productos" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Package className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Líneas de Pedido</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items?.map((item: any, i: number) => (
                                            <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 flex justify-between items-center group hover:border-slate-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        {item.quantity}x
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black text-slate-900 truncate tracking-tight">{item.productTitle}</span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{item.variantTitle || 'Simple'} | SKU: {item.sku}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] font-black text-slate-900">{(item.price || 0).toFixed(2)}€</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Logística */}
                            <TabsContent value="logistica" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Truck className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ejecución Logística</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 mb-4">
                                        <Field label="Provider" value={order.logisticsProvider} />
                                        <Field label="Transportista" value={order.carrier} />
                                        <Field label="Tracking Code" value={order.trackingCode} copyable />
                                        <Field label="Fulfillment Status" value={order.fulfillmentStatus} />
                                        <Field label="Fecha Envío" value={order.shippedAt ? format(new Date(order.shippedAt), 'dd/MM/yyyy', { locale: es }) : '---'} />
                                        <Field label="Fecha Entrega" value={order.deliveredAt ? format(new Date(order.deliveredAt), 'dd/MM/yyyy', { locale: es }) : '---'} />
                                    </div>
                                    {order.trackingUrl && (
                                        <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase gap-2" onClick={() => window.open(order.trackingUrl, '_blank')}>
                                            Rastrear Envío Externo <ExternalLink className="w-3 h-3" />
                                        </Button>
                                    )}
                                </section>
                            </TabsContent>

                            {/* SECTION: Riesgo */}
                            <TabsContent value="riesgo" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldAlert className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Advanced Risk Matrix</h3>
                                    </div>
                                    <div className="bg-slate-950 rounded-lg p-4 text-white mb-4 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-0" />
                                        <div className="flex justify-between items-end relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Score</span>
                                                <span className="text-xl font-black text-white italic tracking-tighter">{order.riskScore || 0}%</span>
                                            </div>
                                            <Badge className={cn(
                                                "h-6 px-3 font-black text-[9px] uppercase border-none rounded-lg italic shadow-lg shadow-black",
                                                order.riskLevel === 'HIGH' ? "bg-rose-500" : order.riskLevel === 'MEDIUM' ? "bg-amber-500" : "bg-emerald-500"
                                            )}>
                                                {order.riskLevel || 'LOW'} RISK CLUSTER
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6">
                                        <Field label="Fraud Status" value={order.fraudStatus} />
                                        <Field label="Fraud Score" value={order.fraudScore} />
                                        <Field label="Incidence Result" value={order.incidenceResult} />
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Comms */}
                            <TabsContent value="com" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Logs de Comunicación</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp Conf.</span>
                                            <div className={cn("w-2 h-2 rounded-full", order.whatsappSent ? "bg-emerald-500" : "bg-slate-200")} />
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Confirmación</span>
                                            <div className={cn("w-2 h-2 rounded-full", order.msgConfirmationSent ? "bg-emerald-500" : "bg-slate-200")} />
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Tracking Sent</span>
                                            <div className={cn("w-2 h-2 rounded-full", order.msgTrackingSent ? "bg-emerald-500" : "bg-slate-200")} />
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Delivery Check</span>
                                            <div className={cn("w-2 h-2 rounded-full", order.msgDeliverySent ? "bg-emerald-500" : "bg-slate-200")} />
                                        </div>
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        <Field label="Intento Llamada 1" value={order.callAttempt1} />
                                        <Field label="Intento Llamada 2" value={order.callAttempt2} />
                                        <Field label="Intento Llamada 3" value={order.callAttempt3} />
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Attribution */}
                            <TabsContent value="ads" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Atribución Publicitaria</h3>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Source</span>
                                                <span className="text-xs font-black text-indigo-900">{order.source || 'Direct'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Medium</span>
                                                <span className="text-xs font-black text-indigo-900">{order.medium || 'None'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        <Field label="Campaña" value={order.campaign} copyable />
                                        <Field label="AdSet ID" value={order.adsetId} copyable />
                                        <Field label="Ad ID" value={order.adId} copyable />
                                        <Field label="UTM Content" value={order.content} />
                                        <Field label="UTM Term" value={order.term} />
                                    </div>
                                </section>
                            </TabsContent>

                            {/* SECTION: Log/Eventos */}
                            <TabsContent value="eventos" className="m-0 space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <History className="w-3 h-3 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Historial de Eventos</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {order.events?.length > 0 ? order.events.map((event: any, i: number) => (
                                            <div key={i} className="flex gap-4 relative">
                                                <div className="w-2 h-2 rounded-full bg-slate-200 mt-1 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{event.type}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 tabular-nums">{format(new Date(event.createdAt), 'dd/MM HH:mm')}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{event.description}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-10 text-center">
                                                <History className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay eventos registrados</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>

            {/* Bottom Controls */}
            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                <Button variant="outline" className="h-10 rounded-lg border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">
                    Registrar Incidencia
                </Button>
                <Button className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200">
                    Sincronizar Shopify
                </Button>
            </div>
        </div>
    );
}

function getStatusStyles(status: string) {
    const normalized = status?.toUpperCase();
    switch (normalized) {
        case 'DELIVERED':
        case 'ENTREGADO':
            return 'bg-emerald-600 text-white';
        case 'SHIPPED':
        case 'EN TRANSITO':
        case 'ENVIADO':
            return 'bg-blue-600 text-white';
        case 'OUT_FOR_DELIVERY':
        case 'EN REPARTO':
            return 'bg-orange-500 text-white';
        case 'INCIDENCE':
        case 'ERROR':
        case 'INCIDENCIA':
        case 'SINIESTRO':
            return 'bg-rose-900 text-white';
        case 'PENDING':
        case 'PROCESSING':
        case 'PREPARACION':
            return 'bg-purple-600 text-white';
        case 'CANCELLED':
        case 'CANCELADO':
            return 'bg-red-600 text-white';
        case 'RETURNED':
        case 'DEVUELTO':
            return 'bg-slate-950 text-white';
        default:
            return 'bg-slate-500 text-white';
    }
}
