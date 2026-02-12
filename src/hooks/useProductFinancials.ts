"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function useProductFinancials(productId: string) {
    const [loading, setLoading] = useState(false);
    const [financialData, setFinancialData] = useState<any>(null);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    const loadFinancials = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const startStr = format(dateRange.start, 'yyyy-MM-dd');
            const endStr = format(dateRange.end, 'yyyy-MM-dd');
            const url = `/api/products/${productId}/financials?start=${startStr}&end=${endStr}`;
            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            setFinancialData(result.data);
        } catch (error: any) {
            console.error("Error loading product financials:", error);
            toast.error("Error al cargar financieros del producto");
        } finally {
            setLoading(false);
        }
    }, [productId, dateRange]);

    useEffect(() => {
        loadFinancials();
    }, [loadFinancials]);

    return {
        financialData,
        loading,
        dateRange,
        setDateRange,
        loadFinancials
    };
}
