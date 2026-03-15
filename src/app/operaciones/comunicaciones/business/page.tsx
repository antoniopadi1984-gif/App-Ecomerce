'use client';
import ComunicacionesLayout from '../_layout';

export default function BusinessPage() {
    return (
        <ComunicacionesLayout activeTab="business">
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/30 border border-blue-500/20 flex items-center justify-center mb-4">
                    <span className="text-3xl">💼</span>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2">Meta Business Messaging</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                    Integración con Instagram DMs y Facebook Messenger para atención directa a clientes. Próximamente.
                </p>
                <div className="mt-6 flex gap-3">
                    <span className="px-3 py-1.5 bg-[#1a1f2e] border border-white/5 rounded-lg text-xs text-gray-500">Instagram DM</span>
                    <span className="px-3 py-1.5 bg-[#1a1f2e] border border-white/5 rounded-lg text-xs text-gray-500">Facebook Messenger</span>
                    <span className="px-3 py-1.5 bg-[#1a1f2e] border border-white/5 rounded-lg text-xs text-gray-500">WhatsApp Business API</span>
                </div>
            </div>
        </ComunicacionesLayout>
    );
}
