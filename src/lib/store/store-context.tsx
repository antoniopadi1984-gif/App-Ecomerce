"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    storeOverview: any | null;
    overviewLoading: boolean;
}

const STORAGE_KEY = "ecombom.activeStoreId";

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storeOverview, setStoreOverview] = useState<any | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const router = useRouter();

    // Cargar stores disponibles
    const fetchStores = useCallback(async () => {
        try {
            const res = await fetch("/api/stores", { cache: "no-store" });
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
                        document.cookie = `activeStoreId=${firstId}; path=/; max-age=31536000; SameSite=Lax`;
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
            document.cookie = `activeStoreId=${id}; path=/; max-age=31536000; SameSite=Lax`;
        }
        const store = stores.find(s => s.id === id);
        if (store) {
            toast.success(`Tienda activa: ${store.name}`);
        }
        logAudit("STORE_SWITCHED", "STORE", id);

        // Force Next.js to re-fetch Server Components with the new active store cookie
        startTransition(() => {
            router.refresh();
        });

        if (id) {
            setOverviewLoading(true);
            fetch(`/api/stores/${id}/overview`)
                .then(r => r.json())
                .then(d => { setStoreOverview(d); setOverviewLoading(false); })
                .catch(() => setOverviewLoading(false));
        }
    }, [stores, router]);

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
            storeOverview,
            overviewLoading,
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
