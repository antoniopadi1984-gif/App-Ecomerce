"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import { OrdersHubClient } from "@/components/logistics/OrdersHubClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, AlertCircle, Link2 } from "lucide-react";
import Image from "next/image";
import { t } from "@/lib/constants/translations";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useStore } from "@/lib/store/store-context";

export default function ProductOrdersPage() {
    const { productId, product, allProducts } = useProduct();
    const { activeStoreId } = useStore();
    const [isConnected, setIsConnected] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        if (activeStoreId) {
            fetch(`/api/connections/status?storeId=${activeStoreId}&service=SHOPIFY`)
                .then(res => res.json())
                .then(data => setIsConnected(data.isConnected));
        }
    }, [activeStoreId]);

    if (isConnected === false) {
        return (
            <PageShell>
                <ModuleHeader title="Pedidos & Logística" subtitle="Gestión Centralizada" icon={ShoppingCart} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Shopify No Conectado</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Debes vincular tu tienda oficial de Shopify antes de gestionar pedidos y logística.</p>
                    </div>
                    <Link href="/connections">
                        <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
                            <Link2 className="w-4 h-4 mr-2" />
                            Ir a Conexiones
                        </Button>
                    </Link>
                </div>
            </PageShell>
        );
    }

    if (!productId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Por favor, selecciona un producto en el menú lateral para acceder a Pedidos.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex -space-x-3 overflow-hidden p-1">
                            {allProducts.slice(0, 3).map((p: any) => (
                                <div key={p.id} className="inline-block h-10 w-10 rounded-xl ring-4 ring-white shadow-sm overflow-hidden bg-slate-100 relative">
                                    {p.imageUrl ? (
                                        <Image src={p.imageUrl} alt={p.title || "Product"} fill sizes="40px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">?</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell loading={isConnected === null} loadingMessage="VERIFICANDO CONEXIÓN...">
            <OrdersHubClient
                productId={productId}
                productTitle={product?.title}
            />
        </PageShell>
    );
}
