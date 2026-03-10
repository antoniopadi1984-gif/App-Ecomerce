'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
 
export default function AvataresPage() {
  const { activeStoreId } = useStore();
  const { productId } = useProduct();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/research/results?productId=${productId}&step=P2`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);
 
  if (!productId) return <div className='p-6 text-gray-400'>Selecciona un producto para ver los datos.</div>;
  if (loading) return <div className='p-6 text-gray-400'>Cargando...</div>;
 
  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-6'>Macro Avatar Engine</h1>
      <pre className='bg-gray-800 p-4 rounded text-sm text-gray-200 overflow-auto whitespace-pre-wrap'>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
