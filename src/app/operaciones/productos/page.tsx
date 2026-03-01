"use client";

import React, { useState, useEffect } from "react";
import { useProduct } from "@/context/ProductContext";
import { useRouter } from "next/navigation";
import {
 Plus,
 Search,
 Filter,
 Package,
 TrendingUp,
 AlertCircle,
 ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/constants/translations";

interface ProductListItem {
 id: string;
 title: string;
 status: string;
 imageUrl?: string | null;
}

export default function ProductsPage() {
 const { setProductId, allProducts, isLoading: contextLoading } = useProduct();
 const router = useRouter();
 const [products, setProducts] = useState<ProductListItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");

 useEffect(() => {
 if (allProducts.length > 0) {
 setProducts(allProducts.map(p => ({
 id: p.id,
 title: p.title,
 status: p.status,
 imageUrl: p.imageUrl
 })));
 setIsLoading(false);
 }
else if (!contextLoading) {
 setIsLoading(false);
 }
 }, [allProducts, contextLoading]);

 const handleSelectProduct = (id: string) => {
 setProductId(id);
 toast.success("Producto seleccionado");
 router.push("/research");
 };

 const filteredProducts = products.filter(p =>
 p.title.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-8">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="text-left">
 <h1 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Mis <span className="text-rose-600 not-italic">Productos</span></h1>
 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Factoría de Escala & Gestión de Catálogo</p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border-slate-200 rounded-lg shadow-xs">
 <Filter className="w-3.5 h-3.5 mr-2" />
 FILTRAR
 </Button>
 <Button className="h-8 px-3 text-[9px] font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all">
 <Plus className="w-3.5 h-3.5 mr-2" />
 NUEVO PRODUCTO
 </Button>
 </div>
 </div>

 {/* Search & Stats Bar */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="md:col-span-2 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
 <Input
 placeholder="BUSCAR POR NOMBRE O ID..."
 className="pl-10 bg-white border-slate-200 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 shadow-xs focus:ring-0"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-3 shadow-xs">
 <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
 <TrendingUp className="w-4 h-4" />
 </div>
 <div className="text-left">
 <div className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">ACTIVOS</div>
 <div className="text-sm font-black text-emerald-900 italic leading-none mt-1">{products.filter(p => p.status === 'ACTIVE').length}</div>
 </div>
 </div>
 <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center gap-3 shadow-xs">
 <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
 <Package className="w-4 h-4" />
 </div>
 <div className="text-left">
 <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">TOTAL</div>
 <div className="text-sm font-black text-slate-900 italic leading-none mt-1">{products.length}</div>
 </div>
 </div>
 </div>

 {/* Products Grid */}
 {isLoading ? (
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
 {[1, 2, 3, 4, 5, 6].map(i => (
 <div key={i}
className="h-40 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
 ))}
 </div>
 ) : filteredProducts.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
 {filteredProducts.map((product) => (
 <button
 key={product.id}
 onClick={() => handleSelectProduct(product.id)}
 className="group bg-white rounded-lg border border-slate-200 shadow-xs hover:shadow-sm hover:border-rose-200 transition-all duration-300 overflow-hidden flex flex-col text-left active:scale-[0.98] relative border"
 >
 <div className="p-3 flex-1 flex flex-col items-start gap-2.5">
 <div className="flex items-start justify-between w-full">
 <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all duration-300 overflow-hidden shadow-sm">
 {product.imageUrl ? (
 <img src={product.imageUrl}
className="w-full h-full object-cover" alt="" />
 ) : (
 <Package className="w-4 h-4" />
 )}
 </div>
 <Badge variant={product.status === 'ACTIVE' ? 'secondary' : 'outline'}
className="rounded-md px-1.5 py-0 font-black text-[6px] uppercase tracking-[0.2em] border-none bg-slate-100 text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-colors h-4 flex items-center justify-center">
 {product.status}
 </Badge>
 </div>
 <h3 className="text-[10px] font-black text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-1 italic uppercase tracking-tighter leading-tight">
 {product.title}
 </h3>
 <div className="flex items-center gap-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">
 <span className="shrink-0 tracking-tighter">ID: {product.id.slice(0, 6)}</span>
 <span className="text-slate-200">•</span>
 <span className="flex items-center gap-1 text-rose-500 shrink-0">
 <TrendingUp className="w-2.5 h-2.5 text-rose-400" />
 V4.0
 </span>
 </div>
 </div>
 <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-rose-50/50 transition-colors">
 <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-rose-600 transition-colors">ACCEDER DASHBOARD</span>
 <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover:text-rose-500 transition-all" />
 </div>
 </button>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-700">
 <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
 <Package className="w-6 h-6" />
 </div>
 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic leading-none">{t('no_products_found')}</h3>
 <p className="text-[9px] text-slate-400 mt-2 max-w-sm text-center px-4 font-black uppercase tracking-wider">
 {searchQuery ? t('try_other_search') : t('no_products_desc')}
 </p>
 <Button className="mt-8 h-9 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-lg shadow-sm transition-all active:scale-[0.98]">
 <Plus className="w-4 h-4 mr-2" />
 FACTORÍA DE ESCALA
 </Button>
 </div>
 )}
 </div>
 );
}
