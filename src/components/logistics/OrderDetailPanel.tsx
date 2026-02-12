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
    Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrderDetailPanelProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailPanel({ order, isOpen, onClose }: OrderDetailPanelProps) {
    if (!order) return null;

    return (
        <div
            className={cn(
                "fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Pedido #{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
                        <Badge className="bg-blue-100 text-blue-700 border-none shadow-none text-[9px] font-black uppercase">
                            {order.logisticsStatus || "PENDIENTE"}
                        </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(order.createdAt), "PPPPp", { locale: es })}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200 transition-colors">
                    <X className="w-4 h-4 text-slate-500" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Fast Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[10px] uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-emerald-100">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp Web
                        </Button>
                        <Button className="bg-[#5c4fff] hover:bg-[#4a3ecc] text-white font-black text-[10px] uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-indigo-100">
                            <Phone className="w-4 h-4 mr-2" />
                            Llamar Zadarma
                        </Button>
                    </div>

                    {/* Customer Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente & Entrega</h3>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">{order.customerName}</span>
                                    <span className="text-xs text-slate-500">{order.email || "Sin email"}</span>
                                    <span className="text-xs font-medium text-slate-600 mt-1">{order.phone}</span>
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 active:scale-95 transition-all">
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </div>
                            <Separator className="bg-slate-200/50" />
                            <div className="flex gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-700">{order.address}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{order.city}, {order.province} {order.zipCode}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Logistics & Tracking */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logística & Tracking</h3>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Transportista</span>
                                    <span className="text-xs font-bold text-slate-700">{order.carrier || "Correos Express"}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Tracking</span>
                                    <span className="text-xs font-bold text-blue-600">{order.trackingNumber || "PENDIENTE"}</span>
                                </div>
                            </div>

                            {/* Timeline Placeholder */}
                            <div className="space-y-4 pt-2">
                                {[
                                    { date: "Hoy, 10:30", label: "Pedido en Reparto", active: true },
                                    { date: "Ayer, 18:45", label: "Llegada a Centro Logístico", active: false },
                                    { date: "12 Oct, 09:15", label: "Pedido Enviado", active: false },
                                    { date: "11 Oct, 23:30", label: "Pedido Preparado", active: false },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 relative">
                                        {i !== 3 && <div className="absolute left-1.5 top-4 w-0.5 h-6 bg-slate-100" />}
                                        <div className={cn(
                                            "w-3 h-3 rounded-full mt-1 shrink-0",
                                            step.active ? "bg-blue-500 shadow-lg shadow-blue-100" : "bg-slate-200"
                                        )} />
                                        <div className="flex flex-col">
                                            <span className={cn("text-xs font-bold", step.active ? "text-slate-900" : "text-slate-500")}>{step.label}</span>
                                            <span className="text-[10px] text-slate-400">{step.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Marketing & Attribution */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Atribución & Marketing</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Campaña</span>
                                <span className="text-[10px] font-bold text-slate-700 truncate block">fb_conversion_top_products</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Origen</span>
                                <span className="text-[10px] font-bold text-slate-700 truncate block">Facebook Ads</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">UTM Source</span>
                                <span className="text-[10px] font-bold text-slate-700 truncate block">meta</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">UTM Medium</span>
                                <span className="text-[10px] font-bold text-slate-700 truncate block">paid_social</span>
                            </div>
                        </div>
                    </section>

                    {/* Fraud Risk */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Riesgo de Fraude (IA)</h3>
                        </div>
                        <div className={cn(
                            "rounded-2xl p-4 flex items-center justify-between border",
                            order.riskScore > 7 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    order.riskScore > 7 ? "bg-rose-100" : "bg-emerald-100"
                                )}>
                                    <ShieldAlert className={cn("w-5 h-5", order.riskScore > 7 ? "text-rose-600" : "text-emerald-600")} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase">Puntuación: {order.riskScore}/10</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Análisis de comportamiento completado.</span>
                                </div>
                            </div>
                            <Badge className={cn(
                                "border-none shadow-none font-black text-[9px] uppercase",
                                order.riskScore > 7 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                            )}>
                                {order.riskScore > 7 ? "Riesgo Alto" : "Seguro"}
                            </Badge>
                        </div>
                    </section>
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Pedido</span>
                    <span className="text-xl font-black text-slate-900 tracking-tighter">€{(order.totalPrice || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                        Editar Pedido
                    </Button>
                    <Button className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                        Imprimir Etiqueta
                    </Button>
                </div>
            </div>

            {/* Backdrop for mobile (optional, but good for UX) */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm -z-10" onClick={onClose} />
            )}
        </div>
    );
}
