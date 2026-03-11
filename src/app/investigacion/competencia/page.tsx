'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
 
export default function CompetenciaPage() {
  const { productId } = useProduct();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/research/results?productId=${productId}&step=P3`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);
 
  if (!productId) {
    return (
      <div className="p-8 text-center mt-10">
        <h2 className="text-[var(--text-h1)] font-bold mb-2 text-[var(--text)]">Ningún producto seleccionado</h2>
        <p className="text-[var(--text-muted)] font-medium">Selecciona un producto en el TopBar para ver el Language Bank.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 mt-10">
        <div className="animate-spin w-5 h-5 border-2 border-[var(--inv)] border-t-transparent rounded-full" />
        <span className="text-[var(--text-secondary)] font-semibold">Decodificando análisis lingüístico...</span>
      </div>
    );
  }

  // Lógica de parseo robusta para sacar el JSON incluso si la IA devolvió markdown
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

  const bank = parsedContent?.language_bank || [];

  return (
    <div className='p-6 w-full max-w-[1400px] mx-auto space-y-6'>
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--inv-bg)] text-[var(--inv)] flex items-center justify-center border border-[var(--inv)]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <h1 className='text-[var(--text-h1)] font-bold text-[var(--text)] leading-tight'>Language Bank &amp; Competencia</h1>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mt-1">Research Lab • Fase P3</p>
        </div>
      </div>

      {/* RENDER FALLBACK (Si no logró parsearse a JSON estructurado) */}
      {!parsedContent && rawText && (
          <div className="ds-card-padded bg-[var(--surface2)]">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Respuesta Plana (Raw)</h3>
            <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">{rawText}</pre>
          </div>
      )}

      {/* RENDER ESTRUCTURADO */}
      {parsedContent && bank.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {bank.map((avatar: any, i: number) => (
                  <div key={i} className="ds-card flex flex-col overflow-hidden h-full">
                      
                      {/* Avatar Header */}
                      <div className="bg-[var(--inv-bg)] border-b border-[var(--inv)]/10 px-5 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--inv)]/20 flex items-center justify-center text-[var(--inv)] font-bold shadow-sm">
                             {i + 1}
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-[var(--inv)]/70 uppercase tracking-wider">Perfil Analizado</p>
                            <h3 className="text-sm font-bold text-[var(--inv)] leading-none mt-1">{avatar.avatar_id}</h3>
                          </div>
                      </div>
                      
                      <div className="p-5 space-y-6 flex-1 bg-[var(--surface)]">
                          
                          {/* Clusters */}
                          {avatar.vocabulary_clusters && avatar.vocabulary_clusters.length > 0 && (
                              <div>
                                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Clusters Vocabulario</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {avatar.vocabulary_clusters.map((c: string, j: number) => (
                                          <span key={j} className="px-2.5 py-1 bg-[var(--surface2)] text-[var(--text-secondary)] text-xs font-medium rounded-md border border-[var(--border)] shadow-sm">{c}</span>
                                      ))}
                                  </div>
                              </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Pain Phrases */}
                              {avatar.pain_phrases && avatar.pain_phrases.length > 0 && (
                                  <div className="bg-[var(--surface2)] p-4 rounded-xl border border-[var(--s-ko)]/10">
                                      <h4 className="text-[10px] font-bold text-[var(--s-ko)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        Frases de Dolor (VOC)
                                      </h4>
                                      <ul className="space-y-2.5">
                                          {avatar.pain_phrases.map((p: string, j: number) => (
                                              <li key={j} className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--s-ko)]/40 leading-relaxed italic">"{p}"</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}

                              {/* Hope Phrases */}
                              {avatar.hope_phrases && avatar.hope_phrases.length > 0 && (
                                  <div className="bg-[var(--surface2)] p-4 rounded-xl border border-[var(--s-ok)]/10">
                                      <h4 className="text-[10px] font-bold text-[var(--s-ok)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                        Frases de Esperanza
                                      </h4>
                                      <ul className="space-y-2.5">
                                          {avatar.hope_phrases.map((p: string, j: number) => (
                                              <li key={j} className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--s-ok)]/40 leading-relaxed italic">"{p}"</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}

                              {/* Skepticism Phrases */}
                              {avatar.skepticism_phrases && avatar.skepticism_phrases.length > 0 && (
                                  <div className="bg-[var(--surface2)] p-4 rounded-xl border border-[var(--s-wa)]/10">
                                      <h4 className="text-[10px] font-bold text-[var(--s-wa)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        Escepticismo y Objecciones
                                      </h4>
                                      <ul className="space-y-2.5">
                                          {avatar.skepticism_phrases.map((p: string, j: number) => (
                                              <li key={j} className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--s-wa)]/40 leading-relaxed italic">"{p}"</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}

                              {/* Competitor Hate */}
                              {avatar.competitor_hate && avatar.competitor_hate.length > 0 && (
                                  <div className="bg-[var(--surface2)] p-4 rounded-xl border border-[var(--text-muted)]/10">
                                      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        Odio a la Competencia
                                      </h4>
                                      <ul className="space-y-2.5">
                                          {avatar.competitor_hate.map((p: string, j: number) => (
                                              <li key={j} className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--border-high)] leading-relaxed italic">"{p}"</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Raw fallback of parsed object if bank missing */}
      {parsedContent && (!bank || bank.length === 0) && (
         <div className="ds-card-padded bg-[var(--surface)]">
             <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Datos Analizados</h3>
             <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--text-secondary)]">{JSON.stringify(parsedContent, null, 2)}</pre>
         </div>
      )}
    </div>
  );
}
