'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
 
export default function LandingsPage() {
  const { productId } = useProduct();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/research/results?productId=${productId}&step=P7`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);
 
  if (!productId) {
    return (
      <div className="p-8 text-center mt-10">
        <h2 className="text-[var(--text-h1)] font-bold mb-2 text-[var(--text)]">Ningún producto seleccionado</h2>
        <p className="text-[var(--text-muted)] font-medium">Selecciona un producto en el TopBar para analizar las Landings de Competencia.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 mt-10">
        <div className="animate-spin w-5 h-5 border-2 border-[var(--inv)] border-t-transparent rounded-full" />
        <span className="text-[var(--text-secondary)] font-semibold">Decodificando landings de competencia...</span>
      </div>
    );
  }

  // Parseo robusto
  let parsedContent = null;
  let rawText = '';
  const resultObj = data?.results?.[0];

  if (resultObj?.outputJson) {
      if (resultObj.outputJson.raw) {
          rawText = resultObj.outputJson.raw;
          const match = rawText.match(/```json\n([\s\S]*?)\n```/);
          if (match) {
              try { parsedContent = JSON.parse(match[1]); } catch (e) { }
          } else {
             try { parsedContent = JSON.parse(rawText); } catch(e) {}
          }
      } else {
          parsedContent = resultObj.outputJson;
      }
  } else if (resultObj?.outputText) {
      rawText = resultObj.outputText;
  }

  const breakdowns = parsedContent?.competitor_breakdowns || [];

  return (
    <div className='p-6 w-full max-w-[1400px] mx-auto space-y-6'>
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--inv-bg)] text-[var(--inv)] flex items-center justify-center border border-[var(--inv)]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v6h6"></path><path d="m3 12.5 5 5"></path><path d="m8 12.5-5 5"></path></svg>
        </div>
        <div>
          <h1 className='text-[var(--text-h1)] font-bold text-[var(--text)] leading-tight'>Landing Analyzer</h1>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mt-1">Research Lab • Fase P7 • Competencia</p>
        </div>
      </div>

      {!parsedContent && rawText && (
          <div className="ds-card-padded bg-[var(--surface2)]">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Respuesta Plana (Raw)</h3>
            <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">{rawText}</pre>
          </div>
      )}

      {parsedContent && breakdowns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {breakdowns.map((comp: any, i: number) => {
                  /* Assign a color depending on sophistication */
                  const isHigh = parseInt(comp.sophistication_level) >= 3;
                  return (
                    <div key={i} className="ds-card flex flex-col overflow-hidden h-full">
                        {/* Competitor Header */}
                        <div className="bg-[var(--inv-bg)] border-b border-[var(--inv)]/10 px-5 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--inv)]/20 flex items-center justify-center text-[var(--inv)] font-bold shadow-sm">
                               {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-bold text-[var(--inv)]/70 uppercase tracking-wider">Análisis de Competidor</p>
                              <h3 className="text-sm font-bold text-[var(--inv)] leading-none mt-1">{comp.competitor}</h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`badge ${isHigh ? 'bg-[var(--s-wa)]/10 text-[var(--s-wa)]' : 'bg-[var(--s-ok)]/10 text-[var(--s-ok)]'}`}>
                                    Nivel {comp.sophistication_level}
                                </span>
                                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Sofisticación</span>
                            </div>
                        </div>
                        
                        <div className="p-5 space-y-5 flex-1 bg-[var(--surface)]">
                            
                            {/* Core Mechanism */}
                            <div>
                                <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                    Mecanismo Prometido
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 bg-[var(--surface2)] rounded-lg">
                                    {comp.core_mechanism}
                                </p>
                            </div>

                            {/* Vulnerability */}
                            <div>
                                <h4 className="text-[10px] font-bold text-[var(--s-ko)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                    Punto de Quiebre / Saturación
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 bg-[var(--s-ko)]/5 border border-[var(--s-ko)]/10 rounded-lg">
                                    {comp.vulnerability}
                                </p>
                            </div>

                            {/* Kill Angle */}
                            <div>
                                <h4 className="text-[10px] font-bold text-[var(--inv)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    Kill Angle (Cómo Destruirles)
                                </h4>
                                <p className="text-xs font-semibold text-[var(--inv)] leading-relaxed p-3 bg-[var(--inv)]/10 border border-[var(--inv)]/20 rounded-lg">
                                    {comp.kill_angle}
                                </p>
                            </div>

                        </div>
                    </div>
                  );
              })}
          </div>
      )}

      {/* Raw fallback of parsed object if missing */}
      {parsedContent && (!breakdowns || breakdowns.length === 0) && (
         <div className="ds-card-padded bg-[var(--surface)]">
             <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Análisis Crudo</h3>
             <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--text-secondary)]">{JSON.stringify(parsedContent, null, 2)}</pre>
         </div>
      )}
    </div>
  );
}
