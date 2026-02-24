"use client";

import { useState, useEffect } from "react";
import {
    Search, User, Phone, Mail, MapPin,
    History, MessageSquare, TrendingUp,
    ChevronRight, Filter, Download, Plus,
    Package, RefreshCw, MoreVertical, ExternalLink,
    CreditCard, Calendar, ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getCustomers, getCustomerDetail, syncCustomersFromOrders } from "./actions";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [query, setQuery] = useState("");
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadData();
    }, [query]);

    useEffect(() => {
        if (selectedId) loadDetail(selectedId);
    }, [selectedId]);

    async function loadData() {
        setLoading(true);
        const res = await getCustomers(query);
        if (res.success) setCustomers(res.data);
        setLoading(false);
    }

    async function loadDetail(id: string) {
        setLoadingDetail(true);
        const res = await getCustomerDetail(id);
        if (res.success) setDetail(res.data);
        setLoadingDetail(false);
    }

    async function handleSync() {
        setSyncing(true);
        const res = await syncCustomersFromOrders();
        if (res.success) {
            toast.success(`Sincronizados ${res.count} clientes correctamente`);
            loadData();
        } else {
            toast.error("Error al sincronizar: " + res.error);
        }
        setSyncing(false);
    }

    return (
        <PageShell>
            <ModuleHeader
                title="Base CRM"
                subtitle={`${customers.length} Clientes Unificados`}
                icon={User}
                actions={
                    <Button
                        variant="outline"
                        className="h-7 px-3 rounded-lg border-slate-200 bg-white text-slate-700 font-black uppercase text-[8px] tracking-widest shadow-xs hover:bg-slate-50 transition-all"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        <RefreshCw className={cn("h-3 w-3 mr-2 text-emerald-500", syncing && "animate-spin")} />
                        SYNC
                    </Button>
                }
            />

            <div className="flex-1 flex bg-white overflow-hidden relative border-t border-slate-200 min-h-[600px]">
                {/* LEFT: CUSTOMER LIST */}
                <div className={cn(
                    "flex flex-col border-r border-slate-100 bg-slate-50/20 transition-all duration-500",
                    selectedId ? "w-[400px]" : "w-full"
                )}>
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="BUSCAR POR NOMBRE, TLF O EMAIL..."
                                    className="h-10 pl-12 bg-white border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:ring-emerald-500/10 focus:border-emerald-500/50 shadow-sm"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-slate-200 bg-white">
                                <Filter className="h-4 w-4 text-slate-400" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-2 pb-8">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
                                ))
                            ) : customers.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                        <User className="h-8 w-8" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No se encontraron clientes</p>
                                    <Button size="sm" variant="ghost" className="text-emerald-600 font-bold text-[10px]" onClick={handleSync}>Intentar Sincronizar</Button>
                                </div>
                            ) : customers.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-all border flex gap-4 group",
                                        selectedId === c.id
                                            ? "bg-white border-emerald-100 shadow-sm ring-1 ring-emerald-500/10"
                                            : "bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:shadow-sm"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 border border-slate-100 shadow-xs">
                                        <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase italic">
                                            {c.name.slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-tight truncate",
                                                selectedId === c.id ? "text-emerald-600" : "text-slate-800"
                                            )}>
                                                {c.name}
                                            </span>
                                            <Badge variant="outline" className="text-[7px] font-black border-slate-100 text-slate-400 uppercase italic">
                                                {c.totalOrders} Pedidos
                                            </Badge>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2">{c.phone}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md">
                                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                                <span className="text-[9px] font-black text-slate-600 italic">€{c.totalSpent.toFixed(2)}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Último: {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 self-center transition-all",
                                        selectedId === c.id ? "text-emerald-500 translate-x-1" : "text-slate-200"
                                    )} />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT: CUSTOMER DETAIL PANEL */}
                <div className="flex-1 bg-white h-full relative overflow-hidden flex flex-col">
                    {selectedId ? (
                        loadingDetail ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <User className="h-8 w-8 text-slate-200" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Cargando Ficha 360º...</p>
                            </div>
                        ) : detail && (
                            <>
                                {/* PANEL HEADER */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-white rounded-lg border-2 border-slate-100 shadow-sm flex items-center justify-center relative">
                                            <User className="h-8 w-8 text-slate-300" />
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{detail.name}</h2>
                                                <Badge className="bg-slate-900 text-[10px] font-black uppercase italic px-3 h-6">Cliente VIP</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {detail.phone}</span>
                                                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {detail.email || 'SIN EMAIL'}</span>
                                                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {detail.city}, {detail.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2">
                                            <Download className="h-4 w-4" /> Exportar
                                        </Button>
                                        <Button className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm">
                                            <Plus className="h-4 w-4" /> Nuevo Pedido
                                        </Button>
                                    </div>
                                </div>

                                {/* PANEL CONTENT */}
                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-4">

                                        {/* KPIS ROW */}
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Ingreso Total', value: `€${detail.totalSpent.toFixed(2)}`, icon: TrendingUp, color: 'emerald' },
                                                { label: 'Pedidos', value: detail.totalOrders, icon: ShoppingBag, color: 'rose' },
                                                { label: 'Ticket Medio', value: `€${detail.avgTicket.toFixed(2)}`, icon: CreditCard, color: 'amber' },
                                                { label: 'Antigüedad', value: '142 Días', icon: Calendar, color: 'slate' },
                                            ].map((kpi, i) => (
                                                <Card key={i} className="p-3 border-slate-100 bg-slate-50/30 rounded-lg shadow-xs hover:shadow-sm transition-all border group">
                                                    <div className={cn("h-8 w-8 rounded-lg mb-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105", `bg-${kpi.color}-100 text-${kpi.color}-600`)}>
                                                        <kpi.icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{kpi.label}</p>
                                                    <p className="text-sm font-black text-slate-900 italic tracking-tight">{kpi.value}</p>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* TABS: HISTORY VS CONVERSATIONS */}
                                        <div className="flex gap-4">
                                            {/* ORDERS COLUMN */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3">
                                                        <History className="h-5 w-5 text-emerald-600" /> Historial de Compras
                                                    </h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {detail.orders.map((o: any) => (
                                                        <div key={o.id} className="p-4 bg-white border border-slate-100 rounded-lg hover:border-emerald-100 hover:shadow-sm transition-all group flex items-center justify-between">
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center font-black text-[9px] text-slate-400 uppercase italic">
                                                                    #{o.orderNumber}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none mb-1">Pedido Confirmado</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex items-center gap-6">
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-900 italic">€{o.totalPrice}</p>
                                                                    <Badge variant="outline" className="text-[7px] font-black border-slate-100 text-slate-400 mt-1 uppercase">COD</Badge>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 group-hover:text-emerald-600">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* CONVERSATION COLUMN (Preview) */}
                                            <div className="w-[450px] space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3">
                                                        <MessageSquare className="h-5 w-5 text-rose-600" /> Conversaciones Recientes
                                                    </h3>
                                                    <Button variant="link" className="text-[10px] font-black text-rose-600 uppercase tracking-widest gap-2">Ir al Inbox <ChevronRight className="h-3 w-3" /></Button>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 h-[500px] flex flex-col">
                                                    <ScrollArea className="flex-1 pr-4">
                                                        <div className="space-y-6">
                                                            {detail.messages?.length > 0 ? detail.messages.map((m: any) => (
                                                                <div key={m.id} className={cn(
                                                                    "flex flex-col gap-2 max-w-[85%]",
                                                                    m.sender === 'CUSTOMER' ? "self-start" : "self-end items-end ml-auto"
                                                                )}>
                                                                    <div className={cn(
                                                                        "p-3 text-[10px] font-black leading-relaxed shadow-xs uppercase tracking-tight",
                                                                        m.sender === 'CUSTOMER'
                                                                            ? "bg-white text-slate-700 rounded-lg rounded-tl-none border border-slate-200"
                                                                            : "bg-slate-900 text-emerald-400 rounded-lg rounded-tr-none italic"
                                                                    )}>
                                                                        {m.content}
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-slate-300 uppercase italic px-2">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )) : (
                                                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                                                                    <MessageSquare className="h-12 w-12" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin mensajes registrados</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            </div>
                                        </div>

                                        {/* NOTES SECTION */}
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Observaciones Técnicas / CRM</h3>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-rose-500/10 blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                                                <textarea
                                                    className="w-full h-[150px] bg-slate-50/50 border border-slate-100 rounded-lg p-4 text-sm font-medium text-slate-600 italic leading-relaxed focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none shadow-sm"
                                                    placeholder="Añade notas sobre el perfil psicológico del cliente, incidencias previas o acuerdos especiales..."
                                                    defaultValue={detail.notes}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm transition-all">
                                                    Actualizar Ficha
                                                </Button>
                                            </div>
                                        </section>
                                    </div>
                                </ScrollArea>
                            </>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20 text-center animate-in fade-in duration-1000">
                            <div className="relative mb-12 group">
                                <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />
                                <div className="h-24 w-24 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm relative z-10 group-hover:rotate-3 transition-transform duration-500">
                                    <User className="h-10 w-10 text-slate-200" />
                                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-slate-900 rounded-lg shadow-sm flex items-center justify-center -rotate-12">
                                        <ShoppingBag className="h-4 w-4 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Mestría en <span className="text-emerald-600">Relación</span></h2>
                            <p className="max-w-md text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-loose">Selecciona un cliente de la lista para acceder a su perfil psicológico, historial de consumo y transmisiones interceptadas.</p>

                            <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-2xl px-8">
                                {[
                                    { label: 'Visión 360º', icon: RefreshCw },
                                    { label: 'LTV Tracking', icon: TrendingUp },
                                    { label: 'WhatsApp Logs', icon: MessageSquare }
                                ].map((feat, i) => (
                                    <div key={i} className="p-4 bg-white rounded-lg border border-slate-100 flex flex-col items-center gap-2 shadow-xs group hover:border-emerald-200 transition-all">
                                        <feat.icon className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{feat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}

// Subcomponent for status Icons (simplified placeholder)
function CheckCircle({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    )
}
