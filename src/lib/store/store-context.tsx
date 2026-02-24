"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

export interface StoreInfo {
    id: string;
    name: string;
    domain: string | null;
    currency: string;
}

interface StoreContextType {
    activeStoreId: string | null;
    activeStore: StoreInfo | null;
    stores: StoreInfo[];
    isLoading: boolean;
    setActiveStoreId: (id: string) => void;
    refreshStores: () => Promise<void>;
}

const STORAGE_KEY = "ecombom.activeStoreId";

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar stores disponibles
    const fetchStores = useCallback(async () => {
        try {
            const res = await fetch("/api/stores");
            const data = await res.json();
            if (res.ok && data.stores) {
                setStores(data.stores);

                // Si no hay activeStoreId guardado, usar el primero
                const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
                if (saved && data.stores.some((s: StoreInfo) => s.id === saved)) {
                    setActiveStoreIdState(saved);
                } else if (data.stores.length > 0) {
                    const firstId = data.stores[0].id;
                    setActiveStoreIdState(firstId);
                    if (typeof window !== "undefined") {
                        localStorage.setItem(STORAGE_KEY, firstId);
                    }
                    // Registrar asignación automática
                    logAudit("STORE_CONTEXT_SET", "STORE", firstId);
                }
            }
        } catch (err) {
            console.error("[StoreContext] Error cargando stores:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    // Cambiar store activo
    const setActiveStoreId = useCallback((id: string) => {
        setActiveStoreIdState(id);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, id);
        }
        const store = stores.find(s => s.id === id);
        if (store) {
            toast.success(`Tienda activa: ${store.name}`);
        }
        logAudit("STORE_SWITCHED", "STORE", id);
    }, [stores]);

    // Store activa actual
    const activeStore = stores.find(s => s.id === activeStoreId) || null;

    return (
        <StoreContext.Provider value={{
            activeStoreId,
            activeStore,
            stores,
            isLoading,
            setActiveStoreId,
            refreshStores: fetchStores,
        }}>
            {children}
        </StoreContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error("useStore debe usarse dentro de un StoreProvider");
    }
    return context;
}

// ─── AuditLog helper (fire-and-forget) ───────────────────────

function logAudit(action: string, entity: string, entityId: string) {
    fetch("/api/settings/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, entity, entityId }),
    }).catch(() => {
        // Silently fail — audit is best-effort from client
    });
}
