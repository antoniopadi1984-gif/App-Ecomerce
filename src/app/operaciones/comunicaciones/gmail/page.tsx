'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store-context';
import ComunicacionesLayout from '../_layout';

interface GmailMessage {
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    snippet: string;
    isUnread: boolean;
}

export default function GmailPage() {
    const { activeStore } = useStore();
    const [emails, setEmails] = useState<GmailMessage[]>([]);
    const [selected, setSelected] = useState<GmailMessage | null>(null);
    const [query, setQuery] = useState('is:unread');
    const [loading, setLoading] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [autoReply, setAutoReply] = useState(true);
    const [status, setStatus] = useState('');

    const fetchEmails = async () => {
        if (!activeStore?.id) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/communications/gmail?q=${encodeURIComponent(query)}&max=20`,
                { headers: { 'X-Store-Id': activeStore.id } }
            );
            const data = await res.json();
            if (data.ok) setEmails(data.emails);
            else setStatus(`Error: ${data.error}`);
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmails(); }, [activeStore?.id]);

    const handleReply = async () => {
        if (!selected || !activeStore?.id) return;
        setReplying(true);
        setStatus('Enviando respuesta...');
        try {
            const res = await fetch('/api/communications/gmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStore.id },
                body: JSON.stringify({
                    messageId: selected.id,
                    threadId: selected.threadId,
                    from: selected.from,
                    subject: selected.subject,
                    body: autoReply ? selected.body : replyText,
                    autoReply
                })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('✅ Respuesta enviada');
                setSelected(null);
                setReplyText('');
                fetchEmails();
            } else {
                setStatus(`❌ Error: ${data.error}`);
            }
        } finally {
            setReplying(false);
        }
    };

    const markAsRead = async (messageId: string) => {
        if (!activeStore?.id) return;
        await fetch('/api/communications/gmail', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Store-Id': activeStore.id },
            body: JSON.stringify({ messageId, action: 'markAsRead' })
        });
        setEmails(prev => prev.map(e => e.id === messageId ? { ...e, isUnread: false } : e));
    };

    return (
        <ComunicacionesLayout activeTab="gmail">
            {/* Search bar */}
            <div className="flex gap-3 mb-5">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="is:unread, from:cliente@gmail.com..."
                    className="flex-1 bg-[#1a1f2e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={fetchEmails} disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>

            {status && (
                <div className="mb-4 p-3 bg-[#1a1f2e] border border-white/10 rounded-xl text-sm text-gray-300">
                    {status}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Email list */}
                <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">{emails.length} correos</p>
                    {emails.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            <p className="text-2xl mb-2">📭</p>
                            <p>No hay correos. Prueba otra búsqueda.</p>
                        </div>
                    )}
                    {emails.map(email => (
                        <div key={email.id}
                            onClick={() => { setSelected(email); markAsRead(email.id); }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.id === email.id
                                ? 'border-blue-500/50 bg-blue-900/10'
                                : 'border-white/5 bg-[#1a1f2e] hover:border-white/15'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className={`text-sm truncate ${email.isUnread ? 'text-white font-semibold' : 'text-gray-300'}`}>
                                        {email.from.split('<')[0].trim() || email.from}
                                    </p>
                                    <p className={`text-xs truncate mt-0.5 ${email.isUnread ? 'text-blue-300' : 'text-gray-400'}`}>
                                        {email.subject || '(Sin asunto)'}
                                    </p>
                                    <p className="text-gray-500 text-xs truncate mt-1">{email.snippet}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-gray-600 text-xs">{new Date(email.date).toLocaleDateString()}</p>
                                    {email.isUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mt-1" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Email detail + reply */}
                {selected ? (
                    <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 space-y-4">
                        <div>
                            <h3 className="text-white font-semibold text-sm">{selected.subject || '(Sin asunto)'}</h3>
                            <p className="text-gray-500 text-xs mt-1">De: {selected.from}</p>
                            <p className="text-gray-500 text-xs">{selected.date}</p>
                        </div>
                        <div className="bg-[#111827] rounded-lg p-3 text-sm text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {selected.body || selected.snippet}
                        </div>

                        <div className="border-t border-white/5 pt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-gray-400 text-sm">Respuesta:</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div onClick={() => setAutoReply(!autoReply)}
                                        className={`w-9 h-5 rounded-full transition-colors relative ${autoReply ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoReply ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </div>
                                    <span className="text-xs text-gray-400">{autoReply ? '🤖 IA genera respuesta' : '✍️ Manual'}</span>
                                </label>
                            </div>
                            {!autoReply && (
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Escribe tu respuesta en HTML o texto plano..."
                                    className="w-full bg-[#111827] border border-white/10 text-white rounded-lg p-3 text-sm h-28 resize-none focus:outline-none focus:border-blue-500/50 mb-3"
                                />
                            )}
                            <button onClick={handleReply} disabled={replying}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                                {replying ? '⏳ Enviando...' : autoReply ? '🤖 Generar y enviar con IA' : '📤 Enviar respuesta'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1a1f2e] border border-white/5 rounded-xl flex items-center justify-center text-gray-600 min-h-48">
                        <p className="text-sm">Selecciona un correo para ver el detalle</p>
                    </div>
                )}
            </div>
        </ComunicacionesLayout>
    );
}
