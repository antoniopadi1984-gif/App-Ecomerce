"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import { OrdersHubClient } from "@/components/logistics/OrdersHubClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { t } from "@/lib/constants/translations";

export default function ProductOrdersPage() {
    const { productId, product, allProducts } = useProduct();

    if (!productId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto en el menú lateral para acceder a Pedidos & Logística.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex -space-x-3 overflow-hidden p-1">
                        {allProducts.slice(0, 3).map((p: any) => (
                            <div key={p.id} className="inline-block h-10 w-10 rounded-xl ring-4 ring-white shadow-sm overflow-hidden bg-slate-100">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">?</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <OrdersHubClient
                productId={productId}
                productTitle={product?.title}
            />
        </div>
    );
}
