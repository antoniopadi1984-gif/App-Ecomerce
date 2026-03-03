'use client';

/**
 * useGestores — hook reutilizable con polling ligero y refresco manual.
 *
 * Estrategia:
 *   - Primera llamada → fetch inmediato
 *   - Polling cada 30s mientras el componente esté montado (sincronización entre pestañas)
 *   - refetch() → fuerza refresco inmediato (útil tras crear/invitar un usuario)
 *   - Caché a nivel de módulo → mounts adicionales reciben datos inmediatamente
 *     sin esperar a la red
 *
 * Retorna: { gestores, refetch }
 */

import { useState, useEffect, useCallback } from 'react';
import type { Gestor } from '@/types/usuario';

// ── Module-level cache ────────────────────────────────────────────────────────
let _cache: Gestor[] | null = null;

async function loadGestores(): Promise<Gestor[]> {
    try {
        const res = await fetch('/api/equipo/gestores-activos');
        const data = await res.json();
        const list: Gestor[] = data.gestores ?? [];
        _cache = list;
        return list;
    } catch {
        return _cache ?? []; // red caída → devuelve última caché conocida
    }
}

/** Fuerza un nuevo fetch en el próximo poll o refetch() */
export function invalidateGestoresCache() {
    _cache = null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 segundos

export function useGestores(): { gestores: Gestor[]; refetch: () => void } {
    const [gestores, setGestores] = useState<Gestor[]>(_cache ?? []);

    const fetchAndSet = useCallback(async () => {
        const data = await loadGestores();
        setGestores(data);
    }, []);

    useEffect(() => {
        // Fetch inmediato al montar
        fetchAndSet();

        // Polling ligero — sincroniza cambios desde otras pestañas/sesiones
        const interval = setInterval(fetchAndSet, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchAndSet]);

    return { gestores, refetch: fetchAndSet };
}
