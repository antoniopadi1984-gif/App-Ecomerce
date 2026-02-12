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
        } else if (!contextLoading) {
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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('my_products')}</h1>
                    <p className="text-slate-500 mt-1">{t('manage_scale_cat')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-slate-200">
                        <Filter className="w-4 h-4" />
                        {t('filter')}
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
                        <Plus className="w-4 h-4" />
                        {t('new_product')}
                    </Button>
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder={t('search_name_id')}
                        className="pl-10 bg-white border-slate-200 h-11 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('active_count')}</div>
                        <div className="text-lg font-bold text-emerald-900">{products.filter(p => p.status === 'ACTIVE').length}</div>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total</div>
                        <div className="text-lg font-bold text-blue-900">{products.length}</div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredProducts.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => handleSelectProduct(product.id)}
                            className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col text-left active:scale-[0.98]"
                        >
                            <div className="p-3 flex-1 flex flex-col items-start gap-2">
                                <div className="flex items-start justify-between w-full">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-300 overflow-hidden shadow-inner">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Package className="w-5 h-5" />
                                        )}
                                    </div>
                                    <Badge variant={product.status === 'ACTIVE' ? 'secondary' : 'outline'} className="rounded-md px-1.5 py-0 font-black text-[7px] uppercase tracking-widest border-none bg-slate-100 text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors h-4 flex items-center justify-center">
                                        {product.status}
                                    </Badge>
                                </div>
                                <h3 className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 italic uppercase tracking-tighter leading-tight">
                                    {product.title}
                                </h3>
                                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="shrink-0">ID: {product.id.slice(0, 4)}</span>
                                    <span className="text-slate-200">•</span>
                                    <span className="flex items-center gap-1 text-emerald-500 shrink-0">
                                        <TrendingUp className="w-2.5 h-2.5" />
                                        V4
                                    </span>
                                </div>
                            </div>
                            <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Dashboard</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover:text-blue-500 transition-all" />
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{t('no_products_found')}</h3>
                    <p className="text-slate-500 mt-1 max-w-sm text-center px-4">
                        {searchQuery ? t('try_other_search') : t('no_products_desc')}
                    </p>
                    <Button className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        {t('new_product')}
                    </Button>
                </div>
            )}
        </div>
    );
}
