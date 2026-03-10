'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
 
const AGENT_LABELS: Record<string, { label: string; description: string; module: string }> = {
  DIRECTOR_CREATIVO:    { label: 'Director Creativo', description: 'Analiza creativos y sugiere mejoras de hook y retención', module: 'Centro Creativo' },
  ESPECIALISTA_META:    { label: 'Especialista Meta Ads', description: 'Optimiza campañas, presupuesto y targeting', module: 'Marketing' },
  ANALISTA_INVESTIGACION: { label: 'Analista Research', description: 'Extrae avatares, ángulos y copy de producto', module: 'Investigación' },
  GESTOR_OPERACIONES:   { label: 'Gestor Operaciones', description: 'Supervisa pedidos, incidencias y logística', module: 'Operaciones' },
  ASESOR_FINANCIERO:    { label: 'Asesor Financiero', description: 'Analiza márgenes, ROAS y rentabilidad', module: 'Finanzas' },
  AGENTE_CRM:           { label: 'Agente CRM', description: 'Analiza comportamiento de clientes y cohortes', module: 'CRM Forense' },
  COPYWRITER:           { label: 'Copywriter', description: 'Genera hooks, scripts y copy de respuesta directa', module: 'Centro Creativo' },
  AGENTE_JEFE:          { label: 'Agente Jefe', description: 'Análisis semanal ejecutivo y alertas críticas', module: 'Sistema' },
  AGENTE_EQUIPO:        { label: 'Agente RRHH', description: 'Analiza rendimiento del equipo y sugiere mejoras', module: 'Operaciones' },
};
 
export default function AgentesPage() {
  const { activeStoreId } = useStore();
  const [configs, setConfigs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
 
  useEffect(() => {
    if (!activeStoreId) return;
    fetch(`/api/agents/config?storeId=${activeStoreId}`).
      then(r => r.json()).then(d => setConfigs(Array.isArray(d) ? d : []));
  }, [activeStoreId]);
 
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch('/api/agents/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: activeStoreId, agentId: editing.agentId, systemPrompt: editing.systemPrompt })
    });
    setEditing(null);
    fetch(`/api/agents/config?storeId=${activeStoreId}`).then(r => r.json()).then(d => setConfigs(Array.isArray(d) ? d : []));
    setSaving(false);
  };
 
  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-2'>Agentes IA</h1>
      <p className='text-gray-400 mb-8'>Personaliza el comportamiento de cada agente para esta tienda.</p>
      <div className='grid gap-4'>
        {configs.map((cfg: any) => {
          const info = AGENT_LABELS[cfg.agentId] || { label: cfg.agentId, description: '', module: 'Sistema' };
          return editing?.agentId === cfg.agentId ? (
            <div key={cfg.agentId} className='bg-gray-800 rounded-xl p-4 border border-blue-500'>
              <div className='flex justify-between mb-2'>
                <h3 className='text-white font-bold'>{info.label}</h3>
                <span className='text-xs text-blue-400 px-2 py-1 bg-blue-900 rounded'>{info.module}</span>
              </div>
              <textarea value={editing.systemPrompt}
                onChange={e => setEditing({...editing, systemPrompt: e.target.value})}
                className='w-full bg-gray-700 text-white rounded p-3 text-sm h-40 font-mono mb-3'/>
              <div className='flex gap-2'>
                <button onClick={save} disabled={saving} className='px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50'>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(null)} className='px-4 py-2 bg-gray-600 text-white rounded text-sm'>Cancelar</button>
              </div>
            </div>
          ) : (
            <div key={cfg.agentId} className='bg-gray-800 rounded-xl p-4 flex items-start justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <h3 className='text-white font-medium'>{info.label}</h3>
                  <span className='text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded'>{info.module}</span>
                </div>
                <p className='text-gray-400 text-sm'>{info.description}</p>
                <p className='text-gray-600 text-xs mt-2 font-mono truncate max-w-xl'>{cfg.systemPrompt?.slice(0,100)}...</p>
              </div>
              <button onClick={() => setEditing({...cfg})} className='ml-4 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm'>Editar</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
