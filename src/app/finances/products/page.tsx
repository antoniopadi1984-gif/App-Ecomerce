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
            packagingCost: product.finance?.packagingCost || 0,
            codFee: product.finance?.codFee || 0,
            insuranceFee: product.finance?.insuranceFee || 0,
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Finanzas de <span className="text-slate-400">Producto (COGS)</span></h1>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Control de costes, proveedores y rentabilidad unitaria.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rentabilidad Media</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-black flex items-center gap-2 text-slate-900">
                            28.5% <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ticket Medio (PVP)</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-black text-slate-900">€{stats?.productStats ? (stats.productStats.reduce((acc: number, p: any) => acc + (p.revenue / p.unitsSold || 0), 0) / stats.productStats.length).toFixed(2) : "0.00"}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-none shadow-xl rounded-lg overflow-hidden">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upsell Take Rate</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-black text-white italic">12.4%</div>
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
                        <Card key={supplier.id} className="bg-white border-slate-100 overflow-hidden shadow-sm rounded-lg">
                            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-lg italic shadow-xl">
                                            {supplier.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{supplier.name}</CardTitle>
                                            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                {supplierProducts.length} productos asignados · Valor inventario: <span className="text-slate-900 font-black">€{totalValue.toFixed(2)}</span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="h-8 rounded-lg border-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-widest">
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
                            <CardContent className="p-0 border-t border-slate-50">
                                <Table>
                                    <TableHeader className="bg-slate-50/30">
                                        <TableRow className="border-slate-50 hover:bg-transparent h-8">
                                            <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Producto</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Unitario</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Envío</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Pack/COD</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Retorno</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Seguro</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">PVP</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-900 py-0">Neto</TableHead>
                                            <TableHead className="w-[80px] py-0"></TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {supplierProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay productos asignados a este proveedor.</TableCell>
                                            </TableRow>
                                        ) : (
                                            supplierProducts.map((product) => (
                                                <TableRow key={product.id} className="border-slate-50 hover:bg-slate-50/30">
                                                    <TableCell className="pl-6 font-bold text-slate-900 italic">
                                                        {product.title}
                                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{product.sku}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" step="0.01" className="h-7 w-16 ml-auto bg-black/50 text-right"
                                                                value={editForm.unitCost}
                                                                onChange={(e) => setEditForm({ ...editForm, unitCost: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.unitCost || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" step="0.01" className="h-7 w-16 ml-auto bg-black/50 text-right"
                                                                value={editForm.shippingCost}
                                                                onChange={(e) => setEditForm({ ...editForm, shippingCost: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.shippingCost || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <div className="flex flex-col gap-1 items-end">
                                                                <Input
                                                                    type="number" step="0.01" className="h-7 w-16 bg-black/50 text-right"
                                                                    placeholder="Pack"
                                                                    value={editForm.packagingCost}
                                                                    onChange={(e) => setEditForm({ ...editForm, packagingCost: parseFloat(e.target.value) })}
                                                                />
                                                                <Input
                                                                    type="number" step="0.01" className="h-7 w-16 bg-black/50 text-right border-emerald-500/30"
                                                                    placeholder="COD"
                                                                    value={editForm.codFee}
                                                                    onChange={(e) => setEditForm({ ...editForm, codFee: parseFloat(e.target.value) })}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-bold text-slate-600">P: €{product.finance?.packagingCost || 0}</span>
                                                                <span className="text-[10px] font-black text-slate-400">C: €{product.finance?.codFee || 0}</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" step="0.01" className="h-7 w-16 ml-auto bg-black/50 text-right border-red-500/30"
                                                                value={editForm.returnCost}
                                                                onChange={(e) => setEditForm({ ...editForm, returnCost: parseFloat(e.target.value) })}
                                                            />
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px] font-bold">€{product.finance?.returnCost || 0}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" step="0.01" className="h-7 w-16 ml-auto bg-black/50 text-right border-blue-500/30"
                                                                value={editForm.insuranceFee}
                                                                onChange={(e) => setEditForm({ ...editForm, insuranceFee: parseFloat(e.target.value) })}
                                                            />
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px] font-bold">€{product.finance?.insuranceFee || 0}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {editingId === product.id ? (
                                                            <Input
                                                                type="number" step="0.01" className="h-7 w-16 ml-auto bg-black/50 text-right"
                                                                value={editForm.sellingPrice}
                                                                onChange={(e) => setEditForm({ ...editForm, sellingPrice: parseFloat(e.target.value) })}
                                                            />
                                                        ) : `€${product.finance?.sellingPrice || 0}`}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-slate-950 italic">
                                                        €{(
                                                            (editingId === product.id ? editForm.sellingPrice : (product.finance?.sellingPrice || 0)) -
                                                            (editingId === product.id
                                                                ? (editForm.unitCost + editForm.shippingCost + editForm.packagingCost + editForm.codFee + editForm.insuranceFee)
                                                                : ((product.finance?.unitCost || 0) + (product.finance?.shippingCost || 0) + (product.finance?.packagingCost || 0) + (product.finance?.codFee || 0) + (product.finance?.insuranceFee || 0)))
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
                    <CardContent className="p-0 border-t border-white/5">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent h-8">
                                    <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Producto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-0">Asignar Proveedor Rápido</TableHead>
                                    <TableHead className="w-[60px] py-0"></TableHead>
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
