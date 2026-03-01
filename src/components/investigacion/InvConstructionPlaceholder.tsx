'use client';

import React from 'react';
import { Microscope, AlertCircle } from 'lucide-react';

export default function InvConstructionPlaceholder({ title, emoji }: { title: string, emoji?: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
            {emoji ? <span className="text-4xl mb-4">{emoji}</span> : <Microscope size={32} className="mb-2 opacity-50 text-[var(--inv)]" />}
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 uppercase tracking-tight">Módulo "{title}" en Laboratorio</h3>
            <p className="text-[11px] max-w-xs text-[var(--text-dim)] font-medium">
                Sincronizando modelos de datos y vectores de mercado. Este módulo se activará tras el primer éxito del God Tier Research.
            </p>
            <div className="mt-6 px-4 py-2 bg-[var(--inv)]/5 rounded-full border border-[var(--inv)]/10 text-[9px] font-black uppercase text-[var(--inv)] tracking-widest">
                Estado: Fase de Calibración
            </div>
        </div>
    );
}
