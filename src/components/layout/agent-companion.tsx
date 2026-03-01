"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Send, Sparkles, AlertCircle, Zap, Microscope, TrendingUp, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/context/ProductContext";

interface Message {
    role: 'agent' | 'user';
    content: string;
}

export function AgentCompanion() {
    const pathname = usePathname();
    const { product } = useProduct();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Context Detection
    const getContextInfo = () => {
        if (pathname.includes('/research')) return { role: 'research-lab', label: 'Especialista en Investigación', icon: Microscope };
        if (pathname.includes('/rendimiento')) return { role: 'metrics-analyzer', label: 'Especialista en Métricas', icon: TrendingUp };
        if (pathname.includes('/pedidos')) return { role: 'customer-support', label: 'Especialista en Soporte', icon: ShoppingCart };
        if (pathname.includes('/creative')) return { role: 'copywriter-elite', label: 'Editor Jefe de Copy', icon: Sparkles };
        return { role: 'general', label: 'Clowdbot Central', icon: Bot };
    };

    const ctx = getContextInfo();

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'agent',
                content: `¡Hola! Soy tu ${ctx.label}. Estoy analizando esta sección para ayudarte. ¿Quieres que ejecute alguna acción automática?`
            }]);
        }
    }, [ctx.label]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Simple mock for now, will connect to dispatcher later
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'agent',
                content: "He recibido tu petición. Analizando datos contextuales para darte una respuesta God-Tier..."
            }]);
            setIsLoading(false);
        }, 1000);
    };

    const runNeuralMother = async () => {
        if (!product) return;
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: "Ejecutar Wizard Madre Neural (One-Click)" }]);

        try {
            const res = await fetch('/api/ai/neural-mother', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id })
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'agent',
                    content: `✅ ¡Éxito! El Wizard ha terminado. He generado un eBook, analizado el mercado y guardado el copy en Drive. ¿Quieres ver el informe final?`
                }]);
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: `❌ Error: ${data.error}` }]);
            }
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'agent', content: `❌ Error de red: ${e.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-3">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[320px] h-[450px] bg-slate-50/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-white/50">
                    {/* Header */}
                    <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ctx.icon className="w-4 h-4 text-rose-400" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Escuadrón IA</p>
                                <p className="text-xs font-bold leading-none">{ctx.label}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-md">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={cn(
                                "max-w-[85%] p-2.5 rounded-xl text-[11px] leading-relaxed",
                                m.role === 'agent' ? "bg-white/80 text-slate-800 self-start border border-slate-100" : "bg-rose-500 text-white self-end ml-auto"
                            )}>
                                {m.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white/50 p-2 rounded-xl self-start">
                                <span className="animate-pulse">● ● ●</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {pathname.includes('/research') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={runNeuralMother}
                                className="h-7 text-[9px] uppercase font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                                <Zap className="w-3 h-3 mr-1" /> Wizard One-Click
                            </Button>
                        )}
                        {(pathname.includes('/creativo/contents') || pathname.includes('/research')) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    if (!product) return;
                                    setIsLoading(true);
                                    setMessages(prev => [...prev, { role: 'user', content: "Generar Almanaque Visual de Transformación" }]);
                                    try {
                                        const { generateAlmanacAction } = await import("@/app/creativo/contents/actions");
                                        const res = await generateAlmanacAction(product.id, "30 Días de Cambio");
                                        setMessages(prev => [...prev, { role: 'agent', content: `🚀 ${res.message} Podrás verlo en la pestaña de Contenidos en unos instantes.` }]);
                                    } catch (err: any) {
                                        setMessages(prev => [...prev, { role: 'agent', content: `❌ Error: ${err.message}` }]);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="h-7 text-[9px] uppercase font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                <Zap className="w-3 h-3 mr-1" /> Crear Almanaque
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase font-bold">
                            Auditar Página
                        </Button>
                    </div>

                    {/* Input */}
                    <div className="p-2 border-t border-slate-100 bg-white/50">
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Pregunta algo al experto..."
                                className="flex-1 glass-input h-8 px-3 rounded-lg text-xs"
                            />
                            <Button onClick={handleSendMessage} className="h-8 w-8 p-0 shrink-0 bg-slate-900 hover:bg-slate-800">
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90",
                    isOpen ? "bg-slate-900 text-white rotate-90" : "bg-rose-500 text-white hover:scale-110"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    </div>
                )}
            </button>
        </div>
    );
}
