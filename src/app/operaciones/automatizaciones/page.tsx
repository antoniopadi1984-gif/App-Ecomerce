'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
 
const AUTOMATION_RULES = [
  { id: 'auto_confirmation', label: 'Confirmación automática al crear pedido', trigger: 'ORDER_CREATED', action: 'SEND_WHATSAPP_CONFIRMATION', defaultOn: true },
  { id: 'auto_tracking', label: 'Tracking automático al añadir código de envío', trigger: 'TRACKING_ADDED', action: 'SEND_WHATSAPP_TRACKING', defaultOn: true },
  { id: 'auto_delivery', label: 'Notificación de reparto (Out for delivery)', trigger: 'OUT_FOR_DELIVERY', action: 'SEND_WHATSAPP_OFD', defaultOn: true },
  { id: 'postv_d3', label: 'Envío de Ebook en D+3 post-entrega', trigger: 'DELIVERED_D3', action: 'SEND_EBOOK', defaultOn: false },
  { id: 'postv_d7', label: 'Solicitud de review en D+7 post-entrega', trigger: 'DELIVERED_D7', action: 'SEND_REVIEW_REQUEST', defaultOn: true },
  { id: 'postv_d14', label: 'Oferta upsell en D+14 post-entrega', trigger: 'DELIVERED_D14', action: 'SEND_UPSELL', defaultOn: false },
];
 
export default function AutomatizacionesPage() {
  const { activeStore } = useStore();
  const [rules, setRules] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
 
  useEffect(() => {
    if (!activeStore?.id) return;
    fetch(`/api/automations?storeId=${activeStore.id}`).then(r => r.json()).then(d => {
      const map: Record<string, boolean> = {};
      AUTOMATION_RULES.forEach(r => {
        const saved = d.rules?.find((x: any) => x.ruleId === r.id);
        map[r.id] = saved ? saved.isEnabled : r.defaultOn;
      });
      setRules(map);
    });
  }, [activeStore?.id]);
 
  const toggle = async (ruleId: string) => {
    setSaving(ruleId);
    const newVal = !rules[ruleId];
    setRules(prev => ({ ...prev, [ruleId]: newVal }));
    await fetch('/api/automations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: activeStore?.id, ruleId, isEnabled: newVal })
    });
    setSaving(null);
  };
 
  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-2'>Automatizaciones</h1>
      <p className='text-gray-400 mb-8'>Activa o desactiva cada regla para la tienda activa.</p>
      <div className='grid gap-4'>
        {AUTOMATION_RULES.map(rule => (
          <div key={rule.id} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between'>
            <div>
              <p className='text-white font-medium'>{rule.label}</p>
              <p className='text-gray-400 text-xs mt-1'>{rule.trigger} → {rule.action}</p>
            </div>
            <button onClick={() => toggle(rule.id)} disabled={saving === rule.id}
              className={`relative w-12 h-6 rounded-full transition-colors ${rules[rule.id] ? 'bg-blue-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${rules[rule.id] ? 'translate-x-7' : 'translate-x-1'}`}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
