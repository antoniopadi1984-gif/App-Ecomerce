"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProductsWithFinance } from "@/app/finances/actions";
import { ArrowRight, Package, BrainCircuit, Search, Filter, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function MarketingProductsList() {
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProductsWithFinance().then((data: any) => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Iniciando Red Neuronal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-8 selection:bg-indigo-100">
            {/* Nav Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100/50">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Mastermind de Productos</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Laboratorio Creativo & Gestión de Activos</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Buscar producto..."
                            className="h-12 text-sm pl-10 w-full md:w-[300px] bg-white border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-slate-50">
                        <Filter className="h-4 w-4 text-slate-600" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <Package className="h-12 w-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron productos en el inventario.</p>
                    </div>
                )}

                {filtered.map(product => (
                    <Link key={product.id} href={`/marketing/products/${product.id}`} className="group">
                        <Card className="h-full border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-400/50 transition-all duration-500 bg-white group-hover:-translate-y-1">
                            <CardContent className="p-0 flex flex-col h-full">
                                <div className="p-6 flex flex-col gap-6 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                            {product.image ? (
                                                <img src={product.image} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-indigo-100 text-indigo-600 px-2 h-5">
                                            MARKET READY
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-700 transition-colors tracking-tight leading-7 line-clamp-2">
                                            {product.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU:</span>
                                            <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{product.sku || "N/A"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="flex flex-col flex-1 gap-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Research Avatars</span>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }}></div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-8 w-8 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all p-2 bg-slate-50 group-hover:bg-indigo-50 rounded-xl" />
                                    </div>
                                </div>
                                <div className="border-t border-slate-50 p-4 bg-slate-50/30 flex justify-between items-center group-hover:bg-indigo-50/20 transition-all">
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">AI Audit Active</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 uppercase italic">Entrar Mastermind</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
