"use client";
import { useStore } from "@/lib/store/store-context";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Finanzas carga el módulo global pero filtrado por tienda activa
export default function FinanzasOperacionesPage() {
    const { activeStoreId } = useStore();
    // Redirigir con storeId como param
    if (typeof window !== "undefined" && activeStoreId) {
        window.location.href = `/finanzas?storeId=${activeStoreId}`;
    }
    return null;
}
