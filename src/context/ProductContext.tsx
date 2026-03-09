"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
    storeId: string;
    price?: number;
    country?: string;
    metaConfig?: {
        pixelId: string | null;
        campaignId: string | null;
        adAccountId: string | null;
        status: string;
    } | null;
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

export function ProductProvider({
    children,
    productId: initialProductId,
    storeId
}: {
    children: React.ReactNode;
    productId?: string;
    storeId?: string | null;
}) {
    const [productId, setProductIdState] = useState<string | null>(initialProductId || null);
    const [product, setProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = useCallback(async () => {
        try {
            const activeStoreId = storeId ||
                (typeof window !== 'undefined' ? localStorage.getItem('activeStoreId') : null);

            const url = activeStoreId
                ? `/api/products?storeId=${activeStoreId}`
                : '/api/products';

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.success) {
                setAllProducts(data.products || []);

                // Reset product selection if current product doesn't belong to new store
                const savedId = typeof window !== 'undefined'
                    ? localStorage.getItem('selectedProductId')
                    : null;

                const savedBelongsToStore = savedId &&
                    data.products?.find((p: Product) => p.id === savedId);

                if (!savedBelongsToStore) {
                    setProductIdState(null);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('selectedProductId');
                    }
                } else if (savedId && !productId) {
                    setProductIdState(savedId);
                }
            }
        } catch (err) {
            console.error('[ProductContext] Error fetching products:', err);
        }
    }, [storeId, productId]);

    // Refetch products when storeId changes
    useEffect(() => {
        fetchAllProducts();
    }, [storeId, fetchAllProducts]);

    const setProductId = useCallback((id: string) => {
        setProductIdState(id);
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedProductId', id);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!productId) return;
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
        if (productId) fetchProduct();
        else setProduct(null);
    }, [productId, fetchProduct]);

    return (
        <ProductContext.Provider value={{
            product,
            allProducts,
            productId,
            setProductId,
            isLoading,
            error,
            refreshProduct: fetchProduct,
            refreshAllProducts: fetchAllProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProduct() {
    const context = useContext(ProductContext);
    if (!context) throw new Error("useProduct must be used within a ProductProvider");
    return context;
}
