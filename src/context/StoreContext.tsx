"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Store {
    id: string;
    name: string;
    currency: string;
    domain?: string | null;
}

interface StoreContextType {
    activeStore: Store | null;
    activeStoreId: string | null;
    allStores: Store[];
    setActiveStoreId: (id: string) => void;
    isLoading: boolean;
    refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStores = useCallback(async () => {
        try {
            const res = await fetch('/api/stores');
            const data = await res.json();
            if (data.success && data.stores?.length > 0) {
                setAllStores(data.stores);
                // Restore from localStorage or default to first store
                const saved = typeof window !== 'undefined'
                    ? localStorage.getItem('activeStoreId')
                    : null;
                const valid = saved && data.stores.find((s: Store) => s.id === saved);
                const defaultId = valid ? saved : data.stores[0].id;
                setActiveStoreIdState(defaultId);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('activeStoreId', defaultId);
                }
            }
        } catch (err) {
            console.error('[StoreContext] Error fetching stores:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    const setActiveStoreId = useCallback((id: string) => {
        setActiveStoreIdState(id);
        if (typeof window !== 'undefined') {
            localStorage.setItem('activeStoreId', id);
            // Clear selected product when switching store
            localStorage.removeItem('selectedProductId');
        }
    }, []);

    const activeStore = allStores.find(s => s.id === activeStoreId) || null;

    return (
        <StoreContext.Provider value={{
            activeStore,
            activeStoreId,
            allStores,
            setActiveStoreId,
            isLoading,
            refreshStores: fetchStores
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within StoreProvider");
    return context;
}
