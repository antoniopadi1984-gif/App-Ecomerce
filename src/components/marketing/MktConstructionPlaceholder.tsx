'use client';

import React from 'react';
import { Target } from 'lucide-react';

export default function MktConstructionPlaceholder({ title, emoji }: { title: string, emoji?: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
            {emoji ? <span className="text-4xl mb-4">{emoji}</span> : <Target size={32} className="mb-2 opacity-50 text-[var(--mkt)]" />}
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 uppercase tracking-tight">Campaña "{title}" en Planificación</h3>
            <p className="text-[11px] max-w-md text-[var(--text-dim)] font-medium">
                Estructura preparada. A la espera de la integración completa de la Graph API de Meta para Ads Manager, Tracking Performance granular, y el MVP Testing Wizard.
            </p>
            <div className="mt-6 px-4 py-2 bg-[var(--mkt)]/5 rounded-full border border-[var(--mkt)]/10 text-[9px] font-black uppercase text-[var(--mkt)] tracking-widest">
                Estado: Configuración de Pixel & API
            </div>
        </div>
    );
}
