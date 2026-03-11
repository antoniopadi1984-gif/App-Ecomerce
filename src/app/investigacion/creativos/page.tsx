'use client';

import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const CompetenciaTab = dynamic(
  () => import('@/components/creativo/CompetenciaTab').then(m => m.CompetenciaTab),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-2">
          <Loader2 size={24} className="text-[var(--cre)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest">
            Inicializando Analizador de Creativos...
          </p>
        </div>
      </div>
    )
  }
);

export default function CreativosPage() {
  const { activeStoreId } = useStore();
  const { productId } = useProduct();

  if (!productId || productId === 'GLOBAL') {
    return (
      <div className="p-8 text-center mt-10">
        <h2 className="text-[var(--text-h1)] font-bold mb-2 text-[var(--text)]">Ningún producto seleccionado</h2>
        <p className="text-[var(--text-muted)] font-medium">Selecciona un producto en el TopBar para acceder al Analizador de Creativos.</p>
      </div>
    );
  }

  if (!activeStoreId) {
    return (
       <div className='p-6 text-gray-400'>Selecciona una tienda para ver los datos.</div>
    )
  }

  return (
    <div className='p-6 max-w-[1600px] mx-auto space-y-4'>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--inv-bg)] text-[var(--inv)] flex items-center justify-center border border-[var(--inv)]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        </div>
        <div>
          <h1 className='text-[var(--text-h1)] font-bold text-[var(--text)] leading-tight'>Analizador Creativos</h1>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mt-1">Research Lab • Competencia • Vector Mapping</p>
        </div>
      </div>
      
      <CompetenciaTab storeId={activeStoreId} productId={productId} productSku="PROD" />
    </div>
  );
}
