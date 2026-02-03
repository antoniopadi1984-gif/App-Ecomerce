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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-emerald-500" /> Gastos Fijos & Operativos
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Registra los gastos mensuales para un cálculo preciso del beneficio neto real.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-9 text-[10px] font-bold uppercase tracking-widest border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                        {syncing ? "Sincronizando..." : "Forzar Sincronización Total"}
                    </Button>

                    <Card className="bg-emerald-500/10 border-emerald-500/20 px-4 py-2 flex items-center gap-3">
                        <Calculator className="h-4 w-4 text-emerald-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-400/80 uppercase font-bold leading-none">Total Fijos / Mes</span>
                            <span className="text-lg font-bold text-emerald-400">€{totalMonthly.toLocaleString()}</span>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
                {/* Form Column */}
                <Card className="md:col-span-4 bg-gray-900/30 border-white/5 h-fit">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Registrar Gasto</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Nombre del Gasto</Label>
                            <Input placeholder="Ej: Apps de Reviews" className="h-8 text-xs bg-white/5 border-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground">Cantidad (€)</Label>
                                <Input type="number" placeholder="29.99" className="h-8 text-xs bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground">Categoría</Label>
                                <Select>
                                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                                        <SelectValue placeholder="Tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-950 border-white/10">
                                        {expenseCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button size="sm" className="w-full mt-2 h-8 text-xs gap-2">
                            <Plus className="h-3 w-3" /> Añadir Gasto
                        </Button>
                    </CardContent>
                </Card>

                {/* Table Column */}
                <Card className="md:col-span-8 bg-gray-900/30 border-white/5">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[10px] h-8 uppercase font-bold">Gasto</TableHead>
                                    <TableHead className="text-[10px] h-8 uppercase font-bold text-center">Categoría</TableHead>
                                    <TableHead className="text-[10px] h-8 uppercase font-bold text-right">Monto / Mes</TableHead>
                                    <TableHead className="text-[10px] h-8 uppercase font-bold w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((exp) => {
                                    const cat = expenseCategories.find(c => c.id === exp.category);
                                    return (
                                        <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                            <TableCell className="py-2">
                                                <span className="text-xs font-medium text-gray-200">{exp.name}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Badge variant="outline" className="text-[9px] h-5 border-white/10 bg-white/5 font-normal">
                                                    {cat?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <span className="text-xs font-bold text-emerald-400">€{exp.amount}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 active:opacity-50">
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
            <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-white/5 overflow-hidden p-0">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold">Impacto en beneficio diario</h4>
                            <p className="text-[11px] text-muted-foreground">Prorrateo de gastos en tus métricas diarias.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center md:text-right">
                            <span className="text-[10px] text-muted-foreground block">Coste Fijo / Día</span>
                            <span className="text-sm font-bold text-rose-400">€{(totalMonthly / 30).toFixed(2)}</span>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="text-[10px] text-muted-foreground block">Punto de Equilibrio (BEP)</span>
                            <span className="text-sm font-bold text-emerald-400">Actualizado</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
