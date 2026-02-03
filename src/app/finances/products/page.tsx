"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Search, Truck, DollarSign, Package, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { getProductsWithFinance, updateProductFinance, getSuppliers, createSupplier, getDetailedStats } from "../actions";

export default function ProductFinancePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const loadData = async () => {
        const [pData, sData, stData] = await Promise.all([
            getProductsWithFinance(),
            getSuppliers(),
            getDetailedStats()
        ]);
        setProducts(pData);
        setSuppliers(sData);
        setStats(stData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setEditForm({
            unitCost: product.finance?.unitCost || 0,
            sellingPrice: product.finance?.sellingPrice || 0,
            shippingCost: product.finance?.shippingCost || 0,
            returnCost: product.finance?.returnCost || 0,
            isUpsell: product.finance?.isUpsell || false,
            supplierId: product.supplierId || "none"
        });
    };

    const handleSave = async (productId: string) => {
        await updateProductFinance(productId, {
            ...editForm,
            supplierId: editForm.supplierId === "none" ? undefined : editForm.supplierId
        });
        setEditingId(null);
        loadData(); // Refresh to get calculated stats
    };

    const handleCreateSupplier = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await createSupplier({ name: formData.get("name") as string });
        loadData();
    };

    const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-10 text-center">Cargando datos financieros...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Finanzas de Producto (COGS)</h1>
                    <p className="text-muted-foreground">Control de costes, proveedores y rentabilidad unitaria.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2"><Truck className="w-4 h-4" /> Nuevo Proveedor</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Añadir Proveedor</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSupplier} className="space-y-4">
                                <Input name="name" placeholder="Nombre Proveedor (ej: Alibaba Shenzhen)" required />
                                <Input name="email" placeholder="Email Contacto" />
                                <Button type="submit" className="w-full">Guardar</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-400">Rentabilidad Media</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            28.5% <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-400">Ticket Medio (PVP)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats?.productStats ? (stats.productStats.reduce((acc: number, p: any) => acc + (p.revenue / p.unitsSold || 0), 0) / stats.productStats.length).toFixed(2) : "0.00"}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-400">Upsell Take Rate</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12.4%</div>
                    </CardContent>
                </Card>
            </div>

            {/* SUPPLIER CARDS GRID */}
            <div className="space-y-8">
                {/* 1. Suppliers with Products */}
                {suppliers.map(supplier => {
                    const supplierProducts = products.filter(p => p.supplierId === supplier.id);
                    const totalValue = supplierProducts.reduce((acc, p) => acc + ((p.finance?.unitCost || 0) * (stats?.productStats?.find((s: any) => s.productId === p.id)?.unitsSold || 0)), 0);

                    return (
                        <Card key={supplier.id} className="bg-black/40 border-white/10 overflow-hidden">
                            <CardHeader className="bg-white/5 pb-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                            {supplier.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{supplier.name}</CardTitle>
                                            <CardDescription>
                                                {supplierProducts.length} productos asignados · Valor inventario vendible: <span className="text-emerald-400 font-bold">€{totalValue.toFixed(2)}</span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300">
                                                <Plus className="w-4 h-4 mr-2" /> Añadir Productos
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Añadir productos a {supplier.name}</DialogTitle>
                                                <DialogDescription>Selecciona productos para asignar a este proveedor.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-2 mt-4">
                                                <Input
                                                    placeholder="Buscar productos sin asignar..."
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                                                    {products
                                                        .filter(p => (!p.supplierId || p.supplierId !== supplier.id) && p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .map(p => (
                                                            <div key={p.id} className="flex justify-between items-center p-3 hover:bg-slate-50">
                                                                <div className="text-sm font-medium">{p.title}</div>
                                                                <Button
                                                                    size="sm" variant="ghost"
                                                                    onClick={() => {
                                                                        updateProductFinance(p.id, { supplierId: supplier.id });
                                                                        loadData();
                                                                    }}
                                                                >
                                                                    Asignar
                                                                </Button>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent text-xs uppercase tracking-wider">
                                            <TableHead className="pl-6">Producto</TableHead>
                                            <TableHead className="text-right">Coste Unit.</TableHead>
                                            <TableHead className="text-right">Envío</TableHead>
                                            <TableHead className="text-right">PVP</TableHead>
                                            <TableHead className="text-right text-emerald-400">Margen</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {supplierProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay productos asignados a este proveedor.</TableCell>
                                            </TableRow>
                                        ) : (
                                            supplierProducts.map((product) => (
                                                <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                                                    <TableCell className="pl-6 font-medium">
                                                        {product.title}
                                                        <div className="text-[10px] text-muted-foreground">{product.sku}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" className="h-7 w-20 ml-auto bg-black/50 text-right"
                                                                value={editForm.unitCost}
                                                                onChange={(e) => setEditForm({ ...editForm, unitCost: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.unitCost || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" className="h-7 w-20 ml-auto bg-black/50 text-right"
                                                                value={editForm.shippingCost}
                                                                onChange={(e) => setEditForm({ ...editForm, shippingCost: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.shippingCost || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" className="h-7 w-20 ml-auto bg-black/50 text-right"
                                                                value={editForm.sellingPrice}
                                                                onChange={(e) => setEditForm({ ...editForm, sellingPrice: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.sellingPrice || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-400">
                                                        €{(
                                                            (editingId === product.id ? editForm.sellingPrice : (product.finance?.sellingPrice || 0)) -
                                                            (editingId === product.id ? editForm.unitCost + editForm.shippingCost : (product.finance?.unitCost || 0) + (product.finance?.shippingCost || 0))
                                                        ).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === product.id ? (
                                                            <Button size="sm" onClick={() => handleSave(product.id)} className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700"><Save className="w-3 h-3" /></Button>
                                                        ) : (
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="h-7 w-7 p-0 hover:bg-white/10 text-muted-foreground hover:text-white">Editar</Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* 2. Unassigned Products */}
                <Card className="bg-slate-900/40 border-slate-700/30 overflow-hidden border-dashed border-2">
                    <CardHeader className="bg-white/5 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg">?</div>
                            <div>
                                <CardTitle className="text-xl text-slate-300">Sin Asignar</CardTitle>
                                <CardDescription>Productos que aún no tienen proveedor asociado.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent text-xs uppercase tracking-wider">
                                    <TableHead className="pl-6">Producto</TableHead>
                                    <TableHead>Asignar Proveedor Rápido</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.filter(p => !p.supplierId).map((product) => (
                                    <TableRow key={product.id} className="border-white/5 hover:bg-white/5 opacity-70 hover:opacity-100">
                                        <TableCell className="pl-6 font-medium">{product.title}</TableCell>
                                        <TableCell>
                                            <Select
                                                onValueChange={(val) => {
                                                    updateProductFinance(product.id, { supplierId: val });
                                                    loadData();
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-[200px] bg-black/20 border-white/10"><SelectValue placeholder="Seleccionar Proveedor..." /></SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(product)}><Search className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.filter(p => !p.supplierId).length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-emerald-500 font-medium">¡Todo organizado! No hay productos sin asignar.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
