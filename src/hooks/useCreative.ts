"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useCreative(productId: string) {
    const [loading, setLoading] = useState(false);
    const [creativeData, setCreativeData] = useState<any>(null);
    const [generating, setGenerating] = useState(false);

    const loadData = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/products/${productId}/creative`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            setCreativeData(result.data);
        } catch (error: any) {
            console.error("Error loading creative data:", error);
            toast.error("Error al cargar creativos");
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const performAction = async (action: string, payload: any = {}) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/products/${productId}/creative`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message || "Acción completada");
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Error al realizar acción");
        } finally {
            setLoading(false);
        }
    };

    const generateVideos = async (params: any) => {
        setGenerating(true);
        try {
            const response = await fetch('/api/creative/generate-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, productId })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Generación iniciada");
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || "Error en generación");
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        creativeData,
        loading,
        generating,
        loadData,
        performAction,
        generateVideos
    };
}
