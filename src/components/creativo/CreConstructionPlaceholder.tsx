'use client';

import React from 'react';
import { Palette } from 'lucide-react';

export default function CreConstructionPlaceholder({ title, emoji }: { title: string, emoji?: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border-dashed border-2 border-[var(--border)]">
            {emoji ? <span className="text-3xl mb-4">{emoji}</span> : <Palette size={32} className="mb-2 opacity-30 text-[var(--cre)]" />}
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-1 uppercase tracking-widest">Estudio "{title}" en Montaje</h3>
            <p className="text-[10px] max-w-xs text-[var(--text-tertiary)] font-medium uppercase tracking-tight">
                Preparando los renderizadores de alto rendimiento. Despliegue automático en curso.
            </p>
            <div className="mt-6 px-4 py-1.5 bg-[var(--cre-bg)] rounded-lg border border-[var(--cre)]/10 text-[9px] font-bold uppercase text-[var(--cre)] tracking-widest">
                Estado: Pre-producción
            </div>
        </div>
    );
}
