'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, User, MessageSquare, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    agentId: string;
}

interface AgentButtonProps {
    agentId: string; // AgentId enum as string
    moduleColor?: string;
    moduleName?: string;
    contextSnapshot?: () => any;
}

export function AgentButton({ agentId, moduleColor, moduleName, contextSnapshot }: AgentButtonProps) {
    const { activeStoreId: storeId } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'module' | 'director'>('module');

    // Historial por agente para no mezclarlos
    const [histories, setHistories] = useState<Record<string, Message[]>>({});
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentAgentId = activeTab === 'module' ? agentId : 'DIRECTOR';
    const messages = histories[currentAgentId] || [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || !storeId || isTyping) return;

        const userMsg = input.trim();
        const targetAgentId = currentAgentId;

        setInput('');
        setHistories(prev => ({
            ...prev,
            [targetAgentId]: [...(prev[targetAgentId] || []), { role: 'user', content: userMsg, agentId: targetAgentId }]
        }));
        setIsTyping(true);

        // Capturar contexto
        const snapshot = contextSnapshot ? contextSnapshot() : null;

        try {
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: targetAgentId,
                    message: userMsg,
                    storeId,
                    context: {
                        path: window.location.pathname,
                        module: moduleName,
                        snapshot
                    },
                    history: messages.slice(-10) // Enviamos últimos 10 mensajes
                })
            });

            const data = await res.json();
            if (data.response) {
                setHistories(prev => ({
                    ...prev,
                    [targetAgentId]: [...(prev[targetAgentId] || []), { role: 'assistant', content: data.response, agentId: targetAgentId }]
                }));
            } else {
                setHistories(prev => ({
                    ...prev,
                    [targetAgentId]: [...(prev[targetAgentId] || []), { role: 'assistant', content: "Error: " + (data.error || "No response"), agentId: targetAgentId }]
                }));
            }
        } catch (error) {
            setHistories(prev => ({
                ...prev,
                [targetAgentId]: [...(prev[targetAgentId] || []), { role: 'assistant', content: "Error de conexión con el sistema de agentes.", agentId: targetAgentId }]
            }));
        } finally {
            setIsTyping(false);
        }
    };

    const buttonBgColor = moduleColor || 'var(--cre)';

    return (
        <div className="fixed bottom-[20px] right-[20px] z-[50]">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button
                        style={{ backgroundColor: buttonBgColor }}
                        className="group relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
                    >
                        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="absolute inset-0 rounded-full opacity-20 blur-xl bg-white group-hover:opacity-40 transition-opacity" />
                    </button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[360px] p-0 flex flex-col border-l border-[var(--border)] shadow-2xl">
                    <SheetHeader className="p-4 border-b border-[var(--border)] bg-[var(--surface2)]/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Brain size={20} />
                            </div>
                            <div>
                                <SheetTitle className="text-[14px] font-[900] uppercase tracking-tighter">
                                    Asistente IA
                                </SheetTitle>
                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">IA OS Operations</p>
                            </div>
                        </div>

                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                            <TabsList className="grid grid-cols-2 w-full h-9 bg-[var(--surface2)] border border-[var(--border)] p-1">
                                <TabsTrigger value="module" className="text-[10px] font-black uppercase tracking-tighter">
                                    {moduleName || 'Agente'}
                                </TabsTrigger>
                                <TabsTrigger value="director" className="text-[10px] font-black uppercase tracking-tighter">
                                    Director
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-12 space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-tertiary)] shadow-sm">
                                        <Sparkles size={24} className="text-primary/40" />
                                    </div>
                                    <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest leading-relaxed px-6">
                                        Habla con el <span style={{ color: buttonBgColor }}>{activeTab === 'module' ? (moduleName || 'Agente') : 'Director General'}</span> para recibir soporte estratégico.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "max-w-[90%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-slate-900 text-white rounded-tr-none"
                                            : "bg-white border border-[var(--border)] text-slate-800 rounded-tl-none font-medium"
                                    )}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">
                                        {msg.role === 'user' ? 'Tú' : (activeTab === 'module' ? moduleName : 'Director')}
                                    </span>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex flex-col gap-1 items-start">
                                    <div className="bg-white border border-[var(--border)] p-3 rounded-2xl rounded-tl-none shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                                            <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-[var(--border)] bg-white">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Escribe un mensaje..."
                                className="w-full h-20 p-3 rounded-xl border border-[var(--border)] text-[12px] font-medium outline-none focus:ring-2 focus:ring-primary/5 resize-none pr-10"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="absolute bottom-2 right-2 p-2 rounded-lg bg-slate-900 text-white shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-[8px] text-[var(--text-tertiary)] font-bold text-center mt-2 uppercase tracking-widest opacity-40">
                            ENTER PARA ENVIAR
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
