'use client';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Plus, Pencil, Trash2, Bot, Sparkles, Save, X, Send, MessageSquare, ChevronRight, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MODULES = [
  { id: 'finanzas',      label: 'Finanzas',         emoji: '💰', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'crm',           label: 'CRM Forense',       emoji: '🔬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'creativo',      label: 'Centro Creativo',   emoji: '🎨', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'investigacion', label: 'Investigación',     emoji: '🔭', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'marketing',     label: 'Marketing & Ads',   emoji: '📡', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { id: 'operaciones',   label: 'Operaciones',       emoji: '⚙️', color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
  { id: 'drive',         label: 'Drive / Archivos',  emoji: '📁', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'mando',         label: 'Centro de Mando',   emoji: '🎛️', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { id: 'sistema',       label: 'Sistema',           emoji: '🛠️', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
];

// Agentes del sistema — estos NO se pueden borrar
const SYSTEM_AGENTS: Record<string, { label: string; description: string; module: string; emoji: string }> = {
  NEURAL_MOTHER:      { label: 'Neural Mother',       description: 'Agente Jefe — diagnóstico ejecutivo y coordinación total',        module: 'mando',         emoji: '🧠' },
  FUNNEL_ARCHITECT:   { label: 'Funnel Architect',    description: 'Landing + Advertorial + Listicle + Oferta + CRO',                module: 'creativo',      emoji: '🏗️' },
  VIDEO_INTELLIGENCE: { label: 'Video Intelligence',  description: 'Análisis + guión + dirección + UGC — todo sobre vídeo',           module: 'creativo',      emoji: '🎬' },
  IMAGE_DIRECTOR:     { label: 'Image Director',      description: 'Imágenes estáticas + carruseles + JSON para IA',                  module: 'creativo',      emoji: '🎨' },
  CREATIVE_FORENSIC:  { label: 'Creative Forensic',   description: 'Disección forense de vídeos, landings y carruseles',              module: 'investigacion', emoji: '🔍' },
  RESEARCH_CORE:      { label: 'Research Core',       description: 'Investigación P1-P7: producto, avatares, ángulos',               module: 'investigacion', emoji: '🔬' },
  MEDIA_BUYER:        { label: 'Media Buyer',          description: 'Meta Ads: análisis, escalado, diagnóstico de creativos',         module: 'marketing',     emoji: '📡' },
  OPS_COMMANDER:      { label: 'Ops Commander',        description: 'Pedidos, incidencias, equipo, postventa',                       module: 'operaciones',   emoji: '⚙️' },
  DRIVE_INTELLIGENCE: { label: 'Drive Intelligence',  description: 'Organización automática, nomenclatura y clasificación',          module: 'drive',         emoji: '📁' },
};

interface AgentConfig {
  agentId: string;
  systemPrompt: string;
  module?: string;
  isCustom?: boolean;
  label?: string;
  description?: string;
  emoji?: string;
}

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  ts: string;
}

function ModuleBadge({ moduleId }: { moduleId?: string }) {
  const mod = MODULES.find(m => m.id === moduleId) || MODULES[8];
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
      background: mod.bg, color: mod.color, border: `1px solid ${mod.border}`, whiteSpace: 'nowrap' }}>
      {mod.emoji} {mod.label}
    </span>
  );
}

export default function AgentesPage() {
  const { activeStoreId } = useStore();
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [editing, setEditing] = useState<AgentConfig | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Chat state
  const [chatAgent, setChatAgent] = useState<AgentConfig | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [newAgent, setNewAgent] = useState<Partial<AgentConfig>>({
    agentId: '', label: '', description: '', module: 'sistema', systemPrompt: '', isCustom: true
  });

  const loadConfigs = () => {
    if (!activeStoreId) return;
    fetch(`/api/agents/config?storeId=${activeStoreId}`)
      .then(r => r.json())
      .then(d => setConfigs(Array.isArray(d) ? d : []));
  };

  useEffect(() => { loadConfigs(); }, [activeStoreId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  // ── Guardar edición ────────────────────────────────────────────
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, agentId: editing.agentId,
          systemPrompt: editing.systemPrompt, module: editing.module,
          label: editing.label, description: editing.description })
      });
      toast.success('Agente actualizado');
      setEditing(null);
      loadConfigs();
    } finally { setSaving(false); }
  };

  // ── Crear agente ───────────────────────────────────────────────
  const createAgent = async () => {
    if (!newAgent.agentId || !newAgent.label) { toast.error('ID y nombre son obligatorios'); return; }
    setSaving(true);
    try {
      await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStoreId,
          agentId: newAgent.agentId!.toUpperCase().replace(/\s+/g, '_'),
          systemPrompt: newAgent.systemPrompt || '',
          module: newAgent.module, label: newAgent.label,
          description: newAgent.description, isCustom: true,
        })
      });
      toast.success('Agente creado');
      setCreating(false);
      setNewAgent({ agentId: '', label: '', description: '', module: 'sistema', systemPrompt: '', isCustom: true });
      loadConfigs();
    } finally { setSaving(false); }
  };

  // ── Generar prompt con Neural Mother ──────────────────────────
  const generatePrompt = async (target: 'new' | 'edit') => {
    const agent = target === 'new' ? newAgent : editing;
    if (!agent?.label) { toast.error('Escribe el nombre del agente primero'); return; }
    setGeneratingPrompt(true);
    try {
      const res = await fetch('/api/agents/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: agent.label,
          description: agent.description,
          module: agent.module,
          basePrompt: agent.systemPrompt,
          storeId: activeStoreId
        })
      });
      const data = await res.json();
      if (data.ok) {
        if (target === 'new') setNewAgent(p => ({ ...p, systemPrompt: data.prompt }));
        else setEditing(p => p ? { ...p, systemPrompt: data.prompt } : null);
        toast.success('Prompt generado por Neural Mother ✨');
      }
    } catch { toast.error('Error generando prompt'); }
    finally { setGeneratingPrompt(false); }
  };

  // ── Eliminar agente ────────────────────────────────────────────
  const deleteAgent = async (agentId: string) => {
    setDeleting(agentId);
    try {
      await fetch('/api/agents/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, agentId })
      });
      toast.success('Agente eliminado');
      loadConfigs();
    } finally { setDeleting(null); }
  };

  // ── Chat con agente ────────────────────────────────────────────
  const openChat = (agent: AgentConfig) => {
    setChatAgent(agent);
    setChatHistory([]);
    setChatInput('');
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatAgent || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput, ts: new Date().toISOString() };
    setChatHistory(h => [...h, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStoreId,
          agentId: chatAgent.agentId,
          message: chatInput,
          history: chatHistory.slice(-6).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }))
        })
      });
      const data = await res.json();
      const agentMsg: ChatMessage = { role: 'agent', content: data.response || data.error || 'Sin respuesta', ts: new Date().toISOString() };
      setChatHistory(h => [...h, agentMsg]);
    } catch {
      setChatHistory(h => [...h, { role: 'agent', content: 'Error de conexión', ts: new Date().toISOString() }]);
    } finally { setChatLoading(false); }
  };

  // ── Enriquecer agentes con info del sistema ────────────────────
  const enriched = (configs || []).filter(Boolean).map(cfg => {
    const sys = SYSTEM_AGENTS[cfg.agentId];
    return {
      ...cfg,
      label:       cfg.label       || sys?.label       || cfg.agentId,
      description: cfg.description || sys?.description || '',
      module:      cfg.module      || sys?.module      || 'sistema',
      emoji:       (cfg as any).emoji       || sys?.emoji       || '🤖',
      isSystem:    !!sys,
    };
  });

  const grouped = MODULES.map(mod => ({
    mod, agents: enriched.filter(a => a && a.module === mod.id),
  })).filter(g => g && g.mod && g.agents.length > 0);

  // ═══════════════════ RENDER ═══════════════════
  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 80px)' }}>

      {/* ── Panel izquierdo: lista de agentes ── */}
      <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Agentes IA</h1>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{configs.length} agentes activos</p>
          </div>
          <button onClick={() => setCreating(true)} className="ds-btn"
            style={{ background: 'var(--ops)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
            <Plus size={14} /> Nuevo Agente
          </button>
        </div>

        {/* ── Modal crear agente ── */}
        {creating && (
          <div className="ds-card" style={{ border: '1.5px solid #6366f1', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>✨ Nuevo Agente</span>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>ID *</label>
                <input className="ds-input" placeholder="MI_AGENTE" value={newAgent.agentId}
                  onChange={e => setNewAgent(p => ({ ...p, agentId: e.target.value }))}
                  style={{ fontSize: '12px', fontFamily: 'monospace', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input className="ds-input" placeholder="Mi Agente Especialista" value={newAgent.label}
                  onChange={e => setNewAgent(p => ({ ...p, label: e.target.value }))}
                  style={{ fontSize: '12px', width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Módulo</label>
                <select className="ds-input" value={newAgent.module}
                  onChange={e => setNewAgent(p => ({ ...p, module: e.target.value }))}
                  style={{ fontSize: '12px', width: '100%' }}>
                  {MODULES.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Descripción</label>
                <input className="ds-input" placeholder="¿Qué hace?" value={newAgent.description}
                  onChange={e => setNewAgent(p => ({ ...p, description: e.target.value }))}
                  style={{ fontSize: '12px', width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>System Prompt</label>
                <button onClick={() => generatePrompt('new')} disabled={generatingPrompt}
                  style={{ background: 'none', border: '1px solid #6366f1', borderRadius: '6px', padding: '2px 8px',
                    fontSize: '10px', fontWeight: 700, color: '#6366f1', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {generatingPrompt ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                  {generatingPrompt ? 'Generando...' : 'Generar con IA'}
                </button>
              </div>
              <textarea className="ds-input" value={newAgent.systemPrompt}
                onChange={e => setNewAgent(p => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="Escribe un prompt base o déjalo vacío y haz clic en 'Generar con IA'..."
                rows={6} style={{ fontSize: '11px', width: '100%', fontFamily: 'monospace', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createAgent} disabled={saving} className="ds-btn"
                style={{ background: '#6366f1', color: 'white', fontSize: '12px' }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Crear Agente
              </button>
              <button onClick={() => setCreating(false)} className="ds-btn"
                style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Lista agrupada por módulo ── */}
        {grouped.map(({ mod, agents }) => (
          <div key={mod.id}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: mod.color, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{mod.emoji}</span> {mod.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {agents.filter(Boolean).map(agent => agent && (
                <div key={agent.agentId}>
                  {/* ── Tarjeta agente ── */}
                  {editing?.agentId === agent.agentId ? (
                    <div className="ds-card" style={{ padding: '16px', border: `1.5px solid ${mod.color}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nombre</label>
                          <input className="ds-input" value={editing.label || ''}
                            onChange={e => setEditing(p => p ? { ...p, label: e.target.value } : null)}
                            style={{ fontSize: '12px', width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Módulo</label>
                          <select className="ds-input" value={editing.module || 'sistema'}
                            onChange={e => setEditing(p => p ? { ...p, module: e.target.value } : null)}
                            style={{ fontSize: '12px', width: '100%' }}>
                            {MODULES.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>System Prompt</label>
                          <button onClick={() => generatePrompt('edit')} disabled={generatingPrompt}
                            style={{ background: 'none', border: `1px solid ${mod.color}`, borderRadius: '6px',
                              padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: mod.color,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {generatingPrompt ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                            Mejorar con IA
                          </button>
                        </div>
                        <textarea className="ds-input" value={editing.systemPrompt}
                          onChange={e => setEditing(p => p ? { ...p, systemPrompt: e.target.value } : null)}
                          rows={8} style={{ fontSize: '11px', width: '100%', fontFamily: 'monospace', resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={save} disabled={saving} className="ds-btn"
                          style={{ background: mod.color, color: 'white', fontSize: '12px' }}>
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
                        </button>
                        <button onClick={() => setEditing(null)} className="ds-btn"
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ds-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: mod.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {agent.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{agent.label}</span>
                          <ModuleBadge moduleId={agent.module} />
                          {(agent as any).isSystem && (
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                              background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>SISTEMA</span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.description}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {/* Botón chat */}
                        <button onClick={() => openChat(agent)}
                          style={{ width: '30px', height: '30px', borderRadius: '8px', border: `1px solid ${mod.border}`,
                            background: mod.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Chatear con este agente">
                          <MessageSquare size={13} color={mod.color} />
                        </button>
                        {/* Botón editar */}
                        <button onClick={() => setEditing(agent)}
                          style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0',
                            background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil size={13} color="#475569" />
                        </button>
                        {/* Botón eliminar — solo agentes custom */}
                        {(agent as any).isCustom && (
                          <button onClick={() => deleteAgent(agent.agentId)} disabled={deleting === agent.agentId}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #fee2e2',
                              background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {deleting === agent.agentId ? <Loader2 size={13} className="animate-spin" color="#ef4444" /> : <Trash2 size={13} color="#ef4444" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Panel derecho: chat con agente ── */}
      {chatAgent ? (
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--surface)', overflow: 'hidden' }}>

          {/* Header del chat */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px',
              background: MODULES.find(m => m.id === chatAgent.module)?.bg || '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              {chatAgent.emoji || '🤖'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{chatAgent.label}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{chatAgent.description}</div>
            </div>
            <button onClick={() => setChatAgent(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={16} />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{chatAgent.emoji || '🤖'}</div>
                <div style={{ fontWeight: 600 }}>Chat con {chatAgent.label}</div>
                <div style={{ marginTop: '4px', fontSize: '11px' }}>Escribe tu primera pregunta o tarea</div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--inv)' : 'var(--surface2)',
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                  fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface2)',
                  display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8',
                      animation: `bounce 1s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Escribe tu mensaje... (Enter para enviar)"
              rows={2}
              style={{ flex: 1, resize: 'none', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '8px 12px', fontSize: '12px', background: 'var(--surface2)', outline: 'none',
                fontFamily: 'inherit' }}
            />
            <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--inv)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', alignSelf: 'flex-end', opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1 }}>
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ width: '380px', flexShrink: 0, border: '1px dashed var(--border)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#94a3b8' }}>
          <MessageSquare size={24} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Selecciona un agente para chatear</span>
        </div>
      )}
    </div>
  );
}
