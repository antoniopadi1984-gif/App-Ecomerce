'use client';
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { toast } from 'sonner';

// ── tipos ───────────────────────────────────────────────────────────
interface ResearchResult {
  stepKey: string;
  outputJson: any;
  outputText: string | null;
  createdAt: string;
}

// ── helpers ─────────────────────────────────────────────────────────
const STEP_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  P1: { label: 'Problema & Avatar',   emoji: '🎯', color: '#6366f1' },
  P2: { label: 'Ángulos de Mensaje',  emoji: '💡', color: '#f59e0b' },
  P3: { label: 'Mecanismo Único',     emoji: '⚙️', color: '#10b981' },
  P4: { label: 'Offer Stack',         emoji: '🎁', color: '#3b82f6' },
  P5: { label: 'Combo Matrix',        emoji: '🧠', color: '#8b5cf6' },
  P6: { label: 'Vector Mapping',      emoji: '🗺️', color: '#14b8a6' },
  P7: { label: 'Landing Analyzer',    emoji: '💻', color: '#ec4899' },
};

const LS: React.CSSProperties = {
  fontSize: '9px', fontWeight: 800, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em',
};

// ── component ────────────────────────────────────────────────────────
export default function ResearchLabPage() {
  const { activeStoreId } = useStore();
  const { productId } = useProduct();

  const [results, setResults]         = useState<ResearchResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [running, setRunning]         = useState(false);
  const [activeStep, setActiveStep]   = useState<string | null>(null);
  const [product, setProduct]         = useState<any>(null);

  // Cargar producto seleccionado
  useEffect(() => {
    if (!productId) { setProduct(null); setResults([]); return; }
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product || d))
      .catch(() => {});
  }, [productId]);

  // Cargar resultados de research
  const loadResults = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/research/results?productId=${productId}`);
      const d = await r.json();
      setResults(d.results || []);
    } catch { /* silence */ }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // Lanzar pipeline — llama al endpoint REAL /api/research/god-tier
  const runPipeline = async (step?: string) => {
    if (!productId || !activeStoreId) {
      toast.error('Necesitas una tienda y un producto seleccionados');
      return;
    }
    setRunning(true);
    const runId = `run_${Date.now()}`;
    const stepsToRun = step ? [step] : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

    try {
      for (const s of stepsToRun) {
        toast.loading(`⏳ Ejecutando ${STEP_LABELS[s]?.label || s}...`, { id: `step-${s}` });
        const res = await fetch('/api/research/god-tier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, storeId: activeStoreId, stepKey: s, runId }),
        });
        const d = await res.json();
        toast.dismiss(`step-${s}`);
        if (!d.ok) {
          toast.error(`Error en ${s}: ${d.error || 'desconocido'}`);
          break;
        }
        toast.success(`✅ ${STEP_LABELS[s]?.label || s} completado`);
      }
      await loadResults();
    } catch (e: any) {
      toast.error('Error en research: ' + (e.message || ''));
    } finally {
      setRunning(false);
    }
  };


  const getResult = (key: string) => results.find(r => r.stepKey === key);
  const completedSteps = Object.keys(STEP_LABELS).filter(k => getResult(k));

  // ── EMPTY — sin producto ──────────────────────────────────────────
  if (!productId) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔬</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Research Lab</h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
            Selecciona o crea un producto desde el selector superior para analizar su potencial de mercado.
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px 24px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '22px' }}>🔬</span>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Research Lab</h1>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', background: '#f3e8ff', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              God Tier Intelligence
            </span>
          </div>
          {product && (
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{product.title}</span>
              {product.niche && <span style={{ marginLeft: '8px', padding: '1px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '10px' }}>{product.niche}</span>}
              {product.country && <span style={{ marginLeft: '4px', padding: '1px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '10px' }}>{product.country}</span>}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={loadResults} disabled={loading}
            style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
          <button onClick={() => runPipeline()} disabled={running}
            style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', background: running ? '#e2e8f0' : '#7c3aed', color: running ? '#94a3b8' : 'white', fontSize: '11px', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {running ? '⏳ Analizando...' : completedSteps.length > 0 ? '🔄 Re-analizar todo' : '🚀 Lanzar Research Completo'}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {Object.entries(STEP_LABELS).map(([key, { label, emoji, color }]) => {
          const done = !!getResult(key);
          return (
            <div key={key} onClick={() => setActiveStep(activeStep === key ? null : key)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${done ? color : '#e2e8f0'}`, background: done ? color + '12' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px' }}>{emoji}</span>
                {done
                  ? <span style={{ fontSize: '10px', color: color, fontWeight: 700 }}>✓</span>
                  : <button onClick={e => { e.stopPropagation(); runPipeline(key); }} disabled={running}
                      style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${color}`, background: 'transparent', color, cursor: 'pointer', fontWeight: 700 }}>
                      Run
                    </button>
                }
              </div>
              <p style={{ ...LS, color: done ? color : '#94a3b8', marginTop: '4px', marginBottom: '2px' }}>{key}</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: done ? '#0f172a' : '#94a3b8', margin: 0 }}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* RESULTS */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>⏳ Cargando datos...</div>
      )}

      {!loading && completedSteps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Sin research todavía</h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px' }}>
            Lanza el pipeline completo para generar el análisis de mercado del producto.
          </p>
          <button onClick={() => runPipeline()} disabled={running}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            🚀 Lanzar Research Completo
          </button>
        </div>
      )}

      {/* Step detail cards */}
      {!loading && completedSteps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: activeStep ? '1fr' : 'repeat(auto-fill, minmax(440px, 1fr))', gap: '12px' }}>
          {(activeStep ? [activeStep] : completedSteps).map(key => {
            const { label, emoji, color } = STEP_LABELS[key] || { label: key, emoji: '📄', color: '#64748b' };
            const result = getResult(key);
            if (!result) return null;
            const json  = result.outputJson;
            const text  = result.outputText;

            return (
              <div key={key} style={{ background: 'white', borderRadius: '12px', border: `1.5px solid ${color}30`, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: color + '08' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{emoji}</span>
                    <div>
                      <span style={{ fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</span>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{label}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setActiveStep(activeStep === key ? null : key)}
                      style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                      {activeStep === key ? '← Volver' : 'Ver todo'}
                    </button>
                    <button onClick={() => runPipeline(key)} disabled={running}
                      style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', border: `1px solid ${color}`, background: 'transparent', color, cursor: 'pointer', fontWeight: 600 }}>
                      🔄 Re-run
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  {json ? (
                    <JsonViewer data={json} color={color} />
                  ) : text ? (
                    <div style={{ fontSize: '12px', lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>{text}</div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Sin datos estructurados</p>
                  )}
                  <p style={{ ...LS, marginTop: '12px', marginBottom: 0 }}>
                    Generado: {new Date(result.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── JsonViewer — renderiza objetos/arrays de forma legible ────────
function JsonViewer({ data, color }: { data: any; color: string }) {
  if (Array.isArray(data)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item: any, i: number) => (
          <div key={i} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '7px', borderLeft: `3px solid ${color}` }}>
            {typeof item === 'object' ? <JsonViewer data={item} color={color} /> : (
              <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (data && typeof data === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <p style={{ ...LS, marginBottom: '3px', color: color }}>{k.replace(/_/g, ' ')}</p>
            {Array.isArray(v) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(v as any[]).map((item, i) => (
                  typeof item === 'string'
                    ? <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: color + '18', color, borderRadius: '20px', fontWeight: 600 }}>{item}</span>
                    : <div key={i} style={{ width: '100%', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', color: '#334155' }}>
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </div>
                ))}
              </div>
            ) : typeof v === 'object' && v !== null ? (
              <div style={{ paddingLeft: '8px', borderLeft: '2px solid #e2e8f0' }}>
                <JsonViewer data={v} color={color} />
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>{String(v)}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>{String(data)}</p>;
}
