
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Search, Filter, Download, Upload, RefreshCw, MoreHorizontal,
    ChevronRight, ChevronDown, CheckCircle2, Package,
    Truck, FileText, Globe, Clock, ShoppingCart, UserX,
    BarChart3, Users, Activity, Zap, Mail, MessageCircle, TrendingUp, Copy,
    Phone, AlertTriangle, AlertCircle, MapPin, ExternalLink, ShieldCheck, CreditCard, ShoppingBag, X,
    LayoutGrid, List, MessageSquare, PhoneCall, Edit3, Send, History, Navigation,
    BookOpen, Book, Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Sheet, SheetContent, SheetTitle, SheetDescription, SheetHeader
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BadgeStatus } from "@/components/ui/badge-status";
import { SystemStatus } from "@/components/logistics/system-status";

// Actions
import {
    getLocalOrders, syncRecentShopifyOrders, syncBeepingStatuses,
    autoGeocodeAllPending, cancelOrder, getOrderEvents, updateOrderAddressMaster,
    importCRMFile, getTotalOrdersCount, markAsDuplicate
} from "./actions";
import { AgentPerformance } from "@/components/logistics/agent-performance";
import { useProduct } from "@/context/ProductContext";

export default function OrdersPage() {
    const { productId, product } = useProduct();
    const [orders, setOrders] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("REGULAR");
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
    const [isCompact, setIsCompact] = useState(true);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderEvents, setOrderEvents] = useState<any[]>([]);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isMetricsOpen, setIsMetricsOpen] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [totalOrders, setTotalOrders] = useState(0);

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const dateParam = searchParams?.get('date');

    const loadOrders = async (reset = false, silent = false) => {
        const currentPage = reset ? 1 : page;
        if (reset) setPage(1);

        if (!silent) setIsSyncing(true);
        try {
            const data = await getLocalOrders((currentPage - 1) * pageSize, pageSize, 'desc', activeTab, dateParam || undefined, productId || undefined);
            const total = await getTotalOrdersCount(activeTab); // Note: total might need product filter too?
            setOrders(data || []);
            setTotalOrders(total);
            setLastUpdated(new Date());
        } catch (e) {
            if (!silent) toast.error("Error al cargar pedidos");
        } finally {
            if (!silent) setIsSyncing(false);
        }
    };

    useEffect(() => { loadOrders(); }, [activeTab, page, dateParam, productId]);

    // AUTO-SYNC HOOK: Real-time updates for New Orders & Logistics
    useEffect(() => {
        // Initial check on mount
        const runAutoSync = async () => {
            console.log("[Auto-Sync] Checking for new orders & status updates...");
            try {
                // 1. Pull new orders + Apply Geocoding/Payment Rules
                await syncRecentShopifyOrders(20);

                // 2. Update statuses for active orders
                await syncBeepingStatuses(20);

                // 3. Refresh the table view silently
                await loadOrders(false, true);
                setLastUpdated(new Date());
            } catch (e) {
                console.error("[Auto-Sync] Error:", e);
            }
        };

        runAutoSync();

        const interval = setInterval(runAutoSync, 60000); // Every 60s
        return () => clearInterval(interval);
    }, []);

    const handleGenerateEbook = async (order: any) => {
        toast.promise(import('./actions').then(a => (a as any).generateEbookAction({
            title: `Guía Maestra: Máximo rendimiento con ${order.productTitle || "tu compra"}`,
            productName: order.productTitle || "Producto Premium",
            theme: "Fidelización y Valor Agregado",
            targetAudience: "Clientes de Nano Banana",
            tone: "EDUCA"
        })), {
            loading: "Generando Ebook Personalizado con Gemini...",
            success: (res: any) => {
                window.open(res.url, '_blank');
                return "Ebook generado con éxito!";
            },
            error: "Error al generar ebook"
        });
    };

    // File Upload Ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        toast.promise(importCRMFile(formData), {
            loading: 'Analizando Hoja de Control...',
            success: (data) => {
                loadOrders(true);
                return data.message;
            },
            error: 'Error al importar archivo'
        });

        // Reset input
        e.target.value = "";
    };

    const toggleRow = async (id: string) => {
        if (expandedRows.includes(id)) {
            setExpandedRows(expandedRows.filter(rowId => rowId !== id));
        } else {
            setExpandedRows([...expandedRows, id]);
            const events = await getOrderEvents(id);
            setOrderEvents(events);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = (o.orderNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.customerPhone || "").includes(searchTerm);
            return matchesSearch;
        });
    }, [orders, searchTerm]);

    const totalPages = Math.ceil(totalOrders / pageSize);

    return (
        <div className={cn(
            "max-w-full min-h-screen bg-background text-foreground transition-all flex flex-col",
            isCompact ? "p-2 sm:p-4 gap-4" : "p-6 sm:p-8 gap-8"
        )}>
            {/* STICKY HEADER MÓVIL / DESKTOP */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl shadow-sm">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                        <ShoppingBag className="text-primary-foreground h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase italic leading-none">Command Center</h1>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {totalOrders} Pedidos Totales | Página {page} de {totalPages || 1}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en esta página..."
                            className="pl-10 h-10 rounded-xl bg-card border-border text-xs font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suppressHydrationWarning
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            toast.promise(autoGeocodeAllPending(), {
                                loading: "Geocodificando pedidos pendientes...",
                                success: (res: any) => res.message,
                                error: "Error en geocodificación"
                            });
                        }}
                        className="h-10 px-4 border-emerald-500/50 text-emerald-500 font-black uppercase text-[10px] tracking-widest rounded-xl"
                    >
                        <MapPin className="h-4 w-4 mr-2" />
                        Geocode All
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCompact(!isCompact)}
                        className="h-10 w-10 rounded-xl border-border bg-card"
                    >
                        {isCompact ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    </Button>

                    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 h-10">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => setIsImportOpen(true)}>
                            <Upload className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => toast.info("Exportando CSV...")}>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>

                    <Sheet open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <SheetContent className="w-full sm:max-w-md bg-background border-l border-border">
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-xl font-black uppercase italic">Importar Hoja de Control</SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground font-medium">
                                    Sube tu CSV/Excel maestro para actualizar estados de logística, incidencias y finanzas.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 transition-colors bg-muted/20">
                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-foreground">Arrastra tu archivo aquí</p>
                                        <p className="text-[10px] text-muted-foreground">Formatos: .csv, .txt (Delimitado por ; o ,)</p>
                                    </div>
                                    <Button size="sm" className="mt-2 h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => fileInputRef.current?.click()}>
                                        Seleccionar Archivo
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv,.txt"
                                        onChange={handleImportFile}
                                    />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Auto-Sync Indicator */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
                    </div>

                    <Button
                        onClick={async () => {
                            setIsSyncing(true);
                            try {
                                const res = await syncRecentShopifyOrders();
                                if (res.success) {
                                    toast.success(`Sincronizados ${res.count} pedidos recientes.`);
                                    await loadOrders(true);
                                } else {
                                    toast.error(res.message);
                                    setIsSyncing(false);
                                }
                            } catch (e) {
                                toast.error("Error de conexión");
                                setIsSyncing(false);
                            }
                        }}
                        className="h-10 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-500/20"
                    >
                        {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                        Sync Recent
                    </Button>

                    <Button
                        onClick={async () => {
                            setIsSyncing(true);
                            toast.info("Iniciando Sincronización PROFUNDA (Esto puede tardar)...");
                            // We need to fetch the store ID first - usually we'd pass it or have the action find it
                            // For simplicity, let's assume the action finds the active connection
                            const res = await (import('./actions').then(a => a.syncShopifyHistory('')));
                            if (res.success) {
                                toast.success(res.message);
                                loadOrders(true);
                            } else {
                                toast.error(res.message);
                            }
                            setIsSyncing(false);
                        }}
                        variant="outline"
                        className="h-10 px-4 border-indigo-500/50 text-indigo-500 font-black uppercase text-[10px] tracking-widest rounded-xl"
                    >
                        <History className="h-4 w-4 mr-2" />
                        Deep Sync
                    </Button>

                    <Button
                        onClick={async () => {
                            setIsSyncing(true);
                            toast.info("Geocodificando historial completo...");
                            const res = await autoGeocodeAllPending(0); // 0 = unlimited
                            if (res.success) toast.success(`Geocodificación completada: ${res.count} pedidos.`);
                            loadOrders(true);
                            setIsSyncing(false);
                        }}
                        className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                        <MapPin className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                        Geocode All
                    </Button>

                    <Button
                        onClick={async () => {
                            setIsSyncing(true);
                            toast.info("Sincronizando transportistas (Historial completo)...");
                            const res = await syncBeepingStatuses(0); // 0 = unlimited
                            toast.success(res.message);
                            loadOrders(true);
                            setIsSyncing(false);
                        }}
                        className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest rounded-xl"
                    >
                        <Truck className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                        Sync Carriers
                    </Button>

                    <Button
                        onClick={() => loadOrders(true)}
                        className="h-10 px-4 bg-card border border-border text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-muted"
                    >
                        <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                    </Button>
                </div>
            </header >

            {/* INTEGRATION HEALTH MONITOR */}
            < div className="px-6 sm:px-8 mt-2" >
                <SystemStatus totalOrders={totalOrders} lastSync={lastUpdated} />
            </div >

            {/* QUEUE TABS */}
            < div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8" >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-card border border-border p-1 rounded-2xl h-14 overflow-x-auto justify-start">
                        <TabsTrigger value="REGULAR" className="rounded-xl font-black text-[10px] uppercase px-6 h-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Confirmados</TabsTrigger>
                        <TabsTrigger value="DUPLICATE" className="rounded-xl font-black text-[10px] uppercase px-6 h-full data-[state=active]:bg-background data-[state=active]:text-orange-500">Duplicados</TabsTrigger>
                        <TabsTrigger value="ABANDONED" className="rounded-xl font-black text-[10px] uppercase px-6 h-full data-[state=active]:bg-background data-[state=active]:text-rose-500">Abandonos</TabsTrigger>
                        <TabsTrigger value="DRAFT" className="rounded-xl font-black text-[10px] uppercase px-6 h-full data-[state=active]:bg-background data-[state=active]:text-amber-500">Borradores</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* PAGINATION CONTROLS */}
                <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-2xl h-14 px-4 shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === 1 || isSyncing}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="h-10 rounded-xl font-black text-[10px] uppercase"
                    >
                        Anterior
                    </Button>
                    <div className="h-8 w-[1px] bg-border mx-2" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground w-20 text-center">Pág {page} / {totalPages || 1}</span>
                    <div className="h-8 w-[1px] bg-border mx-2" />
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === totalPages || isSyncing}
                        onClick={() => setPage(p => p + 1)}
                        className="h-10 rounded-xl font-black text-[10px] uppercase"
                    >
                        Siguiente
                    </Button>
                </div>
            </div >

            {/* MAIN DATA TABLE */}
            < div className="bg-card rounded-[2rem] border border-border shadow-xl overflow-hidden flex-1 mx-6 sm:mx-8 mb-8" >
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-b border-border hover:bg-transparent">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest py-4">Pedido / Fecha</TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cliente / ID</TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado / Courier</TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tracking / Riesgo</TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Origen / Agente</TableHead>
                                <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right">Finanzas / Profit</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <TableRow
                                        className={cn(
                                            "group cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-all",
                                            isCompact ? "h-14" : "h-20",
                                            expandedRows.includes(order.id) && "bg-muted/50"
                                        )}
                                        onClick={() => toggleRow(order.id)}
                                    >
                                        <TableCell className="w-10 text-center">
                                            {expandedRows.includes(order.id) ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </TableCell>

                                        {/* PEDIDO / FECHA */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black tracking-tighter italic">{order.orderNumber}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: es })}</span>
                                            </div>
                                        </TableCell>

                                        {/* CLIENTE / ID */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase text-foreground truncate max-w-[150px]">{order.customerName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-primary">{order.customerPhone}</span>
                                                    {order.shopifyId && <span className="text-[8px] font-medium text-muted-foreground">ID: {order.shopifyId.split('/').pop()}</span>}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* ESTADO / COURIER */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <BadgeStatus status={order.logisticsStatus || "PENDING"} dot />
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">{order.carrier || "Sin asignar"}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* TRACKING / RIESGO */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {order.trackingCode ? (
                                                    <a
                                                        href={order.trackingUrl || "#"}
                                                        target="_blank"
                                                        className="text-[10px] font-black text-indigo-500 hover:underline flex items-center gap-1 uppercase"
                                                    >
                                                        {order.trackingCode} <ExternalLink className="h-2 w-2" />
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Pendiente</span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        order.riskLevel === "HIGH" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" :
                                                            order.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                                                    )} />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">{order.riskLevel || "LOW"}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* ORIGEN / AGENTE */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] font-bold uppercase truncate max-w-[100px]">{order.utmSource || "Directo"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{order.assignedTo || "Auto"}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* FINANZAS / PROFIT */}
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] font-black px-1.5 h-4 rounded-md uppercase flex items-center shadow-sm",
                                                        order.paymentMethod === "COD" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                    )}>
                                                        {order.paymentMethod === "COD" ? "Reembolso" : "Pagado"}
                                                    </span>
                                                    <span className="text-sm font-black italic tracking-tighter text-foreground">€{order.totalPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={cn(
                                                        "text-[9px] font-black px-1.5 h-4 border-none uppercase shadow-sm",
                                                        (order.realProfit || order.estimatedProfit || 0) > 20 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        €{(order.realProfit || order.estimatedProfit || 0).toFixed(1)} PFT
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg"
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {/* EXPANDED ROW: QUICK COMMAND & TIMELINE */}
                                    {expandedRows.includes(order.id) && (
                                        <TableRow className="bg-muted/20 border-b border-border/50">
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-1 duration-300">
                                                    {/* QUICK ACTIONS & INFO */}
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <QuickAction icon={MessageSquare} label="WA" color="bg-[#25D366]" onClick={() => window.open(`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}`, '_blank')} />
                                                            <QuickAction icon={PhoneCall} label="Zadarma" color="bg-primary" onClick={() => toast.info("Iniciando llamada...")} />
                                                            <QuickAction icon={Edit3} label="Editar" color="bg-amber-500" onClick={() => setSelectedOrder(order)} />
                                                            <QuickAction icon={Navigation} label="Mapas" color="bg-blue-600" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.addressLine1 + ' ' + order.city)}`, '_blank')} />
                                                        </div>

                                                        <div className="bg-card/50 p-4 rounded-2xl border border-border space-y-4">
                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resumen de Productos</h4>
                                                            {(order.items || []).map((item: any) => (
                                                                <div key={item.id} className="flex justify-between items-center text-[11px]">
                                                                    <span className="font-bold text-foreground truncate">{item.quantity}x {item.title}</span>
                                                                    <span className="font-black tabular-nums">€{item.totalPrice.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    toast.promise(import("./actions").then(m => m.resendTrackingNotification(order.id)).then(res => {
                                                                        if (!res.success) throw new Error(res.message);
                                                                        return res;
                                                                    }), {
                                                                        loading: "Reenviando notificación...",
                                                                        success: (data) => data.message,
                                                                        error: (err) => err.message
                                                                    });
                                                                }}
                                                                className="flex-1 h-10 bg-primary text-primary-foreground font-black text-[10px] uppercase rounded-xl"
                                                            >
                                                                Reenviar Tracking
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    toast.promise(import("./actions").then(m => m.markIncidence(order.id)).then(res => {
                                                                        if (!res.success) throw new Error(res.message);
                                                                        return res;
                                                                    }), {
                                                                        loading: "Marcando incidencia...",
                                                                        success: (data) => data.message,
                                                                        error: (err) => err.message
                                                                    });
                                                                }}
                                                                variant="outline"
                                                                className="flex-1 h-10 border-border bg-card font-black text-[10px] uppercase rounded-xl"
                                                            >
                                                                Marcar Incidencia
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    toast.promise(markAsDuplicate(order.id), {
                                                                        loading: "Marcando como duplicado...",
                                                                        success: () => { loadOrders(); return "Pedido marcado como duplicado"; },
                                                                        error: "Error al marcar duplicado"
                                                                    });
                                                                }}
                                                                variant="outline"
                                                                className="flex-1 h-10 border-orange-500/50 text-orange-600 bg-orange-500/5 font-black text-[10px] uppercase rounded-xl"
                                                            >
                                                                <Copy className="h-4 w-4 mr-2" /> Es Duplicado
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleGenerateEbook(order)}
                                                                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase rounded-xl"
                                                            >
                                                                <BookOpen className="h-4 w-4 mr-2" /> Ebook Valor
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* TIMELINE */}
                                                    <div className="bg-card/30 rounded-2xl border border-border flex flex-col h-[300px]">
                                                        <div className="p-4 border-b border-border flex items-center justify-between">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <History className="h-3 w-3 text-primary" /> Timeline de Eventos
                                                            </h4>
                                                            <Badge className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 border-none">Sync OK</Badge>
                                                        </div>
                                                        <ScrollArea className="flex-1 p-4">
                                                            <div className="space-y-4 relative">
                                                                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
                                                                {orderEvents.length > 0 ? orderEvents.map((evt) => (
                                                                    <div key={evt.id} className="relative pl-8">
                                                                        <div className="absolute left-1.5 top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-foreground">{evt.type}</span>
                                                                            <p className="text-[11px] text-muted-foreground mt-0.5">{evt.description}</p>
                                                                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase mt-1">{format(new Date(evt.timestamp), "HH:mm:ss", { locale: es })} • {evt.source}</span>
                                                                        </div>
                                                                    </div>
                                                                )) : (
                                                                    <div className="text-center py-10 opacity-30 select-none">
                                                                        <Clock className="mx-auto h-8 w-8 mb-2" />
                                                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin eventos registrados</p>
                                                                    </div>
                                                                )}
                                                                {/* Last Shopify creation event placeholder if no events */}
                                                                <div className="relative pl-8">
                                                                    <div className="absolute left-1.5 top-1 h-2 w-2 rounded-full bg-muted ring-4 ring-background" />
                                                                    <div className="flex flex-col opacity-60">
                                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-foreground">ORDER_CREATED</span>
                                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Pedido recibido desde Shopify</p>
                                                                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase mt-1">{format(new Date(order.createdAt), "HH:mm:ss", { locale: es })} • SHOPIFY</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div >

            {/* FULL DETAIL SHEET (FOR COMPLEX EDITS) */}
            < Sheet open={!!selectedOrder
            } onOpenChange={() => setSelectedOrder(null)}>
                <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 border-l border-border bg-background">
                    {selectedOrder && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-muted flex items-center justify-center rounded-2xl">
                                        <Package className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">#{selectedOrder.orderNumber}</SheetTitle>
                                        <BadgeStatus status={selectedOrder.status} />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-12 w-12 rounded-full border border-border hover:bg-muted">
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-8">
                                    {/* ADDRESS EDITOR WRITE-BACK */}
                                    <section className="space-y-4 bg-muted/30 p-6 rounded-[2rem] border border-border">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" /> Dirección de Entrega
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase text-muted-foreground">Dirección Completa</Label>
                                                <Input
                                                    defaultValue={selectedOrder.addressLine1}
                                                    className="h-12 rounded-xl border-border bg-card font-bold"
                                                    onBlur={(e) => {
                                                        const newVal = e.target.value;
                                                        if (newVal !== selectedOrder.addressLine1) {
                                                            toast.promise(updateOrderAddressMaster(selectedOrder.id, { addressLine1: newVal }), {
                                                                loading: 'Sincronizando con Logistics...',
                                                                success: 'Dirección corregida y enviada.',
                                                                error: 'Error de sincronización.'
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Ciudad</Label>
                                                    <Input
                                                        defaultValue={selectedOrder.city}
                                                        className="h-10 rounded-xl border-border bg-card font-bold"
                                                        onBlur={(e) => updateOrderAddressMaster(selectedOrder.id, { city: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">C.P.</Label>
                                                    <Input
                                                        defaultValue={selectedOrder.zip}
                                                        className="h-10 rounded-xl border-border bg-card font-bold"
                                                        onBlur={(e) => updateOrderAddressMaster(selectedOrder.id, { zip: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* INTERNAL NOTES */}
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" /> Notas de Gestión
                                        </h3>
                                        <textarea
                                            className="w-full h-32 p-4 bg-muted/20 border border-border rounded-2xl text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Añade una nota interna para el equipo..."
                                            defaultValue={selectedOrder.notes}
                                            onBlur={(e) => {
                                                const newVal = e.target.value;
                                                import('./actions').then(m => m.updateOrderNotes(selectedOrder.id, newVal)).then(() => toast.success("Notas guardadas"));
                                            }}
                                        />
                                        <div className="flex justify-end">
                                            <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Auto-guardado al salir</p>
                                        </div>
                                    </section>

                                    {/* CRITICAL ACTIONS */}
                                    <section className="pt-10 border-t border-border">
                                        <Button variant="destructive" className="w-full h-14 rounded-xl font-black uppercase text-[11px] tracking-widest" onClick={() => cancelOrder(selectedOrder.id).then(() => { toast.success("Pedido cancelado"); setSelectedOrder(null); })}>
                                            Anular Pedido en Shopify
                                        </Button>
                                    </section>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </SheetContent>
            </Sheet >

            {/* AGENT PERFORMANCE SHEET */}
            < Sheet open={isMetricsOpen} onOpenChange={setIsMetricsOpen} >
                <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] border-t border-primary/20 bg-background/95 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                    <BarChart3 className="h-6 w-6 text-primary" /> Rendimiento de Equipo
                                </SheetTitle>
                                <p className="text-xs text-muted-foreground">Métricas calculadas en tiempo real basado en la Hoja de Control y estado actual.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsMetricsOpen(false)} className="rounded-full bg-muted">
                                <ChevronDown className="h-6 w-6" />
                            </Button>
                        </div>
                        <AgentPerformance />
                    </div>
                </SheetContent>
            </Sheet >

            {/* MOBILE NAVIGATION TABS (STICKY BOTTOM) */}
            < footer className="sm:hidden sticky bottom-4 inset-x-4 bg-background/90 backdrop-blur-lg border border-border p-2 rounded-2xl shadow-2xl flex items-center justify-around z-50" >
                <MobileTabItem icon={ShoppingCart} label="Pedidos" active={activeTab === 'REGULAR'} onClick={() => setActiveTab('REGULAR')} />
                <MobileTabItem icon={AlertTriangle} label="Incidencias" active={false} onClick={() => toast.info("Filtrando incidencias...")} />
                <MobileTabItem icon={MessageCircle} label="Inbox" active={false} onClick={() => toast.info("Cargando Inbox...")} />
                <MobileTabItem icon={BarChart3} label="Métricas" active={isMetricsOpen} onClick={() => setIsMetricsOpen(true)} />
            </footer >
        </div >
    );
}

function QuickAction({ icon: Icon, label, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl text-white transition-all active:scale-95 shadow-lg",
                color
            )}
        >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase">{label}</span>
        </button>
    );
}

function MobileTabItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            <span className="text-[8px] font-black uppercase">{label}</span>
        </button>
    );
}
