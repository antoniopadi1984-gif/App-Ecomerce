"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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
    const [productId, setProductIdState] = useState<string | null>(initialProductId || null);
    const [product, setProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = useCallback(async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            if (response.ok && data.success) {
                setAllProducts(data.products || []);

                // Si no hay productId seleccionado pero hay productos, seleccionar el primero por defecto si no hay nada en localStorage
                const savedId = typeof window !== 'undefined' ? localStorage.getItem('selectedProductId') : null;

                if (!productId) {
                    if (savedId) {
                        setProductIdState(savedId);
                    } else {
                        // Default to GLOBAL to avoid "Context Required" screens
                        setProductIdState('GLOBAL');
                    }
                }
            }
        } catch (err) {
            console.error('[ProductContext] Error fetching all products:', err);
        }
    }, [productId]);

    // Load initial data
    useEffect(() => {
        fetchAllProducts();
    }, [fetchAllProducts]);

    const setProductId = useCallback((id: string) => {
        setProductIdState(id);
        if (typeof window !== 'undefined') {
            if (id === 'GLOBAL') {
                localStorage.removeItem('selectedProductId');
            } else {
                localStorage.setItem('selectedProductId', id);
            }
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!productId || productId === 'GLOBAL') {
            setProduct(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/products/${productId}`);
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
    }, [productId]);

    useEffect(() => {
        fetchProduct();
    }, [productId, fetchProduct]);

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
