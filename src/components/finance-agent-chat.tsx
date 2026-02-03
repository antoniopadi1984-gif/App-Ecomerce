"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface FinanceAgentChatProps {
    monthlyData?: any;
    className?: string;
}

export function FinanceAgentChat({ monthlyData, className }: FinanceAgentChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "¡Hola! Soy tu asesor financiero IA especializado en ecommerce. Puedo analizar tus métricas, darte recomendaciones sobre ROAS, CPA, márgenes y ayudarte a optimizar tu rentabilidad. ¿En qué puedo ayudarte?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/finance-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    context: monthlyData
                })
            });

            if (!response.ok) throw new Error("Error en la respuesta");

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.response || "No pude procesar tu consulta. Intenta de nuevo.",
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ Error de conexión. Verifica tu API key de Gemini o intenta más tarde.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        { label: "¿Cómo está mi ROAS?", icon: TrendingUp },
        { label: "¿Debo escalar ads?", icon: TrendingUp },
        { label: "Analiza mis márgenes", icon: AlertTriangle },
        { label: "¿Qué días son mejores?", icon: CheckCircle }
    ];

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 z-50 transition-all hover:scale-110",
                    className
                )}
            >
                <Sparkles className="h-6 w-6 text-white" />
            </Button>
        );
    }

    return (
        <div className={cn(
            "fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Asesor Financiero IA</h3>
                        <p className="text-white/70 text-xs">Especialista en Ecommerce</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.role === "user"
                                ? "ml-auto bg-indigo-600 text-white rounded-br-sm"
                                : "bg-white border border-slate-100 shadow-sm rounded-bl-sm text-slate-700"
                        )}
                    >
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analizando...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {quickActions.map((action, i) => (
                        <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-xs py-1"
                            onClick={() => {
                                setInput(action.label);
                            }}
                        >
                            <action.icon className="h-3 w-3 mr-1" />
                            {action.label}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Pregunta sobre tus finanzas..."
                        className="flex-1 text-sm rounded-xl border-slate-200 focus:border-indigo-300"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 h-10 w-10 p-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
