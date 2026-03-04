'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { Microscope } from 'lucide-react';
import { AgentCompanion } from '@/components/layout/agent-companion';
import { useProduct } from '@/context/ProductContext';

import { AddProductDialog } from '@/components/products/AddProductDialog';

export default function InvestigacionLayout({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    const contextForAgent = `Investigación (Research Lab). Tienda: ${activeStoreId}. Producto: ${productId}`;

    return (
        <div className="content-main flex flex-col gap-4 pt-0 h-full min-h-screen bg-[var(--bg)]">
            <div className="flex justify-between items-center py-2 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
                        <Microscope size={18} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-[800] leading-none text-[var(--text)] tracking-tight">Research Lab</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-sm uppercase tracking-wide">
                            God Tier Intelligence & Market Vectors
                        </p>
                    </div>
                </div>
            </div>

            {!activeStoreId || !productId || productId === 'GLOBAL' ? (
                <div className="flex flex-col items-center justify-center py-24 text-center ds-card">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--inv)]/5 flex items-center justify-center mb-4 border border-[var(--inv)]/10">
                        <Microscope className="w-8 h-8 text-[var(--inv)] opacity-60" />
                    </div>
                    <h2 className="text-[18px] font-black text-[var(--text)] tracking-tight">Investigación God Tier</h2>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 max-w-[280px] leading-relaxed">
                        Selecciona una tienda y un producto específico en la barra superior para iniciar o visualizar el ciclo de investigación.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[var(--inv)] uppercase tracking-widest animate-pulse">
                            ↑ Pulsa el selector &quot;Producto&quot; arriba
                        </div>
                        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    marginTop: "12px",
                                    padding: "7px 18px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "white",
                                    background: "#7c3aed",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    letterSpacing: "0.02em"
                                }}
                            >
                                + Crear nuevo producto
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {children}
                </div>
            )}

            <AgentCompanion pageContext={contextForAgent} agentRole="research-lab" />

            {showCreateModal && <AddProductDialog showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal} />}
        </div>
    );
}
