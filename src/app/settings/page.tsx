"use client";

import { useState } from "react";
import {
    Settings, Plug, Bell, Shield,
    CreditCard, Activity, Globe, Lock,
    ChevronRight, ExternalLink, Zap,
    Database, Mail, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function SettingsHubPage() {
    const [activeSection, setActiveSection] = useState("general");

    const sections = [
        { id: "general", label: "General", icon: Settings, description: "Configuración global de la plataforma" },
        { id: "connections", label: "Conexiones", icon: Plug, description: "Shopify, Meta, Beeping y APIs", href: "/connections" },
        { id: "notifications", label: "Notificaciones", icon: Bell, description: "Alertas de stock, pedidos e incidencias", href: "/settings/notifications" },
        { id: "billing", label: "Facturación", icon: CreditCard, description: "Planes, uso de IA y créditos" },
        { id: "security", label: "Seguridad", icon: Shield, description: "Accesos, roles y registros" },
        { id: "api", label: "API & Webhooks", icon: Database, description: "Uso de la infraestructura técnica", href: "/settings/api-usage" },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg border border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-100">
                        <Settings className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none italic">Ajustes del Sistema</h1>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">System Control & Configuration</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-black text-[7px] uppercase tracking-widest px-2 h-5 rounded-sm">System Healthy</Badge>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Internal Nav */}
                <div className="w-64 bg-white rounded-lg border border-slate-100 shadow-sm p-3 flex flex-col gap-1 overflow-y-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => section.href ? window.location.href = section.href : setActiveSection(section.id)}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all text-left group",
                                activeSection === section.id
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                activeSection === section.id ? "bg-white/20" : "bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50"
                            )}>
                                <section.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-tight italic leading-none">{section.label}</p>
                                <p className={cn(
                                    "text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1 truncate w-32",
                                    activeSection === section.id ? "text-indigo-100" : "text-slate-400"
                                )}>{section.description}</p>
                            </div>
                            {section.href && <ExternalLink className="w-2.5 h-2.5 opacity-20 group-hover:opacity-100" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden relative flex flex-col p-6">
                    <ScrollArea className="flex-1">
                        <div className="max-w-3xl space-y-8 pb-20">
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Configuración del Entorno</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <Card className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50/50 transition-all shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tight leading-none">Nombre de la Organización</h4>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">ECOMBOM MASTER ADMIN</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border-slate-200">Cambiar</Button>
                                        </div>
                                    </Card>
                                    <Card className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50/50 transition-all shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tight leading-none">Zona Horaria & Divisa</h4>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Europa/Madrid • Euro (€)</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border-slate-200">Ajustar</Button>
                                        </div>
                                    </Card>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Estado de Servicios</h3>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    <StatusItem label="Shopify API" status="online" />
                                    <StatusItem label="Meta Ads Graph" status="online" />
                                    <StatusItem label="Neural Engine v4" status="online" />
                                    <StatusItem label="Worker Sidecar" status="online" />
                                    <StatusItem label="Database Cluster" status="online" />
                                    <StatusItem label="Google Drive Sync" status="online" />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Eliminación de Datos</h3>
                                </div>

                                <Card className="border border-rose-100 rounded-lg p-4 bg-rose-50/20 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-black text-rose-900 uppercase italic tracking-tight leading-none text-opacity-80">Purge System Data</h4>
                                            <p className="text-[8px] text-rose-400 font-bold uppercase tracking-widest mt-1.5">Acción irreversible • Requiere autenticación maestra</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-100">Purgar</Button>
                                    </div>
                                </Card>
                            </section>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
    return (
        <div className="flex items-center justify-between p-2.5 px-3 bg-slate-50 border border-slate-100 rounded-lg shadow-sm">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight italic">{label}</span>
            <div className="flex items-center gap-1.5">
                <div className={cn("h-1 w-1 rounded-full", status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                <span className={cn("text-[8px] font-black uppercase tracking-widest italic", status === 'online' ? "text-emerald-500" : "text-rose-500")}>{status}</span>
            </div>
        </div>
    );
}
