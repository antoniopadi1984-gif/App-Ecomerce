'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { Plus, Pencil, Trash2, Bot, Sparkles, Save, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// ── Módulos disponibles para asignar ──────────────────────────────
const MODULES = [
  { id: 'finanzas',         label: 'Finanzas',          emoji: '💰', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'crm',              label: 'CRM Forense',        emoji: '🔬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'creativo',         label: 'Centro Creativo',    emoji: '🎨', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'investigacion',    label: 'Investigación',      emoji: '🔭', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'marketing',        label: 'Marketing & Ads',    emoji: '📡', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { id: 'operaciones',      label: 'Operaciones',        emoji: '⚙️', color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
  { id: 'drive',            label: 'Drive / Archivos',   emoji: '📁', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'mando',            label: 'Centro de Mando',    emoji: '🎛️', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { id: 'sistema',          label: 'Sistema',            emoji: '🛠️', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
];

// ── Agentes predefinidos (sistema) ────────────────────────────────
const SYSTEM_AGENTS: Record<string, { label: string; description: string; module: string; emoji: string }> = {
  NEURAL_MOTHER:       { label: 'Neural Mother',        description: 'Agente Jefe — diagnóstico ejecutivo y coordinación total',         module: 'mando',         emoji: '🧠' },
  FUNNEL_ARCHITECT:    { label: 'Funnel Architect',      description: 'Landing + Advertorial + Listicle + Oferta + CRO — máximo nivel',   module: 'creativo',      emoji: '🏗️' },
  VIDEO_INTELLIGENCE:  { label: 'Video Intelligence',    description: 'Análisis + guión + dirección + UGC — todo sobre vídeo',            module: 'creativo',      emoji: '🎬' },
  IMAGE_DIRECTOR:      { label: 'Image Director',        description: 'Imágenes estáticas + carruseles + JSON para generación IA',        module: 'creativo',      emoji: '🎨' },
  RESEARCH_CORE:       { label: 'Research Core',         description: 'Investigación P1-P7: producto, avatares, ángulos, competencia',    module: 'investigacion', emoji: '🔬' },
  MEDIA_BUYER:         { label: 'Media Buyer',           description: 'Meta Ads: análisis, escalado, diagnóstico de creativos',          module: 'marketing',     emoji: '📡' },
  OPS_COMMANDER:       { label: 'Ops Commander',         description: 'Pedidos, incidencias, equipo, postventa — todo operacional',       module: 'operaciones',   emoji: '⚙️' },
  DRIVE_INTELLIGENCE:  { label: 'Drive Intelligence',    description: 'Organización automática, nomenclatura y clasificación de Drive',   module: 'drive',         emoji: '📁' },
};

interface AgentConfig {
  agentId: string;
  systemPrompt: string;
  module?: string;
  isCustom?: boolean;
  label?: string;
  description?: string;
}

function ModuleBadge({ moduleId }: { moduleId?: string }) {
  const mod = MODULES.find(m => m.id === moduleId) || MODULES.find(m => m.id === 'sistema')!;
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
      background: mod.bg, color: mod.color, border: `1px solid ${mod.border}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
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

  // ── Save edit ─────────────────────────────────────────────────
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStoreId,
          agentId: editing.agentId,
          systemPrompt: editing.systemPrompt,
          module: editing.module,
          label: editing.label,
          description: editing.description,
        })
      });
      toast.success('Agente actualizado');
      setEditing(null);
      loadConfigs();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Create new agent ──────────────────────────────────────────
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
          module: newAgent.module,
          label: newAgent.label,
          description: newAgent.description,
          isCustom: true,
        })
      });
      toast.success('Agente creado');
      setCreating(false);
      setNewAgent({ agentId: '', label: '', description: '', module: 'sistema', systemPrompt: '', isCustom: true });
      loadConfigs();
    } catch {
      toast.error('Error al crear agente');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete agent ──────────────────────────────────────────────
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
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  // Merge system info with config
  const enriched = configs.map(cfg => {
    const sys = SYSTEM_AGENTS[cfg.agentId];
    return {
      ...cfg,
      label:       cfg.label       || sys?.label       || cfg.agentId,
      description: cfg.description || sys?.description || '',
      module:      cfg.module      || sys?.module      || 'sistema',
      emoji:       sys?.emoji      || '🤖',
    };
  });

  // Group by module
  const grouped = MODULES.map(mod => ({
    mod,
    agents: enriched.filter(a => a.module === mod.id),
  })).filter(g => g.agents.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fade-in 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Agentes IA
          </h1>
          <p style={{ fontSize: '12px', color: '#334155', marginTop: '4px', fontWeight: 500 }}>
            Configura y asigna agentes a módulos específicos · {configs.length} agentes activos
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="ds-btn"
          style={{ background: 'var(--ops)', color: 'white', textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', fontWeight: 700 }}
        >
          <Plus size={14} />
          Nuevo Agente
        </button>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      {creating && (
        <div className="ds-card" style={{ border: '1.5px solid #6366f1', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#6366f1" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Nuevo Agente Personalizado</span>
            </div>
            <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                ID del Agente *
              </label>
              <input
                className="ds-input"
                placeholder="AGENTE_DRIVE"
                value={newAgent.agentId}
                onChange={e => setNewAgent(p => ({ ...p, agentId: e.target.value }))}
                style={{ fontSize: '12px', fontFamily: 'monospace', width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                Nombre del Agente *
              </label>
              <input
                className="ds-input"
                placeholder="Gestor de Drive"
                value={newAgent.label}
                onChange={e => setNewAgent(p => ({ ...p, label: e.target.value }))}
                style={{ fontSize: '12px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                Módulo Asignado
              </label>
              <select
                className="ds-input"
                value={newAgent.module}
                onChange={e => setNewAgent(p => ({ ...p, module: e.target.value }))}
                style={{ fontSize: '12px', width: '100%' }}
              >
                {MODULES.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                Descripción breve
              </label>
              <input
                className="ds-input"
                placeholder="¿Qué hace este agente?"
                value={newAgent.description}
                onChange={e => setNewAgent(p => ({ ...p, description: e.target.value }))}
                style={{ fontSize: '12px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
              System Prompt
            </label>
            <textarea
              className="ds-input"
              value={newAgent.systemPrompt}
              onChange={e => setNewAgent(p => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="Eres un agente especializado en..."
              rows={5}
              style={{ fontSize: '12px', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createAgent}
              disabled={saving}
              className="ds-btn"
              style={{ background: '#6366f1', color: 'white', textTransform: 'none', letterSpacing: 'normal', fontSize: '12px' }}
            >
              <Save size={13} />
              {saving ? 'Creando...' : 'Crear Agente'}
            </button>
            <button onClick={() => setCreating(false)} className="ds-btn" style={{ background: 'var(--surface2)', color: 'var(--text)', textTransform: 'none', letterSpacing: 'normal', fontSize: '12px' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Grouped by module ──────────────────────────────────────────── */}
      {grouped.length === 0 && !creating && (
        <div className="ds-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', flexDirection: 'column', gap: '12px', color: '#475569', textAlign: 'center' }}>
          <Bot size={36} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Sin agentes configurados</span>
          <span style={{ fontSize: '12px' }}>Crea tu primer agente con el botón superior</span>
        </div>
      )}

      {grouped.map(({ mod, agents }) => (
        <div key={mod.id}>
          {/* Module header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '2px' }}>
            <span style={{ fontSize: '14px' }}>{mod.emoji}</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: mod.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mod.label}</span>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>({agents.length})</span>
            <div style={{ flex: 1, height: '1px', background: mod.border, marginLeft: '4px' }} />
          </div>

          {/* Agent cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '8px' }}>
            {agents.map((cfg: any) => (
              editing?.agentId === cfg.agentId ? (
                /* ── Edit inline card ── */
                <div key={cfg.agentId} className="ds-card" style={{ padding: '16px', border: `1.5px solid ${mod.color}`, gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{cfg.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{cfg.label}</span>
                      <ModuleBadge moduleId={editing!.module} />
                    </div>
                    <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Módulo</label>
                      <select
                        className="ds-input"
                        value={editing!.module || ''}
                        onChange={e => setEditing({ ...editing!, module: e.target.value } as AgentConfig)}
                        style={{ fontSize: '12px', width: '100%' }}
                      >
                        {MODULES.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Descripción</label>
                      <input
                        className="ds-input"
                        value={editing!.description || ''}
                        onChange={e => setEditing({ ...editing!, description: e.target.value } as AgentConfig)}
                        style={{ fontSize: '12px', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>System Prompt</label>
                    <textarea
                      value={editing!.systemPrompt || ''}
                      onChange={e => setEditing({ ...editing!, systemPrompt: e.target.value } as AgentConfig)}
                      className="ds-input"
                      rows={7}
                      style={{ fontSize: '12px', width: '100%', fontFamily: 'monospace', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="ds-btn"
                      style={{ background: mod.color, color: 'white', textTransform: 'none', letterSpacing: 'normal', fontSize: '12px' }}
                    >
                      <Save size={13} />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditing(null)} className="ds-btn" style={{ background: 'var(--surface2)', color: 'var(--text)', textTransform: 'none', letterSpacing: 'normal', fontSize: '12px' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Compact agent card ── */
                <div key={cfg.agentId} className="ds-card" style={{
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'default', transition: 'box-shadow 0.15s',
                  borderLeft: `3px solid ${mod.color}`,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: mod.bg, border: `1px solid ${mod.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                  }}>
                    {cfg.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                        {cfg.agentId}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cfg.description}
                    </p>
                    {cfg.systemPrompt && (
                      <p style={{ fontSize: '10px', color: '#475569', margin: '3px 0 0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cfg.systemPrompt.slice(0, 80)}…
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => setEditing({ ...cfg })}
                      title="Editar agente"
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#1e293b', transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.color = mod.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el agente "${cfg.label}"? Esta acción no se puede deshacer.`)) {
                          deleteAgent(cfg.agentId);
                        }
                      }}
                      disabled={deleting === cfg.agentId}
                      title="Eliminar agente"
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#475569', transition: 'all 0.12s', opacity: deleting === cfg.agentId ? 0.5 : 1,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
