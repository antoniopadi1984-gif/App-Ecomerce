'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, X, Send, Sparkles, Bot,
    Zap, TrendingUp, AlertCircle, FileText,
    Maximize2, Minimize2,
    Lightbulb, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'suggestion' | 'analysis' | 'brief';
}

export function AgenteCreativo({ activeProduct, productId, storeId }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [activeAgent, setActiveAgent] = useState<'specialist' | 'director'>('specialist');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hola! Soy tu Especialista en Estrategia Creativa. Tengo acceso a los datos de **${activeProduct?.name || 'tu producto'}** y estoy listo para ayudarte a escalar. ¿Qué quieres hacer hoy?`,
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            await new Promise(r => setTimeout(r, 1500));

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateMockResponse(input.toLowerCase(), activeProduct, activeAgent),
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            toast.error("Error en la conexión con el agente");
        } finally {
            setIsLoading(false);
        }
    };

    const generateMockResponse = (query: string, product: any, agent: string) => {
        if (agent === 'director') {
            return `[Director General] Estoy analizando el ecosistema completo. Tu producto **${product?.name}** tiene un cuello de botella en la fase de conversión. Recomiendo reasignar el 20% del presupuesto de testing a retargeting dinámico.`;
        }
        if (query.includes('ángulo') || query.includes('concepto')) {
            return `Basado en el rendimiento de **${product?.name}**, te sugiero explorar un ángulo de **"Miedo a la Pérdida de Eficacia"**. Hemos notado que los creativos que mencionan la durabilidad tienen un CTR 20% superior.`;
        }
        if (query.includes('variacion') || query.includes('fatiga')) {
            return `El creativo **PURE_CONC01_V1** está entrando en fatiga (ROAS cayó un 15%). Recomiendo generar una variación cambiando solo el Hook por uno de tipo "Interrupción de Patrón" manteniendo el cuerpo del video.`;
        }
        if (query.includes('brief')) {
            return `He generado un brief de producción para el concepto **"RESULTADO INMEDIATO"**. Incluye 3 opciones de hooks y 2 variaciones de oferta para Fase Fría.`;
        }
        return "Entendido. Estoy analizando las métricas de tus campañas en Meta y la biblioteca para darte la mejor recomendación táctica.";
    };

    const suggestedActions = [
        { label: 'Sugerir nuevos ángulos', icon: Lightbulb },
        { label: 'Analizar fatiga adsets', icon: AlertCircle },
        { label: 'Generar brief de video', icon: FileText },
        { label: 'Explicar bajo CTR', icon: TrendingUp },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
            {/* CHAT WINDOW */}
            {isOpen && (
                <div className={cn(
                    "bg-white rounded-xl border border-[var(--border)] shadow-lg flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5",
                    isExpanded ? "w-[600px] h-[700px] mb-4" : "w-[380px] h-[540px] mb-4"
                )}>
                    {/* Header */}
                    <div className="px-4 py-3 bg-white border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--cre-bg)] flex items-center justify-center text-[var(--cre)] border border-[var(--cre)]/10">
                                <Bot size={16} />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-none">Agente Estratégico</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider leading-none">{activeProduct?.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-[var(--bg)] text-[var(--text-tertiary)] rounded-lg transition-all">
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[var(--bg)] text-[var(--text-tertiary)] rounded-lg transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs Selector */}
                    <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]/30 flex gap-4 shrink-0">
                        <button
                            onClick={() => setActiveAgent('specialist')}
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-widest pb-1 transition-all",
                                activeAgent === 'specialist' ? "text-[var(--cre)] border-b-2 border-[var(--cre)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                            )}
                        >
                            Especialista
                        </button>
                        <button
                            onClick={() => setActiveAgent('director')}
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-widest pb-1 transition-all",
                                activeAgent === 'director' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                            )}
                        >
                            Director
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg)]">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn(
                                "flex flex-col max-w-[85%]",
                                msg.role === 'user' ? "ml-auto items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-3 rounded-xl text-xs leading-relaxed border shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-[var(--cre)] text-white border-transparent rounded-tr-none"
                                        : "bg-white text-[var(--text-primary)] border-[var(--border)] rounded-tl-none"
                                )}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}
                                </div>
                                <span className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase mt-1.5 px-1">
                                    {msg.role === 'assistant' ? (activeAgent === 'director' ? 'Director' : 'Especialista') : 'Tú'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-2">
                                <div className="p-3 bg-white border border-[var(--border)] rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <RefreshCw size={12} className="animate-spin text-[var(--cre)]" />
                                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Analizando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggested Actions */}
                    <div className="p-3 bg-white border-t border-[var(--border)] overflow-x-auto">
                        <div className="flex gap-2 scrollbar-none">
                            {suggestedActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(action.label); }}
                                    className="shrink-0 h-7 px-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:border-[var(--cre)] hover:text-[var(--cre)] transition-all flex items-center gap-1.5"
                                >
                                    <action.icon size={12} />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-[var(--border)] flex items-center gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Haz una pregunta o pide una recomendación..."
                            className="flex-1 h-9 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--cre)] transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-9 h-9 rounded-lg bg-[var(--cre)] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* FLOATING BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group relative",
                    isOpen ? "bg-[var(--text-primary)]" : "bg-[var(--cre)]"
                )}
            >
                {isOpen ? (
                    <X className="text-white" size={20} />
                ) : (
                    <div className="relative">
                        <MessageSquare className="text-white" size={20} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--text-primary)] rounded-full border border-[var(--cre)] flex items-center justify-center">
                            <Sparkles size={6} className="text-white" />
                        </div>
                    </div>
                )}

                {/* Hover Label */}
                {!isOpen && (
                    <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                        <div className="bg-[var(--text-primary)] text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-lg">
                            Agente Estratégico AI
                        </div>
                    </div>
                )}
            </button>
        </div>
    );
}
