'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';

export interface AgentCompanionProps {
    pageContext?: any;
    agentRole?: string;
}

interface Message {
    role: 'user' | 'agent';
    content: string;
}

export function AgentCompanion({ pageContext, agentRole }: AgentCompanionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { activeStoreId } = useStore();
    const { productId } = useProduct();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !activeStoreId || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    storeId: activeStoreId,
                    productId: productId !== 'GLOBAL' ? productId : undefined,
                    context: pageContext,
                    agentRole,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'agent', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: `Error: ${data.error}` }]);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'agent', content: `Error de conexión: ${error.message}` }]);
        } finally {
            setIsLoading(false);
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
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, var(--mando) 0%, #8b5cf6 100%)' }}
                >
                    <Sparkles size={20} />
                </button>
            )}

            {/* Panel lateral derecho (380px) */}
            <div
                className={`fixed top-0 right-0 h-[100dvh] w-[380px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } max-md:w-full`}
            >
                {/* Header */}
                <div className="h-[var(--topbar-h,50px)] px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface2)]">
                    <div className="flex items-center gap-2 text-[var(--text)]">
                        <Bot size={18} className="text-[var(--mando)]" />
                        <span className="font-bold text-[13px] tracking-tight">Factoría <span className="text-[var(--mando)]">IA</span></span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[var(--bg)]">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 mt-[-20px]">
                            <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-3 shadow-sm">
                                <Sparkles size={20} className="text-[var(--mando)]" />
                            </div>
                            <p className="text-[12px] font-semibold text-[var(--text)] mb-1">
                                ¿En qué puedo ayudarte?
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Soy tu asistente operativo. Tengo contexto de esta página y de tus datos.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1 px-1">
                                {msg.role === 'user' ? 'Tú' : 'Agente'}
                            </span>
                            <div
                                className={`p-3 rounded-[var(--r-md)] text-[12px] leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-[var(--mando)] text-white rounded-br-none'
                                        : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-bl-none'
                                    }`}
                            >
                                {/* Simple text rendering, could add markdown support if needed */}
                                <span className="whitespace-pre-wrap">{msg.content}</span>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex flex-col max-w-[85%] mr-auto items-start">
                            <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1 px-1">Agente</span>
                            <div className="p-3 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--border)] rounded-bl-none flex flex-row items-center gap-2">
                                <Loader2 size={14} className="animate-spin text-[var(--mando)]" />
                                <span className="text-[11px] text-[var(--text-muted)]">Pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
                    <div className="relative flex items-center">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un comando o pregunta..."
                            className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--r-md)] py-2.5 pl-3 pr-10 text-[12px] text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--border-high)] transition-colors resize-none overflow-hidden no-scrollbar"
                            rows={1}
                            style={{ minHeight: '38px', maxHeight: '120px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 text-[var(--mando)] disabled:text-[var(--text-dim)] transition-colors p-1"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[9px] text-[var(--text-dim)]">
                            Presiona Enter para enviar, Shift+Enter para nueva línea
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
