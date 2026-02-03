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
        <div className="space-y-10 p-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* HEADER AREA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link href="/finances" className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 mb-3 transition-all">
                        <ArrowLeft className="h-3 w-3" /> Dashboard Global
                    </Link>
                    <h1 className="text-6xl font-black tracking-tighter italic uppercase text-slate-950">Master <span className="text-indigo-600">Ledger</span></h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] ml-1">Daily Micro-Accounting & Financial Evidence</p>
                </div>
                <div className="flex gap-4">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3">
                                <Plus className="h-5 w-5" /> NUEVO MOVIMIENTO
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-8 bg-white overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Wallet className="h-40 w-40 text-indigo-600" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase italic tracking-tight">Registrar Operación</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Añadir entrada manual al libro mayorista</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Tipo</Label>
                                        <Select value={newEntry.type} onValueChange={(val: any) => setNewEntry({ ...newEntry, type: val })}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                <SelectItem value="EXPENSE" className="font-bold">Gasto 🔻</SelectItem>
                                                <SelectItem value="INCOME" className="font-bold">Ingreso 🔼</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Categoría</Label>
                                        <Select value={newEntry.category} onValueChange={(val: any) => setNewEntry({ ...newEntry, category: val })}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                <SelectItem value="AD_SPEND" className="font-bold">Marketing Ads</SelectItem>
                                                <SelectItem value="LOGISTICS" className="font-bold">Logística</SelectItem>
                                                <SelectItem value="COGS" className="font-bold">Producto/COGS</SelectItem>
                                                <SelectItem value="SOFTWARE" className="font-bold">Software/Apps</SelectItem>
                                                <SelectItem value="SALARY" className="font-bold">Nóminas/Sueldos</SelectItem>
                                                <SelectItem value="OTROS" className="font-bold">Otros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Monto (€)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="h-14 rounded-xl border-slate-100 bg-slate-50 font-black text-xl px-6 focus:ring-indigo-500/20"
                                        value={newEntry.amount}
                                        onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Descripción</Label>
                                    <Input
                                        placeholder="Ej: Pago Shopify Mensual"
                                        className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6"
                                        value={newEntry.description}
                                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="w-full h-14 bg-black hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-widest">
                                    EJECUTAR ENTRADA
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all">
                        <Download className="h-4 w-4" /> EXPORTAR CSV
                    </Button>
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-none bg-emerald-50 shadow-xl shadow-emerald-100/50 p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase px-3 py-1">Income Mensual</Badge>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-emerald-950 tracking-tighter italic">{formatCurrency(stats?.monthlyIncome || 0)}</p>
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Bruto desde 1 de {format(new Date(), "MMMM", { locale: es })}</p>
                    </div>
                </Card>
                <Card className="rounded-[2rem] border-none bg-rose-50 shadow-xl shadow-rose-100/50 p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <Badge className="bg-rose-600 text-white font-black text-[9px] uppercase px-3 py-1">Gastos Mensuales</Badge>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-rose-950 tracking-tighter italic">{formatCurrency(stats?.monthlyExpenses || 0)}</p>
                        <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mt-1">Acumulado en el mes actual</p>
                    </div>
                </Card>
                <Card className="rounded-[2rem] border-none bg-slate-900 shadow-2xl p-8 space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Receipt className="h-24 w-24 text-white" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <Badge className="bg-indigo-500 text-white font-black text-[9px] uppercase px-3 py-1">Balance Neto</Badge>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white tracking-tighter italic">{formatCurrency(stats?.monthlyBalance || 0)}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">P&L Consolidado del Periodo</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* LEDGER TABLE */}
            <Card className="premium-card border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Transacciones Recientes</h3>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest">
                            <Filter className="h-3.5 w-3.5 mr-2" /> Filtrar
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha / Ref</TableHead>
                                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Origen</TableHead>
                                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción</TableHead>
                                <TableHead className="py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Monto Final</TableHead>
                                <TableHead className="py-6 text-right pr-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                                    <TableCell className="py-8 px-10">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{format(new Date(entry.date), "dd MMM yyyy", { locale: es })}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                                                {entry.orderId ? `ORDER_REF: #${entry.orderId.slice(-8).toUpperCase()}` : 'MANUAL_ENTRY'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`
                                            ${entry.category === 'REVENUE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                entry.category === 'AD_SPEND' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    entry.category === 'SALARY' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-100'} 
                                            border font-black text-[8px] px-2.5 py-1 rounded-md uppercase tracking-widest
                                        `}>
                                            {entry.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 md:flex hidden items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all`}>
                                                {entry.type === 'INCOME' ? <ArrowUpCircle className="h-5 w-5 text-emerald-500" /> : <ArrowDownCircle className="h-5 w-5 text-rose-500" />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 leading-tight">{entry.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-lg font-black tracking-tighter italic ${entry.amount > 0 ? 'text-emerald-600' : 'text-slate-950'}`}>
                                            {formatCurrency(entry.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                                <Info className="h-5 w-5" />
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
