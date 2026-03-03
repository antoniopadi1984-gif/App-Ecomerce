'use client';

/**
 * useGestores — hook reutilizable para obtener gestores activos.
 *
 * Caché a nivel de módulo: todos los componentes que llamen a useGestores()
 * comparten un único fetch. Las re-renderizaciones no generan llamadas duplicadas.
 *
 * Flujo:
 *   1. Primera llamada → fetch /api/equipo/gestores-activos, rellena cache
 *   2. Llamadas siguientes → devuelven la cache inmediatamente
 *   3. Si el admin crea/activa un usuario → llamar invalidateGestoresCache()
 *      para forzar un nuevo fetch en el próximo mount
 */

import { useState, useEffect } from 'react';
import type { Gestor } from '@/types/usuario';

// ── Module-level cache ────────────────────────────────────────────────────────
let _cache: Gestor[] | null = null;
let _promise: Promise<Gestor[]> | null = null;

async function fetchGestores(): Promise<Gestor[]> {
    if (_cache) return _cache;
    if (!_promise) {
        _promise = fetch('/api/equipo/gestores-activos')
            .then(r => r.json())
            .then(data => {
                _cache = data.gestores ?? [];
                _promise = null;
                return _cache as Gestor[];
            })
            .catch(() => {
                _promise = null; // allow retry on next mount
                return [] as Gestor[];
            });
    }
    return _promise;
}

/** Force a fresh fetch on next useGestores() mount (call after creating/inviting a user) */
export function invalidateGestoresCache() {
    _cache = null;
    _promise = null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useGestores(): Gestor[] {
    const [gestores, setGestores] = useState<Gestor[]>(_cache ?? []);

    useEffect(() => {
        let cancelled = false;
        fetchGestores().then(data => {
            if (!cancelled) setGestores(data);
        });
        return () => { cancelled = true; };
    }, []);

    return gestores;
}
