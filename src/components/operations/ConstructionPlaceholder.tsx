'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function ConstructionPlaceholder({ title }: { title: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
            <ShoppingCart size={32} className="mb-2 opacity-50 text-[var(--ops)]" />
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 uppercase tracking-tight">Módulo "{title}" en Construcción</h3>
            <p className="text-[11px] max-w-xs text-[var(--text-dim)] font-medium">
                Este centro de operaciones está en fase de despliegue. Pronto estará disponible con métricas y funciones avanzadas.
            </p>
            <div className="mt-6 px-4 py-2 bg-[var(--ops)]/5 rounded-full border border-[var(--ops)]/10 text-[9px] font-black uppercase text-[var(--ops)] tracking-widest">
                Estado: Configurando Autopilot
            </div>
        </div>
    );
}
