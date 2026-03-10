'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
 
export default function EquipoPage() {
  const { activeStoreId } = useStore();
  const [gestores, setGestores] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
  const [tab, setTab] = useState<'equipo' | 'tareas'>('equipo');
 
  const fetchAll = async () => {
    if (!activeStoreId) return;
    const [g, t] = await Promise.all([
      fetch(`/api/equipo/gestores?storeId=${activeStoreId}`).then(r => r.json()).catch(() => ({ gestores: [] })),
      fetch(`/api/equipo/tasks?storeId=${activeStoreId}`).then(r => r.json()).catch(() => ({ tasks: [] }))
    ]);
    setGestores(g.gestores || []);
    setTasks(t.tasks || []);
    // Calcular KPIs por gestor (pedidos asignados esta semana)
    const kpiMap: Record<string, any> = {};
    (g.gestores || []).forEach((g: any) => {
      kpiMap[g.id] = {
        tareasActivas: (t.tasks || []).filter((tk: any) => tk.assignedTo === g.id && tk.status !== 'DONE').length,
        tareasDone: (t.tasks || []).filter((tk: any) => tk.assignedTo === g.id && tk.status === 'DONE').length,
      };
    });
    setKpis(kpiMap);
  };
 
  useEffect(() => { fetchAll(); }, [activeStoreId]);
 
  const createTask = async () => {
    if (!newTask.title) return;
    await fetch('/api/equipo/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTask, storeId: activeStoreId })
    });
    setNewTask({ title: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
    fetchAll();
  };
 
  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/equipo/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchAll();
  };
 
  const PRIORITY_COLORS: Record<string, string> = { LOW: 'text-gray-400', MEDIUM: 'text-yellow-400', HIGH: 'text-orange-400', CRITICAL: 'text-red-400' };
  const STATUS_COLORS: Record<string, string> = { TODO: 'bg-gray-700', IN_PROGRESS: 'bg-blue-900', DONE: 'bg-green-900', BLOCKED: 'bg-red-900' };
 
  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-6'>Equipo</h1>
      <div className='flex gap-4 mb-6'>
        {['equipo', 'tareas'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>{t}</button>
        ))}
      </div>
 
      {tab === 'equipo' && (
        <div className='grid gap-4'>
          {gestores.map((g: any) => (
            <div key={g.id} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm' style={{ background: g.color || '#3b82f6' }}>
                  {g.nombre?.charAt(0) || g.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className='text-white font-medium'>{g.nombre || g.name}</p>
                  <p className='text-gray-400 text-xs capitalize'>{g.tipo || g.rol || 'gestor'}</p>
                </div>
              </div>
              <div className='flex gap-6 text-center'>
                <div><p className='text-blue-400 font-bold'>{kpis[g.id]?.tareasActivas || 0}</p><p className='text-gray-400 text-xs'>Activas</p></div>
                <div><p className='text-green-400 font-bold'>{kpis[g.id]?.tareasDone || 0}</p><p className='text-gray-400 text-xs'>Hechas</p></div>
              </div>
            </div>
          ))}
          {gestores.length === 0 && <p className='text-gray-400 text-sm'>No hay gestores en este store</p>}
        </div>
      )}
 
      {tab === 'tareas' && (
        <div>
          <div className='bg-gray-800 rounded-xl p-4 mb-6'>
            <h3 className='text-white font-bold mb-3'>Nueva Tarea</h3>
            <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
              className='w-full bg-gray-700 text-white rounded p-2 text-sm mb-2' placeholder='Título de la tarea'/>
            <div className='flex gap-2'>
              <select value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                className='flex-1 bg-gray-700 text-white rounded p-2 text-sm'>
                <option value=''>Sin asignar</option>
                {gestores.map((g: any) => <option key={g.id} value={g.id}>{g.nombre || g.name}</option>)}
              </select>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                className='flex-1 bg-gray-700 text-white rounded p-2 text-sm'>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type='date' value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                className='flex-1 bg-gray-700 text-white rounded p-2 text-sm'/>
              <button onClick={createTask} className='px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium'>Crear</button>
            </div>
          </div>
          <div className='grid gap-3'>
            {tasks.map((task: any) => (
              <div key={task.id} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between'>
                <div>
                  <p className='text-white font-medium'>{task.title}</p>
                  <div className='flex gap-3 mt-1'>
                    <span className={`text-xs font-bold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    {task.assignedTo && <span className='text-xs text-gray-400'>{gestores.find(g => g.id === task.assignedTo)?.nombre || gestores.find(g => g.id === task.assignedTo)?.name || task.assignedTo}</span>}
                    {task.dueDate && <span className='text-xs text-gray-400'>Vence: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                  className={`text-xs text-white px-2 py-1 rounded ${STATUS_COLORS[task.status]}`}>
                  {['TODO','IN_PROGRESS','DONE','BLOCKED'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
