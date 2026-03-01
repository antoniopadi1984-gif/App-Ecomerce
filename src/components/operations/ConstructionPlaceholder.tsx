'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ConstructionPlaceholder({ title }: { title: string }) {
    return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 ds-card text-[var(--text-muted)] border-dashed border-2 bg-transparent">
            <AlertCircle size={32} className="mb-2 opacity-50 text-[var(--ops)]" />
            <h3 className="text-[14px] font-[800] text-[var(--text)] mb-1 uppercase tracking-tight">Módulo "{title}" en Construcción</h3>
            <p className="text-[11px] max-w-xs text-[var(--text-dim)]">
                Reservado para el despliegue del motor operativo de nivel Élite: tablas masivas y P&L directo.
            </p>
        </div>
    );
}
