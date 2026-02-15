"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    DollarSign,
    Store,
    AppWindow,
    Users,
    Calendar,
    Save,
    Calculator,
    RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const expenseCategories = [
    { id: "SOFTWARE", name: "Apps & Software", icon: AppWindow, color: "text-blue-400" },
    { id: "TEAM", name: "Personal / Salarios", icon: Users, color: "text-purple-400" },
    { id: "STORE", name: "Mantenimiento Tienda", icon: Store, color: "text-orange-400" },
    { id: "SERVICE", name: "Servicios Externos", icon: Calendar, color: "text-emerald-400" },
];

import { syncShopifyHistory } from "@/app/logistics/orders/actions";
import { toast } from "sonner";

export default function ExpensesPage() {
    const [syncing, setSyncing] = useState(false);
    const [expenses, setExpenses] = useState([
        { id: 1, name: "Suscripción Shopify", category: "STORE", amount: 39, date: "Mensual" },
        { id: 2, name: "Dropi Import Fee", category: "SOFTWARE", amount: 15, date: "Fijo" },
        { id: 3, name: "Sueldo Agente ATT (Laura)", category: "TEAM", amount: 1200, date: "Mensual" },
        { id: 4, name: "Google Drive Storage", category: "SOFTWARE", amount: 10, date: "Mensual" },
    ]);

    const totalMonthly = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncShopifyHistory("force-sync"); // StoreId handled internally via active connection
            if (res.success) {
                toast.success(res.message);
                // In a real app we would re-fetch expenses/finance stats here
            } else {
                toast.error("Error al sincronizar: " + res.message);
            }
        } catch (e) {
            toast.error("Fallo de conexión");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tighter italic uppercase text-slate-900 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-slate-900" /> Gastos Fijos <span className="text-slate-400">& Operativos</span>
                    </h2>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">Registra los gastos mensuales para un cálculo preciso del beneficio neto real.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-8 text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                        {syncing ? "Sincronizando..." : "Sincronización Total"}
                    </Button>

                    <Card className="bg-slate-900 border-none px-3 py-1.5 flex items-center gap-2.5 rounded-lg shadow-xl">
                        <Calculator className="h-3.5 w-3.5 text-slate-400" />
                        <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black leading-none tracking-widest">Total Fijos / Mes</span>
                            <span className="text-sm font-black text-white italic tracking-tighter mt-0.5">€{totalMonthly.toLocaleString()}</span>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
                {/* Form Column */}
                <Card className="md:col-span-4 bg-white border-slate-100 shadow-sm h-fit rounded-lg">
                    <CardHeader className="p-3 border-b border-slate-50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registrar Gasto</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Nombre del Gasto</Label>
                            <Input placeholder="Ej: Apps de Reviews" className="h-8 text-[11px] font-bold bg-slate-50 border-slate-100 rounded-lg px-3" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Cantidad (€)</Label>
                                <Input type="number" placeholder="29.99" className="h-8 text-[11px] font-black bg-slate-50 border-slate-100 rounded-lg px-3" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-0.5">Categoría</Label>
                                <Select>
                                    <SelectTrigger className="h-8 text-[11px] font-bold bg-slate-50 border-slate-100 rounded-lg px-3">
                                        <SelectValue placeholder="Tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                        {expenseCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-[11px] font-bold">{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button size="sm" className="w-full mt-2 h-8 text-[9px] font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-black rounded-lg">
                            <Plus className="h-3 w-3" /> Añadir Gasto
                        </Button>
                    </CardContent>
                </Card>

                {/* Table Column */}
                <Card className="md:col-span-8 bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-[9px] h-9 uppercase font-black tracking-widest text-slate-400 pl-4">Gasto</TableHead>
                                    <TableHead className="text-[9px] h-9 uppercase font-black tracking-widest text-slate-400 text-center">Categoría</TableHead>
                                    <TableHead className="text-[9px] h-9 uppercase font-black tracking-widest text-slate-400 text-right">Monto / Mes</TableHead>
                                    <TableHead className="text-[9px] h-9 uppercase font-black tracking-widest text-slate-400 w-[60px] pr-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((exp) => {
                                    const cat = expenseCategories.find(c => c.id === exp.category);
                                    return (
                                        <TableRow key={exp.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                            <TableCell className="py-2.5 pl-4">
                                                <span className="text-[11px] font-black text-slate-900 italic tracking-tight">{exp.name}</span>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-center">
                                                <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest h-4 px-1.5 border-none bg-slate-100 text-slate-600 rounded-sm">
                                                    {cat?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right">
                                                <span className="text-[11px] font-black text-slate-900 italic tracking-tighter">€{exp.amount}</span>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right pr-4">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {expenses.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                No hay gastos registrados para este mes.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Real-time Impact Card */}
            <Card className="bg-slate-900 border-none overflow-hidden rounded-lg shadow-xl shadow-slate-200/50">
                <div className="p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-white leading-none">Impacto en beneficio diario</h4>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Prorrateo de gastos en tus métricas diarias.</p>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        <div className="text-right">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">Coste Fijo / Día</span>
                            <span className="text-sm font-black text-white italic tracking-tighter leading-none">€{(totalMonthly / 30).toFixed(2)}</span>
                        </div>
                        <div className="text-right pr-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">Estado BEP</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Actualizado</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
