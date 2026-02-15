"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search, MessageSquare, Send, Bot, User, Phone, Check,
    MoreVertical, Truck, AlertTriangle, Sparkles, Zap, Paperclip, LayoutGrid, Save,
    History, ExternalLink, Calendar, Smartphone, Info, RefreshCw, RotateCcw,
    MapPin, Package, Mail, Shield, CreditCard, TrendingUp, Filter, CheckCircle2,
    AlertCircle, Clock, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { BadgeStatus } from "@/components/ui/badge-status";
import { toast } from "sonner";
import {
    getInboxConversations,
    getConversationMessages,
    sendWhatsAppMessage,
    sendTrackingTrigger,
    getCustomerFullHistory,
    getGlobalCustomers,
    checkWhatsAppConfig,
    simulateIncomingMessage,
    ChatSession,
    ChatMessage
} from "./actions";

export default function InboxPage() {
    const [conversations, setConversations] = useState<ChatSession[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [messageInput, setMessageInput] = useState("");
    const [aiActive, setAiActive] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [configError, setConfigError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [sidebarTab, setSidebarTab] = useState<'CHATS' | 'CRM'>('CHATS');
    const [globalCustomers, setGlobalCustomers] = useState<any[]>([]);
    const [loadingCRM, setLoadingCRM] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Initial Load
    useEffect(() => {
        loadConversations();
        verifyConfig();
        const interval = setInterval(loadConversations, 60000);
        return () => clearInterval(interval);
    }, []);

    const verifyConfig = async () => {
        const res = await checkWhatsAppConfig();
        if (res.success && res.count === 0) {
            setConfigError("No hay cuentas de WhatsApp configuradas o activas. Revisa la configuración.");
        }
    };

    useEffect(() => {
        if (sidebarTab === 'CRM' && globalCustomers.length === 0) {
            loadGlobalCustomers();
        }
    }, [sidebarTab]);

    const loadGlobalCustomers = async (query?: string) => {
        setLoadingCRM(true);
        const res = await getGlobalCustomers(query);
        if (res.success) {
            setGlobalCustomers(res.data || []);
        }
        setLoadingCRM(false);
    };

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        if (sidebarTab === 'CRM') {
            loadGlobalCustomers(val);
        }
    };

    // Load Messages when selection changes
    useEffect(() => {
        if (selectedId) {
            loadMessages(selectedId);
            loadHistory(selectedId);
            // Scroll to bottom after messages load
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 500);
        }
    }, [selectedId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadConversations = async () => {
        setLoadingChats(true);
        const res = await getInboxConversations();
        if (res.success && res.data) {
            setConversations(res.data);
            if (res.data.length > 0 && !selectedId) {
                setSelectedId(res.data[0].id);
            }
        }
        setLoadingChats(false);
    };

    const loadMessages = async (id: string) => {
        const res = await getConversationMessages(id);
        if (res.success && res.data) {
            setMessages(res.data);
        }
    };

    const loadHistory = async (id: string) => {
        setLoadingHistory(true);
        const res = await getCustomerFullHistory(id);
        if (res.success) {
            setHistory(res.data || []);
        }
        setLoadingHistory(false);
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;
        if (!isTestMode && !selectedId) return;
        if (isTestMode && !testPhone.trim()) {
            toast.error("Introduce un número de teléfono para la prueba");
            return;
        }

        const msgContent = messageInput;
        setMessageInput("");

        if (isTestMode) {
            const { sendTestMessage } = await import("./actions");
            const res = await sendTestMessage(testPhone, msgContent);
            if (res.success) {
                toast.success(`Mensaje de prueba enviado (€${res.cost?.toFixed(2)})`);
            } else {
                toast.error("Error en envío de prueba: " + res.error);
            }
            return;
        }

        if (!selectedId) return;

        const tempId = Date.now().toString();
        const optimisticMsg: ChatMessage = {
            id: tempId,
            sender: 'AGENT',
            content: msgContent,
            timestamp: new Date(),
            isRead: true,
            status: 'SENT'
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const res = await sendWhatsAppMessage(selectedId, msgContent, false);
        if (!res.success) {
            toast.error(res.error || "Error al enviar mensaje");
        }
    };

    const handleTriggerTracking = async () => {
        if (!selectedId) return;
        toast.promise(sendTrackingTrigger(selectedId), {
            loading: "Enviando tracking...",
            success: "Notificación enviada correctamente",
            error: "Error al enviar"
        });
        setTimeout(() => loadMessages(selectedId), 1000);
    };

    const selectedChat = conversations.find(c => c.id === selectedId);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-white rounded-lg overflow-hidden border border-slate-200 shadow-2xl transition-all duration-700">
            {configError && (
                <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500">
                    <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-rose-700">
                        {configError}
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-rose-500 hover:bg-rose-100" onClick={() => setConfigError(null)}>
                        IGNORAR
                    </Button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR: CONVERSATIONS / CRM */}
                <div className="w-[380px] border-r border-slate-100 bg-slate-50/30 flex flex-col shrink-0">
                    <div className="p-8 pb-4 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md shadow-slate-200">
                                    <MessageSquare className="h-4 w-4 text-indigo-400" />
                                </div>
                                <h2 className="font-black text-xs uppercase tracking-tighter text-slate-900 italic">
                                    CENTRAL <span className="text-indigo-600 not-italic">INBOX</span>
                                </h2>
                            </div>
                        </div>

                        <div className="flex p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                            <button
                                onClick={() => setSidebarTab('CHATS')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                                    sidebarTab === 'CHATS' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                TRANSMISSIONS
                            </button>
                            <button
                                onClick={() => setSidebarTab('CRM')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                                    sidebarTab === 'CRM' ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                DATABASE
                            </button>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={sidebarTab === 'CHATS' ? "BUSCAR TRANSMISIÓN..." : "BUSCAR CLIENTE..."}
                                className="h-8 pl-9 bg-white border-slate-200 rounded-lg font-black text-[8px] uppercase tracking-widest text-slate-700 placeholder:text-slate-400 focus:ring-0 transition-all shadow-xs"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col p-4 pt-0 gap-2">
                            {sidebarTab === 'CHATS' ? (
                                loadingChats ? (
                                    <div className="p-12 text-center">
                                        <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
                                    </div>
                                ) : conversations.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedId(chat.id)}
                                        className={cn(
                                            "p-3 rounded-lg cursor-pointer transition-all flex gap-3 group relative border",
                                            selectedId === chat.id
                                                ? "bg-white border-indigo-100 shadow-xl shadow-indigo-900/5 ring-1 ring-indigo-500/10"
                                                : "bg-transparent border-transparent hover:bg-slate-100/50"
                                        )}
                                    >
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-md group-hover:border-indigo-100 transition-all scale-100 group-active:scale-95">
                                            <AvatarFallback className="bg-slate-200 text-slate-500 font-black text-xs">
                                                {chat.customerName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2 truncate">
                                                    {chat.riskLevel === 'HIGH' && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                                                    <span className={cn("text-xs font-black uppercase tracking-tight truncate", selectedId === chat.id ? "text-indigo-600" : "text-slate-700")}>
                                                        {chat.customerName}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-widest">
                                                    {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate font-bold leading-tight mb-2">
                                                {chat.lastMessage}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                                                    <span className="text-[8px] font-black text-slate-400 tracking-tighter italic">#{chat.orderNumber}</span>
                                                </div>
                                                <BadgeStatus status={chat.status} className="h-4 text-[7px] font-black px-1.5 border-none shadow-sm" />
                                            </div>
                                        </div>
                                        {chat.unreadCount > 0 && (
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-indigo-200">
                                                {chat.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                loadingCRM ? (
                                    <div className="p-12 text-center">
                                        <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Clientes...</p>
                                    </div>
                                ) : globalCustomers.map(customer => (
                                    <div
                                        key={customer.id}
                                        onClick={() => {
                                            setSelectedId(customer.id);
                                            setSidebarTab('CHATS');
                                        }}
                                        className="p-3 rounded-lg bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all cursor-pointer flex gap-3 group"
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-slate-50">
                                            <AvatarFallback className="bg-emerald-50 text-emerald-600 font-black text-[10px]">
                                                {customer.customerName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{customer.customerName}</span>
                                                <Badge variant="outline" className="text-[7px] font-black border-slate-100 text-slate-400">CRM</Badge>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{customer.customerPhone}</p>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge className="bg-indigo-600/10 text-indigo-600 border-none font-black text-[8px] uppercase">Clowdbot Copilot</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="px-2 py-0.5 bg-emerald-50 rounded text-[7px] font-black text-emerald-600 uppercase italic">
                                                    €{customer.totalSpent.toFixed(2)}
                                                </div>
                                                <span className="text-[7px] font-bold text-slate-300 uppercase">Último: {new Date(customer.lastOrderAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* MAIN INTERFACE: CHAT & MANAGEMENT */}
                <div className="flex-1 flex overflow-hidden bg-white">
                    <div className="flex-1 flex flex-col h-full border-r border-slate-100">
                        {selectedChat ? (
                            <>
                                {/* CHAT HEADER */}
                                <div className="p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 shadow-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs relative">
                                            <User className="h-5 w-5 text-slate-400" />
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 italic">
                                                {selectedChat.customerName}
                                                <Badge variant="outline" className="text-[7px] font-black border-indigo-100 text-indigo-600 bg-indigo-50/50 rounded-md">#{selectedChat.orderNumber}</Badge>
                                            </h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                <Smartphone className="h-2.5 w-2.5" /> {selectedChat.customerPhone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-slate-100/50 p-0.5 rounded-lg border border-slate-200">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                                                aiActive ? "bg-white text-indigo-600 shadow-xs" : "bg-transparent text-slate-400"
                                            )}>
                                                <Bot className={cn("h-3 w-3", aiActive ? "text-indigo-600" : "text-slate-300")} />
                                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Clowdbot</span>
                                                <Switch
                                                    checked={aiActive}
                                                    onCheckedChange={setAiActive}
                                                    className="scale-[0.6] data-[state=checked]:bg-indigo-600"
                                                />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* MESSAGES AREA */}
                                <ScrollArea className="flex-1 p-8" ref={scrollRef}>
                                    <div className="space-y-6 pb-10">
                                        {messages.map((msg, i) => {
                                            const isAi = msg.sender === 'AI';
                                            const isAgent = msg.sender === 'AGENT';
                                            const isSystem = msg.sender === 'SYSTEM';

                                            if (isSystem) {
                                                return (
                                                    <div key={msg.id} className="flex justify-center my-8">
                                                        <div className="bg-slate-100 text-slate-400 text-[9px] px-5 py-2 rounded-full border border-slate-200 font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
                                                            <Info className="h-3 w-3" />
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={msg.id} className={cn("flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300", (isAi || isAgent) ? "flex-row-reverse" : "flex-row")}>
                                                    <div className={cn(
                                                        "p-3.5 shadow-xs relative min-w-[120px] max-w-[85%] transition-all",
                                                        (isAi || isAgent)
                                                            ? "bg-indigo-600 text-white rounded-lg rounded-tr-none shadow-indigo-900/10 italic"
                                                            : "bg-slate-100 text-slate-700 rounded-lg rounded-tl-none border border-slate-200"
                                                    )}>
                                                        <div className="flex items-center justify-between gap-6 mb-1.5 opacity-70">
                                                            <span className="text-[7.5px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                {isAi ? <Bot className="h-2.5 w-2.5" /> : (isAgent ? <User className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />)}
                                                                {isAi ? "CLOWDBOT AI" : (isAgent ? "HUMAN AGENT" : "CUSTOMER")}
                                                            </span>
                                                            <span className="text-[7px] font-bold flex items-center gap-1.5">
                                                                {msg.cost && msg.cost > 0 ? (
                                                                    <span className="bg-white/20 px-1 py-0.5 rounded-sm text-[6px] font-black">€{msg.cost.toFixed(2)}</span>
                                                                ) : null}
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] font-black leading-relaxed tracking-tight uppercase">{msg.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                {/* INPUT AREA */}
                                <div className="p-8 bg-white border-t border-slate-100 flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                isTestMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                            )} />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                {isTestMode ? "Modo Prueba Activado" : "ConECTADO A PRODUCCIÓN"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isTestMode && (
                                                <input
                                                    type="text"
                                                    placeholder="Tlf Prueba (ej: +34...)"
                                                    className="w-48 h-8 px-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all shadow-sm"
                                                    value={testPhone}
                                                    onChange={(e) => setTestPhone(e.target.value)}
                                                />
                                            )}
                                            <button
                                                onClick={() => setIsTestMode(!isTestMode)}
                                                className={cn(
                                                    "text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest transition-all shadow-sm",
                                                    isTestMode
                                                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                )}
                                            >
                                                {isTestMode ? "Desactivar de Prueba" : "Activar Modo Prueba"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-w-4xl mx-auto relative group w-full">
                                        <div className={cn(
                                            "absolute -inset-0.5 rounded-lg blur-[2px] opacity-0 group-focus-within:opacity-100 transition duration-700",
                                            isTestMode ? "bg-amber-500/20" : "bg-indigo-500/20"
                                        )} />
                                        <div className="relative flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder={isTestMode ? "TELEARRAY TEST..." : (aiActive ? "CLOWDBOT CO-PILOT ACTIVE..." : "TYPE MESSAGE...")}
                                                    className={cn(
                                                        "h-10 pl-6 pr-12 rounded-lg text-[10px] font-black uppercase tracking-widest placeholder:text-slate-400 focus:ring-0 transition-all shadow-xs",
                                                        isTestMode ? "bg-amber-50/50 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-800"
                                                    )}
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                />
                                                <Button
                                                    size="icon"
                                                    className={cn(
                                                        "absolute right-1 top-1 h-8 w-8 rounded-md shadow-xs transition-all hover:scale-105 active:scale-95",
                                                        isTestMode ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                                                    )}
                                                    onClick={handleSendMessage}
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 px-1">
                                            <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black text-slate-400 hover:text-indigo-600 gap-1.5 uppercase tracking-widest rounded-md transition-all">
                                                <Paperclip className="h-3 w-3" /> ATTACH ASSET
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const content = prompt("Simula un mensaje del cliente:");
                                                    if (content) simulateIncomingMessage(selectedId!, content).then(() => loadMessages(selectedId!));
                                                }}
                                                className="h-6 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 text-[8px] font-black px-3 rounded-md uppercase tracking-widest ml-auto transition-all"
                                            >
                                                SIMULATE INCOMING
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 select-none animate-in fade-in duration-1000">
                                <div className="relative mb-6 group">
                                    <div className="absolute inset-0 bg-indigo-500/5 blur-[60px] rounded-full animate-pulse transition-all duration-1000" />
                                    <div className="relative z-10 p-10 rounded-lg bg-white border border-slate-100 shadow-2xl flex items-center justify-center">
                                        <MessageSquare className="h-16 w-16 text-slate-150 transition-colors duration-700" />
                                        <div className="absolute -top-3 -right-3 h-10 w-10 bg-slate-900 rounded-lg shadow-xl flex items-center justify-center rotate-12">
                                            <Zap className="h-5 w-5 text-indigo-400 fill-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-2">
                                    CENTRAL <span className="text-indigo-600">INBOX</span>
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Selecciona un canal para interceptar</p>
                                <div className="mt-12 flex gap-4">
                                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Sistemas Activos
                                    </div>
                                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                        <Shield className="h-4 w-4" />
                                        Clowdbot Online
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MANAGEMENT CONSOLE (RIGHT) */}
                    {selectedChat && (
                        <div className="w-[420px] bg-white shrink-0 animate-in slide-in-from-right duration-700 border-l border-slate-100 flex flex-col h-full overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full shadow-[0_0_10px]",
                                        selectedChat.riskLevel === 'HIGH' ? "bg-rose-500 shadow-rose-200" :
                                            selectedChat.riskLevel === 'MEDIUM' ? "bg-amber-500 shadow-amber-200" :
                                                "bg-emerald-500 shadow-emerald-200"
                                    )} />
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Estado de Seguridad</h4>
                                </div>
                                <Badge className={cn(
                                    "text-white text-[9px] font-black uppercase italic px-3 border-none shadow-lg",
                                    selectedChat.riskLevel === 'HIGH' ? "bg-rose-500 shadow-rose-100" :
                                        selectedChat.riskLevel === 'MEDIUM' ? "bg-amber-500 shadow-amber-100" :
                                            "bg-emerald-500 shadow-emerald-100"
                                )}>
                                    {selectedChat.riskLevel || 'SECURE'}
                                </Badge>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-10 space-y-12 pb-24">
                                    {/* ORDER MASTER */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Resumen del Pedido</Label>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-lg">
                                                <span className="text-[10px] font-black text-indigo-600 italic">#{selectedChat.orderNumber}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 transition-all hover:bg-white hover:shadow-xs group">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Venta Total</p>
                                                <p className="text-lg font-black text-slate-900 italic">€{(selectedChat as any).revenue || '0.00'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 transition-all hover:bg-white hover:shadow-xs group">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Logística</p>
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{(selectedChat as any).carrier}</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4 shadow-xs">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-slate-400 uppercase flex items-center gap-2 italic"><Truck className="h-3.5 w-3.5" /> Estado Flow</span>
                                                <BadgeStatus status={selectedChat.status} className="h-5 px-2 text-[8px] font-black shadow-none border-slate-200" />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-200 pt-4">
                                                <span className="text-slate-400 uppercase flex items-center gap-2 italic"><MapPin className="h-3.5 w-3.5" /> Tracking</span>
                                                <span className="text-slate-900 font-black tracking-widest bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">{(selectedChat as any).trackingNumber || 'PENDIENTE'}</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* CUSTOMER HISTORY TIMELINE */}
                                    <section className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                                <History className="h-4 w-4" /> Historial CRM
                                            </Label>
                                            <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400 px-3 bg-slate-50 uppercase tracking-widest">Fulfillment</Badge>
                                        </div>

                                        <div className="space-y-6">
                                            {loadingHistory ? (
                                                <div className="flex items-center justify-center p-12">
                                                    <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin opacity-50" />
                                                </div>
                                            ) : history.length > 0 ? history.map((h, i) => (
                                                <div key={i} className="relative pl-6 pb-6 last:pb-0 border-l border-slate-100">
                                                    <div className={cn(
                                                        "absolute left-[-4.5px] top-1 h-2 w-2 rounded-full",
                                                        h.status === 'DELIVERED' ? "bg-emerald-500" :
                                                            h.status === 'RETURNED' || h.status === 'INCIDENCE' ? "bg-rose-500" : "bg-indigo-400"
                                                    )} />
                                                    <div className="p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-100 hover:shadow-xs transition-all group relative overflow-hidden">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-900 uppercase italic">ORDER #{h.orderNumber}</span>
                                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(h.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <span className="text-[11px] font-black text-slate-900 italic">€{h.totalPrice}</span>
                                                        </div>
                                                        <BadgeStatus status={h.status} className="h-4 text-[7px] font-black px-1.5 shadow-none bg-slate-50 border-slate-100" />
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                                    <History className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">NO HISTORY DATA</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* ACTIONS MASTER */}
                                    <section className="space-y-8 pt-8 border-t border-slate-100">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Protocolos de Intervención</Label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Button
                                                onClick={handleTriggerTracking}
                                                className="h-12 w-full bg-slate-900 hover:bg-slate-800 text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center group"
                                            >
                                                <Truck className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
                                                DISPATCH TRACKING WHATSAPP
                                            </Button>
                                        </div>
                                    </section>

                                    {/* INTERNAL LOG */}
                                    <section className="space-y-4 pt-6 border-t border-slate-100 pb-12">
                                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Internal Forensic Log</Label>
                                        <textarea
                                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] font-black text-slate-600 placeholder:text-slate-300 focus:ring-0 transition-all resize-none italic leading-relaxed shadow-xs uppercase tracking-tight"
                                            placeholder="PRIVATE OBSERVATIONS..."
                                        />
                                        <Button className="w-full h-10 bg-white border border-slate-200 text-slate-700 font-black text-[9px] uppercase rounded-lg tracking-widest hover:bg-slate-50 transition-all shadow-xs">
                                            <Save className="h-3.5 w-3.5 mr-2" /> COMMIT LOG
                                        </Button>
                                    </section>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
