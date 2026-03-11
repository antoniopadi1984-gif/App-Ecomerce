'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProduct } from '@/context/ProductContext';
import { useStore } from '@/lib/store/store-context';
import { toast } from 'sonner';

// ── Static rates MXN/USD/etc → EUR ────────────────────────────────
const EUR_RATES: Record<string, number> = {
  EUR: 1, USD: 0.92, MXN: 0.052, GBP: 1.17, COP: 0.00023,
};

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', MXN: '$', GBP: '£', COP: '$',
};

function sym(currency: string) { return CURRENCY_SYMBOL[currency] ?? currency + ' '; }
function toEur(val: number, currency: string) { return val * (EUR_RATES[currency] ?? 1); }
function fmtC(val: number, currency: string, decimals = 0) {
  return sym(currency) + val.toFixed(decimals);
}
function fmtE(val: number, decimals = 0) { return '€' + val.toFixed(decimals); }

// ── UI primitives ──────────────────────────────────────────────────
const LS = {
  fontSize: '9px', fontWeight: 800, color: '#64748b',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 3px'
};

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ ...LS, color: '#475569', marginBottom: '7px', fontSize: '10px' }}>{children}</p>;
}
function Input({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <p style={LS}>{label}</p>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}
function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <p style={LS}>{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
        {options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function KPI({ label, val, valEur, color, borderRight, em = false }: {
  label: string; val: string; valEur?: string; color: string; borderRight?: boolean; em?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center', borderRight: borderRight ? '1px solid #e2e8f0' : 'none', padding: '0 4px' }}>
      <div style={{ fontSize: em ? '14px' : '13px', fontWeight: 900, color, lineHeight: 1.1 }}>{val}</div>
      {valEur && <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{valEur}</div>}
      <div style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function UrlInput({ label, value, onChange, onSaved, savedMsg }: any) {
  return (
    <div>
      <p style={LS}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', paddingRight: onSaved ? '28px' : '8px', borderRadius: '6px', fontSize: '11px', border: onSaved ? '1px solid #bbf7d0' : '1px solid #e2e8f0', background: onSaved ? '#f0fdf4' : 'white', outline: 'none', boxSizing: 'border-box' }} />
        {onSaved && <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px' }}>✅</span>}
      </div>
      {onSaved && savedMsg && <p style={{ fontSize: '9px', color: '#16a34a', margin: '2px 0 0', fontWeight: 600 }}>{savedMsg}</p>}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export function AddProductDialog({ showCreateModal, setShowCreateModal }: { showCreateModal: boolean, setShowCreateModal: (v: boolean) => void }) {
  const { refreshAllProducts, setProductId } = useProduct();
  const { activeStoreId, activeStore } = useStore();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: '', sku: '', categoria: 'salud', pais: 'ES',
    idioma: 'ES', moneda: activeStore?.currency || 'EUR',
    imagen: null as File | null, imageUrl: '',
    urlProducto: '', urlAmazon: '', googleDocUrl: '',
    precioVenta: 0, costeProducto: 0, costeEnvio: 0,
    costeManipulacion: 0, costeDevolucion: 0,
    fulfillment: 'beeping',
    tasaEntrega: 100, tasaEnvio: 100, tasaConversion: 3,
    paymentMode: 'card' as 'card' | 'hybrid', // card = solo tarjeta, hybrid = COD+tarjeta
    competidores: [] as any[],
  });

  useEffect(() => {
    if (activeStore?.currency) setForm(prev => ({ ...prev, moneda: activeStore.currency }));
  }, [activeStore?.currency]);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  // ── Cálculos correctos ─────────────────────────────────────────
  const m = useMemo(() => {
    const PV  = form.precioVenta;       // Precio venta
    const CP  = form.costeProducto;     // Coste producto
    const CE  = form.costeEnvio;        // Coste envío
    const CM  = form.costeManipulacion; // Coste manipulación
    const CD  = form.costeDevolucion;   // Coste devolución (€/u para pedidos no entregados)
    const TE  = form.tasaEntrega / 100; // % pedidos entregados
    const TEn = form.tasaEnvio / 100;   // % pedidos enviados
    const TC  = form.tasaConversion / 100;
    const cur = form.moneda;

    // Coste real por venta generada (incl. costes proporcionales)
    const costeReal = CP + CE + CM + CD * (1 - TE);
    // Beneficio por venta antes de ads
    const beneficioVenta = PV - costeReal;
    // Margen %
    const margen = PV > 0 ? (beneficioVenta / PV) * 100 : 0;

    // ROAS break-even (sin ads = no ganancia, no pérdida)
    // ROAS_BE = 1 / margen_decimal = PV / (PV - beneficioVenta + 0) pero más simple:
    const margenDecimal = margen / 100;
    const roasBE = margenDecimal > 0 ? 1 / margenDecimal : 0;

    // CPA máximo = beneficio por venta (máx que puedes pagar sin perder)
    const cpaMax = beneficioVenta;

    // CPC break-even = CPA_max × tasa_conversion
    const cpcBE = cpaMax * TC;

    // Para escalar: ROAS objetivo 2.2 y 2.5
    // CPA = PV / ROAS_objetivo
    const cpaScale22 = PV > 0 ? PV / 2.2 : 0;
    const cpaScale25 = PV > 0 ? PV / 2.5 : 0;
    // CPC escalar = CPA_escalar × TC
    const cpcScale22 = cpaScale22 * TC;
    const cpcScale25 = cpaScale25 * TC;

    // Beneficio neto por pedido generado (ponderado por tasas)
    const beneficioNeto = PV * TE * TEn - costeReal;

    const rate = EUR_RATES[cur] ?? 1;
    const isEur = cur === 'EUR';

    return {
      costeReal, beneficioVenta, margen, margenDecimal,
      roasBE, cpaMax, cpcBE,
      cpaScale22, cpaScale25, cpcScale22, cpcScale25,
      beneficioNeto,
      // EUR equivalents
      costeRealE:     toEur(costeReal,     cur),
      beneficioVentaE:toEur(beneficioVenta,cur),
      cpaMaxE:        toEur(cpaMax,        cur),
      cpcBEE:         toEur(cpcBE,         cur),
      cpaScaleE:      [toEur(cpaScale22, cur), toEur(cpaScale25, cur)],
      cpcScaleE:      [toEur(cpcScale22, cur), toEur(cpcScale25, cur)],
      beneficioNetoE: toEur(beneficioNeto, cur),
      cur, isEur,
    };
  }, [form]);

  const roasColor = m.roasBE < 1.5 ? '#ef4444' : m.roasBE < 2 ? '#f59e0b' : '#16a34a';
  const metricBg  = m.roasBE > 2.5 ? '#f0fdf4' : m.roasBE >= 1.5 ? '#fffbeb' : m.roasBE > 0 ? '#fef2f2' : '#f8fafc';

  const handleGoogleDocImport = async () => {
    const url = form.googleDocUrl;
    if (!url || !url.includes('docs.google.com')) return;
    setImporting(true); setImported(false);
    try {
      const res = await fetch('/api/research/extract-doc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, storeId: activeStoreId })
      });
      const { data, success } = await res.json();
      if (success && data) {
        const n = { ...form };
        let count = 0;
        if (data.nombre)              { n.nombre = data.nombre; count++; }
        if (data.categoria)           { n.categoria = data.categoria; count++; }
        if (data.pais)                { n.pais = data.pais; count++; }
        if (data.idioma)              { n.idioma = data.idioma; count++; }
        if (data.moneda)              { n.moneda = data.moneda; count++; }
        if (data.precioVenta)         { n.precioVenta = data.precioVenta; count++; }
        if (data.costeProducto)       { n.costeProducto = data.costeProducto; count++; }
        if (data.costeEnvio)          { n.costeEnvio = data.costeEnvio; count++; }
        if (data.tasaEntregaEsperada) { n.tasaEntrega = data.tasaEntregaEsperada; count++; }
        if (data.tasaConversionEsperada) { n.tasaConversion = data.tasaConversionEsperada; count++; }
        setForm(n); setImportedCount(count); setImported(true);
      }
    } catch { toast.error('Error importing Doc'); }
    finally { setImporting(false); }
  };

  const handleCrear = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStoreId || '' },
        body: JSON.stringify({
          title: form.nombre,
          sku: form.sku || 'PROD_' + form.nombre.toUpperCase().replace(/\s/g, '_') + '_01',
          country: form.pais, marketLanguage: form.idioma, currency: form.moneda,
          niche: form.categoria, pvpEstimated: form.precioVenta, price: form.precioVenta,
          unitCost: form.costeProducto, shippingCost: form.costeEnvio,
          handlingCost: form.costeManipulacion, returnRate: form.costeDevolucion,
          fulfillment: form.fulfillment, deliveryRate: form.tasaEntrega,
          cvrExpected: form.tasaConversion, paymentMode: form.paymentMode,
          cpaMax: m.cpaMax, breakevenCPC: m.cpcBE, breakevenROAS: m.roasBE,
          imageUrl: form.imageUrl, googleDocUrl: form.googleDocUrl,
          competitors: form.competidores,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await refreshAllProducts();
      setProductId(data.product.id);
      setShowCreateModal(false);
    } catch { toast.error('Error al crear el producto'); }
    finally { setCreating(false); }
  };

  if (!showCreateModal) return null;

  const C = m.cur; // alias

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px', width: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'modalIn 0.18s ease' }}>

        {/* HEADER */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Nuevo producto</h2>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '1px 0 0' }}>Empieza por Google Doc si tienes research previo — rellena todo solo</p>
          </div>
          <button onClick={() => setShowCreateModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 700 }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>

          {/* Google Doc */}
          <div style={{ padding: '7px 10px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚡ Importar desde Google Doc — rellena todo automáticamente</p>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: '14px' }}>🔗</span>
              <input placeholder="Pega URL del Google Doc..." value={form.googleDocUrl}
                onChange={e => update('googleDocUrl', e.target.value)}
                onBlur={() => form.googleDocUrl && handleGoogleDocImport()}
                style={{ width: '100%', padding: '5px 9px', borderRadius: '7px', border: '1px solid #e9d5ff', fontSize: '12px', outline: 'none', boxSizing: 'border-box', background: 'white' }} />
              {importing && <span style={{ position: 'absolute', right: '10px', fontSize: '11px', color: '#7c3aed' }}>🔄 Extrayendo...</span>}
            </div>
            {imported && <p style={{ fontSize: '10px', color: '#16a34a', margin: '4px 0 0', fontWeight: 600 }}>✅ {importedCount} campos rellenados automáticamente</p>}
          </div>

          {/* IDENTIDAD — 2 filas en grid */}
          <Label>Identidad</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.8fr', gap: '6px', marginBottom: '6px' }}>
            <Input label="Nombre *" value={form.nombre} onChange={(v: string) => { update('nombre', v); update('sku', 'PROD_' + v.toUpperCase().replace(/\s+/g, '_') + '_01'); }} />
            <Input label="SKU" value={form.sku} onChange={(v: string) => update('sku', v)} />
            <Select label="País" value={form.pais} onChange={(v: string) => update('pais', v)} options={['ES', 'MX', 'CO', 'UK', 'US', 'LATAM']} />
            <Select label="Moneda" value={form.moneda} onChange={(v: string) => update('moneda', v)} options={['EUR', 'USD', 'MXN', 'COP', 'GBP']} />
            <Select label="Fulfillment" value={form.fulfillment} onChange={(v: string) => update('fulfillment', v)} options={['beeping', 'dropea', 'dropi', 'manual']} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px', alignItems: 'end' }}>
            <Select label="Categoría" value={form.categoria} onChange={(v: string) => update('categoria', v)} options={['salud', 'belleza', 'hogar', 'fitness', 'nutrición', 'otro']} />
            <Select label="Idioma" value={form.idioma} onChange={(v: string) => update('idioma', v)} options={['ES', 'EN', 'FR', 'IT', 'DE', 'PT']} />
            {/* Tipo de pago */}
            <div>
              <p style={LS}>Tipo de pago</p>
              <div style={{ display: 'flex', borderRadius: '7px', border: '1px solid #e2e8f0', overflow: 'hidden', height: '30px' }}>
                {([['card', '💳 Solo Tarjeta'], ['hybrid', '🔀 Híbrida COD']] as [string, string][]).map(([val, lbl]) => (
                  <button key={val} onClick={() => update('paymentMode', val)}
                    style={{ flex: 1, fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: 'none', borderRight: val === 'card' ? '1px solid #e2e8f0' : 'none', background: form.paymentMode === val ? (val === 'card' ? '#eff6ff' : '#fff7ed') : 'white', color: form.paymentMode === val ? (val === 'card' ? '#3b82f6' : '#f59e0b') : '#94a3b8', transition: 'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Imagen + URLs */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
            <div>
              <p style={LS}>Imagen</p>
              <div onClick={() => imageRef.current?.click()} style={{ width: '64px', height: '64px', border: '2px dashed #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden' }}>
                {form.imagen ? <img src={URL.createObjectURL(form.imagen)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: '20px' }}>📷</span>}
              </div>
              <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && update('imagen', e.target.files[0])} />
            </div>
            <Input label="URL producto / competidor" value={form.urlProducto} onChange={(v: string) => update('urlProducto', v)} />
            <Input label="URL Amazon similar" value={form.urlAmazon} onChange={(v: string) => update('urlAmazon', v)} />
          </div>

          {/* FINANCIERO */}
          <Label>Financiero</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
            <Input label={`Precio venta ${C}`} type="number" value={form.precioVenta || ''} onChange={(v: string) => update('precioVenta', +v)} placeholder="0.00" />
            <Input label={`Coste producto ${C}`} type="number" value={form.costeProducto || ''} onChange={(v: string) => update('costeProducto', +v)} placeholder="0.00" />
            <Input label={`Coste envío ${C}`} type="number" value={form.costeEnvio || ''} onChange={(v: string) => update('costeEnvio', +v)} placeholder="0.00" />
            <Input label={`Coste manip. ${C}`} type="number" value={form.costeManipulacion || ''} onChange={(v: string) => update('costeManipulacion', +v)} placeholder="0.00" />
            <Input label={`Coste devol. ${C}`} type="number" value={form.costeDevolucion || ''} onChange={(v: string) => update('costeDevolucion', +v)} placeholder="0.00" />
            <Input label="Tasa entrega %" type="number" value={form.tasaEntrega || ''} onChange={(v: string) => update('tasaEntrega', +v)} placeholder="100" />
            <Input label="Tasa envío %" type="number" value={form.tasaEnvio || ''} onChange={(v: string) => update('tasaEnvio', +v)} placeholder="100" />
            <Input label="Tasa convers. %" type="number" value={form.tasaConversion || ''} onChange={(v: string) => update('tasaConversion', +v)} placeholder="3" />
          </div>

          {/* ──────────── MÉTRICAS CALCULADAS ──────────── */}
          {form.precioVenta > 0 && (
            <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '8px', overflow: 'hidden' }}>

              {/* Fila 1 — Break Even */}
              <div style={{ background: metricBg, padding: '8px 10px', borderBottom: !m.isEur ? '1px solid #e2e8f0' : 'none' }}>
                <p style={{ ...LS, marginBottom: '6px', color: '#475569', fontSize: '9px' }}>📊 BREAK EVEN — {form.paymentMode === 'card' ? '💳 Solo Tarjeta' : '🔀 Híbrida COD'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  <KPI label="ROAS BE" val={m.roasBE.toFixed(2) + 'x'} color={roasColor} borderRight em />
                  <KPI label={`Coste total ${C}`} val={fmtC(form.costeProducto + form.costeEnvio + form.costeManipulacion, C)} valEur={!m.isEur ? fmtE(toEur(form.costeProducto + form.costeEnvio + form.costeManipulacion, C)) : undefined} color="#64748b" borderRight />
                  <KPI label={`Benef/venta ${C}`} val={fmtC(m.beneficioVenta, C)} valEur={!m.isEur ? fmtE(m.beneficioVentaE) : undefined} color={m.beneficioVenta > 0 ? '#16a34a' : '#ef4444'} borderRight />
                  <KPI label="Margen %" val={m.margen.toFixed(1) + '%'} color={m.margen > 50 ? '#16a34a' : m.margen > 30 ? '#f59e0b' : '#ef4444'} borderRight />
                  <KPI label={`CPA Máx ${C}`} val={fmtC(m.cpaMax, C)} valEur={!m.isEur ? fmtE(m.cpaMaxE) : undefined} color="#3b82f6" borderRight />
                  <KPI label={`CPC BE ${C}`} val={fmtC(m.cpcBE, C, 2)} valEur={!m.isEur ? fmtE(m.cpcBEE, 2) : undefined} color="#8b5cf6" borderRight />
                  <KPI label={`Coste real ${C}`} val={fmtC(m.costeReal, C)} valEur={!m.isEur ? fmtE(m.costeRealE) : undefined} color="#64748b" />
                </div>
              </div>

              {/* Fila 2 — Para Escalar */}
              <div style={{ background: '#f8fafc', padding: '8px 10px' }}>
                <p style={{ ...LS, marginBottom: '6px', color: '#475569', fontSize: '9px' }}>🚀 PARA ESCALAR</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  <KPI label="ROAS Rentable" val="2.2x" color="#10b981" borderRight />
                  <KPI label="ROAS Agresivo" val="2.5x" color="#6366f1" borderRight />
                  <KPI label={`CPA×2.2 ${C}`} val={fmtC(m.cpaScale22, C)} valEur={!m.isEur ? fmtE(m.cpaScaleE[0]) : undefined} color="#10b981" borderRight />
                  <KPI label={`CPA×2.5 ${C}`} val={fmtC(m.cpaScale25, C)} valEur={!m.isEur ? fmtE(m.cpaScaleE[1]) : undefined} color="#6366f1" borderRight />
                  <KPI label={`CPC×2.2 ${C}`} val={fmtC(m.cpcScale22, C, 2)} valEur={!m.isEur ? fmtE(m.cpcScaleE[0], 2) : undefined} color="#10b981" borderRight />
                  <KPI label={`CPC×2.5 ${C}`} val={fmtC(m.cpcScale25, C, 2)} valEur={!m.isEur ? fmtE(m.cpcScaleE[1], 2) : undefined} color="#6366f1" />
                </div>
              </div>
            </div>
          )}

          {/* COMPETIDORES */}
          <Label>Competidores</Label>
          {form.competidores.map((comp, i) => (
            <div key={i} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '6px', position: 'relative', background: '#fafafa' }}>
              <button onClick={() => { const n = [...form.competidores]; n.splice(i, 1); update('competidores', n); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px' }}>✕</button>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px', marginBottom: '5px' }}>
                <Input label="Nombre" value={comp.nombre} onChange={(v: string) => { const n = [...form.competidores]; n[i].nombre = v; update('competidores', n); }} />
                <Input label={`Precio ${C}`} type="number" value={comp.precioVenta} onChange={(v: string) => { const n = [...form.competidores]; n[i].precioVenta = +v; update('competidores', n); }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[['urlWeb', 'URL web'], ['urlAmazon', 'URL Amazon'], ['urlMetaLibrary', 'Meta Ads Lib.', '✅ Se importarán anuncios'], ['urlTikTokLibrary', 'TikTok Ads Lib.', '✅ Se importarán anuncios']].map(([key, lbl, msg]) => (
                  <UrlInput key={key} label={lbl} value={comp[key]}
                    onChange={(v: string) => { const n = [...form.competidores]; n[i][key] = v; update('competidores', n); }}
                    onSaved={comp[key]?.length > 5} savedMsg={msg} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => update('competidores', [...form.competidores, { nombre: '', urlWeb: '', urlAmazon: '', urlMetaLibrary: '', urlTikTokLibrary: '', precioVenta: 0 }])} style={{ width: '100%', padding: '5px', borderRadius: '6px', border: '1px dashed #c4b5fd', background: 'transparent', color: '#7c3aed', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
            + Añadir competidor
          </button>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            {!form.nombre && <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>* Nombre obligatorio</span>}
          </div>
          <button onClick={handleCrear} disabled={!form.nombre || creating}
            style={{ padding: '7px 22px', borderRadius: '7px', border: 'none', background: form.nombre ? '#7c3aed' : '#e2e8f0', color: form.nombre ? 'white' : '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: form.nombre ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {creating ? '⏳ Creando...' : 'Crear producto →'}
          </button>
        </div>
      </div>
    </div>
  );
}


