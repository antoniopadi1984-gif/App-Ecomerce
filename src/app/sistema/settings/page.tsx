'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
 
export default function SettingsPage() {
  const { activeStore } = useStore();
  const [status, setStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
 
  const fetchStatus = async () => {
    if (!activeStore?.id) return;
    const r = await fetch(`/api/connections/status?storeId=${activeStore.id}`);
    const d = await r.json();
    setStatus(d);
  };
 
  const triggerSync = async () => {
    setSyncing(true);
    await fetch('/api/system/full-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: activeStore?.id })
    });
    setLastSync(new Date().toLocaleTimeString());
    await fetchStatus();
    setSyncing(false);
  };
 
  useEffect(() => { fetchStatus(); }, [activeStore?.id]);
 
  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-2xl font-bold text-white'>Sistema & Conexiones</h1>
        <button onClick={triggerSync} disabled={syncing}
          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium'>
          {syncing ? 'Sincronizando...' : 'Sync Manual'}
        </button>
      </div>
      {lastSync && <p className='text-sm text-gray-400 mb-4'>Último sync: {lastSync}</p>}
      {status && (
        <div className='grid gap-4'>
          {Object.entries(status).map(([key, val]: [string, any]) => (
            <div key={key} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between'>
              <span className='text-gray-200 font-medium'>{key}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                val?.connected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {val?.connected ? 'Conectado' : 'Sin conexión'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
