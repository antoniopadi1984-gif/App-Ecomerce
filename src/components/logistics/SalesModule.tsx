"use client";

import React, { useEffect } from "react";
import { useProductOrders } from "@/hooks/useProductOrders";
import { ProductOrdersDashboard } from "@/components/logistics/ProductOrdersDashboard";
import { Loader2 } from "lucide-react";
import { t } from "@/lib/constants/translations";

interface SalesModuleProps {
    productId: string;
    forcedStatus?: string;
}

export function SalesModule({ productId, forcedStatus }: SalesModuleProps) {
    const {
        orders,
        loading,
        pagination,
        statusFilter,
        setStatusFilter,
        loadOrders
    } = useProductOrders(productId, forcedStatus);

    useEffect(() => {
        if (forcedStatus) setStatusFilter(forcedStatus);
    }, [forcedStatus, setStatusFilter]);

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
                <p className="text-slate-300 font-black text-[9px] uppercase tracking-widest">{t('loading_history')}</p>
            </div>
        );
    }

    return (
        <ProductOrdersDashboard
            orders={orders}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => loadOrders(page)}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
        />
    );
}
