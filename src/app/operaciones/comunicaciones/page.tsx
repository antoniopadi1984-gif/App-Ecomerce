'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
 
const TRIGGERS = ['CONFIRMATION','PREPARATION','TRACKING','OUT_FOR_DELIVERY','DELIVERED','INCIDENCE'];
const CHANNELS = ['WHATSAPP', 'EMAIL'];
 
export default function ComunicacionesPage() {
  const { activeStore } = useStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [tab, setTab] = useState<'templates' | 'historial'>('templates');
 
  useEffect(() => {
    if (!activeStore?.id) return;
    fetch(`/api/notifications/templates?storeId=${activeStore.id}`).then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch(`/api/notifications/history?storeId=${activeStore.id}`).then(r => r.json()).then(d => setMessages(d.messages || []));
  }, [activeStore?.id]);
 
  const saveTemplate = async (t: any) => {
    await fetch('/api/notifications/templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, storeId: activeStore?.id })
    });
    setEditing(null);
    // refetch
    fetch(`/api/notifications/templates?storeId=${activeStore?.id}`).then(r => r.json()).then(d => setTemplates(d.templates || []));
  };
 
  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-6'>Comunicaciones Automáticas</h1>
      <div className='flex gap-4 mb-6'>
        {['templates','historial'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
            {t === 'templates' ? 'Plantillas' : 'Historial'}
          </button>
        ))}
      </div>
      {tab === 'templates' && (
        <div className='grid gap-4'>
          {TRIGGERS.map(trigger => {
            const t = templates.find((x: any) => x.trigger === trigger) || { trigger, body: '', channel: 'WHATSAPP', isEnabled: false };
            return editing?.trigger === trigger ? (
              <div key={trigger} className='bg-gray-800 rounded-xl p-4'>
                <h3 className='text-white font-bold mb-2'>{trigger}</h3>
                <textarea value={editing.body} onChange={e => setEditing({...editing, body: e.target.value})}
                  className='w-full bg-gray-700 text-white rounded p-2 text-sm h-24 mb-2'
                  placeholder='Usa {{name}}, {{order_number}}, {{tracking}}, {{tracking_url}}'/>
                <div className='flex gap-2'>
                  <button onClick={() => saveTemplate(editing)} className='px-3 py-1 bg-green-600 text-white rounded text-sm'>Guardar</button>
                  <button onClick={() => setEditing(null)} className='px-3 py-1 bg-gray-600 text-white rounded text-sm'>Cancelar</button>
                </div>
              </div>
            ) : (
              <div key={trigger} className='bg-gray-800 rounded-xl p-4 flex items-start justify-between'>
                <div>
                  <span className='text-blue-400 font-bold text-sm'>{trigger}</span>
                  <p className='text-gray-300 text-sm mt-1'>{t.body || 'Sin configurar'}</p>
                </div>
                <button onClick={() => setEditing({...t})} className='px-3 py-1 bg-blue-700 text-white rounded text-sm ml-4'>Editar</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'historial' && (
        <div className='grid gap-2'>
          {messages.map((m: any) => (
            <div key={m.id} className='bg-gray-800 rounded-xl p-3 flex justify-between items-center'>
              <div>
                <span className='text-gray-400 text-xs'>{new Date(m.timestamp).toLocaleString()}</span>
                <p className='text-white text-sm'>{m.content}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${m.status === 'SENT' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{m.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
