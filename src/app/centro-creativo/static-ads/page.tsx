'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
 
export default function StaticAdsPage() {
  const { activeStoreId } = useStore();
  const { productId } = useProduct();
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState('9:16');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
 
  const generate = async () => {
    if (!prompt || !productId) return;
    setGenerating(true); setError(''); setResult(null);
    const r = await fetch('/api/creative/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStoreId || '' },
      body: JSON.stringify({ productId, prompt, aspectRatio: ratio })
    });
    const d = await r.json();
    if (d.ok) setResult(d);
    else setError(d.error || 'Error generando imagen');
    setGenerating(false);
  };
 
  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-6'>Anuncios Estáticos IA</h1>
      {!productId && <p className='text-yellow-400 mb-4'>Selecciona un producto primero</p>}
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        className='w-full bg-gray-800 text-white rounded-xl p-4 h-32 mb-4 text-sm'
        placeholder='Describe el anuncio: producto, escena, estilo, emoción...'/>
      <div className='flex gap-4 mb-6'>
        {['9:16', '1:1', '16:9', '4:5'].map(r => (
          <button key={r} onClick={() => setRatio(r)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${ratio === r ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{r}</button>
        ))}
      </div>
      <button onClick={generate} disabled={generating || !prompt || !productId}
        className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium'>
        {generating ? 'Generando... (30-60s)' : 'Generar Imagen'}
      </button>
      {error && <p className='text-red-400 mt-4 text-sm'>{error}</p>}
      {result && (
        <div className='mt-6'>
          <img src={result.imageUrl} alt='Generated ad' className='w-full rounded-xl'/>
          <p className='text-green-400 text-sm mt-2'>Guardado en Drive — ID: {result.driveFileId}</p>
        </div>
      )}
    </div>
  );
}
