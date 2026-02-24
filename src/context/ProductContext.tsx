"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store/store-context";

export interface Product {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    status: string;
    productFamily: string | null;
    handle: string | null;
    driveFolderId: string | null;
    driveDocId: string | null;
    driveDocUrl: string | null;
    metaConfig?: {
        pixelId: string | null;
        campaignId: string | null;
        adAccountId: string | null;
        status: string;
    } | null;
    // Metrics overview (can be added later)
    metrics?: {
        roas: number;
        revenue: number;
        spend: number;
    };
}

interface ProductContextType {
    product: Product | null;
    allProducts: Product[];
    productId: string | null;
    setProductId: (id: string) => void;
    isLoading: boolean;
    error: string | null;
    refreshProduct: () => Promise<void>;
    refreshAllProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children, productId: initialProductId }: { children: React.ReactNode; productId?: string }) {
    const { activeStoreId } = useStore();
    const [productId, setProductIdState] = useState<string | null>(initialProductId || null);
    const [product, setProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = useCallback(async () => {
        // Fallback to store-main if no activeStoreId is provided yet
        const effectiveStoreId = activeStoreId || 'store-main';

        try {
            const response = await fetch(`/api/products?storeId=${effectiveStoreId}&_t=${Date.now()}`, {
                headers: { 'X-Store-Id': effectiveStoreId },
                cache: 'no-store'
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setAllProducts(data.products || []);

                const savedId = typeof window !== 'undefined' ? localStorage.getItem(`selectedProductId_${effectiveStoreId}`) : null;

                if (!productId || (savedId && productId !== savedId && productId === 'GLOBAL')) {
                    if (savedId) {
                        setProductIdState(savedId);
                    } else {
                        setProductIdState('GLOBAL');
                    }
                }
            }
        } catch (err) {
            console.error('[ProductContext] Error fetching all products:', err);
        }
    }, [activeStoreId, productId]);

    // Reset product selection when store changes
    useEffect(() => {
        const effectiveStoreId = activeStoreId || 'store-main';
        const savedId = typeof window !== 'undefined' ? localStorage.getItem(`selectedProductId_${effectiveStoreId}`) : null;
        setProductIdState(savedId || 'GLOBAL');
        setProduct(null);
        fetchAllProducts();
    }, [activeStoreId]);

    const setProductId = useCallback((id: string) => {
        const effectiveStoreId = activeStoreId || 'store-main';
        setProductIdState(id);
        if (typeof window !== 'undefined') {
            if (id === 'GLOBAL') {
                localStorage.removeItem(`selectedProductId_${effectiveStoreId}`);
            } else {
                localStorage.setItem(`selectedProductId_${effectiveStoreId}`, id);
            }
        }
    }, [activeStoreId]);

    const fetchProduct = useCallback(async () => {
        const effectiveStoreId = activeStoreId || 'store-main';
        if (!productId || productId === 'GLOBAL') {
            setProduct(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/products/${productId}`, {
                headers: { 'X-Store-Id': effectiveStoreId }
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Error al cargar el producto");
            }

            setProduct(data.product);
        } catch (err: any) {
            console.error('[ProductContext] Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [productId, activeStoreId]);

    useEffect(() => {
        fetchProduct();
    }, [productId, activeStoreId, fetchProduct]);

    const value = React.useMemo(() => ({
        product,
        allProducts,
        productId,
        setProductId,
        isLoading,
        error,
        refreshProduct: fetchProduct,
        refreshAllProducts: fetchAllProducts
    }), [product, allProducts, productId, setProductId, isLoading, error, fetchProduct, fetchAllProducts]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProduct() {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error("useProduct must be used within a ProductProvider");
    }
    return context;
}

