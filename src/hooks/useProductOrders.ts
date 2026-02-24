"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useProductOrders(storeId: string, productId: string, initialStatus: string = 'ALL') {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 15, totalPages: 0 });
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const loadOrders = useCallback(async (page = 1) => {
        if (!productId) return;
        setLoading(true);
        try {
            // New unified endpoint that supports GLOBAL
            const url = `/api/orders?page=${page}&pageSize=${pagination.pageSize}&status=${statusFilter}&productId=${productId}&storeId=${storeId}`;
            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            setOrders(result.data.orders);
            setPagination(result.data.pagination);
        } catch (error: any) {
            console.error("Error loading product orders:", error);
            toast.error("Error al cargar pedidos");
        } finally {
            setLoading(false);
        }
    }, [productId, pagination.pageSize, statusFilter, storeId]);

    useEffect(() => {
        loadOrders(1);
    }, [loadOrders]);

    return {
        orders,
        loading,
        pagination,
        statusFilter,
        setStatusFilter,
        loadOrders
    };
}
