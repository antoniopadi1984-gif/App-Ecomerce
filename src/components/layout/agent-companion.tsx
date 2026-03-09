'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import { Send, Loader2, Sparkles, X, Bot, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

export function AgentCompanion() {
    const [open, setOpen] = useState(false);
    const [agentTab, setAgentTab] = useState<'especialista' | 'director'>('especialista');

    // Histories for each tab
    const [messagesEspecialista, setMessagesEspecialista] = useState<Message[]>([]);
    const [messagesDirector, setMessagesDirector] = useState<Message[]>([]);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const pathname = usePathname();
    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Module config for colors and context
    const modulesConfig: Record<string, { label: string; color: string; context: string; slug: string }> = {
        'finanzas': { label: 'Finanzas', color: '#16a34a', context: 'Análisis financiero', slug: 'finanzas' },
        'crm': { label: 'CRM Forense', color: '#dc2626', context: 'Gestión de clientes', slug: 'crm' },
        'operaciones': { label: 'Operaciones', color: '#2563eb', context: 'Logística y flujos', slug: 'operaciones' },
        'creativo': { label: 'Centro Creativo', color: '#9333ea', context: 'Producción de anuncios', slug: 'creativo' },
        'investigacion': { label: 'Investigación', color: '#0891b2', context: 'Análisis de mercado', slug: 'investigacion' },
        'marketing': { label: 'Marketing', color: '#ea580c', context: 'Campañas y pauta', slug: 'marketing' },
        'mando': { label: 'Mando', color: '#0f172a', context: 'Visión general', slug: 'mando' },
    };

    const currentModuleKey = Object.keys(modulesConfig).find(k => pathname.includes(k)) || 'mando';
    const config = modulesConfig[currentModuleKey];

    const NOMBRE_MODULO = config.label;
    const MODULE_COLOR = config.color;
    const AGENT_SLUG = config.slug;

    const mensajesActivos = agentTab === 'especialista' ? messagesEspecialista : messagesDirector;

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajesActivos, loading]);

    const handleSend = async () => {
        if (!input.trim() || !activeStoreId || loading) return;

        const userMsg = input.trim();
        const msgObj: Message = { role: 'user', content: userMsg };

        const setter = agentTab === 'especialista' ? setMessagesEspecialista : setMessagesDirector;
        const currentMessages = agentTab === 'especialista' ? messagesEspecialista : messagesDirector;
        const newMessages = [...currentMessages, msgObj];

        setter(newMessages);
        setInput('');
        setLoading(true);

        try {
            const endpoint = agentTab === 'especialista'
                ? `/api/agents/${AGENT_SLUG}-chat`
                : '/api/agents/director-chat';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({
                        role: m.role === 'agent' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    storeId: activeStoreId,
                    context: {
                        module: NOMBRE_MODULO,
                        path: pathname,
                        productId: productId !== 'GLOBAL' ? productId : undefined
                    }
                }),
            });

            const data = await res.json();
            if (data.success) {
                setter(prev => [...prev, { role: 'agent', content: data.response }]);
            } else {
                setter(prev => [...prev, { role: 'agent', content: `Error: ${data.error}` }]);
            }
        } catch (error: any) {
            setter(prev => [...prev, { role: 'agent', content: `Error de conexión: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(!open)}
                className={cn(
                    "fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-[999] transition-all duration-300",
                    open ? "bg-slate-800 rotate-90" : "animate-bounce-subtle"
                )}
                style={{
                    backgroundColor: open ? '#1e293b' : MODULE_COLOR,
                    boxShadow: `0 8px 32px ${MODULE_COLOR}33`
                }}
            >
                {open ? <X size={24} /> : <Bot size={28} />}
            </motion.button>

            {/* Side Drawer Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: 360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 360, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed top-0 right-0 h-full w-[360px] bg-white/95 backdrop-blur-2xl shadow-[-10px_0_40px_rgba(0,0,0,0.15)] z-[1000] flex flex-col border-l border-[var(--border)]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-white/50">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                    style={{ background: `linear-gradient(135deg, ${MODULE_COLOR} 0%, ${MODULE_COLOR}cc 100%)` }}
                                >
                                    <Bot size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">EcomBoom AI</h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">
                                        {agentTab === 'especialista' ? `Especialista ${NOMBRE_MODULO}` : 'Director General'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex bg-slate-50 border-b border-[var(--border)] p-1 gap-1">
                            {[
                                { id: 'especialista', label: 'Especialista' },
                                { id: 'director', label: 'Director' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAgentTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        agentTab === tab.id
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                            {mensajesActivos.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
                                    <Bot size={60} strokeWidth={1} />
                                    <div className="mt-4">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Cerebro de {agentTab === 'especialista' ? NOMBRE_MODULO : 'Director'} Activo</p>
                                        <p className="text-[10px] max-w-[200px] leading-relaxed">Hazme una pregunta sobre {agentTab === 'especialista' ? `tu ${NOMBRE_MODULO.toLowerCase()}` : 'todo tu negocio en general'}.</p>
                                    </div>
                                </div>
                            )}
                            {mensajesActivos.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                                        msg.role === 'user' ? 'ml-auto' : 'mr-auto'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm font-medium",
                                            msg.role === 'user'
                                                ? "bg-slate-900 text-white rounded-br-none"
                                                : "bg-[#f8fafc] text-slate-900 border border-slate-200 rounded-bl-none"
                                        )}
                                    >
                                        <span className="whitespace-pre-wrap">{msg.content}</span>
                                    </div>
                                    <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                                        {msg.role === 'user' ? 'Tú' : 'Agente'}
                                    </span>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
                                    <Loader2 size={12} className="animate-spin text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[var(--border)] bg-white/50 backdrop-blur-sm">
                            <div className="relative group">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe una instrucción..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 text-[12px] text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all resize-none shadow-inner"
                                    rows={1}
                                    style={{ minHeight: '44px', maxHeight: '120px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className={cn(
                                        "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95",
                                        input.trim() ? "bg-slate-900 text-white shadow-slate-200" : "bg-slate-100 text-slate-400"
                                    )}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 text-center mt-3 uppercase font-bold tracking-widest opacity-60">
                                Analista estratégico de EcomBoom · v2.0
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
