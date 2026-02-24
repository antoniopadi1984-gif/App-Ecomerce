"use client";

import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Download, Filter,
    ArrowUpCircle, ArrowDownCircle,
    Receipt, Info, Plus,
    TrendingUp, TrendingDown, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createLedgerEntry, getLedgerStats } from "./actions";
import { toast } from "sonner";

export default function LedgerPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [newEntry, setNewEntry] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        category: 'OTROS',
        amount: '',
        description: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/finances/ledger");
            if (!res.ok) {
                console.error("Ledger fetch failed:", res.status, res.statusText);
                throw new Error("Error al cargar datos");
            }
            const data = await res.json();

            if (Array.isArray(data)) {
                setEntries(data);
            } else {
                console.error("Ledger data is not an array:", data);
                setEntries([]);
                toast.error("Error de formato en datos del Ledger");
            }

            const statistics = await getLedgerStats();
            setStats(statistics);
        } catch (e) {
            console.error("Ledger load error:", e);
            setEntries([]);
            toast.error("Error al cargar datos del Ledger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async () => {
        if (!newEntry.amount || !newEntry.description) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        const res = await createLedgerEntry({
            ...newEntry,
            amount: parseFloat(newEntry.amount)
        });

        if (res.success) {
            toast.success("Entrada registrada correctamente");
            setOpen(false);
            setNewEntry({ type: 'EXPENSE', category: 'OTROS', amount: '', description: '' });
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* HEADER AREA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <Link href="/finances" className="flex items-center gap-1.5 text-rose-600 font-black text-[9px] uppercase tracking-widest hover:opacity-70 mb-2 transition-all">
                        <ArrowLeft className="h-3 w-3" /> Dashboard Global
                    </Link>
                    <h1 className="text-3xl font-black tracking-tighter italic uppercase text-slate-950 leading-none">Master <span className="text-rose-600">Ledger</span></h1>
                    <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.3em] ml-0.5 mt-1">Daily Micro-Accounting & Financial Evidence</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] tracking-widest uppercase">
                                <Plus className="h-4 w-4" /> MOVIMIENTO
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-lg border-none shadow-sm p-6 bg-white overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Wallet className="h-40 w-40 text-rose-600" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Registrar Operación</DialogTitle>
                                <DialogDescription className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Añadir entrada manual al libro mayorista</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 relative z-10">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Tipo</Label>
                                        <Select value={newEntry.type} onValueChange={(val: any) => setNewEntry({ ...newEntry, type: val })}>
                                            <SelectTrigger className="h-10 rounded-lg border-slate-100 bg-slate-50 font-bold text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-none shadow-sm">
                                                <SelectItem value="EXPENSE" className="font-bold text-xs text-rose-600">Gasto 🔻</SelectItem>
                                                <SelectItem value="INCOME" className="font-bold text-xs text-emerald-600">Ingreso 🔼</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Categoría</Label>
                                        <Select value={newEntry.category} onValueChange={(val: any) => setNewEntry({ ...newEntry, category: val })}>
                                            <SelectTrigger className="h-10 rounded-lg border-slate-100 bg-slate-50 font-bold text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-none shadow-sm">
                                                <SelectItem value="AD_SPEND" className="font-bold text-xs">Marketing Ads</SelectItem>
                                                <SelectItem value="LOGISTICS" className="font-bold text-xs">Logística</SelectItem>
                                                <SelectItem value="COGS" className="font-bold text-xs">Producto/COGS</SelectItem>
                                                <SelectItem value="SOFTWARE" className="font-bold text-xs">Software/Apps</SelectItem>
                                                <SelectItem value="SALARY" className="font-bold text-xs">Nóminas/Sueldos</SelectItem>
                                                <SelectItem value="OTROS" className="font-bold text-xs">Otros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Monto (€)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="h-10 rounded-lg border-slate-100 bg-slate-50 font-black text-lg px-4 focus:ring-rose-500/20"
                                        value={newEntry.amount}
                                        onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Descripción</Label>
                                    <Input
                                        placeholder="Ej: Pago Shopify Mensual"
                                        className="h-10 rounded-lg border-slate-100 bg-slate-50 font-bold text-xs px-4"
                                        value={newEntry.description}
                                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="w-full h-10 bg-black hover:bg-slate-800 text-white font-black rounded-lg text-[10px] uppercase tracking-widest">
                                    EJECUTAR ENTRADA
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="h-10 px-4 rounded-lg border-slate-200 font-black text-[9px] uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all">
                        <Download className="h-3.5 w-3.5" /> EXPORTAR
                    </Button>
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-lg border border-slate-100 bg-white p-6 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="bg-slate-50 text-slate-900 font-black text-[8px] uppercase px-2 py-0.5 rounded-sm border-slate-200">Monthly Income</Badge>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-950 tracking-tighter italic leading-none">{formatCurrency(stats?.monthlyIncome || 0)}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">Real-time Gross Revenue</p>
                    </div>
                </Card>
                <Card className="rounded-lg border border-slate-100 bg-white p-6 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="bg-slate-50 text-slate-900 font-black text-[8px] uppercase px-2 py-0.5 rounded-sm border-slate-200">Monthly Expenses</Badge>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-950 tracking-tighter italic leading-none">{formatCurrency(stats?.monthlyExpenses || 0)}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">Consolidated Deductions</p>
                    </div>
                </Card>
                <Card className="rounded-lg border-none bg-slate-900 shadow-sm p-6 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Receipt className="h-16 w-16 text-white" />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <Badge className="bg-rose-500 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded-sm">Net Balance</Badge>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white tracking-tighter italic leading-none">{formatCurrency(stats?.monthlyBalance || 0)}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1.5 italic">Final P&L Reconciliation</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* LEDGER TABLE */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden rounded-lg bg-white">
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transacciones Recientes</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-[0.2em]">
                            <Filter className="h-3 w-3 mr-1.5" /> Filtrar
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="py-3 px-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Fecha / Ref</TableHead>
                                <TableHead className="py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Origen</TableHead>
                                <TableHead className="py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Descripción</TableHead>
                                <TableHead className="py-3 text-right text-[9px] font-black uppercase text-slate-400 tracking-widest">Monto Final</TableHead>
                                <TableHead className="py-3 text-right pr-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Detalles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-8 w-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.3em] text-[10px]">Consultando registros mayoristas...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Receipt className="h-16 w-16" />
                                            <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">No se encontraron transacciones</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : entries.map((entry) => (
                                <TableRow key={entry.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors group">
                                    <TableCell className="py-3 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">{format(new Date(entry.date), "dd MMM yyyy", { locale: es })}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic leading-none whitespace-nowrap">
                                                {entry.orderId ? `REF: #${entry.orderId.slice(-8).toUpperCase()}` : 'MANUAL_ENTRY'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-black text-[7px] px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                            {entry.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 md:flex hidden items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-slate-100 transition-all">
                                                {entry.type === 'INCOME' ? <ArrowUpCircle className="h-4 w-4 text-slate-900" /> : <ArrowDownCircle className="h-4 w-4 text-slate-400" />}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-1">{entry.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-black tracking-tighter italic text-slate-950">
                                            {formatCurrency(entry.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-200 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
