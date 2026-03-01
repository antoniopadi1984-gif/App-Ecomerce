'use client';

import React from 'react';
import { Palette, AlertCircle } from 'lucide-react';

export default function CreConstructionPlaceholder({ title, emoji }: { title: string, emoji?: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
            {emoji ? <span className="text-4xl mb-4">{emoji}</span> : <Palette size={32} className="mb-2 opacity-50 text-[var(--cre)]" />}
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 uppercase tracking-tight">Estudio "{title}" en Montaje</h3>
            <p className="text-[11px] max-w-xs text-[var(--text-dim)] font-medium">
                Preparando los renderizadores de alto rendimiento para activos estáticos. Espera el despliegue automático en la próxima actualización.
            </p>
            <div className="mt-6 px-4 py-2 bg-[var(--cre)]/5 rounded-full border border-[var(--cre)]/10 text-[9px] font-black uppercase text-[var(--cre)] tracking-widest">
                Estado: Pre-producción
            </div>
        </div>
    );
}
